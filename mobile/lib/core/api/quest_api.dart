import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

class ApiException implements Exception {
  const ApiException(this.message, [this.status = 0]);
  final String message;
  final int status;
  @override
  String toString() => message;
}

class QuestApi {
  QuestApi({http.Client? client, FlutterSecureStorage? storage})
    : _client = client ?? http.Client(),
      _storage = storage ?? const FlutterSecureStorage();
  final http.Client _client;
  final FlutterSecureStorage _storage;
  /// The school server, set as `API_BASE_URL` in `backend/.env` (the
  /// project's only .env). The Android build copies just that value into the
  /// app; `--dart-define=API_BASE_URL=...` still wins.
  static String baseUrl = const String.fromEnvironment('API_BASE_URL');

  /// Reads the address the Android build baked in, once at startup.
  static Future<void> loadConfig() async {
    if (baseUrl.isNotEmpty) return;
    // The web build is served by the school server itself, so it calls the same address.
    if (kIsWeb) {
      baseUrl = Uri.base.origin;
      return;
    }
    try {
      baseUrl =
          await const MethodChannel(
            'safetyquest/config',
          ).invokeMethod<String>('apiBaseUrl') ??
          '';
    } catch (_) {
      // No platform value (tests, other platforms): requests explain what to set.
    }
  }

  String? token;

  Future<void> restore() async {
    token = await _storage.read(key: 'student_session');
  }

  Future<void> saveToken(String value) async {
    await _storage.write(key: 'student_session', value: value);
    token = value;
  }

  Future<void> clearToken() async {
    await _storage.delete(key: 'student_session');
    await _storage.delete(key: 'student_password');
    token = null;
  }

  /// The password the learner chose, kept in the device's secure storage (Keystore /
  /// Keychain) so they can look it up on their profile. It is removed on sign-out.
  Future<void> savePassword(String value) =>
      _storage.write(key: 'student_password', value: value);

  Future<String?> readPassword() => _storage.read(key: 'student_password');

  Future<Map<String, dynamic>> request(
    String route, {
    Map<String, dynamic>? data,
  }) async {
    if (baseUrl.isEmpty) {
      throw const ApiException(
        'No school server address was set. Put API_BASE_URL in backend/.env, '
        'then stop and run the app again.',
      );
    }
    final base = Uri.parse(baseUrl);
    if (kReleaseMode && base.scheme != 'https') {
      throw const ApiException(
        'A secure school server address is required. Contact your school.',
      );
    }
    try {
      final uri = Uri.parse(
        '${baseUrl.replaceAll(RegExp(r'/$'), '')}/api/mobile/$route',
      );
      final headers = {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };
      final response =
          await (data == null
                  ? _client.get(uri, headers: headers)
                  : _client.post(uri, headers: headers, body: jsonEncode(data)))
              .timeout(const Duration(seconds: 20));
      final decoded = jsonDecode(response.body);
      if (decoded is! Map<String, dynamic>) throw const FormatException();
      if (response.statusCode >= 400) {
        throw ApiException(
          decoded['error'] as String? ?? 'Please try again.',
          response.statusCode,
        );
      }
      return decoded;
    } on ApiException {
      rethrow;
    } on TimeoutException {
      throw ApiException(
        'The school server took too long. Please try again.$_where',
      );
    } on FormatException {
      throw const ApiException(
        'The server returned an unexpected response. Please try again.',
      );
    } catch (_) {
      throw ApiException(
        'Cannot reach your school. Check your internet connection and try again.$_where',
      );
    }
  }

  /// In debug builds only, names the address tried, so a stale IP in
  /// backend/.env is obvious. Learners never see it in the release app.
  static String get _where =>
      kDebugMode
      ? '\n(Tried $baseUrl. Check API_BASE_URL in backend/.env.)'
      : '';

  void dispose() => _client.close();
}
