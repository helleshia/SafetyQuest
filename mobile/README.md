# safetyquest_mobile

A new Flutter project.

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Learn Flutter](https://docs.flutter.dev/get-started/learn-flutter)
- [Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Flutter learning resources](https://docs.flutter.dev/reference/learning-resources)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.

## Server address

The app's school server address is `API_BASE_URL` in `backend/.env`, the
project's only .env file. The Android build (`android/app/build.gradle.kts`)
reads just that one value on every build, so a plain `flutter run`, F5 in
VS Code, or `flutter build apk` all pick it up. The rest of `backend/.env` holds
server secrets and never enters the app.

After changing the address, stop the app and run it again (hot reload does not
pick up a new value). The address ships inside the app, so it is public.
