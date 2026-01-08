import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:mobile_admin/providers/auth_provider.dart';
import 'package:mobile_admin/screens/dashboard_screen.dart';
import 'package:flutter_animate/flutter_animate.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  
  bool _obscurePassword = true;
  bool _rememberMe = true;

  void _handleLogin() async {
    if (_formKey.currentState!.validate()) {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      
      final success = await auth.login(
        _usernameController.text, 
        _passwordController.text,
        rememberMe: _rememberMe,
      );

      if (success && mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const DashboardScreen()),
        );
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Login Gagal. Cek username/password.'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Center(
            child: SingleChildScrollView(
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Logo
                    Center(
                      child: Image.asset(
                        'assets/images/logo.png',
                        width: 200, 
                        height: 200,
                        fit: BoxFit.contain,
                      ),
                    ).animate().scale(duration: 500.ms, curve: Curves.elasticOut),
                    
                    const SizedBox(height: 32),
                    
                    Text(
                      'Selamat Datang',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.inter(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: theme.textTheme.bodyLarge?.color,
                      ),
                    ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2),
                    
                    const SizedBox(height: 8),
                    
                    Text(
                      'Masuk untuk mengelola tagihan',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: theme.textTheme.bodySmall?.color,
                      ),
                    ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.2),

                    const SizedBox(height: 48),

                    // Username Input
                    TextFormField(
                      controller: _usernameController,
                      validator: (v) => v!.isEmpty ? 'Username wajib diisi' : null,
                      style: TextStyle(color: theme.textTheme.bodyLarge?.color),
                      decoration: InputDecoration(
                        labelText: 'Username',
                        labelStyle: TextStyle(color: theme.textTheme.bodyMedium?.color),
                        prefixIcon: Icon(LucideIcons.user, color: theme.iconTheme.color),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        filled: true,
                        fillColor: isDark ? theme.cardColor : const Color(0xFFF8FAFC),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: BorderSide.none,
                        ),
                      ),
                    ).animate().fadeIn(delay: 400.ms).slideX(),

                    const SizedBox(height: 20),

                    // Password Input
                    TextFormField(
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      validator: (v) => v!.isEmpty ? 'Password wajib diisi' : null,
                      style: TextStyle(color: theme.textTheme.bodyLarge?.color),
                      decoration: InputDecoration(
                        labelText: 'Password',
                        labelStyle: TextStyle(color: theme.textTheme.bodyMedium?.color),
                        prefixIcon: Icon(LucideIcons.lock, color: theme.iconTheme.color),
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscurePassword ? LucideIcons.eyeOff : LucideIcons.eye,
                            color: theme.iconTheme.color,
                          ),
                          onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        filled: true,
                        fillColor: isDark ? theme.cardColor : const Color(0xFFF8FAFC),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: BorderSide.none,
                        ),
                      ),
                    ).animate().fadeIn(delay: 500.ms).slideX(),

                    const SizedBox(height: 16),

                    // Remember Me Checkbox
                    Row(
                      children: [
                        SizedBox(
                          height: 24,
                          width: 24,
                          child: Checkbox(
                            value: _rememberMe, 
                            onChanged: (val) => setState(() => _rememberMe = val ?? true),
                            activeColor: theme.primaryColor,
                            side: BorderSide(
                              color: isDark ? Colors.white54 : Colors.black54,
                            ),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                          ),
                        ),
                        const SizedBox(width: 8),
                        GestureDetector(
                          onTap: () => setState(() => _rememberMe = !_rememberMe),
                          child: Text(
                            'Ingat Saya', 
                            style: GoogleFonts.inter(
                              color: theme.textTheme.bodyLarge?.color,
                              fontSize: 14,
                              fontWeight: FontWeight.w500
                            )
                          ),
                        ),
                      ],
                    ).animate().fadeIn(delay: 550.ms),

                    const SizedBox(height: 32),

                    Consumer<AuthProvider>(
                      builder: (context, auth, _) {
                        return ElevatedButton(
                          onPressed: auth.isLoading ? null : _handleLogin,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: theme.primaryColor,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                            elevation: 0,
                          ),
                          child: auth.isLoading 
                            ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : const Text('Masuk', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        );
                      },
                    ).animate().fadeIn(delay: 600.ms).scale(),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
