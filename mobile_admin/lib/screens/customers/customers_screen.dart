import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobile_admin/services/api_service.dart';
import 'package:intl/intl.dart';
import 'dart:async';
import 'package:mobile_admin/screens/customers/customer_detail_screen.dart';
import 'package:mobile_admin/screens/customers/customer_form_screen.dart'; 

class CustomersScreen extends StatefulWidget {
  const CustomersScreen({super.key});

  @override
  State<CustomersScreen> createState() => _CustomersScreenState();
}

class _CustomersScreenState extends State<CustomersScreen> {
  final ApiService _apiService = ApiService();
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _searchController = TextEditingController();
  Timer? _debounce;

  // Data State
  List<Customer> _customers = [];
  bool _isLoading = false;
  bool _hasMore = true;
  int _page = 1;
  final int _limit = 15;

  // Filters State
  String _searchQuery = '';
  String? _selectedStatus;
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
        status: _selectedStatus,
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
                    'Filter Pelanggan',
                    style: GoogleFonts.inter(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: theme.textTheme.bodyLarge?.color,
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  Text('Status', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: theme.textTheme.bodyMedium?.color)),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _buildFilterChip(
                        context,
                        label: 'Semua',
                        selected: _selectedStatus == null,
                        onTap: () => setModalState(() => _selectedStatus = null),
                      ),
                      const SizedBox(width: 8),
                      _buildFilterChip(
                         context,
                        label: 'Aktif',
                        selected: _selectedStatus == 'aktif',
                        onTap: () => setModalState(() => _selectedStatus = 'aktif'),
                      ),
                      const SizedBox(width: 8),
                      _buildFilterChip(
                         context,
                        label: 'Nonaktif',
                        selected: _selectedStatus == 'nonaktif',
                        onTap: () => setModalState(() => _selectedStatus = 'nonaktif'),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 24),

                  Text('Wilayah', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: theme.textTheme.bodyMedium?.color)),
                  const SizedBox(height: 12),
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

  Widget _buildFilterChip(BuildContext context, {required String label, required bool selected, required VoidCallback onTap}) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? theme.primaryColor : (isDark ? theme.scaffoldBackgroundColor : Colors.grey[100]),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: selected ? Colors.transparent : theme.dividerColor),
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            color: selected ? Colors.white : theme.textTheme.bodyMedium?.color,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
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
        title: Text(
          'Pelanggan',
          style: GoogleFonts.inter(
            color: theme.textTheme.bodyLarge?.color,
            fontWeight: FontWeight.bold,
            fontSize: 20,
          ),
        ),
        actions: [
          IconButton(
            onPressed: () async {
              final result = await Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const CustomerFormScreen()),
              );
              if (result == true) {
                _loadCustomers(reset: true);
              }
            },
            icon: Icon(LucideIcons.plus, color: theme.iconTheme.color),
          ),
        ],
      ),
      body: Column(
        children: [
          // Search & Filter Bar
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
                        hintText: 'Cari nama, no. pelanggan...',
                        hintStyle: TextStyle(color: theme.textTheme.bodySmall?.color),
                        border: InputBorder.none,
                        enabledBorder: InputBorder.none, // Override theme input decoration
                        focusedBorder: InputBorder.none,
                        fillColor: Colors.transparent, // Let container color show
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
                      color: (_selectedStatus != null || _selectedWilayah != null) 
                          ? theme.primaryColor.withOpacity(0.1) 
                          : (isDark ? theme.scaffoldBackgroundColor : const Color(0xFFF1F5F9)),
                      borderRadius: BorderRadius.circular(12),
                      border: (_selectedStatus != null || _selectedWilayah != null)
                          ? Border.all(color: theme.primaryColor)
                          : null,
                    ),
                    child: Icon(
                      LucideIcons.filter, 
                      size: 20, 
                      color: (_selectedStatus != null || _selectedWilayah != null)
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
    final bool isAktif = customer.status == 'aktif';

    return GestureDetector(
      onTap: () async {
        await Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => CustomerDetailScreen(customerId: customer.id),
          ),
        );
        _loadCustomers(reset: true);
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: theme.cardColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: theme.dividerColor.withOpacity(0.1)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(isDark ? 0.2 : 0.03),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            // Avatar
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
                      color: isAktif 
                          ? (isDark ? theme.primaryColor.withOpacity(0.2) : const Color(0xFFEFF6FF))
                          : (isDark ? Colors.grey[800] : Colors.grey[100]),
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        customer.nama.isNotEmpty ? customer.nama[0].toUpperCase() : '?',
                        style: GoogleFonts.inter(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: isAktif ? theme.primaryColor : theme.disabledColor,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(width: 16),
            
            // Info
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
                  Row(
                    children: [
                      Icon(LucideIcons.mapPin, size: 12, color: theme.disabledColor),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          '${customer.wilayah} • ${customer.nomorPelanggan}',
                          style: GoogleFonts.inter(fontSize: 12, color: theme.textTheme.bodySmall?.color),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Status & Arrears
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: isAktif 
                        ? (isDark ? const Color(0xFF064E3B) : const Color(0xFFDCFCE7))
                        : (isDark ? Colors.grey[700] : Colors.grey[200]),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    isAktif ? 'Aktif' : 'Nonaktif',
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: isAktif 
                          ? (isDark ? const Color(0xFF6EE7B7) : const Color(0xFF166534))
                          : (isDark ? Colors.grey[300] : Colors.grey[600]),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                if (customer.tunggakan > 0)
                  Text(
                    formatCurrency.format(customer.tunggakan),
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFFEF4444),
                    ),
                  )
                else
                  Text(
                    'Lunas',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF10B981),
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
