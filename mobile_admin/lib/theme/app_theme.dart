import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Light Colors
  static const Color primaryLight = Color(0xFF6366F1);
  static const Color backgroundLight = Color(0xFFF8FAFC);
  static const Color surfaceLight = Colors.white;
  static const Color textPrimaryLight = Color(0xFF1E293B);
  static const Color textSecondaryLight = Color(0xFF64748B);
  static const Color borderColorLight = Color(0xFFE2E8F0);

  // Dark Colors
  static const Color primaryDark = Color(0xFF818CF8); // Sedikit lebih terang biar kontras
  static const Color backgroundDark = Color(0xFF0F172A); // Slate 900
  static const Color surfaceDark = Color(0xFF1E293B); // Slate 800
  static const Color textPrimaryDark = Color(0xFFF8FAFC); // Slate 50
  static const Color textSecondaryDark = Color(0xFF94A3B8); // Slate 400
  static const Color borderColorDark = Color(0xFF334155); // Slate 700

  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    colorScheme: const ColorScheme.light(
      primary: primaryLight,
      surface: surfaceLight,
      surfaceContainerHighest: backgroundLight, // Main Background
      onSurface: textPrimaryLight,
      outline: borderColorLight,
    ),
    scaffoldBackgroundColor: backgroundLight,
    textTheme: GoogleFonts.interTextTheme(ThemeData.light().textTheme).apply(
      bodyColor: textPrimaryLight,
      displayColor: textPrimaryLight,
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: surfaceLight,
      elevation: 0,
      titleTextStyle: GoogleFonts.inter(
        color: textPrimaryLight,
        fontSize: 18,
        fontWeight: FontWeight.bold,
      ),
      iconTheme: const IconThemeData(color: textPrimaryLight),
    ),

    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryLight,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: 0,
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: borderColorLight),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: borderColorLight),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: primaryLight, width: 2),
      ),
      labelStyle: const TextStyle(color: textSecondaryLight),
      hintStyle: const TextStyle(color: Color(0xFFCBD5E1)),
    ),
    iconTheme: const IconThemeData(color: textSecondaryLight),
    popupMenuTheme: const PopupMenuThemeData(
      color: surfaceLight,
      surfaceTintColor: Colors.transparent,
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: surfaceLight,
      selectedItemColor: primaryLight,
      unselectedItemColor: textSecondaryLight,
    ),
  );

  static ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: const ColorScheme.dark(
      primary: primaryDark,
      surface: surfaceDark,
      surfaceContainerHighest: backgroundDark, // Main Background
      onSurface: textPrimaryDark,
      outline: borderColorDark,
    ),
    scaffoldBackgroundColor: backgroundDark,
    textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme).apply(
      bodyColor: textPrimaryDark,
      displayColor: textPrimaryDark,
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: surfaceDark,
      elevation: 0,
      titleTextStyle: GoogleFonts.inter(
        color: textPrimaryDark,
        fontSize: 18,
        fontWeight: FontWeight.bold,
      ),
      iconTheme: const IconThemeData(color: textPrimaryDark),
    ),

    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryDark,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: 0,
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: const Color(0xFF1E293B), // Same as surface
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: borderColorDark),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: borderColorDark),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: primaryDark, width: 2),
      ),
      labelStyle: const TextStyle(color: textSecondaryDark),
      hintStyle: const TextStyle(color: Color(0xFF475569)),
    ),
    iconTheme: const IconThemeData(color: textSecondaryDark),
    popupMenuTheme: const PopupMenuThemeData(
      color: surfaceDark,
      surfaceTintColor: Colors.transparent,
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: surfaceDark,
      selectedItemColor: primaryDark,
      unselectedItemColor: textSecondaryDark,
    ),
  );
}
