import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class DepositsService {
  constructor(private prisma: PrismaService) { }

  async create(data: {
    tanggal_setor: string;
    jumlah_setor: number;
    periode_awal: string;
    periode_akhir: string;
    payment_ids: string[];
    catatan?: string;
  }) {
    const deposit = await this.prisma.setoran.create({
      data: {
        tanggal_setor: new Date(data.tanggal_setor),
        jumlah_setor: data.jumlah_setor,
        periode_awal: new Date(data.periode_awal),
        periode_akhir: new Date(data.periode_akhir),
        payment_ids: JSON.stringify(data.payment_ids),
        catatan: data.catatan,
      },
    });

    // Mark payments as deposited
    await this.prisma.payment.updateMany({
      where: {
        id: { in: data.payment_ids },
      },
      data: {
        is_deposited: true,
      },
    });

    return {
      ...deposit,
      payment_ids: JSON.parse(deposit.payment_ids),
    };
  }

  async findAll() {
    const deposits = await this.prisma.setoran.findMany({
      orderBy: { tanggal_setor: 'desc' },
    });

    return deposits.map(d => ({
      ...d,
      payment_ids: JSON.parse(d.payment_ids),
    }));
  }

  async findOne(id: string) {
    const deposit = await this.prisma.setoran.findUnique({
      where: { id },
    });

    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }

    const paymentIds = JSON.parse(deposit.payment_ids) as string[];

    // Fetch payments manually based on payment_ids
    const payments = await this.prisma.payment.findMany({
      where: {
        id: { in: paymentIds },
      },
      include: {
        customer: {
          select: { id: true, nama: true, wilayah: true },
        },
      },
    });

    return {
      ...deposit,
      payment_ids: paymentIds,
      payments: payments.map(p => ({
        ...p,
        bulan_dibayar: JSON.parse(p.bulan_dibayar),
      })),
    };
  }

  async cancel(id: string) {
    const deposit = await this.prisma.setoran.findUnique({
      where: { id },
    });

    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }

    const paymentIds = JSON.parse(deposit.payment_ids) as string[];

    // Mark payments as not deposited
    await this.prisma.payment.updateMany({
      where: {
        id: { in: paymentIds },
      },
      data: {
        is_deposited: false,
      },
    });

    await this.prisma.setoran.delete({ where: { id } });

    return { message: 'Deposit cancelled successfully' };
  }
}
