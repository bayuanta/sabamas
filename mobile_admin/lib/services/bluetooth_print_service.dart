import 'dart:typed_data';
import 'package:intl/intl.dart';
import 'package:print_bluetooth_thermal/print_bluetooth_thermal.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile_admin/services/api_service.dart';

class BluetoothPrintService {
  static const String _prefMacKey = 'selected_bluetooth_mac';
  static const String _prefNameKey = 'selected_bluetooth_name';

  static Future<String?> getSavedMacAddress() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_prefMacKey);
  }

  static Future<String?> getSavedPrinterName() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_prefNameKey);
  }

  static Future<void> savePrinter(String name, String mac) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefMacKey, mac);
    await prefs.setString(_prefNameKey, name);
  }

  static Future<List<BluetoothInfo>> getPairedDevices() async {
    try {
      final List<BluetoothInfo> list = await PrintBluetoothThermal.pairedBluetooths;
      return list;
    } catch (e) {
      return [];
    }
  }

  static Future<bool> isConnected() async {
    try {
      return await PrintBluetoothThermal.connectionStatus;
    } catch (e) {
      return false;
    }
  }

  static Future<bool> connect(String macAddress) async {
    try {
      final bool result = await PrintBluetoothThermal.connect(macPrinterAddress: macAddress);
      return result;
    } catch (e) {
      return false;
    }
  }

  static Future<bool> disconnect() async {
    try {
      return await PrintBluetoothThermal.disconnect;
    } catch (e) {
      return false;
    }
  }

  static Future<bool> printReceiptDirect(
    PaymentResult result, {
    String? customerName,
    String? customerWilayah,
    String? targetMac,
  }) async {
    String? mac = targetMac ?? await getSavedMacAddress();
    if (mac == null || mac.isEmpty) {
      return false;
    }

    bool connected = await isConnected();
    if (!connected) {
      connected = await connect(mac);
      if (!connected) return false;
    }

    final cName = customerName ?? result.customerNama;
    final cWilayah = customerWilayah ?? '';

    String monthName(String yyyyMm) {
      try {
        final dt = DateTime.parse('$yyyyMm-01');
        return DateFormat('MMM yyyy', 'id_ID').format(dt);
      } catch (e) {
        return yyyyMm;
      }
    }

    final currencyFmt = NumberFormat.currency(locale: 'id_ID', symbol: '', decimalDigits: 0);

    StringBuffer sb = StringBuffer();
    // ESC/POS Commands
    sb.write('\x1B\x40'); // Initialize printer
    
    // Header - Center
    sb.write('\x1B\x61\x01'); 
    sb.write('\x1B\x45\x01'); // Bold on
    sb.write('SABAMAS\n');
    sb.write('\x1B\x45\x00'); // Bold off
    sb.write('Billing Sampah Desa\n');
    sb.write('--------------------------------\n');
    sb.write('\x1B\x45\x01');
    sb.write('NOTA PEMBAYARAN\n');
    sb.write('\x1B\x45\x00');
    sb.write('--------------------------------\n');

    // Align Left
    sb.write('\x1B\x61\x00');
    sb.write('No.     : ${result.id.substring(0, 8).toUpperCase()}\n');
    sb.write('Tgl     : ${DateFormat('dd/MM/yy HH:mm').format(result.tanggalBayar)}\n');
    sb.write('--------------------------------\n');
    sb.write('PELANGGAN:\n');
    sb.write('\x1B\x45\x01');
    sb.write('$cName\n');
    sb.write('\x1B\x45\x00');
    if (cWilayah.isNotEmpty) {
      sb.write('$cWilayah\n');
    }
    sb.write('--------------------------------\n');
    sb.write('RINCIAN:\n');

    final itemPrice = result.jumlahBayar / (result.bulanDibayar.isEmpty ? 1 : result.bulanDibayar.length);
    for (int i = 0; i < result.bulanDibayar.length; i++) {
      String name = '${i + 1}. ${monthName(result.bulanDibayar[i])}';
      String priceStr = currencyFmt.format(itemPrice);
      int spaceCount = 32 - (name.length + priceStr.length);
      if (spaceCount < 1) spaceCount = 1;
      sb.write(name + (' ' * spaceCount) + priceStr + '\n');
    }

    sb.write('--------------------------------\n');
    sb.write('\x1B\x45\x01');
    String totalTitle = 'TOTAL';
    String totalVal = 'Rp ${currencyFmt.format(result.jumlahBayar)}';
    int totalSpace = 32 - (totalTitle.length + totalVal.length);
    if (totalSpace < 1) totalSpace = 1;
    sb.write(totalTitle + (' ' * totalSpace) + totalVal + '\n');
    sb.write('\x1B\x45\x00');

    String mTitle = 'METODE';
    String mVal = result.metodeBayar.toUpperCase();
    int mSpace = 32 - (mTitle.length + mVal.length);
    if (mSpace < 1) mSpace = 1;
    sb.write(mTitle + (' ' * mSpace) + mVal + '\n');

    sb.write('================================\n');
    sb.write('\x1B\x61\x01'); // Center
    sb.write('Terima Kasih\n');
    sb.write('Simpan struk ini sebagai bukti\n');
    sb.write('\n\n\n'); // Line feeds

    final bool sent = await PrintBluetoothThermal.writeBytes(Uint8List.fromList(sb.toString().codeUnits));
    return sent;
  }

  static Future<bool> printBillDirect(
    Customer customer, {
    String? targetMac,
  }) async {
    String? mac = targetMac ?? await getSavedMacAddress();
    if (mac == null || mac.isEmpty) {
      return false;
    }

    bool connected = await isConnected();
    if (!connected) {
      connected = await connect(mac);
      if (!connected) return false;
    }

    String monthName(String yyyyMm) {
      try {
        final dt = DateTime.parse('$yyyyMm-01');
        return DateFormat('MMM yyyy', 'id_ID').format(dt);
      } catch (e) {
        return yyyyMm;
      }
    }

    final currencyFmt = NumberFormat.currency(locale: 'id_ID', symbol: '', decimalDigits: 0);
    final arrears = customer.arrearsDetail?.arrearMonths ?? [];
    final totalArrears = customer.tunggakan;

    StringBuffer sb = StringBuffer();
    sb.write('\x1B\x40'); // Reset
    sb.write('\x1B\x61\x01'); // Center
    sb.write('\x1B\x45\x01'); // Bold
    sb.write('SABAMAS\n');
    sb.write('\x1B\x45\x00');
    sb.write('Sistem Billing Sampah\n');
    sb.write('--------------------------------\n');
    sb.write('\x1B\x45\x01');
    sb.write('TAGIHAN IURAN\n');
    sb.write('\x1B\x45\x00');
    sb.write('--------------------------------\n');

    sb.write('\x1B\x61\x00'); // Left
    sb.write('No.Pel  : ${customer.nomorPelanggan}\n');
    sb.write('Nama    : ${customer.nama}\n');
    if (customer.wilayah.isNotEmpty) {
      sb.write('Wilayah : ${customer.wilayah}\n');
    }
    if (customer.tarif != null) {
      sb.write('Tarif   : ${customer.tarif!.namaKategori}\n');
    }
    sb.write('--------------------------------\n');
    sb.write('RINCIAN TAGIHAN:\n');

    if (arrears.isEmpty) {
      sb.write('Tidak ada tunggakan tagihan.\n');
    } else {
      for (int i = 0; i < arrears.length; i++) {
        String name = '${i + 1}. ${monthName(arrears[i].month)}';
        String priceStr = currencyFmt.format(arrears[i].amount);
        int spaceCount = 32 - (name.length + priceStr.length);
        if (spaceCount < 1) spaceCount = 1;
        sb.write(name + (' ' * spaceCount) + priceStr + '\n');
      }
    }

    sb.write('--------------------------------\n');
    sb.write('\x1B\x45\x01');
    String totalTitle = 'TOTAL TAGIHAN';
    String totalVal = 'Rp ${currencyFmt.format(totalArrears)}';
    int totalSpace = 32 - (totalTitle.length + totalVal.length);
    if (totalSpace < 1) totalSpace = 1;
    sb.write(totalTitle + (' ' * totalSpace) + totalVal + '\n');
    sb.write('\x1B\x45\x00');

    sb.write('================================\n');
    sb.write('\x1B\x61\x01'); // Center
    sb.write('Mohon segera lakukan pembayaran\n');
    sb.write('Dicetak: ${DateFormat('dd/MM/yyyy HH:mm').format(DateTime.now())}\n');
    sb.write('\n\n\n');

    final bool sent = await PrintBluetoothThermal.writeBytes(Uint8List.fromList(sb.toString().codeUnits));
    return sent;
  }
}
