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
   * Optimized to use existing data if provided, or fetch if not
   */
  async calculateArrears(customerId: string): Promise<ArrearsResult> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        payments: true,
        partialPayments: true,
        statusHistories: {
          orderBy: { tanggal_mulai: 'asc' },
        },
        // Include tariff data for in-memory calculation
        tarif: true,
        tarifOverrides: true,
        tarifHistories: true,
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    return this.calculateArrearsInMemory(customer);
  }

  /**
   * Calculate arrears for multiple customers
   */
  async calculateMultipleArrears(customerIds: string[]): Promise<ArrearsResult[]> {
    // Optimization: Fetch all data at once if list is small enough, 
    // or just use parallel execution (usually fine for small batches)
    const results: ArrearsResult[] = [];

    // For lists, we should optimize by fetching all at once too
    const customers = await this.prisma.customer.findMany({
      where: { id: { in: customerIds } },
      include: {
        payments: true,
        partialPayments: true,
        statusHistories: { orderBy: { tanggal_mulai: 'asc' } },
        tarif: true,
        tarifOverrides: true,
        tarifHistories: true,
      }
    });

    for (const customer of customers) {
      try {
        const arrears = this.calculateArrearsInMemory(customer);
        results.push(arrears);
      } catch (error) {
        console.error(`Error calculating arrears for customer ${customer.id}:`, error);
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
   * OPTIMIZED for Dashboard Performance (Solves N+1 Problem)
   */
  async calculateTotalArrears(): Promise<{ totalArrears: number; totalCustomers: number }> {
    // Fetch ALL active customers with ALL necessary relations in ONE query
    const activeCustomers = await this.prisma.customer.findMany({
      where: { status: 'aktif' },
      include: {
        payments: {
          select: { bulan_dibayar: true } // Only need this field
        },
        partialPayments: {
          where: { sisa_tagihan: { gt: 0 } }, // Only active partial payments
          select: { bulan_tagihan: true, sisa_tagihan: true }
        },
        statusHistories: {
          orderBy: { tanggal_mulai: 'asc' },
        },
        tarif: true,
        tarifOverrides: true,
        tarifHistories: true,
      },
    });

    let totalArrears = 0;

    // Process entirely in memory (CPU bound, but much faster than I/O)
    for (const customer of activeCustomers) {
      try {
        const result = this.calculateArrearsInMemory(customer);
        totalArrears += result.totalArrears;
      } catch (e) {
        // Ignore individual errors to not crash the whole dashboard
      }
    }

    return {
      totalArrears,
      totalCustomers: activeCustomers.length,
    };
  }

  // ============================================================================
  // PRIVATE HELPERS (IN-MEMORY LOGIC)
  // ============================================================================

  /**
   * Core logic to calculate arrears from a fully loaded customer object.
   * Does NOT perform database queries.
   */
  private calculateArrearsInMemory(customer: any): ArrearsResult {
    // Get all months from tanggal_bergabung to current month
    const startDate = new Date(customer.tanggal_bergabung);
    const currentDate = TimezoneUtil.nowWIB();
    const standardMonths = TimezoneUtil.getMonthsBetween(startDate, currentDate);
    const allMonthsSet = new Set(standardMonths);

    // Get fully paid months and Map Partial Payments
    const paidMonths = new Set<string>();
    const partialPaymentMap = new Map<string, number>();

    // Process Partial Payments
    const partialPayments = customer.partialPayments || [];
    for (const pp of partialPayments) {
      if (pp.sisa_tagihan > 0) {
        partialPaymentMap.set(pp.bulan_tagihan, pp.sisa_tagihan);
        // Ensure this month is considered
        allMonthsSet.add(pp.bulan_tagihan);
      } else {
        // If sisa is 0 or less, it's fully paid (though usually filtered out in DB query for 'active' ones)
        // But if we passed full list, handle it:
        paidMonths.add(pp.bulan_tagihan);
      }
    }

    // Convert back to sorted array
    const allMonths = Array.from(allMonthsSet).sort();

    // Process Regular Payments
    const payments = customer.payments || [];
    for (const payment of payments) {
      try {
        const months = typeof payment.bulan_dibayar === 'string'
          ? JSON.parse(payment.bulan_dibayar) as string[]
          : payment.bulan_dibayar; // Handle if already object (though Prisma usually returns string for JSON)

        if (Array.isArray(months)) {
          for (const month of months) {
            if (!partialPaymentMap.has(month)) {
              paidMonths.add(month);
            }
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    // Filter unpaid months
    const unpaidMonths = allMonths.filter(month => {
      // Don't include future months
      const monthDate = this.parseMonthString(month);
      if (monthDate > currentDate) {
        return false;
      }

      // If it exists in Partial Payment Map, ALWAYS include it
      if (partialPaymentMap.has(month)) {
        return true;
      }

      // Don't include fully paid months
      if (paidMonths.has(month)) {
        return false;
      }

      // Check if customer was active
      const wasActive = this.isCustomerActiveInMonth(monthDate, customer.statusHistories);
      return wasActive;
    });

    // Calculate tariff for each unpaid month
    const arrearDetails: ArrearsDetail[] = [];
    let totalArrears = 0;

    for (const month of unpaidMonths) {
      // Check partial payment
      if (partialPaymentMap.has(month)) {
        const remainingAmount = partialPaymentMap.get(month) || 0;
        arrearDetails.push({
          month,
          amount: remainingAmount,
          source: 'history',
          details: `Sisa Cicilan (${remainingAmount})`,
        });
        totalArrears += remainingAmount;
        continue;
      }

      // Regular full month calculation (In-Memory)
      const tariff = this.getTariffForMonthInMemory(customer, month);

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

    return {
      customerId: customer.id,
      customerName: customer.nama,
      totalArrears,
      arrearMonths: arrearDetails,
      totalMonths: arrearDetails.length,
    };
  }

  /**
   * In-Memory version of TariffCalculatorService.getTariffForMonth
   * Expects customer object to have: tarifOverrides, tarifHistories, tarif
   */
  public getTariffForMonthInMemory(customer: any, month: string): TariffResult {
    // 1. Check TarifOverride
    if (customer.tarifOverrides && customer.tarifOverrides.length > 0) {
      const override = customer.tarifOverrides.find((o: any) => o.bulan_berlaku === month);
      if (override) {
        return {
          amount: override.tarif_amount,
          source: 'override',
          details: override.catatan || 'Manual override',
        };
      }
    }

    // 2. Check TarifHistory
    if (customer.tarifHistories && customer.tarifHistories.length > 0) {
      const history = customer.tarifHistories.find((h: any) => h.bulan_berlaku === month);
      if (history) {
        return {
          amount: history.tarif_amount,
          source: 'history',
          details: history.catatan || 'Custom tariff',
        };
      }
    }

    // 3. Default Tariff
    // Check effective date
    if (customer.tanggal_efektif_tarif) {
      const effectiveDate = new Date(customer.tanggal_efektif_tarif);
      const effectiveMonth = `${effectiveDate.getFullYear()}-${String(effectiveDate.getMonth() + 1).padStart(2, '0')}`;

      if (month < effectiveMonth) {
        return {
          amount: 0,
          source: 'default',
          details: 'Before tariff effective date',
        };
      }
    }

    if (customer.tarif) {
      return {
        amount: customer.tarif.harga_per_bulan,
        source: 'default',
        details: customer.tarif.nama_kategori,
      };
    }

    // Fallback if no tariff data found
    return {
      amount: 0,
      source: 'default',
      details: 'No tariff found',
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
    if (!statusHistories || statusHistories.length === 0) {
      return true;
    }

    for (const history of statusHistories) {
      const startDate = new Date(history.tanggal_mulai);
      const endDate = history.tanggal_selesai
        ? new Date(history.tanggal_selesai)
        : new Date(2100, 0, 1); // Future date

      // Standardize time for comparison
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      if (monthDate >= startDate && monthDate <= endDate) {
        return history.status === 'aktif';
      }
    }

    return true;
  }
}
