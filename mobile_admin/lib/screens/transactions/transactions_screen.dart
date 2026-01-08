import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobile_admin/services/api_service.dart';
import 'package:mobile_admin/services/receipt_service.dart';

class TransactionsScreen extends StatefulWidget {
  const TransactionsScreen({super.key});

  @override
  State<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends State<TransactionsScreen> {
  final ApiService _apiService = ApiService();
  
  // State
  List<Payment> _payments = [];
  bool _isLoading = true;
  bool _isLoadingMore = false;
  
  // Pagination
  int _currentPage = 1;
  int _totalPages = 1;
  final int _limit = 20;
  final ScrollController _scrollController = ScrollController();

  // Filter
  DateTime? _dateFrom;
  DateTime? _dateTo;
  String _filterMetode = ''; // '', 'tunai', 'transfer'
  
  int _totalTransactions = 0;
  
  @override
  void initState() {
    super.initState();
    _fetchPayments(reset: true);
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200 &&
        !_isLoadingMore &&
        _currentPage < _totalPages) {
      _fetchPayments(reset: false);
    }
  }

  Future<void> _fetchPayments({bool reset = false}) async {
    if (reset) {
      setState(() {
        _isLoading = true;
        _payments = [];
        _currentPage = 1;
      });
    } else {
      setState(() {
        _isLoadingMore = true;
      });
    }

    final dateFromStr = _dateFrom != null ? DateFormat('yyyy-MM-dd').format(_dateFrom!) : null;
    final dateToStr = _dateTo != null ? DateFormat('yyyy-MM-dd').format(_dateTo!) : null;

    final response = await _apiService.getPayments(
      page: _currentPage,
      limit: _limit,
      dateFrom: dateFromStr,
      dateTo: dateToStr,
      metodeBayar: _filterMetode,
    );

    if (mounted) {
      setState(() {
        _isLoading = false;
        _isLoadingMore = false;
        if (response != null) {
          if (reset) {
            _payments = response.data;
          } else {
            _payments.addAll(response.data);
          }
          _totalPages = response.meta.lastPage;
          _totalTransactions = response.meta.total;
          if (!reset) _currentPage++;
        }
      });
    }
  }

  void _showFilterSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Theme.of(context).cardColor,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) {
        final theme = Theme.of(context);
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Container(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                   Text('Filter Transaksi', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: theme.textTheme.bodyLarge?.color)),
                  const SizedBox(height: 20),
                  
                  // Date Range
                  Text('Tanggal', style: TextStyle(fontWeight: FontWeight.w600, color: theme.textTheme.bodyLarge?.color)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () async {
                            final picked = await showDatePicker(
                              context: context,
                              initialDate: _dateFrom ?? DateTime.now(),
                              firstDate: DateTime(2020),
                              lastDate: DateTime.now(),
                            );
                            if (picked != null) {
                              setSheetState(() => _dateFrom = picked);
                            }
                          },
                          icon: Icon(LucideIcons.calendar, size: 16, color: theme.iconTheme.color),
                          label: Text(_dateFrom != null ? DateFormat('dd/MM/yy').format(_dateFrom!) : 'Dari', style: TextStyle(color: theme.textTheme.bodyLarge?.color)),
                          style: OutlinedButton.styleFrom(side: BorderSide(color: theme.dividerColor)),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () async {
                            final picked = await showDatePicker(
                              context: context,
                              initialDate: _dateTo ?? DateTime.now(),
                              firstDate: DateTime(2020),
                              lastDate: DateTime.now(),
                            );
                            if (picked != null) {
                              setSheetState(() => _dateTo = picked);
                            }
                          },
                          icon: Icon(LucideIcons.calendar, size: 16, color: theme.iconTheme.color),
                          label: Text(_dateTo != null ? DateFormat('dd/MM/yy').format(_dateTo!) : 'Sampai', style: TextStyle(color: theme.textTheme.bodyLarge?.color)),
                          style: OutlinedButton.styleFrom(side: BorderSide(color: theme.dividerColor)),
                        ),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // Method
                  Text('Metode Pembayaran', style: TextStyle(fontWeight: FontWeight.w600, color: theme.textTheme.bodyLarge?.color)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: [
                      _buildFilterChip(context, 'Semua', '', setSheetState),
                      _buildFilterChip(context, 'Tunai', 'tunai', setSheetState),
                      _buildFilterChip(context, 'Transfer', 'transfer', setSheetState),
                    ],
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Actions
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {
                            setSheetState(() {
                              _dateFrom = null;
                              _dateTo = null;
                              _filterMetode = '';
                            });
                          },
                          style: OutlinedButton.styleFrom(side: BorderSide(color: theme.dividerColor)),
                          child: Text('Reset', style: TextStyle(color: theme.textTheme.bodyLarge?.color)),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () {
                            Navigator.pop(context);
                            _fetchPayments(reset: true);
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: theme.primaryColor,
                            foregroundColor: Colors.white,
                          ),
                          child: const Text('Terapkan'),
                        ),
                      ),
                    ],
                  )
                ],
              ),
            );
          }
        );
      }
    );
  }

  Widget _buildFilterChip(BuildContext context, String label, String value, StateSetter setSheetState) {
    final theme = Theme.of(context);
    final isSelected = _filterMetode == value;
    final isDark = theme.brightness == Brightness.dark;
    
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (val) {
        setSheetState(() => _filterMetode = value);
      },
      selectedColor: theme.primaryColor.withOpacity(0.2),
      checkmarkColor: theme.primaryColor,
      backgroundColor: isDark ? theme.scaffoldBackgroundColor : Colors.grey[100],
      labelStyle: TextStyle(
        color: isSelected ? theme.primaryColor : theme.textTheme.bodyMedium?.color,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
      ),
      side: BorderSide(color: isSelected ? theme.primaryColor : theme.dividerColor),
    );
  }

  void _showTransactionDetails(Payment payment) {
    showDialog(
      context: context,
      builder: (context) => _TransactionDetailDialog(
        payment: payment, 
        onCancel: () async {
           // Handle Cancel
           final confirm = await showDialog<bool>(
             context: context,
             builder: (ctx) => AlertDialog(
               title: const Text('Batalkan Transaksi?'),
               content: const Text('Apakah Anda yakin ingin membatalkan transaksi ini? Status pelanggan akan kembali menunggak.'),
               actions: [
                 TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
                 ElevatedButton(
                   onPressed: () => Navigator.pop(ctx, true), 
                   style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
                   child: const Text('Ya, Batalkan')
                 ),
               ],
             )
           );

           if (confirm == true) {
             final success = await _apiService.cancelPayment(payment.id);
             if (mounted) {
               Navigator.pop(context); // Close dialog
               if (success) {
                 ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Transaksi berhasil dibatalkan')));
                 _fetchPayments(reset: true);
               } else {
                 ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Gagal membatalkan transaksi')));
               }
             }
           }
        }
      )
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Text('Riwayat Transaksi', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18, color: theme.textTheme.bodyLarge?.color)),
        backgroundColor: theme.cardColor,
        elevation: 0,
        centerTitle: true,
        iconTheme: IconThemeData(color: theme.iconTheme.color),
        actions: [
          IconButton(
            onPressed: _showFilterSheet,
            icon: Stack(
              children: [
                Icon(LucideIcons.filter, color: theme.iconTheme.color),
                if (_dateFrom != null || _dateTo != null || _filterMetode.isNotEmpty)
                  Positioned(
                    right: 0, top: 0,
                    child: Container(
                      width: 8, height: 8,
                      decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                    ),
                  )
              ],
            ),
          )
        ],
      ),
      body: Column(
        children: [
          // Counts
          if (!_isLoading)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: isDark ? theme.primaryColor.withOpacity(0.1) : Colors.blue[50],
              border: Border(bottom: BorderSide(color: theme.primaryColor.withOpacity(0.2))),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('$_totalTransactions Transaksi', style: TextStyle(color: theme.primaryColor, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          
          Expanded(
            child: _isLoading 
              ? const Center(child: CircularProgressIndicator()) 
              : _payments.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(LucideIcons.searchX, size: 48, color: theme.disabledColor),
                        const SizedBox(height: 16),
                        Text('Tidak ada transaksi ditemukan', style: TextStyle(color: theme.disabledColor)),
                      ],
                    ),
                  )
                : ListView.separated(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: _payments.length + (_isLoadingMore ? 1 : 0),
                    separatorBuilder: (ctx, i) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      if (index == _payments.length) {
                        return const Center(child: Padding(padding: EdgeInsets.all(8), child: CircularProgressIndicator()));
                      }
                      
                      final item = _payments[index];
                      return _TransactionCard(
                        payment: item, 
                        onTap: () => _showTransactionDetails(item)
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

class _TransactionCard extends StatelessWidget {
  final Payment payment;
  final VoidCallback onTap;
  
  const _TransactionCard({required this.payment, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final fmt = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);

    return Material(
      color: theme.cardColor,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12), 
        side: BorderSide(color: theme.dividerColor.withOpacity(0.1))
      ),
      elevation: 2,
      shadowColor: Colors.black.withOpacity(isDark ? 0.2 : 0.05),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header: Date & Status
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(children: [
                    Icon(LucideIcons.calendar, size: 14, color: theme.disabledColor),
                    const SizedBox(width: 4),
                    Text(
                      DateFormat('dd MMM yyyy • HH:mm').format(payment.tanggalBayar), 
                      style: TextStyle(fontSize: 12, color: theme.textTheme.bodySmall?.color)
                    ),
                  ]),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: payment.metodeBayar == 'transfer' 
                          ? (isDark ? Colors.blue[900] : Colors.blue[50]) 
                          : (isDark ? Colors.green[900] : Colors.green[50]),
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: payment.metodeBayar == 'transfer' ? Colors.blue : Colors.green, width: 0.5)
                    ),
                    child: Text(
                      payment.metodeBayar.toUpperCase(),
                      style: TextStyle(
                        fontSize: 10, 
                        fontWeight: FontWeight.bold,
                        color: payment.metodeBayar == 'transfer' 
                            ? (isDark ? Colors.blue[100] : Colors.blue[700])
                            : (isDark ? Colors.green[100] : Colors.green[700])
                      ),
                    ),
                  )
                ],
              ),
              const SizedBox(height: 12),
              
              // Customer
              Text(
                payment.customerNama,
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: theme.textTheme.bodyLarge?.color),
              ),
              if (payment.customerWilayah.isNotEmpty)
                Text(payment.customerWilayah, style: TextStyle(fontSize: 12, color: theme.textTheme.bodySmall?.color)),
                
              const SizedBox(height: 12),
              Divider(height: 1, color: theme.dividerColor),
              const SizedBox(height: 12),
              
              // Details
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                   Column(
                     crossAxisAlignment: CrossAxisAlignment.start,
                     children: [
                       Text('${payment.bulanDibayar.length} Bulan', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: theme.textTheme.bodyMedium?.color)),
                       if (payment.bulanDibayar.isNotEmpty)
                          Text(
                            payment.bulanDibayar.take(2).map((m) {
                              try {
                                return DateFormat('MMM').format(DateTime.parse('$m-01'));
                              } catch(e) { return m; }
                            }).join(', ') + (payment.bulanDibayar.length > 2 ? '...' : ''),
                            style: TextStyle(fontSize: 11, color: theme.disabledColor)
                          )
                     ],
                   ),
                   Text(
                     fmt.format(payment.jumlahBayar),
                     style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: theme.primaryColor)
                   ),
                ],
              )
            ],
          ),
        ),
      ),
    );
  }
}

class _TransactionDetailDialog extends StatelessWidget {
  final Payment payment;
  final VoidCallback onCancel;

  const _TransactionDetailDialog({required this.payment, required this.onCancel});

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Detail Transaksi'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _detailRow(context, 'ID', payment.id.substring(0, 8).toUpperCase()),
           const Divider(),
          _detailRow(context, 'Pelanggan', payment.customerNama),
          _detailRow(context, 'Tanggal', DateFormat('dd MMM yyyy HH:mm').format(payment.tanggalBayar)),
          _detailRow(context, 'Metode', payment.metodeBayar.toUpperCase()),
          const Divider(),
          const Text('Bulan Dibayar:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
          const SizedBox(height: 4),
          Text(payment.bulanDibayar.join(', '), style: const TextStyle(fontSize: 12)),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('TOTAL', style: TextStyle(fontWeight: FontWeight.bold)),
              Text(
                NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0).format(payment.jumlahBayar),
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Theme.of(context).primaryColor)
              ),
            ],
          )
        ],
      ),
      actions: [
        TextButton.icon(
          onPressed: () {
            final result = PaymentResult(
              id: payment.id,
              jumlahBayar: payment.jumlahBayar,
              tanggalBayar: payment.tanggalBayar,
              metodeBayar: payment.metodeBayar,
              customerNama: payment.customerNama,
              bulanDibayar: payment.bulanDibayar,
              isPartial: false, 
            );
            
            Navigator.pop(context); // Close dialog first to allow printing UI
            ReceiptService.printReceipt(
              result, 
              customerName: payment.customerNama, 
              customerWilayah: payment.customerWilayah
            );
          },
          icon: const Icon(LucideIcons.printer, size: 16),
          label: const Text('Cetak Struk'),
        ),
        if (!payment.isDeposited)
          TextButton(
            onPressed: onCancel,
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Batalkan'),
          ),
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Tutup'),
        ),
      ],
    );
  }

  Widget _detailRow(BuildContext context, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Theme.of(context).disabledColor, fontSize: 12)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 12)),
        ],
      ),
    );
  }
}
