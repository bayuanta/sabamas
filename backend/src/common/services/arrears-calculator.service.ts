import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { TariffCalculatorService, TariffResult } from './tariff-calculator.service';
import { TimezoneUtil } from '../utils/timezone.util';

export interface ArrearsDetail {
  month: string; // Format: "YYYY-MM"
  amount: number;
  source: 'override' | 'history' | 'default';
  details?: string;
}

export interface ArrearsResult {
  customerId: string;
  customerName: string;
  totalArrears: number;
  arrearMonths: ArrearsDetail[];
  totalMonths: number;
}

/**
 * Service untuk menghitung tunggakan pelanggan
 * Menghitung dari tanggal_bergabung sampai bulan sekarang
 * Exclude bulan yang sudah dibayar
 */
@Injectable()
export class ArrearsCalculatorService {
  constructor(
    private prisma: PrismaService,
    private tariffCalculator: TariffCalculatorService,
  ) { }

  /**
   * Calculate arrears for a customer
   */
  async calculateArrears(customerId: string): Promise<ArrearsResult> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        payments: true,
        partialPayments: true, // Include partial payments
        statusHistories: {
          orderBy: { tanggal_mulai: 'asc' },
        },
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }



    // Get all months from tanggal_bergabung to current month
    const startDate = new Date(customer.tanggal_bergabung);
    const currentDate = TimezoneUtil.nowWIB();
    const standardMonths = TimezoneUtil.getMonthsBetween(startDate, currentDate);
    const allMonthsSet = new Set(standardMonths);

    // Get fully paid months and Map Partial Payments
    const paidMonths = new Set<string>();
    const partialPaymentMap = new Map<string, number>();

    // Process Partial Payments first
    if (customer.partialPayments) {
      for (const pp of customer.partialPayments) {
        if (pp.sisa_tagihan > 0) {
          partialPaymentMap.set(pp.bulan_tagihan, pp.sisa_tagihan);
          // CRITICAL FIX: Ensure this month is considered even if before join date
          allMonthsSet.add(pp.bulan_tagihan);
        } else {
          paidMonths.add(pp.bulan_tagihan);
        }
      }

    }

    // Convert back to sorted array for processing
    const allMonths = Array.from(allMonthsSet).sort();

    // Process Regular Payments
    for (const payment of customer.payments) {
      const months = JSON.parse(payment.bulan_dibayar) as string[];
      for (const month of months) {
        // Only mark as fully paid if it's NOT a partial payment with remaining balance
        if (!partialPaymentMap.has(month)) {
          paidMonths.add(month);
        }
      }
    }

    // Filter unpaid months AND only count months where customer was active
    // Also include months that are partially paid (in partialPaymentMap)
    const unpaidMonths = allMonths.filter(month => {
      // Don't include future months
      const monthDate = this.parseMonthString(month);
      if (monthDate > currentDate) {
        return false;
      }

      // If it exists in Partial Payment Map (has remaining balance), ALWAYS include it
      if (partialPaymentMap.has(month)) {
        return true;
      }

      // Don't include fully paid months
      if (paidMonths.has(month)) {
        return false;
      }

      // Check if customer was active in this month
      const wasActive = this.isCustomerActiveInMonth(monthDate, customer.statusHistories);
      return wasActive;
    });

    // Calculate tariff for each unpaid month
    const arrearDetails: ArrearsDetail[] = [];
    let totalArrears = 0;

    for (const month of unpaidMonths) {
      // Check if it's a partial payment month
      if (partialPaymentMap.has(month)) {
        const remainingAmount = partialPaymentMap.get(month) || 0;
        arrearDetails.push({
          month,
          amount: remainingAmount,
          source: 'history', // Consider it historical data
          details: `Sisa Cicilan (${remainingAmount})`,
        });
        totalArrears += remainingAmount;
        continue;
      }

      // Regular full month arrear calculation
      const tariff = await this.tariffCalculator.getTariffForMonth(customerId, month);

      if (tariff.amount > 0) {
        arrearDetails.push({
          month,
          amount: tariff.amount,
          source: tariff.source,
          details: tariff.details,
        });
        totalArrears += tariff.amount;
      }
    }

    const result = {
      customerId: customer.id,
      customerName: customer.nama,
      totalArrears,
      arrearMonths: arrearDetails,
      totalMonths: arrearDetails.length,
    };


    return result;
  }

  /**
   * Calculate arrears for multiple customers
   */
  async calculateMultipleArrears(customerIds: string[]): Promise<ArrearsResult[]> {
    const results: ArrearsResult[] = [];

    for (const customerId of customerIds) {
      try {
        const arrears = await this.calculateArrears(customerId);
        results.push(arrears);
      } catch (error) {
        console.error(`Error calculating arrears for customer ${customerId}:`, error);
      }
    }

    return results;
  }

  /**
   * Get arrears summary (only total)
   */
  async getArrearsSummary(customerId: string): Promise<{ total: number; months: number }> {
    const arrears = await this.calculateArrears(customerId);
    return {
      total: arrears.totalArrears,
      months: arrears.totalMonths,
    };
  }

  /**
   * Calculate total arrears for ALL active customers
   * WARNING: This can be resource intensive if there are many customers
   */
  async calculateTotalArrears(): Promise<{ totalArrears: number; totalCustomers: number }> {
    const activeCustomers = await this.prisma.customer.findMany({
      where: { status: 'aktif' },
      select: { id: true },
    });

    let totalArrears = 0;
    // Process in batches or one by one
    for (const customer of activeCustomers) {
      // Use getArrearsSummary to keep it lighter if possible (though it calls calculateArrears internally)
      const arrears = await this.getArrearsSummary(customer.id);
      totalArrears += arrears.total;
    }

    return {
      totalArrears,
      totalCustomers: activeCustomers.length,
    };
  }

  /**
   * Parse month string to Date
   */
  private parseMonthString(monthStr: string): Date {
    const [year, month] = monthStr.split('-').map(Number);
    return new Date(year, month - 1, 1);
  }

  /**
   * Check if customer was active in a specific month
   */
  private isCustomerActiveInMonth(monthDate: Date, statusHistories: any[]): boolean {
    // If no status history, assume always active
    if (!statusHistories || statusHistories.length === 0) {
      return true;
    }

    // Find the status that was active during this month
    for (const history of statusHistories) {
      const startDate = new Date(history.tanggal_mulai);
      const endDate = history.tanggal_selesai
        ? new Date(history.tanggal_selesai)
        : new Date(); // Current date if still active

      // Check if monthDate falls within this status period
      if (monthDate >= startDate && monthDate <= endDate) {
        return history.status === 'aktif';
      }
    }

    // Default to active if no matching history found
    return true;
  }
}
