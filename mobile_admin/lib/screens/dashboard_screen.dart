import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:mobile_admin/services/api_service.dart';
import 'package:mobile_admin/widgets/dashboard_stats_grid.dart';
import 'package:mobile_admin/widgets/monthly_bar_chart.dart';
import 'package:mobile_admin/widgets/wilayah_distribution_chart.dart';
import 'package:mobile_admin/widgets/revenue_trend_chart.dart';
import 'package:mobile_admin/screens/customers/customers_screen.dart'; // Import CustomersScreen
import 'package:mobile_admin/screens/billing/billing_search_screen.dart';
import 'package:mobile_admin/screens/transactions/transactions_screen.dart';
import 'package:mobile_admin/screens/settings/settings_screen.dart';
import 'package:mobile_admin/screens/notifications/notification_screen.dart';
import 'package:provider/provider.dart';
import 'package:mobile_admin/providers/auth_provider.dart';
import 'package:mobile_admin/screens/login_screen.dart';
import 'package:mobile_admin/screens/reports/arrears_report_screen.dart'; // Import ArrearsReportScreen
import 'package:intl/intl.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _selectedIndex = 0;
  final ApiService _apiService = ApiService();
  DashboardStats? _stats;
  bool _isLoading = true;
  int _selectedYear = DateTime.now().year;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    // Only load data if we are on the dashboard tab
    if (_selectedIndex != 0) return;

    setState(() => _isLoading = true);
    try {
      final data = await _apiService.getDashboardStats(year: _selectedYear, revenueYear: _selectedYear);
      if (mounted) {
        setState(() {
          _stats = data;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  String formatCurrency(num value) {
    final format = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);
    return format.format(value);
  }

  void _handleLogout() async {
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

    if (shouldLogout == true && mounted) {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      await auth.logout();
      if (mounted) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const LoginScreen()),
          (route) => false,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: _buildBody(),
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).bottomNavigationBarTheme.backgroundColor,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 20,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: NavigationBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          indicatorColor: Colors.transparent,
          selectedIndex: _selectedIndex,
          onDestinationSelected: (index) {
            setState(() {
              _selectedIndex = index;
            });
            if (index == 0) {
              _loadData(); // Reload dashboard data when returning
            }
          },
          labelBehavior: NavigationDestinationLabelBehavior.alwaysHide,
          destinations: [
            _buildNavDestination(Icons.home_rounded, 0),
            _buildNavDestination(Icons.people_rounded, 1),
            _buildNavDestination(Icons.receipt_long_rounded, 2),
            _buildNavDestination(Icons.history_rounded, 3),
          ],
        ),
      ),
    );
  }

  Widget _buildBody() {
    switch (_selectedIndex) {
      case 0:
        return _buildDashboardContent();
      case 1:
        return const CustomersScreen();
      case 2:
        return BillingSearchScreen(onBack: () => setState(() => _selectedIndex = 0));
      case 3:
        return const TransactionsScreen();
      default:
        return _buildDashboardContent();
    }
  }

  Widget _buildDashboardContent() {
    return _isLoading 
      ? const Center(child: CircularProgressIndicator())
      : RefreshIndicator(
          onRefresh: _loadData,
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            physics: const AlwaysScrollableScrollPhysics(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // --- Header ---
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      constraints: const BoxConstraints(maxWidth: 160),
                      child: Image.asset(
                        'assets/images/logo.png',
                        height: 48, 
                        fit: BoxFit.contain,
                        alignment: Alignment.centerLeft,
                      ),
                    ),
                    Row(
                      children: [
                        IconButton(
                          icon: Icon(LucideIcons.fileText, color: Theme.of(context).iconTheme.color),
                          tooltip: 'Laporan Tunggakan',
                          onPressed: () {
                            Navigator.push(context, MaterialPageRoute(builder: (_) => const ArrearsReportScreen()));
                          },
                        ),
                        IconButton(
                          icon: Icon(LucideIcons.bell, color: Theme.of(context).iconTheme.color),
                          onPressed: () {
                            Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationScreen()));
                          },
                        ),
                        const SizedBox(width: 8),
                        PopupMenuButton<String>(
                          offset: const Offset(0, 50),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          color: Theme.of(context).cardColor,
                          onSelected: (value) {
                            if (value == 'settings') {
                              Navigator.push(context, MaterialPageRoute(builder: (_) => const SettingsScreen()));
                            } else if (value == 'logout') {
                              _handleLogout();
                            }
                          },
                          itemBuilder: (context) => [
                            PopupMenuItem(
                              value: 'settings',
                              child: Row(
                                children: [
                                  Icon(LucideIcons.settings, size: 20, color: Theme.of(context).iconTheme.color),
                                  const SizedBox(width: 12),
                                  Text('Pengaturan', style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color)),
                                ],
                              ),
                            ),
                            PopupMenuItem(
                              value: 'logout',
                              child: Row(
                                children: [
                                  const Icon(LucideIcons.logOut, size: 20, color: Colors.red),
                                  const SizedBox(width: 12),
                                  const Text('Keluar', style: TextStyle(color: Colors.red)),
                                ],
                              ),
                            ),
                          ],
                          child: Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: Theme.of(context).cardColor,
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: Theme.of(context).dividerColor.withValues(alpha: 0.1),
                              ),
                            ),
                            alignment: Alignment.center,
                            child: Icon(LucideIcons.user, color: Theme.of(context).iconTheme.color),
                          ),
                        ),
                      ],
                    ),
                  ],
                ).animate().fadeIn().slideY(begin: -0.2),

                const SizedBox(height: 32),

                // --- Dashboard Title ---
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Dashboard',
                      style: GoogleFonts.inter(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).textTheme.bodyLarge?.color,
                      ),
                    ),
                  ],
                ).animate().fadeIn(delay: 100.ms),

                const SizedBox(height: 24),

                // --- Stats Grid ---
                DashboardStatsGrid(
                  pemasukanHariIni: _stats?.pemasukanHariIni ?? 0,
                  pemasukanBulanIni: _stats?.pemasukanBulanIni ?? 0,
                  totalTunggakan: _stats?.totalTunggakan ?? 0,
                  transaksiHariIni: _stats?.wargaBayarHariIni ?? 0,
                  onTunggakanTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const ArrearsReportScreen()),
                    );
                  },
                ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.1),

                const SizedBox(height: 24),

                // --- Revenue Trend Chart ---
                if (_stats != null)
                  RevenueTrendChart(
                    payments: _stats!.allPaymentsForYear,
                    selectedYear: _selectedYear,
                    onYearChanged: (year) {
                      setState(() {
                        _selectedYear = year;
                      });
                      _loadData();
                    },
                  ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.1),

                const SizedBox(height: 24),

                // --- Monthly Bar Chart ---
                if (_stats != null)
                  MonthlyBarChart(
                    stats: _stats!.monthlyStats,
                    selectedYear: _selectedYear,
                    onYearChanged: (year) {
                      setState(() {
                        _selectedYear = year;
                      });
                      _loadData();
                    },
                  ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.1),

                const SizedBox(height: 24),

                // --- Wilayah Distribution Chart ---
                if (_stats != null)
                  WilayahDistributionChart(stats: _stats!.wilayahStats)
                      .animate().fadeIn(delay: 500.ms).slideY(begin: 0.1),
                
                const SizedBox(height: 32),
                
                // --- Recent Transactions ---
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Transaksi Terbaru',
                      style: GoogleFonts.inter(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).textTheme.bodyLarge?.color,
                      ),
                    ),
                    Icon(Icons.more_horiz, color: Theme.of(context).iconTheme.color?.withValues(alpha: 0.5)),
                  ],
                ),
                const SizedBox(height: 16),
                ...(_stats?.recentPayments ?? []).take(5).map((payment) => _buildTransactionItem(payment)),
                
                const SizedBox(height: 80), // Padding for bottom nav
              ],
            ),
          ),
        );
  }

  NavigationDestination _buildNavDestination(IconData icon, int index) {
    final theme = Theme.of(context);
    final unselectedColor = theme.brightness == Brightness.dark ? Colors.white54 : Colors.grey[400];
    
    return NavigationDestination(
      icon: Icon(icon, color: unselectedColor),
      selectedIcon: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: theme.primaryColor,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: theme.primaryColor.withValues(alpha: 0.3),
              blurRadius: 10,
              offset: const Offset(0, 5),
            )
          ],
        ),
        child: Icon(icon, color: Colors.white, size: 24),
      ),
      label: '',
    );
  }

  Widget _buildTransactionItem(Payment payment) {
    final theme = Theme.of(context);
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: theme.dividerColor.withValues(alpha: 0.1)),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: payment.metodeBayar == 'transfer' ? Colors.blue.withValues(alpha: 0.1) : Colors.green.withValues(alpha: 0.1),
            radius: 20,
            child: Icon(
              payment.metodeBayar == 'transfer' ? LucideIcons.creditCard : LucideIcons.banknote,
              color: payment.metodeBayar == 'transfer' ? Colors.blue : Colors.green,
              size: 18,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  payment.customerNama,
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.w600,
                    color: theme.textTheme.bodyLarge?.color,
                  ),
                ),
                Text(
                  DateFormat('d MMM yyyy • HH:mm').format(payment.tanggalBayar),
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: theme.textTheme.bodySmall?.color,
                  ),
                ),
              ],
            ),
          ),
          Text(
            formatCurrency(payment.jumlahBayar),
            style: GoogleFonts.inter(
              fontWeight: FontWeight.bold,
              color: theme.textTheme.bodyLarge?.color,
            ),
          ),
        ],
      ),
    );
  }
}
