import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon; // Icon at top right (Blue colored usually)
  final String trend; // Percentage e.g. "15,5%"
  final bool isTrendUp; // Determines Green vs Red badge
  final String subtext; // e.g. "vs. kemarin"

  // Unused params kept for compatibility but ignored in layout
  final Color? color; 
  final List<Color>? gradientColors;
  final bool isNegative;
  final VoidCallback? onTap;

  const StatCard({
    super.key,
    required this.title,
    required this.value,
    required this.icon,
    required this.trend,
    this.isTrendUp = true,
    this.subtext = 'vs. periode lalu',
    // Compatibility args
    this.color,
    this.gradientColors,
    this.isNegative = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    // Determine badge colors based on trend direction & theme
    // Dark Mode: Darker background, Lighter Text
    // Light Mode: Very Light background, Darker Text
    
    final isBadState = (isNegative || !isTrendUp);
    
    Color badgeBgColor;
    Color badgeTextColor;

    if (isBadState) {
      // Red
      badgeBgColor = isDark ? const Color(0xFF450A0A) : const Color(0xFFFEE2E2);
      badgeTextColor = isDark ? const Color(0xFFFECACA) : const Color(0xFFEF4444);
    } else {
      // Green
      badgeBgColor = isDark ? const Color(0xFF064E3B) : const Color(0xFFDCFCE7);
      badgeTextColor = isDark ? const Color(0xFF6EE7B7) : const Color(0xFF10B981);
    }
        
    final trendIcon = isBadState
        ? Icons.arrow_drop_down
        : Icons.arrow_drop_up;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: theme.cardColor,
          borderRadius: BorderRadius.circular(16), 
          border: Border.all(
            // Fix deprecation warnings by using withValues(alpha: ...)
            color: theme.dividerColor.withValues(alpha: 0.1),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03), 
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // Row 1: Title and Icon
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerLeft,
                    child: Text(
                      title,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: theme.textTheme.bodyLarge?.color,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Icon(
                  icon,
                  size: 20,
                  color: theme.primaryColor,
                ),
              ],
            ),
            
            const Spacer(), 

            // Row 2: Value (Big Number)
            FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Text(
                value,
                style: GoogleFonts.inter(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  color: theme.brightness == Brightness.dark ? Colors.white : const Color(0xFF0F172A),
                  letterSpacing: -0.5,
                ),
              ),
            ),

            const Spacer(),

            // Row 3: Trend Badge & Subtext
            Row(
              children: [
                // Badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                  decoration: BoxDecoration(
                    color: badgeBgColor,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(trendIcon, size: 14, color: badgeTextColor),
                      const SizedBox(width: 2),
                      Text(
                        trend,
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: badgeTextColor,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerLeft,
                    child: Text(
                      subtext,
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        color: theme.textTheme.bodySmall?.color,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
