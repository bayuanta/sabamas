import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:mobile_admin/services/api_service.dart';

class RevenueTrendChart extends StatefulWidget {
  final List<Payment> payments;
  final int selectedYear;
  final Function(int) onYearChanged; // Callback for filter

  const RevenueTrendChart({
    super.key,
    required this.payments,
    required this.selectedYear,
    required this.onYearChanged,
  });

  @override
  State<RevenueTrendChart> createState() => _RevenueTrendChartState();
}

class _RevenueTrendChartState extends State<RevenueTrendChart> {
  bool _showFullValue = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    // 1. Process Data (Monthly)
    List<FlSpot> spots = _processDataMonthly();
    double maxY = 0;
    if (spots.isNotEmpty) {
      maxY = spots.map((e) => e.y).reduce((a, b) => a > b ? a : b);
    }
    if (maxY == 0) maxY = 1000000;

    // Calculate Total Revenue
    double totalRevenue = widget.payments.fold(0, (sum, item) => sum + item.jumlahBayar);

    // Format Currency
    final currencyFormat = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);
    String formattedTotalFull = currencyFormat.format(totalRevenue);
    
    // Compact Format
    String formattedTotalCompact = formattedTotalFull;
    if (totalRevenue >= 1000000000) {
      formattedTotalCompact = 'Rp ${(totalRevenue / 1000000000).toStringAsFixed(1)} M';
    } else if (totalRevenue >= 1000000) {
      formattedTotalCompact = 'Rp ${(totalRevenue / 1000000).toStringAsFixed(1)} Jt';
    }

    // Determine what to show
    String displayValue = _showFullValue ? formattedTotalFull : formattedTotalCompact;

    return Container(
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          // Fix deprecation warnings by using withValues(alpha: ...)
          color: theme.dividerColor.withValues(alpha: 0.1),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.05),
            blurRadius: 20,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Row: Title/Value & Year Filter
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Left: Title & Value & Trend
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Pendapatan Tahun ${widget.selectedYear}',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: theme.textTheme.bodySmall?.color,
                      ),
                    ),
                    const SizedBox(height: 8),
                    
                    // Value with Tap to Toggle
                    GestureDetector(
                      onTap: () {
                        setState(() {
                          _showFullValue = !_showFullValue;
                        });
                      },
                      child: Text(
                        displayValue,
                        style: GoogleFonts.inter(
                          fontSize: 24, // Slightly smaller than before to fit full text
                          fontWeight: FontWeight.bold,
                          color: theme.textTheme.bodyLarge?.color,
                          letterSpacing: -0.5,
                        ),
                      ),
                    ),
                    
                    const SizedBox(height: 8),
                    // Trend Badge (Mockup)
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: isDark ? Colors.green[900]?.withValues(alpha: 0.3) : Colors.green[50],
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.arrow_upward, size: 12, color: Colors.green),
                              const SizedBox(width: 4),
                              Text(
                                'Yearly Trend', 
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.green,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'vs tahun lalu',
                          style: GoogleFonts.inter(fontSize: 12, color: theme.textTheme.bodySmall?.color),
                        ),
                      ],
                    ),
                  ],
                ),
  
                // Right: Year Filter Dropdown
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1E293B) : Colors.grey[50], // Light grey bg
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: theme.dividerColor.withValues(alpha: 0.5)),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<int>(
                      value: widget.selectedYear,
                      isDense: true,
                      dropdownColor: theme.cardColor,
                      icon: Icon(Icons.keyboard_arrow_down, size: 18, color: theme.iconTheme.color),
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: theme.textTheme.bodyLarge?.color,
                      ),
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
  
            const SizedBox(height: 32),
            
            // Chart
            SizedBox(
              height: 180,
              child: LineChart(
                LineChartData(
                  gridData: FlGridData(
                    show: true,
                    drawVerticalLine: false,
                    horizontalInterval: maxY / 3, // Show ~3 lines
                    getDrawingHorizontalLine: (value) => FlLine(
                      color: isDark ? Colors.white.withValues(alpha: 0.2) : Colors.grey[300],
                      strokeWidth: 1,
                      dashArray: [5, 5],
                    ),
                  ),
                  titlesData: FlTitlesData(
                    show: true,
                    rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 30,
                        interval: 1, // Show EVERY month
                        getTitlesWidget: (value, meta) {
                          int index = value.toInt();
                          if (index >= 0 && index < 12) {
                            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                            return Padding(
                              padding: const EdgeInsets.only(top: 8.0),
                              child: Text(
                                months[index],
                                style: GoogleFonts.inter(
                                  color: theme.textTheme.bodySmall?.color, 
                                  fontSize: 10, 
                                  fontWeight: FontWeight.w500
                                ),
                              ),
                            );
                          }
                          return const SizedBox();
                        },
                      ),
                    ),
                  ),
                  borderData: FlBorderData(show: false),
                  minX: 0,
                  maxX: 11,
                  minY: 0,
                  maxY: maxY * 1.1,
                  lineBarsData: [
                    LineChartBarData(
                      spots: spots,
                      isCurved: false,
                      color: isDark ? const Color(0xFF38BDF8) : theme.primaryColor,
                      barWidth: 3,
                      isStrokeCapRound: true,
                      dotData: FlDotData(
                        show: true,
                        getDotPainter: (spot, percent, barData, index) => FlDotCirclePainter(
                          radius: 4,
                          color: theme.cardColor,
                          strokeWidth: 2,
                          strokeColor: isDark ? const Color(0xFF38BDF8) : theme.primaryColor,
                        ),
                      ),
                      belowBarData: BarAreaData(
                        show: true,
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            (isDark ? const Color(0xFF38BDF8) : theme.primaryColor).withValues(alpha: 0.2),
                            (isDark ? const Color(0xFF38BDF8) : theme.primaryColor).withValues(alpha: 0.0),
                          ],
                        ),
                      ),
                    ),
                  ],
                  lineTouchData: LineTouchData(
                    handleBuiltInTouches: true,
                    touchSpotThreshold: 50, // Increase touch area for easier mobile tapping
                    touchTooltipData: LineTouchTooltipData(
                      getTooltipColor: (_) => theme.primaryColor,
                      getTooltipItems: (touchedSpots) {
                        return touchedSpots.map((spot) {
                          final format = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);
                          const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                          return LineTooltipItem(
                            '${months[spot.x.toInt()]}\n',
                            const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                            children: [
                              TextSpan(
                                text: format.format(spot.y),
                                style: const TextStyle(color: Colors.white, fontSize: 12),
                              ),
                            ],
                          );
                        }).toList();
                      },
                    ),
                  ),
                ),
              ),
            )
          ],
        ),
      ),
    );
  }

  // Helper: Aggregate data by month (0-11)
  List<FlSpot> _processDataMonthly() {
    List<Payment> filtered = widget.payments;
    
    // Initialize 12 months with 0
    Map<int, double> monthlySum = {};
    for(int i=0; i<12; i++) monthlySum[i] = 0;

    for (var p in filtered) {
      if (p.tanggalBayar.year == widget.selectedYear) {
        monthlySum[p.tanggalBayar.month - 1] = (monthlySum[p.tanggalBayar.month - 1] ?? 0) + p.jumlahBayar;
      }
    }

    List<FlSpot> spots = [];
    for (int i=0; i<12; i++) {
      spots.add(FlSpot(i.toDouble(), monthlySum[i]!));
    }
    return spots;
  }
}
