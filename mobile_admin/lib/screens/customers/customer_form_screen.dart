import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobile_admin/services/api_service.dart';
import 'package:intl/intl.dart';

class CustomerFormScreen extends StatefulWidget {
  final Customer? customer;

  const CustomerFormScreen({super.key, this.customer});

  @override
  State<CustomerFormScreen> createState() => _CustomerFormScreenState();
}

class _CustomerFormScreenState extends State<CustomerFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final ApiService _apiService = ApiService();
  
  // Controllers
  final _noPelangganController = TextEditingController(); 
  final _namaController = TextEditingController();
  final _noHpController = TextEditingController();
  final _alamatController = TextEditingController();
  
  // Form State
  String? _selectedWilayah;
  String? _selectedTariffId;
  String _status = 'aktif';
  DateTime _tanggalBergabung = DateTime.now();
  
  // Data Lists
  List<String> _wilayahList = [];
  List<TariffCategory> _tariffList = [];
  bool _isLoading = false;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _loadFormData();
    if (widget.customer != null) {
      _initEditMode();
    }
  }

  void _initEditMode() {
    final c = widget.customer!;
    _noPelangganController.text = c.nomorPelanggan;
    _namaController.text = c.nama;
    _noHpController.text = c.noHp;
    _alamatController.text = c.alamat;
    _selectedWilayah = c.wilayah;
    _selectedTariffId = c.tarif?.id;
    _status = c.status;
  }

  Future<void> _loadFormData() async {
    setState(() => _isLoading = true);
    final wilayah = await _apiService.getWilayahList();
    final tariffs = await _apiService.getTariffCategories();
    
    if (mounted) {
      setState(() {
        _wilayahList = wilayah;
        _tariffList = tariffs;
        _isLoading = false;
      });
    }
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _tanggalBergabung,
      firstDate: DateTime(2000),
      lastDate: DateTime(2101),
    );
    if (picked != null && picked != _tanggalBergabung) {
      setState(() {
        _tanggalBergabung = picked;
      });
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    
    if (_selectedWilayah == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pilih wilayah')));
      return;
    }
    if (_selectedTariffId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pilih tarif')));
      return;
    }

    setState(() => _isSaving = true);

    final data = {
      'nomor_pelanggan': _noPelangganController.text,
      'nama': _namaController.text,
      'alamat': _alamatController.text,
      'wilayah': _selectedWilayah,
      'nomor_telepon': _noHpController.text,
      'tarif_id': _selectedTariffId,
      'status': _status,
      'tanggal_bergabung': DateFormat('yyyy-MM-dd').format(_tanggalBergabung),
    };

    bool success;
    if (widget.customer != null) {
      success = await _apiService.updateCustomer(widget.customer!.id, data);
    } else {
      success = await _apiService.createCustomer(data);
    }

    if (mounted) {
      setState(() => _isSaving = false);
      if (success) {
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(widget.customer != null ? 'Data diperbarui' : 'Pelanggan ditambahkan')),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Gagal menyimpan data')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.customer != null;
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: Icon(LucideIcons.arrowLeft, color: theme.iconTheme.color),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          isEdit ? 'Edit Pelanggan' : 'Tambah Pelanggan',
          style: GoogleFonts.inter(
            color: theme.textTheme.bodyLarge?.color,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : Form(
            key: _formKey,
            child: ListView(
              padding: const EdgeInsets.all(24),
              children: [
                _buildLabel('Informasi Pelanggan'),
                
                // No Pelanggan
                _buildTextField(
                  controller: _noPelangganController,
                  label: 'Nomor Pelanggan',
                  icon: LucideIcons.hash,
                  validator: (v) => v == null || v.isEmpty ? 'Nomor Pelanggan wajib diisi' : null,
                ),
                const SizedBox(height: 16),

                // Nama
                _buildTextField(
                  controller: _namaController,
                  label: 'Nama Lengkap',
                  icon: LucideIcons.user,
                  validator: (v) => v == null || v.isEmpty ? 'Nama wajib diisi' : null,
                ),
                const SizedBox(height: 16),
                
                // Alamat
                _buildTextField(
                  controller: _alamatController,
                  label: 'Alamat',
                  icon: LucideIcons.mapPin,
                  maxLines: 2,
                  validator: (v) => v == null || v.isEmpty ? 'Alamat wajib diisi' : null,
                ),
                
                const SizedBox(height: 16),
                
                // Telepon
                _buildTextField(
                  controller: _noHpController,
                  label: 'Nomor HP',
                  icon: LucideIcons.phone,
                  inputType: TextInputType.phone,
                ),

                const SizedBox(height: 32),
                _buildLabel('Layanan & Status'),

                // Wilayah Dropdown
                DropdownButtonFormField<String>(
                  value: _wilayahList.contains(_selectedWilayah) ? _selectedWilayah : null,
                  decoration: _inputDecoration('Wilayah', LucideIcons.map),
                  dropdownColor: theme.cardColor,
                  style: GoogleFonts.inter(color: theme.textTheme.bodyLarge?.color),
                  items: _wilayahList.map((w) => DropdownMenuItem(value: w, child: Text(w))).toList(),
                  onChanged: (val) => setState(() => _selectedWilayah = val),
                ),
                const SizedBox(height: 16),

                // Tarif Dropdown
                DropdownButtonFormField<String>(
                  value: _tariffList.any((t) => t.id == _selectedTariffId) ? _selectedTariffId : null,
                  decoration: _inputDecoration('Kategori Tarif', LucideIcons.tag),
                  dropdownColor: theme.cardColor,
                  style: GoogleFonts.inter(color: theme.textTheme.bodyLarge?.color),
                  items: _tariffList.map((t) => DropdownMenuItem(
                    value: t.id, 
                    child: Text('${t.namaKategori} - Rp ${t.hargaPerBulan}'),
                  )).toList(),
                  onChanged: (val) => setState(() => _selectedTariffId = val),
                ),
                const SizedBox(height: 16),

                // Status Dropdown
                DropdownButtonFormField<String>(
                  value: _status,
                  decoration: _inputDecoration('Status', LucideIcons.power),
                  dropdownColor: theme.cardColor,
                  style: GoogleFonts.inter(color: theme.textTheme.bodyLarge?.color),
                  items: const [
                    DropdownMenuItem(value: 'aktif', child: Text('Aktif')),
                    DropdownMenuItem(value: 'nonaktif', child: Text('Nonaktif')),
                  ],
                  onChanged: (val) => setState(() => _status = val ?? 'aktif'),
                ),
                const SizedBox(height: 16),

                // Tanggal Bergabung Picker
                InkWell(
                  onTap: () => _selectDate(context),
                  child: InputDecorator(
                    decoration: _inputDecoration('Tanggal Bergabung', LucideIcons.calendar),
                    child: Text(
                      DateFormat('dd MMMM yyyy', 'id_ID').format(_tanggalBergabung),
                      style: GoogleFonts.inter(color: theme.textTheme.bodyMedium?.color),
                    ),
                  ),
                ),

                const SizedBox(height: 48),

                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _isSaving ? null : _save,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: theme.primaryColor,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: _isSaving 
                      ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : Text(
                          'Simpan Data',
                          style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                  ),
                ),
              ],
            ),
          ),
    );
  }

  Widget _buildLabel(String text) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Text(text, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: theme.disabledColor)),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? inputType,
    int maxLines = 1,
    String? Function(String?)? validator,
  }) {
    final theme = Theme.of(context);
    return TextFormField(
      controller: controller,
      keyboardType: inputType,
      maxLines: maxLines,
      validator: validator,
      decoration: _inputDecoration(label, icon),
      style: GoogleFonts.inter(color: theme.textTheme.bodyLarge?.color),
    );
  }

  InputDecoration _inputDecoration(String label, IconData icon) {
    final theme = Theme.of(context);
    // Explicitly using theme values to ensure consistency or overriding if local style is preferred
    // Assuming ThemeData.inputDecorationTheme handles defaults, but we need icon color
    return InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon, color: theme.iconTheme.color, size: 20),
      // Border styles are handled by Theme, but we can enforce if needed.
    );
  }
}
