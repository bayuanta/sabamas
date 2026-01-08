import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:mobile_admin/services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  final _storage = const FlutterSecureStorage();

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  String? _token;
  bool get isAuthenticated => _token != null;
  
  UserData? _currentUser;
  UserData? get currentUser => _currentUser;

  bool _isInitialized = false;
  bool get isInitialized => _isInitialized;

  AuthProvider() {
    _loadToken();
  }

  Future<void> _loadToken() async {
    try {
      _token = await _storage.read(key: 'jwt_token');
      // Verify token validity here if needed, or rely on API 401 later
    } catch (e) {
      // Handle storage read error
      _token = null;
    } finally {
      _isInitialized = true;
      notifyListeners();
    }
  }

  Future<bool> login(String username, String password, {bool rememberMe = true}) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.login(username, password);
      
      if (response != null) {
        _token = response.accessToken;
        _currentUser = response.user;
        
        if (rememberMe) {
          await _storage.write(key: 'jwt_token', value: _token);
        } else {
          await _storage.delete(key: 'jwt_token');
        }

        _isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      print('Login Error: $e');
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<void> logout() async {
    _token = null;
    _currentUser = null;
    await _storage.delete(key: 'jwt_token');
    notifyListeners();
  }
}
