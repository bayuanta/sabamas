import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ArrearsCalculatorService } from '../common/services/arrears-calculator.service';
import { TimezoneUtil } from '../common/utils/timezone.util';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private arrearsCalculator: ArrearsCalculatorService,
  ) { }

  async getPaymentReport(query: { dateFrom?: string; dateTo?: string; metode_bayar?: string }) {
    const where: any = {};

    if (query.dateFrom || query.dateTo) {
      where.tanggal_bayar = {};
      if (query.dateFrom) where.tanggal_bayar.gte = new Date(query.dateFrom);
      if (query.dateTo) where.tanggal_bayar.lte = new Date(query.dateTo);
    }

    if (query.metode_bayar) {
      where.metode_bayar = query.metode_bayar;
    }

    const payments = await this.prisma.payment.findMany({
      where,
      include: {
        customer: {
          select: { id: true, nama: true, wilayah: true },
        },
      },
      orderBy: { tanggal_bayar: 'desc' },
    });

    const totalAmount = payments.reduce((sum, p) => sum + p.jumlah_bayar, 0);
    const totalTransactions = payments.length;

    return {
      payments,
      summary: {
        totalAmount,
        totalTransactions,
      },
    };
  }

  async getArrearsReport(query: { wilayah?: string; sortBy?: string }) {
    const where: any = { status: 'aktif' };

    if (query.wilayah) {
      where.wilayah = query.wilayah;
    }

    const customers = await this.prisma.customer.findMany({
      where,
      include: {
        tarif: true,
      },
    });

    const customersWithArrears = await Promise.all(
      customers.map(async (customer) => {
        const arrears = await this.arrearsCalculator.calculateArrears(customer.id);
        return {
          customer,
          arrears,
        };
      }),
    );

    // Filter only customers with arrears
    const filtered = customersWithArrears.filter(c => c.arrears.totalArrears > 0);

    // Sort
    if (query.sortBy === 'amount_desc') {
      filtered.sort((a, b) => b.arrears.totalArrears - a.arrears.totalArrears);
    } else if (query.sortBy === 'amount_asc') {
      filtered.sort((a, b) => a.arrears.totalArrears - b.arrears.totalArrears);
    }

    const totalArrears = filtered.reduce((sum, c) => sum + c.arrears.totalArrears, 0);

    return {
      customers: filtered,
      summary: {
        totalCustomers: filtered.length,
        totalArrears,
      },
    };
  }

  async getDashboardStats(year?: number, reportYear?: number) {
    const today = TimezoneUtil.nowWIB();
    const targetYear = year ? Number(year) : today.getFullYear();
    const revenueYear = reportYear ? Number(reportYear) : today.getFullYear();

    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    // Fetch existing dashboard summary data
    const [paymentsTodayData, paymentsMonthData, recentPayments, totalCustomers] = await Promise.all([
      this.prisma.payment.aggregate({
        where: {
          tanggal_bayar: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        _sum: { jumlah_bayar: true },
        _count: true,
      }),
      this.prisma.payment.aggregate({
        where: {
          tanggal_bayar: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: { jumlah_bayar: true },
        _count: true,
      }),
      this.prisma.payment.findMany({
        take: 10,
        orderBy: { tanggal_bayar: 'desc' },
        include: {
          customer: {
            select: { id: true, nama: true, wilayah: true },
          },
        },
      }),
      this.prisma.customer.count({ where: { status: 'aktif' } }),
    ]);

    // --- NEW: Calculate Monthly Statistics for the selected year (BILLING STATS) ---
    // (Uses targetYear)

    // 1. Fetch all active customers with their tariff info
    // We need this to calculate "Total Tagihan" for each month
    const allActiveCustomers = await this.prisma.customer.findMany({
      where: { status: 'aktif' },
      select: {
        id: true,
        tanggal_bergabung: true,
        tanggal_efektif_tarif: true,
        tarif: {
          select: { harga_per_bulan: true, nama_kategori: true }
        },
        tarifOverrides: true,
        tarifHistories: true,
        statusHistories: true,
      },
    });

    // 2. Fetch all payments relevant to the target year (Billing)
    // We look for payments where bulan_dibayar string contains the year
    // This is a broad search, we will filter precisely in memory
    const yearlyPayments = await this.prisma.payment.findMany({
      where: {
        bulan_dibayar: {
          contains: String(targetYear)
        }
      },
      select: {
        id: true,
        customer_id: true,
        jumlah_bayar: true,
        bulan_dibayar: true,
        month_breakdown: true,
        tanggal_bayar: true,
      }
    });

    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    const monthlyStats = months.map((monthName, index) => {
      // Month index 0-11
      const monthKey = `${targetYear}-${String(index + 1).padStart(2, '0')}`;
      const monthDate = new Date(targetYear, index, 1);
      // End of month is useful to check if customer joined *during* the month (and should be billed)
      // Usually bill is issued for the full month if active/joined in that month.
      const endOfThisMonth = new Date(targetYear, index + 1, 0, 23, 59, 59);

      // --- Calculate Total Tagihan ---
      let totalTagihan = 0;
      let totalCustomersThisMonth = 0;

      for (const customer of allActiveCustomers) {
        const joinDate = new Date(customer.tanggal_bergabung);

        // Include customer if they joined ON or BEFORE the end of this month
        // logic: joinDate <= endOfThisMonth
        if (joinDate <= endOfThisMonth) {
          const tariffResult = this.arrearsCalculator.getTariffForMonthInMemory(customer, monthKey);

          if (tariffResult.amount > 0) {
            totalTagihan += tariffResult.amount;
            totalCustomersThisMonth++;
          }
        }
      }

      // --- Calculate Sudah Bayar ---
      let paidThisMonth = 0;
      const paidCustomers = new Set<string>();

      for (const payment of yearlyPayments) {
        try {
          // Parse bulan_dibayar
          let bulanDibayar: string[] = [];
          if (typeof payment.bulan_dibayar === 'string') {
            bulanDibayar = JSON.parse(payment.bulan_dibayar);
          }

          if (Array.isArray(bulanDibayar) && bulanDibayar.includes(monthKey)) {
            paidCustomers.add(payment.customer_id);

            // Calculate amount for this specific month
            let amountForMonth = 0;

            // Try month_breakdown first
            if (payment.month_breakdown) {
              const breakdown = typeof payment.month_breakdown === 'string'
                ? JSON.parse(payment.month_breakdown)
                : payment.month_breakdown;

              if (breakdown && breakdown[monthKey] && breakdown[monthKey].amount) {
                amountForMonth = Number(breakdown[monthKey].amount) || 0;
              }
            }

            // Fallback: if no breakdown or 0, divide evenly
            if (amountForMonth === 0) {
              amountForMonth = payment.jumlah_bayar / bulanDibayar.length;
            }

            paidThisMonth += amountForMonth;
          }
        } catch (e) {
          // ignore parse errors
        }
      }

      const belumBayar = Math.max(0, totalTagihan - paidThisMonth);
      const persentaseBayar = totalTagihan > 0 ? (paidThisMonth / totalTagihan) * 100 : 0;

      return {
        month: monthName,
        totalTagihan,
        sudahBayar: paidThisMonth,
        belumBayar,
        persentaseBayar: Math.round(persentaseBayar),
        pelangganBayar: paidCustomers.size,
        totalPelanggan: totalCustomersThisMonth
      };
    });

    // --- Yearly Revenue Data (for Line Chart) ---
    // Uses revenueYear (defaults to current year, independent of billing year)
    const paymentsMadeInYear = await this.prisma.payment.findMany({
      where: {
        tanggal_bayar: {
          gte: new Date(revenueYear, 0, 1),
          lte: new Date(revenueYear, 11, 31, 23, 59, 59)
        }
      },
      select: {
        tanggal_bayar: true,
        jumlah_bayar: true,
        metode_bayar: true,
        id: true
      }
    });

    // Calculate total arrears (simplified)
    const totalArrears = await this.arrearsCalculator.calculateTotalArrears();

    // --- Wilayah Stats (Distribution) ---
    // Group by wilayah and count active customers
    const wilayahStatsRaw = await this.prisma.customer.groupBy({
      by: ['wilayah'],
      where: { status: 'aktif' },
      _count: { wilayah: true },
    });

    const wilayahStats = wilayahStatsRaw.map(item => ({
      wilayah: item.wilayah,
      count: item._count.wilayah,
    }));

    return {
      pemasukanHariIni: paymentsTodayData._sum.jumlah_bayar || 0,
      pemasukanBulanIni: paymentsMonthData._sum.jumlah_bayar || 0,
      wargaBayarHariIni: paymentsTodayData._count || 0,
      wargaBayarBulanIni: paymentsMonthData._count || 0,
      totalTunggakan: totalArrears.totalArrears || 0,
      totalCustomers,
      recentPayments, // Top 10 for list
      monthlyStats,   // Calculated billing stats
      allPaymentsForYear: paymentsMadeInYear, // For the revenue line chart
      wilayahStats,   // NEW: Proper aggregated stats
    };
  }
}
