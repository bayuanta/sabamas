import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  // Ganti URL ini sesuai kebutuhan:
    // Use production domain for release build
    return 'https://sabamas.web.id/api'; 
  }

  final Dio _dio = Dio(BaseOptions(
    baseUrl: baseUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
  ));

  final _storage = const FlutterSecureStorage();

  ApiService() {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'jwt_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) {
        if (e.response?.statusCode == 401) {
          // TODO: Trigger logout
        }
        return handler.next(e);
      },
    ));
  }

  Dio get client => _dio;

  Future<LoginResponse?> login(String username, String password) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'email': username,
        'password': password,
      });

      if (response.statusCode == 200 || response.statusCode == 201) {
        return LoginResponse.fromJson(response.data);
      }
      return null;
    } catch (e) {
      rethrow;
    }
  }

  Future<DashboardStats?> getDashboardStats({int? year, int? revenueYear}) async {
    try {
      final response = await _dio.get('/reports/dashboard', queryParameters: {
        'year': year,
        'revenueYear': revenueYear,
      });

      if (response.statusCode == 200) {
        return DashboardStats.fromJson(response.data);
      }
      return null;
    } catch (e) {
      if (kDebugMode) print('Error dashboard stats: $e');
      return null;
    }
  }

  // --- Transactions / Payments ---

  Future<PaymentListResponse?> getPayments({
    int page = 1,
    int limit = 20,
    String? dateFrom,
    String? dateTo,
    String? metodeBayar,
  }) async {
    try {
      final queryParams = {
        'page': page,
        'limit': limit,
        if (dateFrom != null && dateFrom.isNotEmpty) 'dateFrom': dateFrom,
        if (dateTo != null && dateTo.isNotEmpty) 'dateTo': dateTo,
        if (metodeBayar != null && metodeBayar.isNotEmpty) 'metode_bayar': metodeBayar,
      };

      final response = await _dio.get('/payments', queryParameters: queryParams);

      if (response.statusCode == 200) {
        return PaymentListResponse.fromJson(response.data);
      }
      return null;
    } catch (e) {
      if (kDebugMode) print('Error getting payments: $e');
      return null;
    }
  }

  Future<bool> cancelPayment(String id) async {
    try {
      final response = await _dio.delete('/payments/$id');
      return response.statusCode == 200;
    } catch (e) {
      if (kDebugMode) print('Error cancelling payment: $e');
      return false;
    }
  }

  Future<PaymentResult?> createPayment(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post('/payments', data: data);
      if (response.statusCode == 201 || response.statusCode == 200) {
        return PaymentResult.fromJson(response.data);
      }
      return null;
    } catch (e) {
      if (kDebugMode) print('Payment error: $e');
      return null;
    }
  }
  
  Future<List<PartialPayment>> getPartialPaymentHistory(String customerId) async {
    try {
      final response = await _dio.get('/payments/partial/$customerId');
      if (response.statusCode == 200) {
        return (response.data as List).map((e) => PartialPayment.fromJson(e)).toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  // --- Customer Methods ---

  Future<CustomerListResponse?> getCustomers({
    int page = 1,
    int limit = 20,
    String? search,
    String? status,
    String? wilayah,
  }) async {
    try {
      final queryParams = {
        'page': page,
        'limit': limit,
        if (search != null && search.isNotEmpty) 'search': search,
        if (status != null && status.isNotEmpty) 'status': status,
        if (wilayah != null && wilayah.isNotEmpty) 'wilayah': wilayah,
      };

      final response = await _dio.get('/customers', queryParameters: queryParams);

      if (response.statusCode == 200) {
        return CustomerListResponse.fromJson(response.data);
      }
      return null;
    } catch (e) {
      if (kDebugMode) print('Error getting customers: $e');
      return null;
    }
  }

  Future<List<String>> getWilayahList() async {
    try {
      final response = await _dio.get('/customers/wilayah/list');
      if (response.statusCode == 200) {
        return List<String>.from(response.data);
      }
      return [];
    } catch (e) {
      if (kDebugMode) print('Error getting wilayah: $e');
      return [];
    }
  }

  Future<ArrearsReportResponse?> getArrears({String? wilayah, String? sortBy}) async {
    try {
      final response = await _dio.get('/reports/arrears', queryParameters: {
        if (wilayah != null && wilayah.isNotEmpty) 'wilayah': wilayah,
        if (sortBy != null && sortBy.isNotEmpty) 'sortBy': sortBy,
      });

      if (response.statusCode == 200) {
        return ArrearsReportResponse.fromJson(response.data);
      }
      return null;
    } catch (e) {
      if (kDebugMode) print('Error getting arrears report: $e');
      return null;
    }
  }

  Future<List<TariffCategory>> getTariffCategories() async {
    try {
      final response = await _dio.get('/tariffs/categories');
      if (response.statusCode == 200) {
        return (response.data as List).map((e) => TariffCategory.fromJson(e)).toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<bool> createCustomer(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post('/customers', data: data);
      return response.statusCode == 201;
    } catch (e) {
      return false;
    }
  }

  Future<bool> updateCustomer(String id, Map<String, dynamic> data) async {
    try {
      final response = await _dio.patch('/customers/$id', data: data);
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  Future<bool> deleteCustomer(String id) async {
    try {
      final response = await _dio.delete('/customers/$id');
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  Future<bool> toggleCustomerStatus(String id, String status) async {
    try {
      final response = await _dio.patch('/customers/$id/toggle-status', data: {'status': status});
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  Future<Customer?> getCustomerDetail(String id) async {
    try {
      final response = await _dio.get('/customers/$id');
      if (response.statusCode == 200) {
        return Customer.fromJson(response.data);
      }
      return null;
    } catch (e) {
      if (kDebugMode) print('Error getting customer detail: $e');
      return null;
    }
  }

  Future<List<StatusHistory>> getStatusHistory(String id) async {
    try {
      final response = await _dio.get('/customers/$id/status-history');
      if (response.statusCode == 200) {
        return (response.data as List).map((e) => StatusHistory.fromJson(e)).toList();
      }
      return [];
    } catch (e) {
      if (kDebugMode) print('Error getting status history: $e');
      return [];
    }
  }
}

// --- Models ---

class LoginResponse {
  final String accessToken;
  final UserData user;

  LoginResponse({required this.accessToken, required this.user});

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    return LoginResponse(
      accessToken: json['access_token'],
      user: UserData.fromJson(json['user'] ?? {}),
    );
  }
}

class UserData {
  final String id;
  final String username;
  final String role;

  UserData({required this.id, required this.username, required this.role});

  factory UserData.fromJson(Map<String, dynamic> json) {
    return UserData(
      id: json['id']?.toString() ?? '',
      username: json['username'] ?? '',
      role: json['role'] ?? 'user',
    );
  }
}

class DashboardStats {
  final num pemasukanHariIni;
  final num pemasukanBulanIni;
  final int wargaBayarHariIni;
  final int wargaBayarBulanIni;
  final num totalTunggakan;
  final int totalCustomers;
  final List<Payment> recentPayments;
  final List<MonthlyStat> monthlyStats;
  final List<Payment> allPaymentsForYear;
  final List<WilayahStat> wilayahStats;

  DashboardStats({
    required this.pemasukanHariIni,
    required this.pemasukanBulanIni,
    required this.wargaBayarHariIni,
    required this.wargaBayarBulanIni,
    required this.totalTunggakan,
    required this.totalCustomers,
    required this.recentPayments,
    required this.monthlyStats,
    required this.allPaymentsForYear,
    required this.wilayahStats,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      pemasukanHariIni: json['pemasukanHariIni'] ?? 0,
      pemasukanBulanIni: json['pemasukanBulanIni'] ?? 0,
      wargaBayarHariIni: json['wargaBayarHariIni'] ?? 0,
      wargaBayarBulanIni: json['wargaBayarBulanIni'] ?? 0,
      totalTunggakan: json['totalTunggakan'] ?? 0,
      totalCustomers: json['totalCustomers'] ?? 0,
      recentPayments: (json['recentPayments'] as List?)
              ?.map((e) => Payment.fromJson(e))
              .toList() ??
          [],
      monthlyStats: (json['monthlyStats'] as List?)
              ?.map((e) => MonthlyStat.fromJson(e))
              .toList() ??
          [],
      allPaymentsForYear: (json['allPaymentsForYear'] as List?)
              ?.map((e) => Payment.fromJson(e))
              .toList() ??
          [],
      wilayahStats: (json['wilayahStats'] as List?)
              ?.map((e) => WilayahStat.fromJson(e))
              .toList() ??
          [],
    );
  }
}

class WilayahStat {
  final String wilayah;
  final int count;

  WilayahStat({required this.wilayah, required this.count});

  factory WilayahStat.fromJson(Map<String, dynamic> json) {
    return WilayahStat(
      wilayah: json['wilayah'] ?? 'Unknown',
      count: json['count'] ?? 0,
    );
  }
}

class PaymentListResponse {
  final List<Payment> data;
  final Meta meta;

  PaymentListResponse({required this.data, required this.meta});

  factory PaymentListResponse.fromJson(Map<String, dynamic> json) {
    return PaymentListResponse(
      data: (json['data'] as List?)?.map((e) => Payment.fromJson(e)).toList() ?? [],
      meta: Meta.fromJson(json['meta'] ?? {}),
    );
  }
}

class Payment {
  final String id;
  final num jumlahBayar;
  final DateTime tanggalBayar;
  final String metodeBayar;
  final String customerNama;
  // New Fields for Transactions List
  final List<String> bulanDibayar;
  final String customerWilayah;
  final bool isDeposited;
  final String customerId;

  Payment({
    required this.id,
    required this.jumlahBayar,
    required this.tanggalBayar,
    required this.metodeBayar,
    required this.customerNama,
    this.bulanDibayar = const [],
    this.customerWilayah = '',
    this.isDeposited = false,
    this.customerId = '',
  });

  factory Payment.fromJson(Map<String, dynamic> json) {
    List<String> parsedBulan = [];
    if (json['bulan_dibayar'] is List) {
      parsedBulan = List<String>.from(json['bulan_dibayar']);
    }

    return Payment(
      id: json['id']?.toString() ?? '',
      jumlahBayar: json['jumlah_bayar'] ?? 0,
      tanggalBayar: DateTime.parse(json['tanggal_bayar']),
      metodeBayar: json['metode_bayar'] ?? 'cash',
      customerNama: json['customer']?['nama'] ?? json['customer_nama'] ?? 'Unknown',
      customerWilayah: json['customer']?['wilayah'] ?? '',
      customerId: json['customer']?['id']?.toString() ?? json['customer_id']?.toString() ?? '',
      bulanDibayar: parsedBulan,
      isDeposited: json['is_deposited'] ?? false,
    );
  }
}

class MonthlyStat {
  final String month;
  final num totalTagihan;
  final num sudahBayar;
  final num belumBayar;

  MonthlyStat({
    required this.month,
    required this.totalTagihan,
    required this.sudahBayar,
    required this.belumBayar,
  });

  factory MonthlyStat.fromJson(Map<String, dynamic> json) {
    return MonthlyStat(
      month: json['month'] ?? '',
      totalTagihan: json['totalTagihan'] ?? 0,
      sudahBayar: json['sudahBayar'] ?? 0,
      belumBayar: json['belumBayar'] ?? 0,
    );
  }
}

class CustomerListResponse {
  final List<Customer> data;
  final Meta meta;

  CustomerListResponse({required this.data, required this.meta});

  factory CustomerListResponse.fromJson(Map<String, dynamic> json) {
    return CustomerListResponse(
      data: (json['data'] as List?)?.map((e) => Customer.fromJson(e)).toList() ?? [],
      meta: Meta.fromJson(json['meta'] ?? {}),
    );
  }
}

class Customer {
  final String id;
  final String nama;
  final String nomorPelanggan;
  final String alamat;
  final String wilayah;
  final String status;
  final String noHp;
  final num tunggakan; 
  final TariffCategory? tarif;
  
  // Detail Fields
  final DateTime? tanggalBergabung;
  final ArrearsDetail? arrearsDetail;
  final List<Payment>? payments;
  final List<PartialPayment>? partialPayments;

  Customer({
    required this.id,
    required this.nama,
    required this.nomorPelanggan,
    required this.alamat,
    required this.wilayah,
    required this.status,
    required this.noHp,
    required this.tunggakan,
    this.tarif,
    this.tanggalBergabung,
    this.arrearsDetail,
    this.payments,
    this.partialPayments,
  });

  factory Customer.fromJson(Map<String, dynamic> json) {
    num tunggakanValue = 0;
    if (json['tunggakan'] != null) {
      tunggakanValue = json['tunggakan'];
    } else if (json['arrears'] != null && json['arrears']['total'] != null) {
      tunggakanValue = json['arrears']['total'];
    } else if (json['arrears'] != null && json['arrears']['totalArrears'] != null) {
      tunggakanValue = json['arrears']['totalArrears'];
    }

    return Customer(
      id: json['id']?.toString() ?? '',
      nama: json['nama'] ?? '',
      nomorPelanggan: json['nomor_pelanggan'] ?? '',
      alamat: json['alamat'] ?? '',
      wilayah: json['wilayah'] ?? '',
      status: json['status'] ?? 'nonaktif',
      noHp: json['nomor_telepon'] ?? json['no_hp'] ?? '',
      tunggakan: tunggakanValue,
      tarif: json['tarif'] != null ? TariffCategory.fromJson(json['tarif']) : null,
      tanggalBergabung: json['tanggal_bergabung'] != null ? DateTime.tryParse(json['tanggal_bergabung']) : null,
      arrearsDetail: json['arrears'] != null ? ArrearsDetail.fromJson(json['arrears']) : null,
      payments: (json['payments'] as List?)?.map((e) => Payment.fromJson(e)).toList(),
      partialPayments: (json['partialPayments'] as List?)?.map((e) => PartialPayment.fromJson(e)).toList(),
    );
  }
}

class ArrearsDetail {
  final num totalArrears;
  final int totalMonths;
  final List<ArrearMonth> arrearMonths;

  ArrearsDetail({required this.totalArrears, required this.totalMonths, required this.arrearMonths});

  factory ArrearsDetail.fromJson(Map<String, dynamic> json) {
    return ArrearsDetail(
      totalArrears: json['totalArrears'] ?? json['total'] ?? 0,
      totalMonths: json['totalMonths'] ?? json['months'] ?? 0,
      arrearMonths: (json['arrearMonths'] as List?)?.map((e) => ArrearMonth.fromJson(e)).toList() ?? [],
    );
  }
}

class ArrearMonth {
  final String month;
  final num amount;
  final String details;
  final String source;

  ArrearMonth({required this.month, required this.amount, required this.details, required this.source});

  factory ArrearMonth.fromJson(Map<String, dynamic> json) {
    return ArrearMonth(
      month: json['month'] ?? '',
      amount: json['amount'] ?? 0,
      details: json['details'] ?? '',
      source: json['source'] ?? 'default',
    );
  }
}

class PartialPayment {
  final String id;
  final String bulanTagihan;
  final num jumlahTagihan;
  final num jumlahTerbayar;
  final num sisaTagihan;
  final String status;

  PartialPayment({
    required this.id, 
    required this.bulanTagihan, 
    required this.jumlahTagihan, 
    required this.jumlahTerbayar,
    required this.sisaTagihan,
    required this.status
  });

  factory PartialPayment.fromJson(Map<String, dynamic> json) {
    return PartialPayment(
      id: json['id']?.toString() ?? '',
      bulanTagihan: json['bulan_tagihan'] ?? '',
      jumlahTagihan: json['jumlah_tagihan'] ?? 0,
      jumlahTerbayar: json['jumlah_terbayar'] ?? 0,
      sisaTagihan: json['sisa_tagihan'] ?? 0,
      status: json['status'] ?? 'pending',
    );
  }
}

class StatusHistory {
  final String id;
  final String status;
  final DateTime tanggalMulai;
  final DateTime? tanggalSelesai;
  final String? keterangan;

  StatusHistory({
    required this.id,
    required this.status,
    required this.tanggalMulai,
    this.tanggalSelesai,
    this.keterangan,
  });

  factory StatusHistory.fromJson(Map<String, dynamic> json) {
    return StatusHistory(
      id: json['id']?.toString() ?? '',
      status: json['status'] ?? '',
      tanggalMulai: DateTime.parse(json['tanggal_mulai']),
      tanggalSelesai: json['tanggal_selesai'] != null ? DateTime.parse(json['tanggal_selesai']) : null,
      keterangan: json['keterangan'],
    );
  }
}

class TariffCategory {
  final String id;
  final String namaKategori;
  final num hargaPerBulan;

  TariffCategory({required this.id, required this.namaKategori, required this.hargaPerBulan});

  factory TariffCategory.fromJson(Map<String, dynamic> json) {
    return TariffCategory(
      id: json['id']?.toString() ?? '',
      namaKategori: json['nama_kategori'] ?? '',
      hargaPerBulan: json['harga_per_bulan'] ?? 0,
    );
  }
}

class Meta {
  final int total;
  final int page;
  final int lastPage;

  Meta({required this.total, required this.page, required this.lastPage});

  factory Meta.fromJson(Map<String, dynamic> json) {
    return Meta(
      total: json['total'] ?? 0,
      page: json['page'] ?? 1,
      lastPage: json['lastPage'] ?? 1,
    );
  }
}

class PaymentResult {
  final String id;
  final num jumlahBayar;
  final DateTime tanggalBayar;
  final String metodeBayar;
  final String customerNama;
  final List<String> bulanDibayar;
  final bool isPartial;

  PaymentResult({
    required this.id,
    required this.jumlahBayar,
    required this.tanggalBayar,
    required this.metodeBayar,
    required this.customerNama,
    required this.bulanDibayar,
    required this.isPartial,
  });

  factory PaymentResult.fromJson(Map<String, dynamic> json) {
    List<String> parsedBulan = [];
    if (json['bulan_dibayar'] is List) {
      parsedBulan = List<String>.from(json['bulan_dibayar']);
    }

    return PaymentResult(
      id: json['id']?.toString() ?? '',
      jumlahBayar: json['jumlah_bayar'] ?? 0,
      tanggalBayar: DateTime.parse(json['tanggal_bayar']),
      metodeBayar: json['metode_bayar'] ?? 'tunai',
      customerNama: json['customer_nama'] ?? '',
      bulanDibayar: parsedBulan,
      isPartial: json['is_partial'] ?? false,
    );
  }
}

class ArrearsReportResponse {
  final ArrearsSummary summary;
  final List<CustomerArrear> customers;

  ArrearsReportResponse({required this.summary, required this.customers});

  factory ArrearsReportResponse.fromJson(Map<String, dynamic> json) {
    return ArrearsReportResponse(
      summary: ArrearsSummary.fromJson(json['summary'] ?? {}),
      customers: (json['customers'] as List?)
              ?.map((e) => CustomerArrear.fromJson(e))
              .toList() ??
          [],
    );
  }
}

class ArrearsSummary {
  final num totalArrears;
  final int totalCustomers;

  ArrearsSummary({required this.totalArrears, required this.totalCustomers});

  factory ArrearsSummary.fromJson(Map<String, dynamic> json) {
    return ArrearsSummary(
      totalArrears: json['totalArrears'] ?? 0,
      totalCustomers: json['totalCustomers'] ?? 0,
    );
  }
}

class CustomerArrear {
  final Customer customer;
  final ArrearsDetail arrears;

  CustomerArrear({required this.customer, required this.arrears});

  factory CustomerArrear.fromJson(Map<String, dynamic> json) {
    return CustomerArrear(
      customer: Customer.fromJson(json['customer'] ?? {}),
      arrears: ArrearsDetail.fromJson(json['arrears'] ?? {}),
    );
  }
}
