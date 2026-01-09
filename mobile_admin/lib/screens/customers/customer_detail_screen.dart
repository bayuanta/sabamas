import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobile_admin/services/api_service.dart';
import 'package:mobile_admin/services/receipt_service.dart';
import 'package:intl/intl.dart';
import 'package:mobile_admin/screens/customers/customer_form_screen.dart';
import 'package:url_launcher/url_launcher.dart';

class CustomerDetailScreen extends StatefulWidget {
  final String customerId;

  const CustomerDetailScreen({super.key, required this.customerId});

  @override
  State<CustomerDetailScreen> createState() => _CustomerDetailScreenState();
}

class _CustomerDetailScreenState extends State<CustomerDetailScreen> with SingleTickerProviderStateMixin {
  final ApiService _apiService = ApiService();
  Customer? _customer;
  List<StatusHistory> _statusHistory = [];
  bool _isLoading = true;
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadDetail();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadDetail() async {
    setState(() => _isLoading = true);
    final data = await _apiService.getCustomerDetail(widget.customerId);
    final history = await _apiService.getStatusHistory(widget.customerId);
    
    if (mounted) {
      setState(() {
        _customer = data;
        _statusHistory = history;
        _isLoading = false;
      });
    }
  }

  String _generateArrearsMessage(Customer c) {
    final formatCurrency = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);

    String monthName(String yyyyMm) {
      try {
        // Handle format '2023-11'
        final parts = yyyyMm.split('-');
        if (parts.length == 2) {
            final dt = DateTime(int.parse(parts[0]), int.parse(parts[1]));
             return DateFormat('MMMM yyyy', 'id_ID').format(dt);
        }
        return yyyyMm;
      } catch (e) {
        return yyyyMm;
      }
    }
    
    final rincian = c.arrearsDetail?.arrearMonths.asMap().entries.map((e) {
      final i = e.key + 1;
      final m = e.value;
      return '$i. ${monthName(m.month)} - ${formatCurrency.format(m.amount)}';
    }).join('\n') ?? 'Tidak ada tunggakan';
    
    final totalMonths = c.arrearsDetail?.totalMonths ?? 0;
    final totalArrears = c.arrearsDetail?.totalArrears ?? 0;

    return '''
*INFORMASI TUNGGAKAN*
━━━━━━━━━━━━━━━━━━

*Pelanggan:* ${c.nama}
*Alamat:* ${c.alamat}
*Wilayah:* ${c.wilayah}

━━━━━━━━━━━━━━━━━━
*RINCIAN TUNGGAKAN*

$rincian

━━━━━━━━━━━━━━━━━━
*Total Bulan:* $totalMonths bulan
*TOTAL TUNGGAKAN:* ${formatCurrency.format(totalArrears)}

Mohon segera lakukan pembayaran. 🙏

_SABAMAS - Sistem Billing Sampah_
    '''.trim();
  }

  Future<void> _shareWa() async {
     if (_customer == null) return;
     
     final message = _generateArrearsMessage(_customer!);
     final phone = _customer!.noHp;
     final cleanPhone = phone.replaceAll(RegExp(r'\D'), '');
     
     String urlString;
     
     if (cleanPhone.isNotEmpty) {
       String targetPhone = cleanPhone;
       if (targetPhone.startsWith('0')) {
         targetPhone = '62${targetPhone.substring(1)}';
       }
       urlString = "https://wa.me/$targetPhone?text=${Uri.encodeComponent(message)}";
     } else {
       urlString = "https://wa.me/?text=${Uri.encodeComponent(message)}";
     }
     
     final uri = Uri.parse(urlString);
     try {
        if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
            if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Tidak dapat membuka WhatsApp')));
        }
     } catch (e) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
     }
  }

  Future<void> _toggleStatus() async {
    if (_customer == null) return;
    final newStatus = _customer!.status == 'aktif' ? 'nonaktif' : 'aktif';
    
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Konfirmasi', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
        content: Text('Ubah status menjadi ${newStatus.toUpperCase()}?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Batal')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: newStatus == 'aktif' ? Colors.green : Colors.red),
            child: const Text('Ya, Ubah'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    final success = await _apiService.toggleCustomerStatus(_customer!.id, newStatus);
    if (success) {
      _loadDetail();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Status berhasil diubah menjadi $newStatus')),
      );
    }
  }

  void _navigateToEdit() async {
    if (_customer == null) return;
    final result = await Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => CustomerFormScreen(customer: _customer)),
    );
    if (result == true) {
      _loadDetail();
    }
  }

  String _formatMonthYear(String yyyyMm) {
    try {
      final parts = yyyyMm.split('-');
      if (parts.length >= 2) {
        final year = int.parse(parts[0]);
        final month = int.parse(parts[1]);
        final dt = DateTime(year, month);
        return DateFormat('MMMM yyyy', 'id_ID').format(dt);
      }
      return yyyyMm;
    } catch (e) {
      return yyyyMm;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (_customer == null) return const Scaffold(body: Center(child: Text('Data tidak ditemukan')));

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final c = _customer!;
    final isAktif = c.status == 'aktif';
    final hasArrears = (c.arrearsDetail?.totalArrears ?? 0) > 0;

    return Scaffold(
      appBar: AppBar(
        title: Text(c.nama, style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: theme.textTheme.bodyLarge?.color)),
        backgroundColor: theme.cardColor,
        elevation: 0,
        leading: IconButton(
          icon: Icon(LucideIcons.arrowLeft, color: theme.iconTheme.color),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          if (hasArrears)
            IconButton(
              onPressed: _shareWa, 
              icon: Icon(LucideIcons.share2, color: theme.iconTheme.color),
              tooltip: 'Share Tagihan WA',
            ),
          IconButton(onPressed: _navigateToEdit, icon: Icon(LucideIcons.edit2, color: theme.iconTheme.color)),
          IconButton(
            onPressed: _toggleStatus,
            icon: Icon(isAktif ? LucideIcons.powerOff : LucideIcons.power, color: isAktif ? Colors.red : Colors.green),
          ),
        ],
      ),
      body: Column(
        children: [
          // Header Stats
          _buildHeaderStats(c),

          // Tabs
          Container(
            color: theme.cardColor,
            child: TabBar(
              controller: _tabController,
              labelColor: isDark ? Colors.white : theme.primaryColor,
              unselectedLabelColor: theme.disabledColor,
              labelStyle: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13),
              indicatorColor: isDark ? Colors.white : theme.primaryColor,
              tabs: const [
                Tab(text: 'Tunggakan'),
                Tab(text: 'Cicilan'),
                Tab(text: 'Riwayat'),
                Tab(text: 'Info'),
              ],
            ),
          ),

          // Tab View
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildArrearsTab(c),
                _buildPartialPaymentsTab(c),
                _buildPaymentsTab(c),
                _buildInfoTab(c),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeaderStats(Customer c) {
    final theme = Theme.of(context);
    final formatCurrency = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);

    return Container(
      padding: const EdgeInsets.all(16),
      color: theme.cardColor,
      child: Row(
        children: [
          Expanded(
            child: _buildStatCard(
              'Tunggakan',
              formatCurrency.format(c.arrearsDetail?.totalArrears ?? 0),
              Colors.red,
              LucideIcons.alertCircle,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _buildStatCard(
              'Tarif',
              formatCurrency.format(c.tarif?.hargaPerBulan ?? 0),
              Colors.blue,
              LucideIcons.receipt,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String value, Color color, IconData icon) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 8),
              Text(label, style: GoogleFonts.inter(color: theme.textTheme.bodySmall?.color, fontSize: 12)),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: color),
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildArrearsTab(Customer c) {
    if (c.arrearsDetail == null || c.arrearsDetail!.arrearMonths.isEmpty) {
      return _buildEmptyState('Tidak ada tunggakan', LucideIcons.checkCircle, Colors.green);
    }

    final theme = Theme.of(context);
    final formatCurrency = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: c.arrearsDetail!.arrearMonths.length,
      itemBuilder: (context, index) {
        final item = c.arrearsDetail!.arrearMonths[index];
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: theme.cardColor,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: theme.dividerColor.withOpacity(0.1)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_formatMonthYear(item.month), style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: theme.textTheme.bodyLarge?.color)), 
                  if (item.details.isNotEmpty)
                    Text(item.details, style: GoogleFonts.inter(fontSize: 12, color: theme.textTheme.bodySmall?.color)),
                ],
              ),
              Text(
                formatCurrency.format(item.amount),
                style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: theme.textTheme.bodyLarge?.color),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPartialPaymentsTab(Customer c) {
    if (c.partialPayments == null || c.partialPayments!.isEmpty) {
      return _buildEmptyState('Belum ada riwayat cicilan', LucideIcons.layers, Colors.orange);
    }
    
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final formatCurrency = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: c.partialPayments!.length,
      itemBuilder: (context, index) {
        final pp = c.partialPayments![index];
        final progress = pp.jumlahTagihan > 0 ? (pp.jumlahTerbayar / pp.jumlahTagihan) : 0.0;

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: theme.cardColor,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: theme.dividerColor.withOpacity(0.1)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(_formatMonthYear(pp.bulanTagihan), style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: theme.textTheme.bodyLarge?.color)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: pp.status == 'lunas' 
                          ? (isDark ? Colors.green[900] : Colors.green[50]) 
                          : (isDark ? Colors.orange[900] : Colors.orange[50]),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      pp.status.toUpperCase(),
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: pp.status == 'lunas' ? Colors.green : Colors.orange,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              LinearProgressIndicator(
                value: progress,
                backgroundColor: isDark ? Colors.grey[700] : Colors.grey[100],
                color: pp.status == 'lunas' ? Colors.green : Colors.orange,
                minHeight: 6,
                borderRadius: BorderRadius.circular(3),
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Terbayar', style: GoogleFonts.inter(fontSize: 10, color: theme.textTheme.bodySmall?.color)),
                      Text(formatCurrency.format(pp.jumlahTerbayar), style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.green)),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text('Sisa', style: GoogleFonts.inter(fontSize: 10, color: theme.textTheme.bodySmall?.color)),
                      Text(formatCurrency.format(pp.sisaTagihan), style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.red)),
                    ],
                  ),
                ],
              )
            ],
          ),
        );
      },
    );
  }

  Widget _buildPaymentsTab(Customer c) {
     if (c.payments == null || c.payments!.isEmpty) {
      return _buildEmptyState('Belum ada pembayaran', LucideIcons.history, Colors.blue);
    }
    
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final formatCurrency = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: c.payments!.length,
      itemBuilder: (context, index) {
        final payment = c.payments![index];
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: theme.cardColor,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: theme.dividerColor.withOpacity(0.1)),
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(12),
              onTap: () => _showPaymentDetail(payment),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: isDark ? Colors.green[900] : Colors.green[50],
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(LucideIcons.check, size: 20, color: Colors.green),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                           Text(
                            DateFormat('dd MMM yyyy HH:mm').format(payment.tanggalBayar),
                            style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14, color: theme.textTheme.bodyLarge?.color),
                          ),
                          Text(
                            payment.metodeBayar.toUpperCase(),
                            style: GoogleFonts.inter(fontSize: 12, color: theme.textTheme.bodySmall?.color),
                          ),
                          if (payment.bulanDibayar.isNotEmpty)
                            Padding(
                              padding: const EdgeInsets.only(top: 4),
                              child: Text(
                                payment.bulanDibayar.map((b) => _formatMonthYear(b)).join(', '),
                                style: GoogleFonts.inter(fontSize: 11, color: isDark ? Colors.white70 : theme.textTheme.bodySmall?.color, fontStyle: FontStyle.italic),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                        ],
                      ),
                    ),
                    Text(
                      formatCurrency.format(payment.jumlahBayar),
                      style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: theme.textTheme.bodyLarge?.color),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  void _showPaymentDetail(Payment p) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      backgroundColor: Theme.of(context).cardColor,
      builder: (context) {
        final theme = Theme.of(context);
        final isDark = theme.brightness == Brightness.dark;
        final formatCurrency = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);
        
        return Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40, 
                  height: 4, 
                  decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2)),
                ),
              ),
              const SizedBox(height: 24),
              Text('Detail Pembayaran', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 24),
              _buildInfoItem('Waktu', DateFormat('dd MMMM yyyy HH:mm', 'id_ID').format(p.tanggalBayar)),
              _buildInfoItem('Nominal', formatCurrency.format(p.jumlahBayar)),
              _buildInfoItem('Metode', p.metodeBayar.toUpperCase()),
              
              if (p.bulanDibayar.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text('Untuk Bulan:', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: p.bulanDibayar.map((bulan) {
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: isDark ? Colors.white.withOpacity(0.1) : theme.primaryColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: isDark ? Colors.white.withOpacity(0.2) : theme.primaryColor.withOpacity(0.2)),
                      ),
                      child: Text(
                        _formatMonthYear(bulan),
                        style: GoogleFonts.inter(fontSize: 12, color: isDark ? Colors.white : theme.primaryColor, fontWeight: FontWeight.w500),
                      ),
                    );
                  }).toList(),
                ),
              ],
              
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton.icon(
                      icon: const Icon(LucideIcons.printer),
                      label: const Text('Cetak Struk'),
                      onPressed: () async {
                        // Map Payment to PaymentResult for printing
                        final result = PaymentResult(
                          id: p.id,
                          jumlahBayar: p.jumlahBayar,
                          tanggalBayar: p.tanggalBayar,
                          metodeBayar: p.metodeBayar,
                          customerNama: _customer?.nama ?? '-',
                          bulanDibayar: p.bulanDibayar,
                          isPartial: false // Assuming history list shows completed or tracked payments
                        );

                        await ReceiptService.printReceipt(
                          result, 
                          customerName: _customer?.nama,
                          customerWilayah: _customer?.wilayah,
                          isThermalMode: true // Force 58mm thermal layout
                        );
                      },
                    ),
                    const SizedBox(width: 8),
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Tutup'),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildInfoTab(Customer c) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildInfoSection('Profil', [
            _buildInfoItem('Nama Lengkap', c.nama),
            _buildInfoItem('No. Pelanggan', c.nomorPelanggan),
            _buildInfoItem('No. HP', c.noHp),
            _buildInfoItem('Alamat', c.alamat),
            _buildInfoItem('Wilayah', c.wilayah),
            _buildInfoItem('Bergabung', c.tanggalBergabung != null ? DateFormat('dd MMMM yyyy').format(c.tanggalBergabung!) : '-'),
          ]),
          
          const SizedBox(height: 24),
          
          Text('Riwayat Perubahan Status', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: theme.textTheme.bodyLarge?.color)),
          const SizedBox(height: 12),
          
          if (_statusHistory.isEmpty) 
             Text('Belum ada riwayat', style: GoogleFonts.inter(color: theme.disabledColor)),

          ..._statusHistory.map((h) => Container(
            margin: const EdgeInsets.only(bottom: 16),
            padding: const EdgeInsets.only(left: 16, top: 0, bottom: 0),
            decoration: BoxDecoration(
              border: Border(left: BorderSide(color: theme.dividerColor, width: 2)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: h.status == 'aktif' 
                            ? (isDark ? Colors.green[900] : Colors.green[100])
                            : (isDark ? Colors.red[900] : Colors.red[100]),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        h.status.toUpperCase(),
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: h.status == 'aktif' ? Colors.green : Colors.red,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      DateFormat('dd MMM yyyy').format(h.tanggalMulai),
                      style: GoogleFonts.inter(fontSize: 12, color: theme.textTheme.bodySmall?.color),
                    ),
                  ],
                ),
                if (h.keterangan != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      '"${h.keterangan}"',
                      style: GoogleFonts.inter(fontStyle: FontStyle.italic, color: theme.textTheme.bodySmall?.color),
                    ),
                  ),
              ],
            ),
          )).toList(),
        ],
      ),
    );
  }

  Widget _buildInfoSection(String title, List<Widget> children) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: theme.textTheme.bodyLarge?.color)),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: theme.cardColor,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: theme.dividerColor.withOpacity(0.1)),
          ),
          child: Column(children: children),
        ),
      ],
    );
  }

  Widget _buildInfoItem(String label, String value) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(label, style: GoogleFonts.inter(color: theme.textTheme.bodySmall?.color, fontSize: 13)),
          ),
          Expanded(
            child: Text(value, style: GoogleFonts.inter(fontWeight: FontWeight.w500, color: theme.textTheme.bodyLarge?.color)),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(String message, IconData icon, Color color) {
    final theme = Theme.of(context);
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 48, color: color.withOpacity(0.3)),
          const SizedBox(height: 16),
          Text(message, style: GoogleFonts.inter(color: theme.disabledColor)),
        ],
      ),
    );
  }
}
