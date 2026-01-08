
import 'dart:typed_data';
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:mobile_admin/services/api_service.dart'; // For PaymentResult and Customer models

class ReceiptService {
  
  static Future<void> printReceipt(
    PaymentResult result, {
    String? customerName,
    String? customerWilayah,
    bool isThermalMode = false,
  }) async {
    // If specific thermal mode is requested, we can force a specific format, 
    // but usually Printing.layoutPdf allows the printer to handle it or we provide a dynamic layout.
    // For this implementation, we will use the logic that adapts to the page format provided by the printer driver.
    
    await Printing.layoutPdf(
      onLayout: (format) => generatePdf(format, result, customerName: customerName, customerWilayah: customerWilayah),
      name: 'Struk-${result.id}',
    );
  }

  static Future<Uint8List> generatePdf(
    PdfPageFormat format, 
    PaymentResult result, {
    String? customerName,
    String? customerWilayah,
  }) async {
    final pdf = pw.Document();
    final font = await PdfGoogleFonts.interRegular();
    final fontBold = await PdfGoogleFonts.interBold();
    final fontMono = await PdfGoogleFonts.courierPrimeRegular(); 
    final fontMonoBold = await PdfGoogleFonts.courierPrimeBold();

    // Use provided customer info or fallback to result data if available
    final cName = customerName ?? result.customerNama;
    final cWilayah = customerWilayah ?? ''; // PaymentResult usually doesn't store wilayah explicitly unless we added it

    // Check if thermal (roughly < 80mm width) or A6/A7
    // Standard thermal 58mm is ~48mm printable. format.width is in points (1/72 inch). 
    // 58mm ~ 164 points. 80mm ~ 226 points.
    final isThermal = format.width < 300 * PdfPageFormat.mm / 25.4; 

    String monthName(String yyyyMm) {
      try {
        final dt = DateTime.parse('$yyyyMm-01');
        return DateFormat('MMM yyyy', 'id_ID').format(dt);
      } catch (e) { return yyyyMm; }
    }

    pdf.addPage(
      pw.Page(
        pageFormat: format,
        margin: isThermal ? const pw.EdgeInsets.all(5) : const pw.EdgeInsets.all(20),
        build: (pw.Context context) {
           if (isThermal) {
             // --- THERMAL LAYOUT DESIGN (CLASSIC MONOSPACE) ---
             final styleMono = pw.TextStyle(font: fontMono, fontSize: 8);
             final styleMonoBold = pw.TextStyle(font: fontMonoBold, fontSize: 8);
             final styleMonoHeader = pw.TextStyle(font: fontMonoBold, fontSize: 10);
             
             return pw.Column(
               crossAxisAlignment: pw.CrossAxisAlignment.start,
               mainAxisSize: pw.MainAxisSize.min,
               children: [
                 // HEADER
                 pw.Center(
                   child: pw.Column(
                     children: [
                       pw.Text('SABAMAS', style: styleMonoHeader),
                       pw.Text('Billing Sampah Desa', style: styleMono.copyWith(fontSize: 7)),
                       pw.Text('Kemasan, Sawit, Boyolali', style: styleMono.copyWith(fontSize: 7)),
                       pw.SizedBox(height: 4),
                       pw.Text('NOTA PEMBAYARAN', style: styleMonoBold),
                     ]
                   )
                 ),
                 
                 pw.SizedBox(height: 4),
                 pw.Divider(borderStyle: pw.BorderStyle.dashed, height: 1),
                 pw.SizedBox(height: 4),
                 
                 // TRANSACTION META
                 pw.Row(children: [
                   pw.SizedBox(width: 40, child: pw.Text('No', style: styleMono)),
                   pw.Text(': ', style: styleMono),
                   pw.Text(result.id.substring(0, 8).toUpperCase(), style: styleMonoBold),
                 ]),
                 pw.Row(children: [
                   pw.SizedBox(width: 40, child: pw.Text('Tgl', style: styleMono)),
                   pw.Text(': ', style: styleMono),
                   pw.Text(DateFormat('dd/MM/yy HH:mm').format(result.tanggalBayar), style: styleMono),
                 ]),
                 
                 pw.SizedBox(height: 4),
                 pw.Divider(borderStyle: pw.BorderStyle.dashed, height: 1),
                 pw.SizedBox(height: 4),
                 
                 // CUSTOMER
                 pw.Text('PELANGGAN:', style: styleMono.copyWith(fontSize: 7)),
                 pw.Text(cName.toUpperCase(), style: styleMonoBold),
                 if (cWilayah.isNotEmpty)
                    pw.Text(cWilayah, style: styleMono.copyWith(fontSize: 7)),

                 pw.SizedBox(height: 4),
                 pw.Divider(borderStyle: pw.BorderStyle.dashed, height: 1),
                 pw.SizedBox(height: 4),
                 
                 // ITEMS
                 pw.Text('RINCIAN:', style: styleMono.copyWith(fontSize: 7)),
                 ...result.bulanDibayar.asMap().entries.map((entry) {
                   final m = entry.value;
                   return pw.Padding(
                     padding: const pw.EdgeInsets.only(top: 2),
                     child: pw.Row(
                      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Expanded(child: pw.Text(monthName(m), style: styleMono)),
                        pw.Text(
                           NumberFormat.currency(locale: 'id_ID', symbol: '', decimalDigits: 0).format(result.jumlahBayar / (result.bulanDibayar.isEmpty ? 1 : result.bulanDibayar.length)), 
                           style: styleMono
                         ),
                      ]
                     )
                   );
                 }),
                 
                 pw.SizedBox(height: 4),
                 pw.Divider(borderStyle: pw.BorderStyle.solid, height: 1),
                 pw.SizedBox(height: 4),

                 // TOTAL
                 pw.Row(mainAxisAlignment: pw.MainAxisAlignment.spaceBetween, children: [
                    pw.Text('TOTAL', style: styleMonoBold),
                    pw.Text(NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0).format(result.jumlahBayar), style: styleMonoBold.copyWith(fontSize: 9)),
                 ]),
                 pw.Row(mainAxisAlignment: pw.MainAxisAlignment.spaceBetween, children: [
                    pw.Text('METODE', style: styleMono.copyWith(fontSize: 7)),
                    pw.Text(result.metodeBayar.toUpperCase(), style: styleMonoBold.copyWith(fontSize: 7)),
                 ]),
                 
                 pw.SizedBox(height: 10),
                 pw.Divider(borderStyle: pw.BorderStyle.dashed, height: 1),
                 pw.SizedBox(height: 6),
                 
                 // FOOTER
                 pw.Center(child: pw.Text('Terima Kasih', style: styleMonoBold)),
                 pw.Center(child: pw.Text('Simpan struk ini', style: styleMono.copyWith(fontSize: 6))),
                 pw.SizedBox(height: 2),
                 pw.Center(child: pw.Text(DateFormat('dd MMM yy HH:mm').format(DateTime.now()), style: styleMono.copyWith(fontSize: 6, color: PdfColors.grey700))),
               ]
             );
           } else {
             // --- A4 / STANDARD PDF START ---
             // Fallback for non-thermal / download PDF on big paper
             return pw.Column(
               crossAxisAlignment: pw.CrossAxisAlignment.start,
               children: [
                 pw.Header(
                   level: 0, 
                   child: pw.Row(
                     mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                     children: [
                       pw.Text('SABAMAS BILLING', style: pw.TextStyle(font: fontBold, fontSize: 24)),
                       pw.Text('BUKTI PEMBAYARAN', style: pw.TextStyle(font: font, fontSize: 18, color: PdfColors.grey)),
                     ]
                   )
                 ),
                 pw.SizedBox(height: 20),
                 pw.Row(
                   mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                   crossAxisAlignment: pw.CrossAxisAlignment.start,
                   children: [
                     pw.Column(crossAxisAlignment: pw.CrossAxisAlignment.start, children: [
                        pw.Text('Diterbitkan Untuk:', style: pw.TextStyle(font: font, fontSize: 10, color: PdfColors.grey700)),
                        pw.Text(cName, style: pw.TextStyle(font: fontBold, fontSize: 14)),
                        if(cWilayah.isNotEmpty) pw.Text(cWilayah, style: pw.TextStyle(font: font, fontSize: 12)),
                     ]),
                     pw.Column(crossAxisAlignment: pw.CrossAxisAlignment.end, children: [
                        pw.Text('No. Transaksi:', style: pw.TextStyle(font: font, fontSize: 10, color: PdfColors.grey700)),
                        pw.Text('#${result.id.toUpperCase()}', style: pw.TextStyle(font: fontBold, fontSize: 12)),
                        pw.Text(DateFormat('dd MMMM yyyy').format(result.tanggalBayar), style: pw.TextStyle(font: font, fontSize: 12)),
                     ]),
                   ]
                 ),
                 pw.SizedBox(height: 30),
                 pw.Table(
                   border: pw.TableBorder.all(color: PdfColors.grey300),
                   children: [
                     pw.TableRow(
                       decoration: const pw.BoxDecoration(color: PdfColors.grey100),
                       children: [
                         pw.Padding(padding: const pw.EdgeInsets.all(8), child: pw.Text('Keterangan', style: pw.TextStyle(font: fontBold))),
                         pw.Padding(padding: const pw.EdgeInsets.all(8), child: pw.Text('Bulan', style: pw.TextStyle(font: fontBold))),
                         pw.Padding(padding: const pw.EdgeInsets.all(8), child: pw.Text('Jumlah', style: pw.TextStyle(font: fontBold), textAlign: pw.TextAlign.right)),
                       ]
                     ),
                     ...result.bulanDibayar.map((m) {
                       return pw.TableRow(
                         children: [
                           pw.Padding(padding: const pw.EdgeInsets.all(8), child: pw.Text('Retribusi Sampah', style: pw.TextStyle(font: font))),
                           pw.Padding(padding: const pw.EdgeInsets.all(8), child: pw.Text(monthName(m), style: pw.TextStyle(font: font))),
                           pw.Padding(padding: const pw.EdgeInsets.all(8), child: pw.Text(
                              NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0).format(result.jumlahBayar / result.bulanDibayar.length), 
                              style: pw.TextStyle(font: fontMono), textAlign: pw.TextAlign.right
                           )),
                         ]
                       );
                     }),
                   ]
                 ),
                 pw.SizedBox(height: 20),
                 pw.Row(
                   mainAxisAlignment: pw.MainAxisAlignment.end,
                   children: [
                     pw.Column(crossAxisAlignment: pw.CrossAxisAlignment.end, children: [
                       pw.Text('Total Bayar', style: pw.TextStyle(font: font, fontSize: 12)),
                       pw.Text(
                         NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0).format(result.jumlahBayar), 
                         style: pw.TextStyle(font: fontBold, fontSize: 20, color: PdfColors.blue900)
                       ),
                       pw.SizedBox(height: 4),
                       pw.Text('Metode: ${result.metodeBayar.toUpperCase()}', style: pw.TextStyle(font: font, fontSize: 10, color: PdfColors.grey600)),
                     ])
                   ]
                 ),
                 pw.Spacer(),
                 pw.Divider(),
                 pw.Center(child: pw.Text('Terima kasih atas partisipasi Anda dalam menjaga kebersihan lingkungan.', style: pw.TextStyle(font: font, fontSize: 10, color: PdfColors.grey600))),
               ]
             );
             // --- A4 END ---
           }
        }
      )
    );
    return pdf.save();
  }
}
