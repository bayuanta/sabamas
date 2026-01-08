import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import 'package:mobile_admin/widgets/stat_card.dart';

class DashboardStatsGrid extends StatelessWidget {
  final num pemasukanHariIni;
  final num pemasukanBulanIni;
  final num totalTunggakan;
  final int transaksiHariIni;
  final VoidCallback? onTunggakanTap;

  const DashboardStatsGrid({
    super.key,
    required this.pemasukanHariIni,
    required this.pemasukanBulanIni,
    required this.totalTunggakan,
    required this.transaksiHariIni,
    this.onTunggakanTap,
  });

  String formatCurrency(num value) {
    final format = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);
    // Shorten if too long for card card
    String formatted = format.format(value);
    if (formatted.length > 15) {
       // e.g. Rp 1.500.000.000 -> 1.5M logic could be better but let's stick to standard or compact
    }
    return formatted;
  }

  String formatCompact(num value) {
     if (value >= 1000000000) {
       return '${(value / 1000000000).toStringAsFixed(1)}M'; // Rp skipped for cleaner look or keep small Rp
     }
     if (value >= 1000000) {
       return '${(value / 1000000).toStringAsFixed(1)}jt';
     }
     if (value >= 1000) { // Ribuan
        return '${(value / 1000).toStringAsFixed(0)}K';
     }
     return value.toString();
  }

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      childAspectRatio: 0.85, // Taller cards typical for Dashboard UI
      children: [
        // 1. Pemasukan Hari Ini
        StatCard(
          title: 'Harian', // Short title
          value: formatCompact(pemasukanHariIni),
          icon: LucideIcons.dollarSign, // Or Eye like reference
          trend: '12,5%',
          isTrendUp: true,
          subtext: 'vs. kemarin',
        ),
        
        // 2. Transaksi Hari Ini
        StatCard(
          title: 'Transaksi',
          value: '$transaksiHariIni',
          icon: LucideIcons.mousePointer, // Cursor icon like 'Click'
          trend: '5,2%',
          isTrendUp: false, // Example of down trend
          subtext: 'vs. kemarin',
        ),

        // 3. Total Tunggakan (New)
        StatCard(
          title: 'Total Tunggakan',
          value: formatCompact(totalTunggakan),
          icon: LucideIcons.alertCircle,
          trend: 'Attention',
          isTrendUp: false, // Red Badge for Warning
          subtext: 'Belum lunas',
          isNegative: true,
          onTap: onTunggakanTap,
        ),

        // 4. Pemasukan Bulan Ini
        StatCard(
          title: 'Bulanan',
          value: formatCompact(pemasukanBulanIni),
          icon: LucideIcons.shoppingBag, // Like 'Orders'
          trend: '8,1%',
          isTrendUp: true,
          subtext: 'vs. bln lalu',
        ),
      ],
    );
  }
}
