package ph.safetyquest.safetyquest_mobile

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        // Hands the Dart side API_BASE_URL, baked in from backend/.env at build time.
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "safetyquest/config")
            .setMethodCallHandler { call, result ->
                if (call.method == "apiBaseUrl") {
                    result.success(getString(R.string.api_base_url))
                } else {
                    result.notImplemented()
                }
            }
    }
}
