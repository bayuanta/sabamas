import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile_admin/services/api_service.dart';

class WilayahDistributionChart extends StatelessWidget {
  final List<WilayahStat> stats;

  const WilayahDistributionChart({super.key, required this.stats});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    // Sort stats by count descending
    final sortedStats = List<WilayahStat>.from(stats)..sort((a, b) => b.count.compareTo(a.count));
    // Limit to top 5 for UI cleanliness
    final displayStats = sortedStats.take(5).toList();
    final maxCount = displayStats.isNotEmpty ? displayStats.first.count : 1;

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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Pelanggan per Wilayah',
                style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: theme.textTheme.bodyLarge?.color,
                ),
              ),
              Icon(Icons.more_horiz, color: theme.iconTheme.color?.withOpacity(0.5)),
            ],
          ),
          const SizedBox(height: 20),
          ...displayStats.map((stat) => _buildBarItem(context, stat, maxCount)),
          if (sortedStats.length > 5)
             Center(
               child: TextButton(
                 onPressed: () {}, 
                 child: Text('Lihat Semua (${sortedStats.length - 5} lainnya)', style: const TextStyle(fontSize: 12)),
                ),
             )
        ],
      ),
    );
  }

  Widget _buildBarItem(BuildContext context, WilayahStat stat, int maxCount) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final double percentage = stat.count / maxCount;
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E3A8A).withOpacity(0.4) : const Color(0xFFEFF6FF), // Blue 50 or dark blue
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.location_on, size: 14, color: Color(0xFF3B82F6)),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    stat.wilayah,
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: theme.textTheme.bodyLarge?.color,
                    ),
                  ),
                ],
              ),
              Text(
                '${stat.count}',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: theme.textTheme.bodyLarge?.color,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Stack(
            children: [
              Container(
                height: 6,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: theme.dividerColor.withOpacity(isDark ? 0.2 : 0.5),
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
              FractionallySizedBox(
                widthFactor: percentage,
                child: Container(
                  height: 6,
                  decoration: BoxDecoration(
                    color: _getColorForWilayah(stat.wilayah),
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Color _getColorForWilayah(String wilayah) {
    // Generate consistent colors? Or just use brand colors
    const colors = [
      Color(0xFF3B82F6), // Blue
      Color(0xFF10B981), // Emerald
      Color(0xFFF59E0B), // Amber
      Color(0xFF8B5CF6), // Purple
      Color(0xFFEC4899), // Pink
    ];
    final hash = wilayah.hashCode;
    return colors[hash.abs() % colors.length];
  }
}
