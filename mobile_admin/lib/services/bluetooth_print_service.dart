import 'dart:convert';
import 'dart:typed_data';
import 'package:intl/intl.dart';
import 'package:print_bluetooth_thermal/print_bluetooth_thermal.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile_admin/services/api_service.dart';
import 'package:permission_handler/permission_handler.dart';

class BluetoothPrintService {
  static const String _prefMacKey = 'selected_bluetooth_mac';
  static const String _prefNameKey = 'selected_bluetooth_name';

  static Future<void> requestPermissions() async {
    try {
      await [
        Permission.bluetoothConnect,
        Permission.bluetoothScan,
        Permission.location,
      ].request();
    } catch (e) {
      // Fallback
    }
  }

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
      await requestPermissions();
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
      await PrintBluetoothThermal.disconnect;
      await Future.delayed(const Duration(milliseconds: 250));

      bool result = await PrintBluetoothThermal.connect(macPrinterAddress: macAddress);
      if (result) return true;

      await Future.delayed(const Duration(milliseconds: 500));
      result = await PrintBluetoothThermal.connect(macPrinterAddress: macAddress);
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

  static Future<bool> printTestReceipt(String macAddress) async {
    bool ok = await isConnected();
    if (!ok) {
      ok = await connect(macAddress);
      if (!ok) return false;
    }

    List<int> bytes = [];
    // ESC/POS Commands
    bytes.addAll([0x1B, 0x40]); // Initialize ESC @
    bytes.addAll([0x1B, 0x74, 0x00]); // Select PC437 code table
    bytes.addAll([0x1B, 0x61, 0x01]); // Center align
    bytes.addAll([0x1B, 0x45, 0x01]); // Bold ON
    bytes.addAll(latin1.encode('SABAMAS PRINTER TEST\n'));
    bytes.addAll([0x1B, 0x45, 0x00]); // Bold OFF
    bytes.addAll(latin1.encode('--------------------------------\n'));
    bytes.addAll(latin1.encode('Printer RP330N Terhubung OK!\n'));
    bytes.addAll(latin1.encode('STATUS: SIAP CETAK STRUK\n'));
    bytes.addAll(latin1.encode('--------------------------------\n'));
    bytes.addAll(latin1.encode('Sistem Billing Sampah Desa\n'));
    
    // ULTRA COMPACT PAPER SAVING (Exact fit for RP330N tear bar)
    bytes.addAll([0x1B, 0x64, 0x02]); // ESC d 2 (Feed 2 lines)

    return await PrintBluetoothThermal.writeBytes(bytes);
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

    List<int> bytes = [];
    // ESC/POS Commands
    bytes.addAll([0x1B, 0x40]); // Initialize
    bytes.addAll([0x1B, 0x74, 0x00]); // Select PC437
    
    // Header - Center
    bytes.addAll([0x1B, 0x61, 0x01]); 
    bytes.addAll([0x1B, 0x45, 0x01]); // Bold on
    bytes.addAll(latin1.encode('SABAMAS\n'));
    bytes.addAll([0x1B, 0x45, 0x00]); // Bold off
    bytes.addAll(latin1.encode('Billing Sampah Desa\n'));
    bytes.addAll(latin1.encode('--------------------------------\n'));
    bytes.addAll([0x1B, 0x45, 0x01]);
    bytes.addAll(latin1.encode('NOTA PEMBAYARAN\n'));
    bytes.addAll([0x1B, 0x45, 0x00]);
    bytes.addAll(latin1.encode('--------------------------------\n'));

    // Align Left
    bytes.addAll([0x1B, 0x61, 0x00]);
    bytes.addAll(latin1.encode('No.     : ${result.id.substring(0, 8).toUpperCase()}\n'));
    bytes.addAll(latin1.encode('Tgl     : ${DateFormat('dd/MM/yy HH:mm').format(result.tanggalBayar)}\n'));
    bytes.addAll(latin1.encode('--------------------------------\n'));
    bytes.addAll(latin1.encode('PELANGGAN:\n'));
    bytes.addAll([0x1B, 0x45, 0x01]);
    bytes.addAll(latin1.encode('$cName\n'));
    bytes.addAll([0x1B, 0x45, 0x00]);
    if (cWilayah.isNotEmpty) {
      bytes.addAll(latin1.encode('$cWilayah\n'));
    }
    bytes.addAll(latin1.encode('--------------------------------\n'));
    bytes.addAll(latin1.encode('RINCIAN:\n'));

    final itemPrice = result.jumlahBayar / (result.bulanDibayar.isEmpty ? 1 : result.bulanDibayar.length);
    for (int i = 0; i < result.bulanDibayar.length; i++) {
      String name = '${i + 1}. ${monthName(result.bulanDibayar[i])}';
      String priceStr = currencyFmt.format(itemPrice);
      int spaceCount = 32 - (name.length + priceStr.length);
      if (spaceCount < 1) spaceCount = 1;
      bytes.addAll(latin1.encode(name + (' ' * spaceCount) + priceStr + '\n'));
    }

    bytes.addAll(latin1.encode('--------------------------------\n'));
    bytes.addAll([0x1B, 0x45, 0x01]);
    String totalTitle = 'TOTAL';
    String totalVal = 'Rp ${currencyFmt.format(result.jumlahBayar)}';
    int totalSpace = 32 - (totalTitle.length + totalVal.length);
    if (totalSpace < 1) totalSpace = 1;
    bytes.addAll(latin1.encode(totalTitle + (' ' * totalSpace) + totalVal + '\n'));
    bytes.addAll([0x1B, 0x45, 0x00]);

    String mTitle = 'METODE';
    String mVal = result.metodeBayar.toUpperCase();
    int mSpace = 32 - (mTitle.length + mVal.length);
    if (mSpace < 1) mSpace = 1;
    bytes.addAll(latin1.encode(mTitle + (' ' * mSpace) + mVal + '\n'));

    bytes.addAll(latin1.encode('================================\n'));
    bytes.addAll([0x1B, 0x61, 0x01]); // Center
    bytes.addAll(latin1.encode('Terima Kasih\n'));
    bytes.addAll(latin1.encode('Simpan struk ini sebagai bukti\n'));
    
    // ULTRA COMPACT PAPER SAVING (Exact fit for RP330N tear bar)
    bytes.addAll([0x1B, 0x64, 0x02]); // ESC d 2 (Feed 2 lines)

    return await PrintBluetoothThermal.writeBytes(bytes);
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

    List<int> bytes = [];
    bytes.addAll([0x1B, 0x40]); // Reset
    bytes.addAll([0x1B, 0x74, 0x00]); // Code page PC437
    bytes.addAll([0x1B, 0x61, 0x01]); // Center
    bytes.addAll([0x1B, 0x45, 0x01]); // Bold
    bytes.addAll(latin1.encode('SABAMAS\n'));
    bytes.addAll([0x1B, 0x45, 0x00]);
    bytes.addAll(latin1.encode('Sistem Billing Sampah\n'));
    bytes.addAll(latin1.encode('--------------------------------\n'));
    bytes.addAll([0x1B, 0x45, 0x01]);
    bytes.addAll(latin1.encode('TAGIHAN IURAN\n'));
    bytes.addAll([0x1B, 0x45, 0x00]);
    bytes.addAll(latin1.encode('--------------------------------\n'));

    bytes.addAll([0x1B, 0x61, 0x00]); // Left
    bytes.addAll(latin1.encode('No.Pel  : ${customer.nomorPelanggan}\n'));
    bytes.addAll(latin1.encode('Nama    : ${customer.nama}\n'));
    if (customer.wilayah.isNotEmpty) {
      bytes.addAll(latin1.encode('Wilayah : ${customer.wilayah}\n'));
    }
    if (customer.tarif != null) {
      bytes.addAll(latin1.encode('Tarif   : ${customer.tarif!.namaKategori}\n'));
    }
    bytes.addAll(latin1.encode('--------------------------------\n'));
    bytes.addAll(latin1.encode('RINCIAN TAGIHAN:\n'));

    if (arrears.isEmpty) {
      bytes.addAll(latin1.encode('Tidak ada tunggakan tagihan.\n'));
    } else {
      for (int i = 0; i < arrears.length; i++) {
        String name = '${i + 1}. ${monthName(arrears[i].month)}';
        String priceStr = currencyFmt.format(arrears[i].amount);
        int spaceCount = 32 - (name.length + priceStr.length);
        if (spaceCount < 1) spaceCount = 1;
        bytes.addAll(latin1.encode(name + (' ' * spaceCount) + priceStr + '\n'));
      }
    }

    bytes.addAll(latin1.encode('--------------------------------\n'));
    bytes.addAll([0x1B, 0x45, 0x01]);
    String totalTitle = 'TOTAL TAGIHAN';
    String totalVal = 'Rp ${currencyFmt.format(totalArrears)}';
    int totalSpace = 32 - (totalTitle.length + totalVal.length);
    if (totalSpace < 1) totalSpace = 1;
    bytes.addAll(latin1.encode(totalTitle + (' ' * totalSpace) + totalVal + '\n'));
    bytes.addAll([0x1B, 0x45, 0x00]);

    bytes.addAll(latin1.encode('================================\n'));
    bytes.addAll([0x1B, 0x61, 0x01]); // Center
    bytes.addAll(latin1.encode('Mohon segera lakukan pembayaran\n'));
    bytes.addAll(latin1.encode('Dicetak: ${DateFormat('dd/MM/yyyy HH:mm').format(DateTime.now())}\n'));
    
    // ULTRA COMPACT PAPER SAVING (Exact fit for RP330N tear bar)
    bytes.addAll([0x1B, 0x64, 0x02]); // ESC d 2 (Feed 2 lines)

    return await PrintBluetoothThermal.writeBytes(bytes);
  }
}
