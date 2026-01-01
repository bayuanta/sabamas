import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

export interface TariffResult {
  amount: number;
  source: 'override' | 'history' | 'default';
  details?: string;
}

/**
 * Service untuk menghitung tarif dengan priority logic:
 * 1. TarifOverride (highest priority)
 * 2. TarifHistory
 * 3. TarifCategory (default)
 */
@Injectable()
export class TariffCalculatorService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get tariff for a specific customer and month
   * Implements priority rule: Override > History > Default
   */
  async getTariffForMonth(
    customerId: string,
    month: string, // Format: "YYYY-MM"
  ): Promise<TariffResult> {
    // 1. Check TarifOverride (highest priority)
    const override = await this.prisma.tarifOverride.findUnique({
      where: {
        customer_id_bulan_berlaku: {
          customer_id: customerId,
          bulan_berlaku: month,
        },
      },
    });

    if (override) {
      return {
        amount: override.tarif_amount,
        source: 'override',
        details: override.catatan || 'Manual override',
      };
    }

    // 2. Check TarifHistory
    const history = await this.prisma.tarifHistory.findUnique({
      where: {
        customer_id_bulan_berlaku: {
          customer_id: customerId,
          bulan_berlaku: month,
        },
      },
    });

    if (history) {
      return {
        amount: history.tarif_amount,
        source: 'history',
        details: history.catatan || 'Custom tariff',
      };
    }

    // 3. Get default TarifCategory
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        tarif: true,
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Check if tarif is effective for this month
    // Compare at month level (YYYY-MM), not day level
    const effectiveDate = new Date(customer.tanggal_efektif_tarif);
    const effectiveMonth = `${effectiveDate.getFullYear()}-${String(effectiveDate.getMonth() + 1).padStart(2, '0')}`;
    
    if (month < effectiveMonth) {
      // Month is before tarif effective date, no tariff
      return {
        amount: 0,
        source: 'default',
        details: 'Before tariff effective date',
      };
    }

    return {
      amount: customer.tarif.harga_per_bulan,
      source: 'default',
      details: customer.tarif.nama_kategori,
    };
  }

  /**
   * Get tariff for multiple months
   */
  async getTariffsForMonths(
    customerId: string,
    months: string[],
  ): Promise<Map<string, TariffResult>> {
    const result = new Map<string, TariffResult>();
    
    for (const month of months) {
      const tariff = await this.getTariffForMonth(customerId, month);
      result.set(month, tariff);
    }

    return result;
  }

  /**
   * Parse month string to Date
   */
  private parseMonthString(monthStr: string): Date {
    const [year, month] = monthStr.split('-').map(Number);
    return new Date(year, month - 1, 1);
  }
}
