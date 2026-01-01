import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { ArrearsCalculatorService } from '../common/services/arrears-calculator.service';

@Injectable()
export class CustomersService {
  constructor(
    private prisma: PrismaService,
    private arrearsCalculator: ArrearsCalculatorService,
  ) { }

  async create(createCustomerDto: CreateCustomerDto) {
    // Set tanggal_bergabung
    const tanggal_bergabung = createCustomerDto.tanggal_bergabung
      ? new Date(createCustomerDto.tanggal_bergabung)
      : new Date();

    // Set tanggal_efektif_tarif = tanggal_bergabung jika tidak diisi
    // Ini penting agar tunggakan dihitung dari awal bergabung
    const tanggal_efektif_tarif = createCustomerDto.tanggal_efektif_tarif
      ? new Date(createCustomerDto.tanggal_efektif_tarif)
      : tanggal_bergabung;

    // Create customer with CustomerAccess in a transaction
    const customer = await this.prisma.$transaction(async (tx) => {
      // Create customer
      const newCustomer = await tx.customer.create({
        data: {
          ...createCustomerDto,
          tanggal_efektif_tarif,
          tanggal_bergabung,
        },
        include: {
          tarif: true,
        },
      });

      // Automatically create CustomerAccess with default PIN
      await tx.customerAccess.create({
        data: {
          customer_id: newCustomer.id,
          login_key: '1234', // Default PIN
          is_registered: false,
        },
      });

      return newCustomer;
    });

    return customer;
  }

  async findAll(query: QueryCustomerDto) {
    const {
      search,
      wilayah,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 50,
    } = query;

    const where: any = {};

    if (search) {
      where.OR = [
        { nama: { contains: search } },
        { alamat: { contains: search } },
        { nomor_telepon: { contains: search } },
      ];
    }

    if (wilayah) {
      where.wilayah = wilayah;
    }

    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        include: {
          tarif: true,
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.customer.count({ where }),
    ]);

    // Calculate arrears for each customer
    const customersWithArrears = await Promise.all(
      customers.map(async (customer) => {
        const arrears = await this.arrearsCalculator.getArrearsSummary(customer.id);
        return {
          ...customer,
          tunggakan: arrears.total,
          bulan_tunggakan: arrears.months,
        };
      }),
    );

    return {
      data: customersWithArrears,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        tarif: true,
        payments: {
          orderBy: { tanggal_bayar: 'desc' },
        },
        tarifOverrides: {
          orderBy: { bulan_berlaku: 'desc' },
        },
        tarifHistories: {
          orderBy: { bulan_berlaku: 'desc' },
        },
        customerAccess: true,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Calculate detailed arrears
    const arrears = await this.arrearsCalculator.calculateArrears(customer.id);

    return {
      ...customer,
      arrears,
    };
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const updateData: any = { ...updateCustomerDto };

    // Determine final tanggal_bergabung (either new value or existing)
    const finalTanggalBergabung = updateCustomerDto.tanggal_bergabung
      ? new Date(updateCustomerDto.tanggal_bergabung)
      : new Date(customer.tanggal_bergabung);

    // Determine final tanggal_efektif_tarif
    let finalTanggalEfektif: Date;

    if (updateCustomerDto.tanggal_efektif_tarif) {
      // User explicitly set tanggal_efektif_tarif
      finalTanggalEfektif = new Date(updateCustomerDto.tanggal_efektif_tarif);
    } else if (updateCustomerDto.tanggal_bergabung) {
      // tanggal_bergabung is being updated, adjust tanggal_efektif_tarif
      const currentEfektif = new Date(customer.tanggal_efektif_tarif);

      // Always ensure tanggal_efektif_tarif is not later than tanggal_bergabung
      // This ensures all months from join date are included in arrears calculation
      if (finalTanggalBergabung < currentEfektif) {
        finalTanggalEfektif = finalTanggalBergabung;
        console.log(`[UPDATE] Customer ${customer.nama}: tanggal_efektif_tarif adjusted from ${currentEfektif.toISOString()} to ${finalTanggalBergabung.toISOString()}`);
      } else {
        finalTanggalEfektif = currentEfektif;
      }
    } else {
      // No changes to dates, keep existing
      finalTanggalEfektif = new Date(customer.tanggal_efektif_tarif);
    }

    // Apply date updates
    if (updateCustomerDto.tanggal_bergabung) {
      updateData.tanggal_bergabung = finalTanggalBergabung;
    }

    // Always update tanggal_efektif_tarif if it needs adjustment
    if (updateCustomerDto.tanggal_bergabung || updateCustomerDto.tanggal_efektif_tarif) {
      updateData.tanggal_efektif_tarif = finalTanggalEfektif;
    }

    // If tarif_id is being updated, preserve old tariff history
    if (updateData.tarif_id && updateData.tarif_id !== customer.tarif_id) {
      // Get customer with full data including old tariff
      const customerWithTariff = await this.prisma.customer.findUnique({
        where: { id },
        include: {
          tarif: true,
          payments: true,
        },
      });

      if (customerWithTariff) {
        // Use the final effective date for preserving history
        await this.preserveOldTariffHistory(customerWithTariff, finalTanggalEfektif);
      }
    }

    const updated = await this.prisma.customer.update({
      where: { id },
      data: updateData,
      include: {
        tarif: true,
      },
    });

    return updated;
  }

  /**
   * Preserve old tariff in TarifHistory for unpaid months before new tariff effective date
   */
  private async preserveOldTariffHistory(customer: any, newTariffEffectiveDate: Date) {
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
              customer_id: customer.id,
              bulan_berlaku: month,
            },
          },
          create: {
            customer_id: customer.id,
            bulan_berlaku: month,
            tarif_amount: customer.tarif.harga_per_bulan,
            catatan: `Tarif lama sebelum perubahan tarif`,
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

  async remove(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    await this.prisma.customer.delete({
      where: { id },
    });

    return { message: 'Customer deleted successfully' };
  }

  async getWilayahList() {
    // 1. Get from Wilayah table
    const storedWilayahs = await this.prisma.wilayah.findMany({
      select: { nama: true },
      orderBy: { nama: 'asc' },
    });

    // 2. Get from existing customers (legacy support)
    const customerWilayahs = await this.prisma.customer.findMany({
      select: { wilayah: true },
      distinct: ['wilayah'],
      orderBy: { wilayah: 'asc' },
    });

    // 3. Merge and unique
    const allWilayahs = new Set([
      ...storedWilayahs.map((w) => w.nama),
      ...customerWilayahs.map((c) => c.wilayah),
    ]);

    return Array.from(allWilayahs).sort();
  }

  async createWilayah(nama: string) {
    // Check if already exists
    const exists = await this.prisma.wilayah.findUnique({
      where: { nama },
    });

    if (exists) {
      throw new Error('Wilayah sudah ada');
    }

    return this.prisma.wilayah.create({
      data: { nama },
    });
  }

  async updateWilayah(oldName: string, newName: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Update or Create in Wilayah table
      const existingWilayah = await tx.wilayah.findUnique({
        where: { nama: oldName },
      });

      if (existingWilayah) {
        await tx.wilayah.update({
          where: { id: existingWilayah.id },
          data: { nama: newName },
        });
      } else {
        // If not in Wilayah table (only in Customers), create it
        await tx.wilayah.create({
          data: { nama: newName },
        });
      }

      // 2. Update all customers
      await tx.customer.updateMany({
        where: { wilayah: oldName },
        data: { wilayah: newName },
      });

      return { message: 'Wilayah updated successfully' };
    });
  }

  async deleteWilayah(nama: string) {
    // 1. Check if used by customers
    const usedCount = await this.prisma.customer.count({
      where: { wilayah: nama },
    });

    if (usedCount > 0) {
      throw new Error(`Tidak bisa menghapus wilayah yang masih memiliki ${usedCount} pelanggan`);
    }

    // 2. Delete from Wilayah table
    const existingWilayah = await this.prisma.wilayah.findUnique({
      where: { nama },
    });

    if (existingWilayah) {
      await this.prisma.wilayah.delete({
        where: { id: existingWilayah.id },
      });
    }

    return { message: 'Wilayah deleted successfully' };
  }

  /**
   * Toggle customer status (aktif <-> nonaktif)
   */
  async toggleCustomerStatus(
    id: string,
    newStatus: 'aktif' | 'nonaktif',
    keterangan?: string,
  ) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        statusHistories: {
          where: { tanggal_selesai: null },
          orderBy: { tanggal_mulai: 'desc' },
          take: 1,
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Check if status is actually changing
    if (customer.status === newStatus) {
      return {
        message: `Customer sudah dalam status ${newStatus}`,
        customer,
      };
    }

    return this.prisma.$transaction(async (tx) => {
      const now = new Date();

      // Close current status history if exists
      if (customer.statusHistories.length > 0) {
        await tx.customerStatusHistory.update({
          where: { id: customer.statusHistories[0].id },
          data: { tanggal_selesai: now },
        });
      }

      // Create new status history
      await tx.customerStatusHistory.create({
        data: {
          customer_id: id,
          status: newStatus,
          tanggal_mulai: now,
          keterangan: keterangan || `Status diubah menjadi ${newStatus}`,
        },
      });

      // Update customer status
      const updated = await tx.customer.update({
        where: { id },
        data: { status: newStatus },
        include: {
          tarif: true,
          statusHistories: {
            orderBy: { tanggal_mulai: 'desc' },
            take: 5,
          },
        },
      });

      return {
        message: `Status pelanggan berhasil diubah menjadi ${newStatus}`,
        customer: updated,
      };
    });
  }

  /**
   * Get customer status history
   */
  async getCustomerStatusHistory(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const history = await this.prisma.customerStatusHistory.findMany({
      where: { customer_id: id },
      orderBy: { tanggal_mulai: 'desc' },
    });

    return history;
  }

  /**
   * Get active months for a customer in a date range
   * Returns array of month strings (YYYY-MM) where customer was active
   */
  async getActiveMonths(
    customerId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<string[]> {
    const statusHistory = await this.prisma.customerStatusHistory.findMany({
      where: { customer_id: customerId },
      orderBy: { tanggal_mulai: 'asc' },
    });

    // If no history, assume always active
    if (statusHistory.length === 0) {
      return this.generateMonthRange(startDate, endDate);
    }

    const activeMonths: string[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const monthStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;

      // Check if customer was active in this month
      const isActive = this.isCustomerActiveInMonth(current, statusHistory);

      if (isActive) {
        activeMonths.push(monthStr);
      }

      current.setMonth(current.getMonth() + 1);
    }

    return activeMonths;
  }

  /**
   * Check if customer was active in a specific month
   */
  private isCustomerActiveInMonth(
    monthDate: Date,
    statusHistory: any[],
  ): boolean {
    // Find the status that was active during this month
    for (const history of statusHistory) {
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

  /**
   * Generate array of month strings in range
   */
  private generateMonthRange(startDate: Date, endDate: Date): string[] {
    const months: string[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const monthStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      months.push(monthStr);
      current.setMonth(current.getMonth() + 1);
    }

    return months;
  }
}
