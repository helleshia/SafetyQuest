// The school server address: API_BASE_URL from backend/.env, the project's only
// .env. Read here on every build so plain `flutter run`/`flutter build apk` pick it
// up. Only this one public value enters the app; the file's secrets never do.
val apiBaseUrl: String = rootProject.file("../../backend/.env").let { env ->
    if (!env.exists()) return@let ""
    env.readLines()
        .map { it.trim() }
        .filter { it.startsWith("API_BASE_URL=") }
        .lastOrNull()
        ?.substringAfter("=")
        ?.trim()
        ?.removeSurrounding("\"")
        ?.removeSurrounding("'")
        ?: ""
}

plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "ph.safetyquest.safetyquest_mobile"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "ph.safetyquest.safetyquest_mobile"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
        resValue("string", "api_base_url", apiBaseUrl.replace("&", "&amp;").replace("<", "&lt;"))
    }

    buildTypes {
        release {
            // TODO: Add your own signing config for the release build.
            // Signing with the debug keys for now, so `flutter run --release` works.
            signingConfig = signingConfigs.getByName("debug")
        }
    }
}

flutter {
    source = "../.."
}
