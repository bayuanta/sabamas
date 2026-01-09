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
    return format.format(value);
  }
  
  String formatCompact(num value) {
     if (value >= 1000000000) {
       return '${(value / 1000000000).toStringAsFixed(1)}M'; 
     }
     if (value >= 1000000) {
       return '${(value / 1000000).toStringAsFixed(1)}jt';
     }
     if (value >= 1000) { 
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
      childAspectRatio: 0.85, 
      children: [
        // 1. Pemasukan Hari Ini
        StatCard(
          title: 'Harian',
          value: formatCompact(pemasukanHariIni),
          fullValue: formatCurrency(pemasukanHariIni), // Full value on tap
          icon: LucideIcons.dollarSign,
          trend: '12,5%',
          isTrendUp: true,
          subtext: 'vs. kemarin',
        ),
        
        // 2. Transaksi Hari Ini
        StatCard(
          title: 'Transaksi',
          value: '$transaksiHariIni',
          // No fullValue needed as int is short enough, or same
          icon: LucideIcons.mousePointer,
          trend: '5,2%',
          isTrendUp: false,
          subtext: 'vs. kemarin',
        ),

        // 3. Total Tunggakan
        StatCard(
          title: 'Total Tunggakan',
          value: formatCompact(totalTunggakan),
          fullValue: formatCurrency(totalTunggakan), // Full value on tap
          icon: LucideIcons.alertCircle,
          trend: 'Attention',
          isTrendUp: false,
          subtext: 'Belum lunas',
          isNegative: true,
          onTap: onTunggakanTap,
        ),

        // 4. Pemasukan Bulan Ini
        StatCard(
          title: 'Bulanan',
          value: formatCompact(pemasukanBulanIni),
          fullValue: formatCurrency(pemasukanBulanIni), // Full value on tap
          icon: LucideIcons.shoppingBag, 
          trend: '8,1%',
          isTrendUp: true,
          subtext: 'vs. bln lalu',
        ),
      ],
    );
  }
}
