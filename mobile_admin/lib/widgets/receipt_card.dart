
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobile_admin/services/api_service.dart';

class ReceiptCard extends StatelessWidget {
  final PaymentResult result;
  final Customer customer;

  const ReceiptCard({super.key, required this.result, required this.customer});

  @override
  Widget build(BuildContext context) {
    final currencyFmt = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);
    final dateFmt = DateFormat('dd MMM yyyy, HH:mm');

    return Container(
      width: 320, // Fixed width for consistent image generation
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header Bank Style
          Container(
            padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
            decoration: const BoxDecoration(
              color: Color(0xFF6366F1), // Primary Blue
              borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
            ),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(LucideIcons.check, color: Color(0xFF6366F1), size: 32),
                ),
                const SizedBox(height: 12),
                Text(
                  'Pembayaran Berhasil',
                  style: GoogleFonts.inter(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                Text(
                  dateFmt.format(result.tanggalBayar),
                  style: GoogleFonts.inter(
                    color: Colors.white.withOpacity(0.9),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          
          // Body
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                const Text('Total Pembayaran', style: TextStyle(color: Colors.grey, fontSize: 12)),
                const SizedBox(height: 4),
                Text(
                  currencyFmt.format(result.jumlahBayar),
                  style: GoogleFonts.inter(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 24),
                const Divider(height: 1),
                const SizedBox(height: 24),
                
                _buildRow('ID Transaksi', result.id.substring(0, 10).toUpperCase()),
                _buildRow('Pelanggan', customer.nama),
                _buildRow('No. Pelanggan', customer.nomorPelanggan),
                _buildRow('Metode Bayar', result.metodeBayar.toUpperCase()),
                
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.grey[50],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Rincian Tagihan:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      ...result.bulanDibayar.map((bulan) => Padding(
                        padding: const EdgeInsets.only(bottom: 2),
                        child: Row(
                          children: [
                            const Icon(Icons.circle, size: 6, color: Colors.grey),
                            const SizedBox(width: 8),
                            Text(
                              _formatMonth(bulan), 
                              style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[700])
                            ),
                          ],
                        ),
                      )),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // Footer
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: const BorderRadius.vertical(bottom: Radius.circular(16)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(LucideIcons.zap, size: 14, color: Colors.grey),
                const SizedBox(width: 4),
                Text('SABAMAS Billing System', style: GoogleFonts.inter(fontSize: 10, color: Colors.grey)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.inter(color: Colors.grey[600], fontSize: 12)),
          Expanded(
            child: Text(
              value, 
              textAlign: TextAlign.right,
              style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.black87),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  String _formatMonth(String yyyyMm) {
      try {
        final parts = yyyyMm.split('-');
        final dt = DateTime(int.parse(parts[0]), int.parse(parts[1]));
        return DateFormat('MMMM yyyy', 'id_ID').format(dt);
      } catch (e) { return yyyyMm; }
  }
}
