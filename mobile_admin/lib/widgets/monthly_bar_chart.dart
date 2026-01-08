import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:mobile_admin/services/api_service.dart';

class MonthlyBarChart extends StatefulWidget {
  final List<MonthlyStat> stats;
  final int selectedYear;
  final Function(int) onYearChanged;

  const MonthlyBarChart({
    super.key, 
    required this.stats,
    required this.selectedYear,
    required this.onYearChanged,
  });

  @override
  State<MonthlyBarChart> createState() => _MonthlyBarChartState();
}

class _MonthlyBarChartState extends State<MonthlyBarChart> {
  int _touchedIndex = -1;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: theme.dividerColor.withOpacity(0.1)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.2 : 0.03), 
            blurRadius: 10, 
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                _getHeaderTitle(),
                style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: theme.textTheme.bodyLarge?.color,
                ),
              ),
              // Year Filter
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : Colors.grey[50], 
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: theme.dividerColor.withOpacity(0.5)),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<int>(
                    value: widget.selectedYear,
                    isDense: true,
                    dropdownColor: theme.cardColor,
                    icon: Icon(Icons.keyboard_arrow_down, size: 16, color: theme.iconTheme.color),
                    style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: theme.textTheme.bodyLarge?.color),
                    items: List.generate(11, (index) => 2020 + index).map((year) {
                      return DropdownMenuItem<int>(
                        value: year,
                        child: Text('$year'),
                      );
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) widget.onYearChanged(val);
                    },
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          
          // Stacked Bar Chart
          SizedBox(
            height: 220, // Slightly taller for stack clarity
            child: BarChart(
              BarChartData(
                alignment: BarChartAlignment.spaceAround,
                barTouchData: BarTouchData(
                  enabled: true,
                  touchTooltipData: BarTouchTooltipData(
                    getTooltipColor: (_) => Colors.blueGrey.shade800,
                    getTooltipItem: (group, groupIndex, rod, rodIndex) {
                      final stat = widget.stats[groupIndex];
                      final format = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);
                      
                      return BarTooltipItem(
                        '${stat.month}\n',
                         const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                         children: [
                           TextSpan(
                             text: 'Lunas: ',
                             style: const TextStyle(color: Colors.greenAccent, fontSize: 11, fontWeight: FontWeight.w500),
                           ),
                           TextSpan(
                             text: '${format.format(stat.sudahBayar)}\n',
                             style: const TextStyle(color: Colors.white, fontSize: 11),
                           ),
                           TextSpan(
                             text: 'Tunggakan: ',
                             style: const TextStyle(color: Colors.redAccent, fontSize: 11, fontWeight: FontWeight.w500),
                           ),
                           TextSpan(
                             text: format.format(stat.belumBayar),
                             style: const TextStyle(color: Colors.white, fontSize: 11),
                           ),
                         ]
                      );
                    },
                  ),
                  touchCallback: (FlTouchEvent event, barTouchResponse) {
                    if (!event.isInterestedForInteractions ||
                        barTouchResponse == null ||
                        barTouchResponse.spot == null) {
                      return;
                    }
                    
                    if (event is FlTapUpEvent) {
                       setState(() {
                        final touchedGroupIndex = barTouchResponse.spot!.touchedBarGroupIndex;
                        if (_touchedIndex == touchedGroupIndex) {
                          _touchedIndex = -1; 
                        } else {
                          _touchedIndex = touchedGroupIndex;
                        }
                      });
                    }
                  },
                ),
                titlesData: FlTitlesData(
                  show: true,
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (value, meta) {
                         if (value.toInt() >= 0 && value.toInt() < widget.stats.length) {
                           bool isSelected = _touchedIndex == value.toInt();
                           return Padding(
                             padding: const EdgeInsets.only(top: 8.0),
                             child: Text(
                               widget.stats[value.toInt()].month.substring(0, 3),
                               style: TextStyle(
                                 color: isSelected 
                                    ? theme.textTheme.bodyLarge?.color 
                                    : theme.textTheme.bodySmall?.color, 
                                 fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                 fontSize: 10,
                               ),
                             ),
                           );
                         }
                         return const SizedBox();
                      },
                      reservedSize: 30,
                    ),
                  ),
                  leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                ),
                gridData: const FlGridData(show: false),
                borderData: FlBorderData(show: false),
                barGroups: widget.stats.asMap().entries.map((e) {
                  final stat = e.value;
                  final double sudahBayar = stat.sudahBayar.toDouble();
                  final double belumBayar = stat.belumBayar.toDouble();
                  final double totalHeight = sudahBayar + belumBayar; // Total Tagihan

                  bool isSelected = _touchedIndex == e.key;
                  
                  // Color: Red for Arrears
                  final Color colorTunggakan = const Color(0xFFEF4444); 

                  return BarChartGroupData(
                    x: e.key,
                    barRods: [
                      BarChartRodData(
                        toY: belumBayar, // Only draw Red height
                        color: colorTunggakan,
                        width: 14,
                        // Round the top of the Red bar
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                        borderSide: isSelected 
                            ? BorderSide(color: theme.textTheme.bodyLarge?.color ?? Colors.black87, width: 1.5) 
                            : BorderSide.none,
                        // Use Background Rod to represent Total Tagihan (Visible Grey)
                        backDrawRodData: BackgroundBarChartRodData(
                          show: true,
                          toY: totalHeight, 
                          color: isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9), 
                        ),
                      ),
                    ],
                  );
                }).toList(),
              ),
            ),
          ),
          
          // --- Statistical Summary (Footer) ---
          Padding(
            padding: const EdgeInsets.only(top: 24.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildSummaryItem(
                  _touchedIndex == -1 
                      ? 'Total Tagihan (${widget.selectedYear})' 
                      : 'Tagihan ${widget.stats[_touchedIndex].month.substring(0, 3)}', 
                  _calculateTotalTagihan(), 
                  Colors.blue
                ),
                _buildSummaryItem(
                  _touchedIndex == -1 
                      ? 'Sudah Lunas (${widget.selectedYear})' 
                      : 'Lunas ${widget.stats[_touchedIndex].month.substring(0, 3)}', 
                  _calculateTotalLunas(), 
                  Colors.green
                ),
                _buildSummaryItem(
                  _touchedIndex == -1 
                      ? 'Total Tunggakan (${widget.selectedYear})' 
                      : 'Tunggakan ${widget.stats[_touchedIndex].month.substring(0, 3)}', 
                  _calculateTotalTunggakan(), 
                  Colors.red
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _getHeaderTitle() {
    if (_touchedIndex != -1 && _touchedIndex < widget.stats.length) {
      return 'Statistik ${widget.stats[_touchedIndex].month}';
    }
    return 'Statistik Pembayaran'; // General Title
  }

  Widget _buildSummaryItem(String label, double value, Color color) {
    String formattedValue = NumberFormat.currency(locale: 'id_ID', symbol: '', decimalDigits: 0).format(value);
    
    if (value >= 1000000000) {
      formattedValue = '${(value / 1000000000).toStringAsFixed(1)} M';
    } else if (value >= 1000000) {
      formattedValue = '${(value / 1000000).toStringAsFixed(1)} Jt';
    }

    final theme = Theme.of(context);

    return Expanded(
      child: Column(
        children: [
          Text(
            label,
            style: GoogleFonts.inter(fontSize: 12, color: theme.textTheme.bodySmall?.color),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 4),
          Text(
            formattedValue,
            style: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: color,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  double _calculateTotalTagihan() {
    if (_touchedIndex != -1 && _touchedIndex < widget.stats.length) {
      return widget.stats[_touchedIndex].totalTagihan.toDouble();
    }
    return widget.stats.fold(0, (sum, item) => sum + item.totalTagihan);
  }

  double _calculateTotalLunas() {
    if (_touchedIndex != -1 && _touchedIndex < widget.stats.length) {
      return widget.stats[_touchedIndex].sudahBayar.toDouble();
    }
    return widget.stats.fold(0, (sum, item) => sum + item.sudahBayar);
  }

  double _calculateTotalTunggakan() {
     if (_touchedIndex != -1 && _touchedIndex < widget.stats.length) {
      return widget.stats[_touchedIndex].belumBayar.toDouble();
    }
    return widget.stats.fold(0, (sum, item) => sum + item.belumBayar);
  }
}
