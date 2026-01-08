import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:mobile_admin/providers/auth_provider.dart';
import 'package:mobile_admin/providers/theme_provider.dart';
import 'package:mobile_admin/screens/login_screen.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  void _handleLogout(BuildContext context) async {
    final shouldLogout = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Konfirmasi Logout'),
        content: const Text('Apakah Anda yakin ingin keluar aplikasi?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Batal'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Keluar'),
          ),
        ],
      ),
    );

    if (shouldLogout == true && context.mounted) {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      await auth.logout();
      if (context.mounted) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const LoginScreen()),
          (route) => false,
        );
      }
    }
  }

  void _showThemeSelector(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Theme.of(context).cardTheme.color,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Consumer<ThemeProvider>(
          builder: (context, themeProvider, _) {
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(left: 8, bottom: 16),
                    child: Text(
                      'Pilih Tema',
                      style: GoogleFonts.inter(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).textTheme.bodyLarge?.color,
                      ),
                    ),
                  ),
                  _buildThemeOption(
                    context,
                    title: 'Terang',
                    icon: LucideIcons.sun,
                    isSelected: themeProvider.themeMode == ThemeMode.light,
                    onTap: () => themeProvider.setThemeMode(ThemeMode.light),
                  ),
                  _buildThemeOption(
                    context,
                    title: 'Gelap',
                    icon: LucideIcons.moon,
                    isSelected: themeProvider.themeMode == ThemeMode.dark,
                    onTap: () => themeProvider.setThemeMode(ThemeMode.dark),
                  ),
                  _buildThemeOption(
                    context,
                    title: 'Ikuti Sistem',
                    icon: LucideIcons.smartphone,
                    isSelected: themeProvider.themeMode == ThemeMode.system,
                    onTap: () => themeProvider.setThemeMode(ThemeMode.system),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildThemeOption(
    BuildContext context, {
    required String title,
    required IconData icon,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    final color = isSelected ? Theme.of(context).colorScheme.primary : Theme.of(context).iconTheme.color;
    
    return ListTile(
      leading: Icon(icon, color: color),
      title: Text(
        title,
        style: TextStyle(
          color: isSelected ? Theme.of(context).colorScheme.primary : Theme.of(context).textTheme.bodyLarge?.color,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
      ),
      trailing: isSelected ? Icon(LucideIcons.check, color: Theme.of(context).colorScheme.primary) : null,
      onTap: () {
        onTap();
        Navigator.pop(context);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: Text(
          'Pengaturan',
          style: GoogleFonts.inter(
            fontWeight: FontWeight.bold,
          ),
        ),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
           _buildSectionHeader(context, 'Tampilan'),
          Consumer<ThemeProvider>(
            builder: (context, theme, _) => _buildListTile(
              context,
              icon: LucideIcons.palette,
              title: 'Tema Aplikasi',
              subtitle: _getThemeName(theme.themeMode),
              onTap: () => _showThemeSelector(context),
            ),
          ),

          const SizedBox(height: 24),
          _buildSectionHeader(context, 'Akun'),
          // Info User (Static for now)
          Consumer<AuthProvider>(
            builder: (context, auth, _) => _buildListTile(
              context,
              icon: LucideIcons.user,
              title: 'Username',
              subtitle: auth.currentUser?.username ?? 'Admin',
              onTap: () {},
            ),
          ),
          
          const SizedBox(height: 24),
          _buildSectionHeader(context, 'Aplikasi'),
          _buildListTile(
            context,
            icon: LucideIcons.info,
            title: 'Versi Aplikasi',
            subtitle: '1.0.0',
            onTap: () {},
          ),

           const SizedBox(height: 24),
           
           Container(
             decoration: BoxDecoration(
               color: Theme.of(context).cardTheme.color,
               borderRadius: BorderRadius.circular(12),
               border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.1)),
             ),
             child: ListTile(
               leading: Container(
                 padding: const EdgeInsets.all(8),
                 decoration: BoxDecoration(
                   color: const Color(0xFFFEE2E2),
                   borderRadius: BorderRadius.circular(8),
                 ),
                 child: const Icon(LucideIcons.logOut, color: Colors.red, size: 20),
               ),
               title: Text(
                 'Logout',
                 style: GoogleFonts.inter(
                   fontWeight: FontWeight.w600,
                   color: Colors.red,
                 ),
               ),
               onTap: () => _handleLogout(context),
             ),
           ),
        ],
      ),
    );
  }
  
  String _getThemeName(ThemeMode mode) {
    switch (mode) {
      case ThemeMode.light: return 'Terang';
      case ThemeMode.dark: return 'Gelap';
      case ThemeMode.system: return 'Ikuti Sistem';
    }
  }

  Widget _buildSectionHeader(BuildContext context, String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12, left: 4),
      child: Text(
        title,
        style: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.bold,
          color: Theme.of(context).textTheme.bodySmall?.color,
        ),
      ),
    );
  }

  Widget _buildListTile(BuildContext context, {
    required IconData icon,
    required String title,
    String? subtitle,
    required VoidCallback onTap,
  }) {
    final theme = Theme.of(context);
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: theme.cardTheme.color,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: theme.dividerColor.withOpacity(0.1)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: theme.scaffoldBackgroundColor, // Use background color
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: theme.iconTheme.color, size: 20),
        ),
        title: Text(
          title,
          style: GoogleFonts.inter(
            fontWeight: FontWeight.w600,
            color: theme.textTheme.bodyLarge?.color,
          ),
        ),
        subtitle: subtitle != null
            ? Text(
                subtitle,
                style: GoogleFonts.inter(
                  color: theme.textTheme.bodySmall?.color,
                  fontSize: 13,
                ),
              )
            : null,
        trailing: Icon(LucideIcons.chevronRight, size: 20, color: theme.disabledColor),
        onTap: onTap,
      ),
    );
  }
}
