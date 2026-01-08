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
    is_partial?: boolean;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { id: data.customer_id },
      });

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

      // 1. Calculate correct amount needed per month (considering existing partials)
      const monthBreakdown: Record<string, { amount: number; source: string; details?: string; is_partial_exist: boolean; partial_id?: string }> = {};
      let totalTagihanNeeded = 0;

      for (const month of data.bulan_dibayar) {
        // Check existing partial payment
        const existingPartial = await tx.partialPayment.findUnique({
          where: {
            customer_id_bulan_tagihan: {
              customer_id: data.customer_id,
              bulan_tagihan: month,
            },
          },
        });

        if (existingPartial && existingPartial.sisa_tagihan > 0) {
          monthBreakdown[month] = {
            amount: existingPartial.sisa_tagihan,
            source: 'history',
            details: `Sisa Cicilan`,
            is_partial_exist: true,
            partial_id: existingPartial.id
          };
          totalTagihanNeeded += existingPartial.sisa_tagihan;
        } else {
          const tariff = await this.tariffCalculator.getTariffForMonth(data.customer_id, month);
          monthBreakdown[month] = {
            amount: tariff.amount,
            source: tariff.source,
            details: tariff.details,
            is_partial_exist: false
          };
          totalTagihanNeeded += tariff.amount;
        }
      }

      // 2. Calculate final amount to be paid
      const subtotal = data.jumlah_bayar;
      const diskonNominal = data.diskon_nominal || 0;
      const finalAmount = subtotal - diskonNominal;

      // Check if this results in ANY partial status
      const isGloballyPartial = finalAmount < totalTagihanNeeded;

      // 3. Create regular Payment Record
      const payment = await tx.payment.create({
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

      // 4. Distribute Payment & Handle Partial Records
      let remainingAmountToDistribute = finalAmount;
      const sortedMonths = [...data.bulan_dibayar].sort();

      for (let i = 0; i < sortedMonths.length; i++) {
        const bulanTagihan = sortedMonths[i];
        const breakdown = monthBreakdown[bulanTagihan];
        const amountNeeded = breakdown.amount; // This is either remaining partial or full tariff

        let amountPaidForThisMonth = 0;

        if (remainingAmountToDistribute >= amountNeeded) {
          amountPaidForThisMonth = amountNeeded;
        } else {
          amountPaidForThisMonth = remainingAmountToDistribute;
        }

        if (i === sortedMonths.length - 1) {
          amountPaidForThisMonth = Math.min(amountPaidForThisMonth, remainingAmountToDistribute);
        }

        const sisaTagihan = Math.max(0, amountNeeded - amountPaidForThisMonth);
        remainingAmountToDistribute -= amountPaidForThisMonth;

        monthBreakdown[bulanTagihan].amount = amountPaidForThisMonth; // Update for receipt

        // UPDATE or CREATE Partial Payment Logic

        if (breakdown.is_partial_exist && breakdown.partial_id) {
          const existingPartial = await tx.partialPayment.findUnique({ where: { id: breakdown.partial_id } });
          if (existingPartial) {
            const newTerbayar = existingPartial.jumlah_terbayar + amountPaidForThisMonth;
            const newSisaReal = existingPartial.jumlah_tagihan - newTerbayar;

            let paymentIds: string[] = [];
            try {
              paymentIds = JSON.parse(existingPartial.payment_ids);
              if (!Array.isArray(paymentIds)) paymentIds = [];
            } catch (e) {
              paymentIds = [];
            }
            paymentIds.push(payment.id);

            await tx.partialPayment.update({
              where: { id: breakdown.partial_id },
              data: {
                jumlah_terbayar: newTerbayar,
                sisa_tagihan: Math.max(0, newSisaReal),
                status: newSisaReal <= 0 ? 'lunas' : 'cicilan',
                payment_ids: JSON.stringify(paymentIds)
              }
            });
          }
        } else {
          if (sisaTagihan > 0) {
            await tx.partialPayment.create({
              data: {
                customer_id: data.customer_id,
                bulan_tagihan: bulanTagihan,
                jumlah_tagihan: amountNeeded,
                jumlah_terbayar: amountPaidForThisMonth,
                sisa_tagihan: sisaTagihan,
                status: 'cicilan',
                payment_ids: JSON.stringify([payment.id]),
              },
            });
          }
        }
      }

      // 5. Update Payment Record with breakdown
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          month_breakdown: JSON.stringify(monthBreakdown)
        }
      });

      // Return result
      return {
        ...payment,
        bulan_dibayar: data.bulan_dibayar, // Return as array for frontend compatibility
        month_breakdown: JSON.stringify(monthBreakdown),
        is_partial: isGloballyPartial
      };
    });
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
      // Fix: dateTo should be until the END of that day (23:59:59.999)
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.tanggal_bayar.lte = endDate;
      }
    }

    if (metode_bayar) {
      where.metode_bayar = metode_bayar;
    }

    const skip = (page - 1) * limit;

    const [payments, total, aggregate] = await Promise.all([
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
      this.prisma.payment.aggregate({
        where,
        _sum: {
          jumlah_bayar: true,
        },
      }),
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
        totalAmount: aggregate._sum.jumlah_bayar || 0,
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
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      if (payment.is_deposited) {
        throw new Error('Cannot cancel payment that has been deposited');
      }

      // Clean up partial payment records
      let bulanDibayar: string[] = [];
      try {
        bulanDibayar = JSON.parse(payment.bulan_dibayar);
      } catch (e) {
        // If parse fails or empty
      }

      let monthBreakdown: any = {};
      try {
        monthBreakdown = payment.month_breakdown ? JSON.parse(payment.month_breakdown) : {};
      } catch (e) {
        monthBreakdown = {};
      }

      for (const bulan of bulanDibayar) {
        const partialPayment = await tx.partialPayment.findUnique({
          where: {
            customer_id_bulan_tagihan: {
              customer_id: payment.customer_id,
              bulan_tagihan: bulan,
            },
          },
        });

        if (partialPayment) {
          let paymentIds: string[] = [];
          try {
            paymentIds = JSON.parse(partialPayment.payment_ids);
          } catch (e) { paymentIds = [] }

          const updatedPaymentIds = paymentIds.filter(pid => pid !== id);

          let amountToRollback = 0;
          if (monthBreakdown && monthBreakdown[bulan]) {
            amountToRollback = monthBreakdown[bulan].amount;
          } else {
            // Fallback average
            amountToRollback = bulanDibayar.length > 0 ? payment.jumlah_bayar / bulanDibayar.length : 0;
          }

          if (updatedPaymentIds.length === 0) {
            // If no other payments linked to this partial record, delete it
            await tx.partialPayment.delete({
              where: { id: partialPayment.id },
            });
          } else {
            // Revert changes
            const newTerbayar = Math.max(0, partialPayment.jumlah_terbayar - amountToRollback);
            const newSisa = partialPayment.jumlah_tagihan - newTerbayar;

            await tx.partialPayment.update({
              where: { id: partialPayment.id },
              data: {
                jumlah_terbayar: newTerbayar,
                sisa_tagihan: newSisa,
                status: newSisa <= 0 ? 'lunas' : 'cicilan',
                payment_ids: JSON.stringify(updatedPaymentIds),
              },
            });
          }
        }
      }

      await tx.payment.delete({ where: { id } });

      return { message: 'Payment cancelled successfully' };
    });
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

  /**
   * Get partial payments for a customer
   */
  async getPartialPayments(customerId: string) {
    const partialPayments = await this.prisma.partialPayment.findMany({
      where: { customer_id: customerId },
      orderBy: { bulan_tagihan: 'desc' },
    });

    return partialPayments.map(pp => ({
      ...pp,
      payment_ids: JSON.parse(pp.payment_ids),
    }));
  }

  /**
   * Get partial payment detail for a specific month
   */
  async getPartialPaymentDetail(customerId: string, bulanTagihan: string) {
    const partialPayment = await this.prisma.partialPayment.findUnique({
      where: {
        customer_id_bulan_tagihan: {
          customer_id: customerId,
          bulan_tagihan: bulanTagihan,
        },
      },
      include: {
        customer: {
          select: { id: true, nama: true, wilayah: true },
        },
      },
    });

    if (!partialPayment) {
      return null;
    }

    // Get related payments
    const paymentIds = JSON.parse(partialPayment.payment_ids) as string[];
    const relatedPayments = await this.prisma.payment.findMany({
      where: {
        id: { in: paymentIds },
      },
      orderBy: { tanggal_bayar: 'asc' },
    });

    return {
      ...partialPayment,
      payment_ids: paymentIds,
      payments: relatedPayments.map(p => ({
        ...p,
        bulan_dibayar: JSON.parse(p.bulan_dibayar),
      })),
    };
  }
}
