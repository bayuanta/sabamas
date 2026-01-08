import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:mobile_admin/screens/dashboard_screen.dart';
import 'package:mobile_admin/screens/login_screen.dart';
import 'package:mobile_admin/screens/splash_screen.dart';
import 'package:mobile_admin/theme/app_theme.dart';
import 'package:mobile_admin/providers/auth_provider.dart';
import 'package:mobile_admin/providers/theme_provider.dart';

import 'package:intl/date_symbol_data_local.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('id_ID', null);
  runApp(const SabamasApp());
}

class SabamasApp extends StatelessWidget {
  const SabamasApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
      ],
      child: Consumer2<AuthProvider, ThemeProvider>(
        builder: (context, auth, themeProvider, _) {
          return MaterialApp(
            title: 'Sabamas Admin',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: themeProvider.themeMode,
            home: auth.isInitialized 
              ? (auth.isAuthenticated ? const DashboardScreen() : const LoginScreen())
              : const SplashScreen(),
          );
        },
      ),
    );
  }
}
