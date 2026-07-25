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
    bool isThermalMode = true,
  }) async {
    await Printing.layoutPdf(
      onLayout: (format) => generatePdf(
        format, 
        result, 
        customerName: customerName, 
        customerWilayah: customerWilayah,
        forceThermal: isThermalMode,
      ),
      name: 'Struk-${result.id}',
      format: isThermalMode ? const PdfPageFormat(58 * PdfPageFormat.mm, double.infinity, marginAll: 2 * PdfPageFormat.mm) : PdfPageFormat.a4,
    );
  }

  static Future<Uint8List> generatePdf(
    PdfPageFormat format, 
    PaymentResult result, {
    String? customerName,
    String? customerWilayah,
    bool forceThermal = true,
  }) async {
    final pdf = pw.Document();
    final font = pw.Font.helvetica();
    final fontBold = pw.Font.helveticaBold();
    final fontMono = pw.Font.courier(); 
    final fontMonoBold = pw.Font.courierBold();

    final cName = customerName ?? result.customerNama;
    final cWilayah = customerWilayah ?? '';

    final isThermal = forceThermal || format.width < 210 * PdfPageFormat.mm; 

    String monthName(String yyyyMm) {
      try {
        final dt = DateTime.parse('$yyyyMm-01');
        return DateFormat('MMM yyyy', 'id_ID').format(dt);
      } catch (e) { return yyyyMm; }
    }

    pdf.addPage(
      pw.Page(
        pageFormat: isThermal ? const PdfPageFormat(58 * PdfPageFormat.mm, double.infinity, marginAll: 2 * PdfPageFormat.mm) : format,
        margin: isThermal ? const pw.EdgeInsets.symmetric(horizontal: 4, vertical: 2) : const pw.EdgeInsets.all(20),
        build: (pw.Context context) {
           if (isThermal) {
             // --- THERMAL LAYOUT (58mm) ---
             final styleNormal = pw.TextStyle(font: fontMono, fontSize: 9);
             final styleBold = pw.TextStyle(font: fontMonoBold, fontSize: 9);
             final styleSmall = pw.TextStyle(font: fontMono, fontSize: 8);
             
             return pw.Container(
               color: PdfColors.white,
               child: pw.Column(
                 crossAxisAlignment: pw.CrossAxisAlignment.start,
                 mainAxisSize: pw.MainAxisSize.min,
                 children: [
                   // HEADER
                   pw.Center(
                     child: pw.Column(
                       children: [
                         pw.Text('SABAMAS', style: pw.TextStyle(font: fontMonoBold, fontSize: 14)),
                         pw.Text('Billing Sampah Desa', style: styleSmall),
                         pw.SizedBox(height: 4),
                         pw.Container(height: 1, width: double.infinity, color: PdfColors.black),
                         pw.Container(height: 1, margin: const pw.EdgeInsets.only(top: 1), width: double.infinity, color: PdfColors.black),
                         pw.SizedBox(height: 4),
                         pw.Text('NOTA PEMBAYARAN', style: styleBold),
                       ]
                     )
                   ),
                   
                   pw.SizedBox(height: 4),
                   pw.Divider(borderStyle: pw.BorderStyle.dashed, height: 1),
                   pw.SizedBox(height: 4),
                   
                   // META
                   pw.Row(children: [
                     pw.SizedBox(width: 35, child: pw.Text('No.', style: styleSmall)),
                     pw.Text(': ${result.id.substring(0, 8).toUpperCase()}', style: styleBold),
                   ]),
                   pw.Row(children: [
                     pw.SizedBox(width: 35, child: pw.Text('Tgl', style: styleSmall)),
                     pw.Text(': ${DateFormat('dd/MM/yy HH:mm').format(result.tanggalBayar)}', style: styleSmall),
                   ]),
                   
                   pw.SizedBox(height: 4),
                   pw.Divider(borderStyle: pw.BorderStyle.dashed, height: 1),
                   pw.SizedBox(height: 4),
                   
                   // CUSTOMER
                   pw.Text('PELANGGAN:', style: styleSmall),
                   pw.Text(cName, style: styleBold),
                   if (cWilayah.isNotEmpty) pw.Text(cWilayah, style: styleSmall),

                   pw.SizedBox(height: 4),
                   pw.Divider(borderStyle: pw.BorderStyle.dashed, height: 1),
                   pw.SizedBox(height: 4),
                   
                   // ITEMS
                   pw.Text('RINCIAN:', style: styleSmall),
                   ...result.bulanDibayar.asMap().entries.map((entry) {
                     final m = entry.value;
                     return pw.Padding(
                       padding: const pw.EdgeInsets.only(top: 2),
                       child: pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                        children: [
                          pw.Expanded(child: pw.Text('${entry.key + 1}. ${monthName(m)}', style: styleNormal)),
                          pw.Text(
                             NumberFormat.currency(locale: 'id_ID', symbol: '', decimalDigits: 0).format(result.jumlahBayar / (result.bulanDibayar.isEmpty ? 1 : result.bulanDibayar.length)), 
                             style: styleBold
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
                      pw.Text('TOTAL', style: styleBold),
                      pw.Text(NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0).format(result.jumlahBayar), style: styleBold.copyWith(fontSize: 11)),
                   ]),
                   pw.SizedBox(height: 2),
                   pw.Row(mainAxisAlignment: pw.MainAxisAlignment.spaceBetween, children: [
                      pw.Text('METODE', style: styleSmall),
                      pw.Text(result.metodeBayar.toUpperCase(), style: styleBold),
                   ]),
                   
                   pw.SizedBox(height: 8),
                   pw.Container(height: 1, width: double.infinity, color: PdfColors.black),
                   pw.Container(height: 1, margin: const pw.EdgeInsets.only(top: 1), width: double.infinity, color: PdfColors.black),
                   pw.SizedBox(height: 6),
                   
                   // FOOTER
                   pw.Center(child: pw.Text('Terima Kasih', style: styleBold)),
                   pw.Center(child: pw.Text('Simpan struk ini sebagai bukti', style: styleSmall.copyWith(fontSize: 7))),
                 ],
               ),
             );
           } else {
             // --- A4 PDF START ---
             return pw.Container(
               color: PdfColors.white,
               child: pw.Column(
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
                 ],
               ),
             );
           }
         }
       )
     );
     return pdf.save();
   }

  static Future<Uint8List> generateReceiptImage(
    PaymentResult result, {
    String? customerName,
    String? customerWilayah,
  }) async {
    final pdfBytes = await generatePdf(
      const PdfPageFormat(58 * PdfPageFormat.mm, double.infinity, marginAll: 2 * PdfPageFormat.mm),
      result,
      customerName: customerName,
      customerWilayah: customerWilayah,
      forceThermal: true,
    );

    final rasterStream = Printing.raster(pdfBytes, pages: [0], dpi: 200);
    await for (final page in rasterStream) {
      return await page.toPng();
    }
    throw Exception('Failed to generate receipt PNG image');
  }

  static Future<void> printBillThermal(
    Customer customer, {
    bool isThermalMode = true,
  }) async {
    await Printing.layoutPdf(
      onLayout: (format) => generateBillPdf(
        format, 
        customer, 
        forceThermal: isThermalMode,
      ),
      name: 'Tagihan-${customer.nomorPelanggan}',
      format: isThermalMode ? const PdfPageFormat(58 * PdfPageFormat.mm, double.infinity, marginAll: 2 * PdfPageFormat.mm) : PdfPageFormat.a4,
    );
  }

  static Future<Uint8List> generateBillPdf(
    PdfPageFormat format,
    Customer customer, {
    bool forceThermal = true,
  }) async {
    final pdf = pw.Document();
    final fontMono = pw.Font.courier(); 
    final fontMonoBold = pw.Font.courierBold();

    final isThermal = forceThermal || format.width < 210 * PdfPageFormat.mm; 

    String monthName(String yyyyMm) {
      try {
        final dt = DateTime.parse('$yyyyMm-01');
        return DateFormat('MMM yyyy', 'id_ID').format(dt);
      } catch (e) { return yyyyMm; }
    }

    final arrears = customer.arrearsDetail?.arrearMonths ?? [];
    final totalArrears = customer.tunggakan;

    pdf.addPage(
      pw.Page(
        pageFormat: isThermal ? const PdfPageFormat(58 * PdfPageFormat.mm, double.infinity, marginAll: 2 * PdfPageFormat.mm) : format,
        margin: isThermal ? const pw.EdgeInsets.symmetric(horizontal: 4, vertical: 2) : const pw.EdgeInsets.all(20),
        build: (pw.Context context) {
          final styleNormal = pw.TextStyle(font: fontMono, fontSize: 9);
          final styleBold = pw.TextStyle(font: fontMonoBold, fontSize: 9);
          final styleSmall = pw.TextStyle(font: fontMono, fontSize: 8);

          return pw.Container(
            color: PdfColors.white,
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              mainAxisSize: pw.MainAxisSize.min,
              children: [
                // HEADER
                pw.Center(
                  child: pw.Column(
                    children: [
                      pw.Text('SABAMAS', style: pw.TextStyle(font: fontMonoBold, fontSize: 14)),
                      pw.Text('Sistem Billing Sampah', style: styleSmall),
                      pw.SizedBox(height: 4),
                      pw.Container(height: 1, width: double.infinity, color: PdfColors.black),
                      pw.Container(height: 1, margin: const pw.EdgeInsets.only(top: 1), width: double.infinity, color: PdfColors.black),
                      pw.SizedBox(height: 4),
                      pw.Text('TAGIHAN IURAN', style: styleBold),
                    ]
                  )
                ),
                
                pw.SizedBox(height: 4),
                pw.Divider(borderStyle: pw.BorderStyle.dashed, height: 1),
                pw.SizedBox(height: 4),

                // PELANGGAN
                pw.Row(children: [
                  pw.SizedBox(width: 40, child: pw.Text('No.Pel', style: styleSmall)),
                  pw.Text(': ${customer.nomorPelanggan}', style: styleBold),
                ]),
                pw.Row(children: [
                  pw.SizedBox(width: 40, child: pw.Text('Nama', style: styleSmall)),
                  pw.Expanded(child: pw.Text(': ${customer.nama}', style: styleBold)),
                ]),
                if (customer.wilayah.isNotEmpty)
                  pw.Row(children: [
                    pw.SizedBox(width: 40, child: pw.Text('Wilayah', style: styleSmall)),
                    pw.Text(': ${customer.wilayah}', style: styleSmall),
                  ]),
                if (customer.tarif != null)
                  pw.Row(children: [
                    pw.SizedBox(width: 40, child: pw.Text('Tarif', style: styleSmall)),
                    pw.Text(': ${customer.tarif!.namaKategori} (${NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0).format(customer.tarif!.hargaPerBulan)}/bln)', style: styleSmall),
                  ]),

                pw.SizedBox(height: 4),
                pw.Divider(borderStyle: pw.BorderStyle.dashed, height: 1),
                pw.SizedBox(height: 4),

                // RINCIAN TAGIHAN / TUNGGAKAN
                pw.Text('RINCIAN TAGIHAN:', style: styleSmall),
                if (arrears.isEmpty)
                  pw.Padding(
                    padding: const pw.EdgeInsets.only(top: 2),
                    child: pw.Text('Tidak ada tunggakan tagihan.', style: styleNormal),
                  )
                else
                  ...arrears.asMap().entries.map((entry) {
                    final m = entry.value;
                    return pw.Padding(
                      padding: const pw.EdgeInsets.only(top: 2),
                      child: pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                        children: [
                          pw.Expanded(child: pw.Text('${entry.key + 1}. ${monthName(m.month)}', style: styleNormal)),
                          pw.Text(
                            NumberFormat.currency(locale: 'id_ID', symbol: '', decimalDigits: 0).format(m.amount),
                            style: styleBold,
                          ),
                        ],
                      ),
                    );
                  }),

                pw.SizedBox(height: 4),
                pw.Divider(borderStyle: pw.BorderStyle.solid, height: 1),
                pw.SizedBox(height: 4),

                // TOTAL
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text('TOTAL TAGIHAN', style: styleBold),
                    pw.Text(
                      NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0).format(totalArrears),
                      style: styleBold.copyWith(fontSize: 11),
                    ),
                  ],
                ),

                pw.SizedBox(height: 8),
                pw.Container(height: 1, width: double.infinity, color: PdfColors.black),
                pw.Container(height: 1, margin: const pw.EdgeInsets.only(top: 1), width: double.infinity, color: PdfColors.black),
                pw.SizedBox(height: 6),

                // FOOTER
                pw.Center(child: pw.Text('Mohon segera lakukan pembayaran', style: styleSmall.copyWith(fontSize: 7))),
                pw.Center(child: pw.Text('Dicetak: ${DateFormat('dd/MM/yyyy HH:mm').format(DateTime.now())}', style: styleSmall.copyWith(fontSize: 7))),
              ],
            ),
          );
        },
      ),
    );

    return pdf.save();
  }
}
