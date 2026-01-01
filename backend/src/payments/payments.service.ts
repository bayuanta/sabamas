import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TimezoneUtil } from '../common/utils/timezone.util';
import { TariffCalculatorService } from '../common/services/tariff-calculator.service';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private tariffCalculator: TariffCalculatorService,
  ) { }

  async create(data: {
    customer_id: string;
    bulan_dibayar: string[];
    jumlah_bayar: number;
    metode_bayar: string;
    catatan?: string;
    diskon_nominal?: number;
  }) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: data.customer_id },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Calculate month breakdown with correct tariff per month
    const monthBreakdown: Record<string, { amount: number; source: string; details?: string }> = {};

    for (const month of data.bulan_dibayar) {
      const tariff = await this.tariffCalculator.getTariffForMonth(data.customer_id, month);
      monthBreakdown[month] = {
        amount: tariff.amount,
        source: tariff.source,
        details: tariff.details,
      };
    }

    // Calculate subtotal and final amount with discount
    const subtotal = data.jumlah_bayar;
    const diskonNominal = data.diskon_nominal || 0;
    const finalAmount = subtotal - diskonNominal;

    const payment = await this.prisma.payment.create({
      data: {
        customer_id: data.customer_id,
        customer_nama: customer.nama,
        tanggal_bayar: TimezoneUtil.nowWIB(),
        bulan_dibayar: JSON.stringify(data.bulan_dibayar),
        subtotal: diskonNominal > 0 ? subtotal : null,
        diskon_nominal: diskonNominal > 0 ? diskonNominal : null,
        jumlah_bayar: finalAmount,
        metode_bayar: data.metode_bayar,
        catatan: data.catatan,
        month_breakdown: JSON.stringify(monthBreakdown),
        is_deposited: false,
      },
      include: {
        customer: true,
      },
    });

    // Parse bulan_dibayar and month_breakdown back to objects
    return {
      ...payment,
      bulan_dibayar: JSON.parse(payment.bulan_dibayar),
      month_breakdown: payment.month_breakdown ? JSON.parse(payment.month_breakdown) : null,
    };
  }

  async findAll(query: {
    dateFrom?: string;
    dateTo?: string;
    metode_bayar?: string;
    page?: number;
    limit?: number;
  }) {
    // Convert page and limit to numbers (they might come as strings from query params)
    const page = query.page ? parseInt(String(query.page), 10) : 1;
    const limit = query.limit ? parseInt(String(query.limit), 10) : 30;
    const { dateFrom, dateTo, metode_bayar } = query;

    const where: any = {};

    if (dateFrom || dateTo) {
      where.tanggal_bayar = {};
      if (dateFrom) where.tanggal_bayar.gte = new Date(dateFrom);
      if (dateTo) where.tanggal_bayar.lte = new Date(dateTo);
    }

    if (metode_bayar) {
      where.metode_bayar = metode_bayar;
    }

    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          customer: {
            select: { id: true, nama: true, wilayah: true, nomor_telepon: true },
          },
        },
        orderBy: { tanggal_bayar: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    // Parse bulan_dibayar and month_breakdown for all payments
    const paymentsWithParsed = payments.map(p => {
      try {
        return {
          ...p,
          bulan_dibayar: JSON.parse(p.bulan_dibayar),
          month_breakdown: p.month_breakdown ? JSON.parse(p.month_breakdown) : null,
        };
      } catch (error) {
        console.error('Error parsing payment data for', p.id, error);
        return {
          ...p,
          bulan_dibayar: [],
          month_breakdown: null,
        };
      }
    });

    return {
      data: paymentsWithParsed,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return {
      ...payment,
      bulan_dibayar: JSON.parse(payment.bulan_dibayar),
      month_breakdown: payment.month_breakdown ? JSON.parse(payment.month_breakdown) : null,
    };
  }

  async cancel(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.is_deposited) {
      throw new Error('Cannot cancel payment that has been deposited');
    }

    await this.prisma.payment.delete({ where: { id } });

    return { message: 'Payment cancelled successfully' };
  }

  async getUndepositedFunds() {
    const payments = await this.prisma.payment.findMany({
      where: {
        metode_bayar: 'tunai',
        is_deposited: false,
      },
      include: {
        customer: {
          select: { id: true, nama: true, wilayah: true },
        },
      },
      orderBy: { tanggal_bayar: 'desc' },
    });

    return payments.map(p => ({
      ...p,
      bulan_dibayar: JSON.parse(p.bulan_dibayar),
    }));
  }
}
