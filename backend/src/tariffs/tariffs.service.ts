import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TariffsService {
  constructor(private prisma: PrismaService) { }

  async createCategory(data: { nama_kategori: string; harga_per_bulan: number; deskripsi?: string }) {
    return this.prisma.tarifCategory.create({ data });
  }

  async findAllCategories() {
    return this.prisma.tarifCategory.findMany({
      orderBy: { nama_kategori: 'asc' },
    });
  }

  async findOneCategory(id: string) {
    const category = await this.prisma.tarifCategory.findUnique({
      where: { id },
      include: {
        customers: {
          select: { id: true, nama: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Tariff category not found');
    }

    return category;
  }

  async updateCategory(id: string, data: { nama_kategori?: string; harga_per_bulan?: number; deskripsi?: string }) {
    return this.prisma.tarifCategory.update({
      where: { id },
      data,
    });
  }

  async removeCategory(id: string) {
    await this.prisma.tarifCategory.delete({ where: { id } });
    return { message: 'Tariff category deleted successfully' };
  }

  async createOverride(data: {
    customer_id: string;
    bulan_berlaku: string;
    tarif_amount: number;
    catatan?: string;
    created_by_user: string;
  }) {
    return this.prisma.tarifOverride.upsert({
      where: {
        customer_id_bulan_berlaku: {
          customer_id: data.customer_id,
          bulan_berlaku: data.bulan_berlaku,
        },
      },
      create: data,
      update: {
        tarif_amount: data.tarif_amount,
        catatan: data.catatan,
        created_by_user: data.created_by_user,
      },
    });
  }

  async findOverridesByCustomer(customerId: string) {
    return this.prisma.tarifOverride.findMany({
      where: { customer_id: customerId },
      orderBy: { bulan_berlaku: 'desc' },
    });
  }

  async removeOverride(id: string) {
    await this.prisma.tarifOverride.delete({ where: { id } });
    return { message: 'Tariff override deleted successfully' };
  }

  async bulkUpdateCustomerTariff(data: {
    customer_ids: string[];
    tarif_id: string;
    tanggal_efektif: Date;
  }) {
    // Validate tariff exists
    const tariff = await this.prisma.tarifCategory.findUnique({
      where: { id: data.tarif_id },
    });

    if (!tariff) {
      throw new NotFoundException('Tariff category not found');
    }

    // For each customer, preserve old tariff in TarifHistory for months before tanggal_efektif
    for (const customerId of data.customer_ids) {
      await this.preserveOldTariffHistory(customerId, data.tanggal_efektif);
    }

    // Update multiple customers
    const result = await this.prisma.customer.updateMany({
      where: {
        id: { in: data.customer_ids },
      },
      data: {
        tarif_id: data.tarif_id,
        tanggal_efektif_tarif: data.tanggal_efektif,
      },
    });

    return {
      message: 'Tariff updated successfully',
      updated_count: result.count,
      tariff_name: tariff.nama_kategori,
    };
  }

  /**
   * Preserve old tariff in TarifHistory for unpaid months before new tariff effective date
   */
  private async preserveOldTariffHistory(customerId: string, newTariffEffectiveDate: Date) {
    // Get customer with current tariff and payments
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        tarif: true,
        payments: true,
      },
    });

    if (!customer) {
      return;
    }

    // Get all months from tanggal_bergabung to newTariffEffectiveDate
    const startDate = new Date(customer.tanggal_bergabung);
    const effectiveDate = new Date(newTariffEffectiveDate);
    
    // Generate months between startDate and effectiveDate (exclusive)
    const months: string[] = [];
    const current = new Date(startDate);
    
    while (current < effectiveDate) {
      const monthStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      months.push(monthStr);
      current.setMonth(current.getMonth() + 1);
    }

    // Get paid months from payments
    const paidMonths = new Set<string>();
    for (const payment of customer.payments) {
      const paidMonthsArray = JSON.parse(payment.bulan_dibayar) as string[];
      for (const month of paidMonthsArray) {
        paidMonths.add(month);
      }
    }

    // Filter unpaid months
    const unpaidMonths = months.filter(month => !paidMonths.has(month));

    // Create TarifHistory for each unpaid month with old tariff
    for (const month of unpaidMonths) {
      try {
        // Only create if not already exists
        await this.prisma.tarifHistory.upsert({
          where: {
            customer_id_bulan_berlaku: {
              customer_id: customerId,
              bulan_berlaku: month,
            },
          },
          create: {
            customer_id: customerId,
            bulan_berlaku: month,
            tarif_amount: customer.tarif.harga_per_bulan,
            catatan: `Tarif lama sebelum perubahan tarif selektif`,
          },
          update: {
            // If exists, don't overwrite (respect manual overrides)
          },
        });
      } catch (error) {
        console.error(`Error creating tarif history for ${month}:`, error);
      }
    }
  }
}
