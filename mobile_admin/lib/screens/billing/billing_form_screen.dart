
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobile_admin/services/api_service.dart';
import 'package:mobile_admin/services/receipt_service.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import 'dart:ui' as ui;
import 'package:flutter/rendering.dart';
import 'package:mobile_admin/widgets/receipt_card.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'dart:io';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'dart:typed_data';

class BillingFormScreen extends StatefulWidget {
  final Customer customer;

  const BillingFormScreen({super.key, required this.customer});

  @override
  State<BillingFormScreen> createState() => _BillingFormScreenState();
}

class _BillingFormScreenState extends State<BillingFormScreen> {
  final ApiService _apiService = ApiService();
  final NumberFormat _currencyFormat = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);

  Customer? _detailCustomer;
  List<PartialPayment> _partialPayments = [];
  bool _isLoading = true;

  // Selection & Payment State
  List<String> _selectedMonths = [];
  bool _isPartialMode = false;
  final TextEditingController _partialAmountController = TextEditingController();
  final TextEditingController _discountController = TextEditingController();
  final TextEditingController _notesController = TextEditingController();
  String _paymentMethod = 'tunai'; // tunai, transfer
  
  // ignore: unused_field
  bool _showFutureMonths = false;

  @override
  void initState() {
    super.initState();
    _loadData();
    _partialAmountController.addListener(_updateState);
    _discountController.addListener(_updateState);
  }

  void _updateState() {
     setState(() {});
  }

  @override
  void dispose() {
    _partialAmountController.dispose();
    _discountController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final detail = await _apiService.getCustomerDetail(widget.customer.id);
    final partials = await _apiService.getPartialPaymentHistory(widget.customer.id);
    
    if (mounted) {
      setState(() {
        _detailCustomer = detail;
        _partialPayments = partials;
        _isLoading = false;
      });
    }
  }

  // --- Logic Helpers ---

  String _formatMonthRequest(String yyyyMm) {
      try {
        final d = DateFormat('yyyy-MM').parse(yyyyMm);
        return DateFormat('MMMM yyyy', 'id_ID').format(d);
      } catch (e) {
        return yyyyMm;
      }
  }

  void _toggleMonth(String month) {
    setState(() {
      if (_selectedMonths.contains(month)) {
        _selectedMonths.remove(month);
      } else {
        _selectedMonths.add(month);
      }
      
      // Reset partial mode if no months selected
      if (_selectedMonths.isEmpty) {
        _isPartialMode = false;
        _partialAmountController.clear();
      }
    });
  }

  double get _totalBill {
    if (_detailCustomer == null) return 0;
    double total = 0;
    
    // Calculate from Arrears and Future Months
    for (var m in _selectedMonths) {
      // Is it an arrear?
      final arrear = _detailCustomer!.arrearsDetail?.arrearMonths.firstWhere(
        (a) => a.month == m, 
        orElse: () => ArrearMonth(month: '', amount: -1, details: '', source: ''),
      );

      if (arrear != null && arrear.amount != -1) {
        total += arrear.amount;
      } else {
         // Assume future month = standard tariff
         total += (_detailCustomer!.tarif?.hargaPerBulan ?? 0).toDouble();
      }
    }
    return total;
  }

  double get _finalPayAmount {
    double discount = double.tryParse(_discountController.text.replaceAll(RegExp(r'\D'), '')) ?? 0;
    
    if (_isPartialMode) {
      double partial = double.tryParse(_partialAmountController.text.replaceAll(RegExp(r'\D'), '')) ?? 0;
      return partial;
    }
    
    return (_totalBill - discount).clamp(0, double.infinity);
  }

  List<String> _getFutureMonths() {
    final now = DateTime.now();
    final List<String> months = [];
    
    for (int i = 1; i <= 12; i++) {
      final d = DateTime(now.year, now.month + i);
      final s = DateFormat('yyyy-MM').format(d);
      months.add(s);
    }
    return months;
  }

  Future<void> _processPayment() async {
    if (_selectedMonths.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pilih minimal satu bulan tagihan')));
      return;
    }

    final double amount = _finalPayAmount;
    if (amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Jumlah bayar tidak valid')));
      return;
    }
    
    if (_isPartialMode && amount > _totalBill) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pembayaran cicilan tidak boleh melebihi total tagihan')));
      return;
    }

    final payload = {
      'customer_id': _detailCustomer!.id,
      'bulan_dibayar': _selectedMonths,
      'jumlah_bayar': amount,
      'metode_bayar': _paymentMethod,
      'catatan': _notesController.text,
      'is_partial': _isPartialMode,
      'diskon_nominal': double.tryParse(_discountController.text.replaceAll(RegExp(r'\D'), '')) ?? 0,
    };

    setState(() => _isLoading = true);
    final result = await _apiService.createPayment(payload);
    setState(() => _isLoading = false);

    if (result != null && mounted) {
      _showSuccessDialog(result);
    } else {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Gagal memproses pembayaran')));
    }
  }
  
  void _showSuccessDialog(PaymentResult result) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => _PaymentSuccessDialog(result: result, customer: _detailCustomer!),
    ).then((_) {
        // Pop back to search screen or reload
        if (mounted) Navigator.pop(context); 
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading && _detailCustomer == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    
    final c = _detailCustomer ?? widget.customer;
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Text('Input Tagihan', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: theme.textTheme.bodyLarge?.color)),
        backgroundColor: theme.cardColor,
        elevation: 0,
        leading: IconButton(
          icon: Icon(LucideIcons.arrowLeft, color: theme.iconTheme.color),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. Customer Card
            _buildCustomerInfo(c),
            const SizedBox(height: 16),

            // 2. Arrears List
            Text('Tagihan Belum Dibayar', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16, color: theme.textTheme.bodyLarge?.color)),
            const SizedBox(height: 8),
            _buildArrearsList(c),
            const SizedBox(height: 16),
            
            // 3. Future Months (Optional)
             Theme(
              data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
              child: ExpansionTile(
                title: Text('Bayar Dimuka / Bulan Depan', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: theme.textTheme.bodyLarge?.color)),
                leading: const Icon(LucideIcons.calendar, color: Colors.blue),
                tilePadding: EdgeInsets.zero,
                iconColor: theme.iconTheme.color,
                collapsedIconColor: theme.iconTheme.color,
                children: _buildFutureMonthsList(),
              ),
            ),
            const SizedBox(height: 24),
            
            // 4. Payment Form
            _buildPaymentForm(),
            const SizedBox(height: 40),
          ],
        ),
      ),
      bottomNavigationBar: _buildBottomBar(),
    );
  }
  
  Widget _buildBottomBar() {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.cardColor,
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(isDark ? 0.2 : 0.05), blurRadius: 10, offset: const Offset(0, -4))],
      ),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Total Bayar', style: GoogleFonts.inter(fontSize: 12, color: theme.textTheme.bodySmall?.color)),
                  Text(
                    _currencyFormat.format(_finalPayAmount),
                    style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.green),
                  ),
                ],
              ),
            ),
            ElevatedButton(
              onPressed: _isLoading ? null : _processPayment,
              style: ElevatedButton.styleFrom(
                backgroundColor: theme.primaryColor,
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: _isLoading 
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : Text('Proses Bayar', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCustomerInfo(Customer c) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: theme.dividerColor.withOpacity(0.1)),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: isDark ? Colors.blue[900] : Colors.blue[50],
            radius: 24,
            child: Text(c.nama[0].toUpperCase(), style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.blue)),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(c.nama, style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16, color: theme.textTheme.bodyLarge?.color)),
                Text('${c.wilayah} • ${c.nomorPelanggan}', style: GoogleFonts.inter(color: theme.textTheme.bodySmall?.color, fontSize: 13)),
                 if (c.tarif != null)
                  Text('Tarif: ${_currencyFormat.format(c.tarif!.hargaPerBulan)}/bln', style: GoogleFonts.inter(color: theme.textTheme.bodySmall?.color, fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildArrearsList(Customer c) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    if (c.arrearsDetail == null || c.arrearsDetail!.arrearMonths.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(16),
        width: double.infinity,
        decoration: BoxDecoration(
          color: isDark ? Colors.green[900]!.withOpacity(0.3) : Colors.green[50],
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: isDark ? Colors.green[800]! : Colors.green[100]!),
        ),
        child: Column(
          children: [
            const Icon(LucideIcons.checkCircle, color: Colors.green),
            const SizedBox(height: 8),
            Text('Tidak ada tunggakan!', style: GoogleFonts.inter(color: Colors.green, fontWeight: FontWeight.bold)),
          ],
        ),
      );
    }

    return Column(
      children: c.arrearsDetail!.arrearMonths.map((m) {
        final isSelected = _selectedMonths.contains(m.month);
        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          decoration: BoxDecoration(
            color: isSelected 
                ? (isDark ? Colors.blue[900]!.withOpacity(0.3) : Colors.blue[50]) 
                : theme.cardColor,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected 
                  ? Colors.blue 
                  : theme.dividerColor.withOpacity(0.1)
            ),
          ),
          child: CheckboxListTile(
            value: isSelected,
            onChanged: (val) => _toggleMonth(m.month),
            title: Text(_formatMonthRequest(m.month), style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: theme.textTheme.bodyLarge?.color)),
            subtitle: Text(m.details.isNotEmpty ? m.details : 'Tunggakan Regular', style: TextStyle(color: theme.textTheme.bodyMedium?.color)),
            secondary: Text(_currencyFormat.format(m.amount), style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.red)),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            activeColor: Colors.blue,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          ),
        );
      }).toList(),
    );
  }
  
  List<Widget> _buildFutureMonthsList() {
    final futures = _getFutureMonths();
    final tariff = _detailCustomer?.tarif?.hargaPerBulan ?? 0;
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    return futures.map((m) {
      final isSelected = _selectedMonths.contains(m);
      return Container(
        margin: const EdgeInsets.only(bottom: 8),
        decoration: BoxDecoration(
          color: isSelected 
            ? (isDark ? Colors.orange[900]!.withOpacity(0.3) : Colors.orange[50]) 
            : theme.cardColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? Colors.orange : theme.dividerColor.withOpacity(0.1)
          ),
        ),
        child: CheckboxListTile(
          value: isSelected,
          onChanged: (val) => _toggleMonth(m),
          title: Text(_formatMonthRequest(m), style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: theme.textTheme.bodyLarge?.color)),
          subtitle: const Text('Pembayaran dimuka'),
          secondary: Text(_currencyFormat.format(tariff), style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: theme.textTheme.bodyLarge?.color)),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          activeColor: Colors.orange,
        ),
      );
    }).toList();
  }

  Widget _buildPaymentForm() {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(isDark ? 0.2 : 0.05), blurRadius: 10)],
        border: Border.all(color: theme.dividerColor.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Rincian Pembayaran', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16, color: theme.textTheme.bodyLarge?.color)),
          const SizedBox(height: 16),
          
          // Payment Method Checkboxes (Radio look-alike)
          Row(
            children: [
              Expanded(child: _buildRadioOption('Tunai', 'tunai')),
              const SizedBox(width: 12),
              Expanded(child: _buildRadioOption('Transfer', 'transfer')),
            ],
          ),
          const SizedBox(height: 16),
          
          _buildSummaryRow('Bulan Dipilih', '${_selectedMonths.length} bulan'),
          _buildSummaryRow('Total Tagihan', _currencyFormat.format(_totalBill)),
          const Divider(height: 24),
          
          // Partial Toggle
          SwitchListTile(
            value: _isPartialMode,
            onChanged: (val) {
              setState(() {
                _isPartialMode = val;
                if (!val) _partialAmountController.clear();
              });
            },
            title: Text('Bayar Sebagian (Cicilan)', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: theme.textTheme.bodyLarge?.color)),
            contentPadding: EdgeInsets.zero,
            activeColor: Colors.orange,
          ),
          
          if (_isPartialMode)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: TextField(
                controller: _partialAmountController,
                keyboardType: TextInputType.number,
                style: GoogleFonts.inter(color: theme.textTheme.bodyLarge?.color),
                decoration: InputDecoration(
                  labelText: 'Nominal Cicilan',
                  prefixText: 'Rp ',
                  prefixStyle: TextStyle(color: theme.textTheme.bodyLarge?.color),
                  labelStyle: TextStyle(color: theme.textTheme.bodyMedium?.color),
                  border: const OutlineInputBorder(),
                  enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: theme.disabledColor)),
                ),
              ),
            ),
            
           TextField(
            controller: _discountController,
            keyboardType: TextInputType.number,
             style: GoogleFonts.inter(color: theme.textTheme.bodyLarge?.color),
            decoration: InputDecoration(
              labelText: 'Diskon (Opsional)',
              prefixText: 'Rp ',
               prefixStyle: TextStyle(color: theme.textTheme.bodyLarge?.color),
              labelStyle: TextStyle(color: theme.textTheme.bodyMedium?.color),
              border: const OutlineInputBorder(),
              enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: theme.disabledColor)),
              isDense: true,
            ),
          ),
          
          const SizedBox(height: 16),
          TextField(
            controller: _notesController,
            style: GoogleFonts.inter(color: theme.textTheme.bodyLarge?.color),
            decoration: InputDecoration(
              labelText: 'Catatan (Opsional)',
              labelStyle: TextStyle(color: theme.textTheme.bodyMedium?.color),
              border: const OutlineInputBorder(),
              enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: theme.disabledColor)),
              isDense: true,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildRadioOption(String label, String value) {
    final isSelected = _paymentMethod == value;
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return InkWell(
      onTap: () => setState(() => _paymentMethod = value),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? theme.primaryColor : (isDark ? theme.scaffoldBackgroundColor : Colors.grey[100]),
          borderRadius: BorderRadius.circular(8),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: GoogleFonts.inter(
            color: isSelected ? Colors.white : theme.textTheme.bodyMedium?.color,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.inter(color: theme.textTheme.bodySmall?.color)),
          Text(value, style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: theme.textTheme.bodyLarge?.color)),
        ],
      ),
    );
  }
}

// ======================= RESULT DIALOG =======================

class _PaymentSuccessDialog extends StatefulWidget {
  final PaymentResult result;
  final Customer customer;
  
  const _PaymentSuccessDialog({required this.result, required this.customer});

  @override
  State<_PaymentSuccessDialog> createState() => _PaymentSuccessDialogState();
}

class _PaymentSuccessDialogState extends State<_PaymentSuccessDialog> {
  final GlobalKey _globalKey = GlobalKey();

  Future<void> _captureAndShare() async {
    try {
      // 1. Capture Image
      RenderRepaintBoundary? boundary = _globalKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
      if (boundary == null) return;
      
      // Upscale for better quality
      ui.Image image = await boundary.toImage(pixelRatio: 3.0);
      ByteData? byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      if (byteData == null) return;
      Uint8List pngBytes = byteData.buffer.asUint8List();

      if (kIsWeb) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Gunakan "Download PDF" untuk versi Web')));
        return;
      }

      // 2. Save to Temp File (Mobile)
      final tempDir = await getTemporaryDirectory();
      final file = await File('${tempDir.path}/struk-${widget.result.id}.png').create();
      await file.writeAsBytes(pngBytes);

      // 3. Share via SharePlus
      final result = await Share.shareXFiles([XFile(file.path)], text: 'Bukti Pembayaran Sabamas');
      
      if (result.status == ShareResultStatus.success) {
         // Success
      }

    } catch (e) {
      debugPrint('Error capturing image: $e');
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Gagal memproses gambar')));
    }
  }
  
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      backgroundColor: theme.cardColor,
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 450), // responsive max width
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              RepaintBoundary(
                key: _globalKey,
                // Assuming ReceiptCard is designed to check theme or needs a specific container
                // For now, let's wrap it in a container that ensures it looks good.
                // Usually receipts are white.
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white, // Receipts are usually white
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: ReceiptCard(result: widget.result, customer: widget.customer),
                ),
              ),
              const SizedBox(height: 24),
              
              Text('Bukti Pembayaran berhasil dibuat', style: TextStyle(color: theme.textTheme.bodySmall?.color, fontSize: 13)),
              const SizedBox(height: 16),

              // Actions
              Column(
                children: [
                   Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _captureAndShare,
                          icon: const Icon(LucideIcons.image, size: 16),
                          label: Text(kIsWeb ? 'Simpan Gbr' : 'Share Gbr'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.amber[700],
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _shareWaText,
                          icon: const Icon(LucideIcons.send, size: 16),
                          label: const Text('Kirim WA'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ),
                    ],
                   ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _printPdf(context),
                          icon: const Icon(LucideIcons.fileText, size: 16),
                          label: const Text('PDF'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.purple,
                            side: const BorderSide(color: Colors.purple),
                             padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _printThermal(context),
                          icon: const Icon(LucideIcons.printer, size: 16),
                          label: const Text('Thermal'),
                           style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.blue,
                            side: const BorderSide(color: Colors.blue),
                             padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: Text('Tutup', style: TextStyle(color: theme.disabledColor)),
                  )
                ],
              )
            ],
          ),
        ),
      ),
    );
  }
  
  Future<void> _shareWaText() async {
      final fmt = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);
      final result = widget.result;
      final customer = widget.customer;

      String monthName(String yyyyMm) {
        try {
          final dt = DateTime.parse('$yyyyMm-01');
          return DateFormat('MMMM yyyy', 'id_ID').format(dt);
        } catch (e) { return yyyyMm; }
      }

      final bulanStr = result.bulanDibayar.asMap().entries.map((e) => "${e.key + 1}. ${monthName(e.value)}").join('\n');

      final message = '''
*BUKTI PEMBAYARAN SABAMAS*
━━━━━━━━━━━━━━━━━━━

*Pelanggan:* ${customer.nama}
*Tanggal:* ${DateFormat('dd MMM yyyy HH:mm').format(result.tanggalBayar)}
*No. Transaksi:* ${result.id.substring(0, 8).toUpperCase()}

━━━━━━━━━━━━━━━━━━━
*RINCIAN PEMBAYARAN*

$bulanStr

━━━━━━━━━━━━━━━━━━━
*Total Bulan:* ${result.bulanDibayar.length}
*Metode:* ${result.metodeBayar.toUpperCase()}
*TOTAL BAYAR:* ${fmt.format(result.jumlahBayar)}

Terima kasih! 🙏
_SABAMAS - Sistem Billing Sampah_
''';
    
    final phone = customer.noHp.replaceAll(RegExp(r'\D'), '');
    String urlString;
     if (phone.isNotEmpty) {
       String targetPhone = phone;
       if (targetPhone.startsWith('0')) targetPhone = '62${targetPhone.substring(1)}';
       urlString = "https://wa.me/$targetPhone?text=${Uri.encodeComponent(message)}";
     } else {
       urlString = "https://wa.me/?text=${Uri.encodeComponent(message)}";
     }
     
     final uri = Uri.parse(urlString);
     if (await canLaunchUrl(uri)) {
       await launchUrl(uri, mode: LaunchMode.externalApplication);
     } else {
       if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Tidak dapat membuka WhatsApp')));
     }
  }

  // --- PDF GENERATION LOGIC ---


  Future<void> _printPdf(BuildContext context) async {
    await ReceiptService.printReceipt(
      widget.result, 
      customerName: widget.customer.nama, 
      customerWilayah: widget.customer.wilayah
    );
  }

  Future<void> _printThermal(BuildContext context) async {
    await ReceiptService.printReceipt(
      widget.result, 
      customerName: widget.customer.nama, 
      customerWilayah: widget.customer.wilayah,
      isThermalMode: true
    );
  }
}
