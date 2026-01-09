import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobile_admin/services/api_service.dart';
import 'package:intl/intl.dart';
import 'dart:async';
import 'package:mobile_admin/screens/billing/billing_form_screen.dart';

class BillingSearchScreen extends StatefulWidget {
  final VoidCallback? onBack;
  const BillingSearchScreen({super.key, this.onBack});

  @override
  State<BillingSearchScreen> createState() => _BillingSearchScreenState();
}

class _BillingSearchScreenState extends State<BillingSearchScreen> {
  final ApiService _apiService = ApiService();
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _searchController = TextEditingController();
  Timer? _debounce;

  List<Customer> _customers = [];
  bool _isLoading = false;
  bool _hasMore = true;
  int _page = 1;
  final int _limit = 15;

  String _searchQuery = '';
  String? _selectedWilayah;
  List<String> _wilayahList = [];

  @override
  void initState() {
    super.initState();
    _loadWilayahList();
    _loadCustomers(reset: true);
    
    _scrollController.addListener(() {
      if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent * 0.9 &&
          !_isLoading &&
          _hasMore) {
        _loadCustomers();
      }
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _searchController.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () {
      if (query != _searchQuery) {
        setState(() => _searchQuery = query);
        _loadCustomers(reset: true);
      }
    });
  }

  Future<void> _loadWilayahList() async {
    final list = await _apiService.getWilayahList();
    if (mounted) {
      setState(() => _wilayahList = list);
    }
  }

  Future<void> _loadCustomers({bool reset = false}) async {
    if (_isLoading) return;

    setState(() {
      _isLoading = true;
      if (reset) {
        _customers = [];
        _page = 1;
        _hasMore = true;
      }
    });

    try {
      final response = await _apiService.getCustomers(
        page: _page,
        limit: _limit,
        search: _searchQuery,
        status: 'aktif', // Only active customers for billing usually
        wilayah: _selectedWilayah,
      );

      if (response != null && mounted) {
        setState(() {
          if (reset) {
            _customers = response.data;
          } else {
            _customers.addAll(response.data);
          }
          _page++;
          _hasMore = response.data.length >= _limit;
        });
      }
    } catch (e) {
      // Handle error
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showFilterSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Theme.of(context).cardColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        final theme = Theme.of(context);
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Container(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Filter Wilayah',
                    style: GoogleFonts.inter(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: theme.textTheme.bodyLarge?.color,
                    ),
                  ),
                  const SizedBox(height: 24),
                  DropdownButtonFormField<String>(
                    value: _selectedWilayah,
                    dropdownColor: theme.cardColor,
                    style: TextStyle(color: theme.textTheme.bodyLarge?.color),
                    decoration: InputDecoration(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      fillColor: theme.brightness == Brightness.dark ? theme.scaffoldBackgroundColor : Colors.white,
                      filled: true,
                    ),
                    items: [
                      DropdownMenuItem(value: null, child: Text('Semua Wilayah', style: TextStyle(color: theme.textTheme.bodyLarge?.color))),
                      ..._wilayahList.map((w) => DropdownMenuItem(value: w, child: Text(w, style: TextStyle(color: theme.textTheme.bodyLarge?.color)))),
                    ],
                    onChanged: (val) {
                      setModalState(() => _selectedWilayah = val);
                    },
                  ),
                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        _loadCustomers(reset: true);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: theme.primaryColor,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text('Terapkan Filter', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        backgroundColor: theme.cardColor,
        elevation: 0,
        leading: (widget.onBack != null || Navigator.canPop(context))
            ? IconButton(
                icon: Icon(LucideIcons.arrowLeft, color: theme.iconTheme.color),
                onPressed: () {
                  if (widget.onBack != null) {
                    widget.onBack!();
                  } else {
                    Navigator.pop(context);
                  }
                },
              )
            : null,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Buat Tagihan',
              style: GoogleFonts.inter(
                color: theme.textTheme.bodyLarge?.color,
                fontWeight: FontWeight.bold,
                fontSize: 20,
              ),
            ),
            Text(
              'Pilih pelanggan untuk ditagih',
              style: GoogleFonts.inter(
                color: theme.textTheme.bodySmall?.color,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            color: theme.cardColor,
            child: Row(
              children: [
                Expanded(
                   child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: isDark ? theme.scaffoldBackgroundColor : const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: TextField(
                      controller: _searchController,
                      onChanged: _onSearchChanged,
                      style: TextStyle(color: theme.textTheme.bodyLarge?.color),
                      decoration: InputDecoration(
                        hintText: 'Cari nama pelanggan...',
                        hintStyle: TextStyle(color: theme.textTheme.bodySmall?.color),
                        border: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        focusedBorder: InputBorder.none,
                        fillColor: Colors.transparent,
                        filled: false,
                        icon: Icon(LucideIcons.search, size: 20, color: theme.disabledColor),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                InkWell(
                  onTap: _showFilterSheet,
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: _selectedWilayah != null
                          ? theme.primaryColor.withOpacity(0.1) 
                          : (isDark ? theme.scaffoldBackgroundColor : const Color(0xFFF1F5F9)),
                      borderRadius: BorderRadius.circular(12),
                      border: _selectedWilayah != null
                          ? Border.all(color: theme.primaryColor)
                          : null,
                    ),
                    child: Icon(
                      LucideIcons.filter, 
                      size: 20, 
                      color: _selectedWilayah != null
                          ? theme.primaryColor
                          : theme.iconTheme.color
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          Expanded(
            child: _customers.isEmpty && !_isLoading
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(LucideIcons.users, size: 64, color: theme.disabledColor),
                        const SizedBox(height: 16),
                        Text('Tidak ada data pelanggan', style: GoogleFonts.inter(color: theme.disabledColor)),
                      ],
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: () => _loadCustomers(reset: true),
                    child: ListView.separated(
                      controller: _scrollController,
                      padding: const EdgeInsets.all(16),
                      itemCount: _customers.length + (_hasMore ? 1 : 0),
                      separatorBuilder: (context, index) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        if (index == _customers.length) {
                          return const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator()));
                        }
                        
                        final customer = _customers[index];
                        return _buildCustomerCard(context, customer);
                      },
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildCustomerCard(BuildContext context, Customer customer) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final formatCurrency = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);
    
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => BillingFormScreen(customer: customer),
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: theme.cardColor,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(isDark ? 0.2 : 0.03),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
          border: Border.all(color: theme.dividerColor.withOpacity(0.1)),
        ),
        child: Row(
          children: [
            ClipOval(
              child: Image.asset(
                'assets/images/customer-icon.png',
                width: 50,
                height: 50,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: isDark ? theme.primaryColor.withOpacity(0.2) : const Color(0xFFEFF6FF),
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        customer.nama.isNotEmpty ? customer.nama[0].toUpperCase() : '?',
                        style: GoogleFonts.inter(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: theme.primaryColor,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(width: 16),
            
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    customer.nama,
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.w600,
                      color: theme.textTheme.bodyLarge?.color,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${customer.wilayah} • ${customer.nomorPelanggan}',
                    style: GoogleFonts.inter(fontSize: 12, color: theme.textTheme.bodySmall?.color),
                  ),
                ],
              ),
            ),

            if (customer.tunggakan > 0)
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    'Tunggakan',
                    style: GoogleFonts.inter(fontSize: 10, color: theme.textTheme.bodySmall?.color),
                  ),
                  Text(
                    formatCurrency.format(customer.tunggakan),
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFFEF4444),
                    ),
                  ),
                ],
              )
            else
               const Icon(LucideIcons.checkCircle, color: Colors.green, size: 20),
          ],
        ),
      ),
    );
  }
}
