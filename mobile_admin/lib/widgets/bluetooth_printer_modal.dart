import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:print_bluetooth_thermal/print_bluetooth_thermal.dart';
import 'package:mobile_admin/services/bluetooth_print_service.dart';

class BluetoothPrinterModal extends StatefulWidget {
  final Function()? onSelected;
  const BluetoothPrinterModal({super.key, this.onSelected});

  @override
  State<BluetoothPrinterModal> createState() => _BluetoothPrinterModalState();
}

class _BluetoothPrinterModalState extends State<BluetoothPrinterModal> {
  List<BluetoothInfo> _devices = [];
  bool _isLoading = true;
  String? _selectedMac;
  String? _selectedName;
  bool _isConnecting = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final savedMac = await BluetoothPrintService.getSavedMacAddress();
    final savedName = await BluetoothPrintService.getSavedPrinterName();
    final devices = await BluetoothPrintService.getPairedDevices();

    if (mounted) {
      setState(() {
        _devices = devices;
        _selectedMac = savedMac;
        _selectedName = savedName;
        _isLoading = false;
      });
    }
  }

  Future<void> _connectAndSave(BluetoothInfo device) async {
    setState(() {
      _isConnecting = true;
      _selectedMac = device.macAdress;
      _selectedName = device.name;
    });

    final success = await BluetoothPrintService.connect(device.macAdress);
    if (success) {
      await BluetoothPrintService.savePrinter(device.name, device.macAdress);
    }

    if (mounted) {
      setState(() => _isConnecting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            success 
              ? 'Terhubung ke ${device.name}' 
              : 'Gagal terhubung ke ${device.name}. Pastikan printer menyala!',
          ),
          backgroundColor: success ? Colors.green : Colors.red,
        ),
      );
      if (success && widget.onSelected != null) {
        widget.onSelected!();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final primaryColor = Theme.of(context).primaryColor;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(LucideIcons.printer, color: Colors.blue),
                  SizedBox(width: 8),
                  Text(
                    'Pilih Printer Bluetooth',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              IconButton(
                icon: const Icon(LucideIcons.refreshCw, size: 20),
                onPressed: _loadData,
              ),
            ],
          ),
          const Divider(),
          const SizedBox(height: 8),
          const Text(
            'Daftar Perangkat Bluetooth Terpasang (Paired):',
            style: TextStyle(fontSize: 12, color: Colors.grey),
          ),
          const SizedBox(height: 12),

          if (_isLoading)
            const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator()))
          else if (_devices.isEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.amber.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(LucideIcons.alertTriangle, color: Colors.amber),
                      SizedBox(width: 8),
                      Text('Tidak Ada Perangkat Paired', style: TextStyle(fontWeight: FontWeight.bold)),
                    ],
                  ),
                  SizedBox(height: 4),
                  Text(
                    '1. Buka Pengaturan Bluetooth HP Anda.\n2. Lakukan "Pairing" ke printer Bluetooth (PIN: 0000 / 1234).\n3. Tekan tombol Refresh di kanan atas.',
                    style: TextStyle(fontSize: 12),
                  ),
                ],
              ),
            )
          else
            Flexible(
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: _devices.length,
                itemBuilder: (context, index) {
                  final dev = _devices[index];
                  final isSelected = dev.macAdress == _selectedMac;

                  return Card(
                    elevation: isSelected ? 2 : 0,
                    color: isSelected ? primaryColor.withOpacity(0.1) : null,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(
                        color: isSelected ? primaryColor : Colors.grey.shade300,
                        width: isSelected ? 2 : 1,
                      ),
                    ),
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      leading: Icon(
                        LucideIcons.bluetooth, 
                        color: isSelected ? primaryColor : Colors.grey,
                      ),
                      title: Text(
                        dev.name.isEmpty ? 'Printer Bluetooth' : dev.name, 
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      subtitle: Text(dev.macAdress, style: const TextStyle(fontSize: 11)),
                      trailing: isSelected
                        ? const Icon(LucideIcons.checkCircle2, color: Colors.green)
                        : _isConnecting && _selectedMac == dev.macAdress
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                          : ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: primaryColor,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                              ),
                              onPressed: () => _connectAndSave(dev),
                              child: const Text('Pilih', style: TextStyle(fontSize: 12)),
                            ),
                      onTap: () => _connectAndSave(dev),
                    ),
                  );
                },
              ),
            ),

          const SizedBox(height: 16),
          if (_selectedMac != null && _selectedMac!.isNotEmpty)
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.green,
                  side: const BorderSide(color: Colors.green),
                ),
                icon: const Icon(LucideIcons.printer, size: 16),
                label: Text('Tes Cetak (${_selectedName ?? "Printer"})'),
                onPressed: () async {
                  bool ok = await BluetoothPrintService.connect(_selectedMac!);
                  if (ok) {
                    StringBuffer sb = StringBuffer();
                    sb.write('\x1B\x40\x1B\x61\x01\x1B\x45\x01SABAMAS TEST\n\x1B\x45\x00Printer Terhubung OK!\n\n\n');
                    await PrintBluetoothThermal.writeBytes(Uint8List.fromList(sb.toString().codeUnits));
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Tes cetak terkirim!'), backgroundColor: Colors.green),
                      );
                    }
                  } else {
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Gagal menghubungkan printer!'), backgroundColor: Colors.red),
                      );
                    }
                  }
                },
              ),
            ),
        ],
      ),
    );
  }
}

void showBluetoothPrinterModal(BuildContext context, {Function()? onSelected}) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (context) => BluetoothPrinterModal(onSelected: onSelected),
  );
}
