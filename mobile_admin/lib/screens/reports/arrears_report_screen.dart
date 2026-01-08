
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobile_admin/services/api_service.dart';
import 'package:mobile_admin/screens/customers/customer_detail_screen.dart';

class ArrearsReportScreen extends StatefulWidget {
  const ArrearsReportScreen({super.key});

  @override
  State<ArrearsReportScreen> createState() => _ArrearsReportScreenState();
}

class _ArrearsReportScreenState extends State<ArrearsReportScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  ArrearsReportResponse? _report;
  
  // Filter
  String _selectedWilayah = '';
  String _sortBy = 'amount_desc';
  List<String> _wilayanList = [];

  @override
  void initState() {
    super.initState();
    _loadData();
    _loadWilayah();
  }

  Future<void> _loadWilayah() async {
    final list = await _apiService.getWilayahList();
    if (mounted) {
      setState(() {
        _wilayanList = list;
      });
    }
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    // Note: API integration for sortBy needs to be updated in api_service.dart too if it supports it.
    // Assuming API supports it as web uses it.
    final data = await _apiService.getArrears(wilayah: _selectedWilayah, sortBy: _sortBy);
    if (mounted) {
      setState(() {
        _report = data;
        _isLoading = false;
      });
    }
  }

  String formatCurrency(num value) {
    final format = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);
    return format.format(value);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        title: Text(
          'Laporan Tunggakan',
          style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        elevation: 0,
        backgroundColor: theme.appBarTheme.backgroundColor ?? theme.cardColor,
        foregroundColor: theme.appBarTheme.foregroundColor ?? theme.textTheme.bodyLarge?.color,
        iconTheme: theme.iconTheme,
      ),
      body: Column(
        children: [
          // Filter Section
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: theme.cardColor,
            child: Column(
              children: [
                Row(
                  children: [
                    Icon(LucideIcons.filter, size: 20, color: theme.iconTheme.color),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        decoration: BoxDecoration(
                          color: isDark ? Colors.grey[800] : Colors.grey[100],
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _selectedWilayah,
                            isExpanded: true,
                            hint: Text('Semua Wilayah', style: GoogleFonts.inter(color: theme.textTheme.bodyMedium?.color)),
                            dropdownColor: theme.cardColor,
                            style: GoogleFonts.inter(color: theme.textTheme.bodyLarge?.color),
                            iconEnabledColor: theme.iconTheme.color,
                            items: [
                              DropdownMenuItem(value: '', child: Text('Semua Wilayah', style: GoogleFonts.inter(color: theme.textTheme.bodyLarge?.color))),
                              ..._wilayanList.map((w) => DropdownMenuItem(value: w, child: Text(w, style: GoogleFonts.inter(color: theme.textTheme.bodyLarge?.color)))),
                            ],
                            onChanged: (val) {
                              setState(() {
                                _selectedWilayah = val ?? '';
                              });
                              _loadData();
                            },
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(LucideIcons.arrowUpDown, size: 20, color: theme.iconTheme.color),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        decoration: BoxDecoration(
                          color: isDark ? Colors.grey[800] : Colors.grey[100],
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _sortBy,
                            isExpanded: true,
                            dropdownColor: theme.cardColor,
                            style: GoogleFonts.inter(color: theme.textTheme.bodyLarge?.color),
                            iconEnabledColor: theme.iconTheme.color,
                            items: [
                              DropdownMenuItem(value: 'amount_desc', child: Text('Tunggakan Terbesar', style: GoogleFonts.inter(color: theme.textTheme.bodyLarge?.color))),
                              DropdownMenuItem(value: 'amount_asc', child: Text('Tunggakan Terkecil', style: GoogleFonts.inter(color: theme.textTheme.bodyLarge?.color))),
                            ],
                            onChanged: (val) {
                              setState(() {
                                _sortBy = val ?? 'amount_desc';
                              });
                              _loadData();
                            },
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          
          if (_isLoading)
            const Expanded(child: Center(child: CircularProgressIndicator()))
          else if (_report == null)
            Expanded(child: Center(child: Text('Gagal memuat data', style: TextStyle(color: theme.textTheme.bodyLarge?.color))))
          else ...[
            // Summary Card (Sticky-like)
            Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Colors.red, Color(0xFFE53935)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.red.withValues(alpha: 0.3),
                    blurRadius: 10,
                    offset: const Offset(0, 5),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'TOTAL TUNGGAKAN',
                            style: GoogleFonts.inter(
                              color: Colors.white.withValues(alpha: 0.9),
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            formatCurrency(_report!.summary.totalArrears),
                            style: GoogleFonts.inter(
                              color: Colors.white,
                              fontSize: 28, // Large text
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(LucideIcons.alertCircle, color: Colors.white, size: 24),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(LucideIcons.users, color: Colors.white, size: 16),
                        const SizedBox(width: 8),
                        Text(
                          '${_report!.summary.totalCustomers} Pelanggan Menunggak',
                          style: GoogleFonts.inter(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // List
            Expanded(
              child: _report!.customers.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(LucideIcons.checkCircle, size: 64, color: Colors.green[300]),
                          const SizedBox(height: 16),
                          Text(
                            'Tidak Ada Tunggakan',
                            style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: theme.textTheme.bodyLarge?.color),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Semua pelanggan di wilayah ini sudah lunas',
                            style: GoogleFonts.inter(color: theme.textTheme.bodyMedium?.color ?? Colors.grey),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      itemCount: _report!.customers.length,
                      itemBuilder: (context, index) {
                        final item = _report!.customers[index];
                        final customer = item.customer;
                        final arrears = item.arrears;

                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          decoration: BoxDecoration(
                            color: theme.cardColor,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: theme.dividerColor.withValues(alpha: 0.1)),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.02),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: InkWell(
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => CustomerDetailScreen(customerId: customer.id),
                                ),
                              );
                            },
                            borderRadius: BorderRadius.circular(12),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  CircleAvatar(
                                    backgroundColor: isDark ? Colors.red.withValues(alpha: 0.1) : Colors.red[50],
                                    radius: 20,
                                    child: const Icon(LucideIcons.user, color: Colors.red, size: 20),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          customer.nama,
                                          style: GoogleFonts.inter(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 16,
                                            color: theme.textTheme.bodyLarge?.color,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Row(
                                          children: [
                                            Icon(LucideIcons.mapPin, size: 12, color: theme.textTheme.bodySmall?.color),
                                            const SizedBox(width: 4),
                                            Text(
                                              customer.wilayah,
                                              style: GoogleFonts.inter(fontSize: 12, color: theme.textTheme.bodySmall?.color),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(
                                        formatCurrency(arrears.totalArrears),
                                        style: GoogleFonts.inter(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 16,
                                          color: Colors.red[600],
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: isDark ? Colors.red.withValues(alpha: 0.1) : Colors.red[50],
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: Text(
                                          '${arrears.totalMonths} Bulan',
                                          style: GoogleFonts.inter(
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                            color: Colors.red[700],
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ],
      ),
    );
  }
}
