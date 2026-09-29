import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:safetyquest_mobile/core/api/quest_api.dart';
import 'package:safetyquest_mobile/core/theme/quest_theme.dart';
import 'package:safetyquest_mobile/features/auth/auth_screen.dart';
import 'package:safetyquest_mobile/features/home/home_shell.dart';
import 'package:safetyquest_mobile/features/onboarding/onboarding_screen.dart';
import 'package:safetyquest_mobile/features/onboarding/consent_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await QuestApi.loadConfig();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      systemNavigationBarColor: QuestColors.paper,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );
  runApp(const SafetyQuestApp());
}

class SafetyQuestApp extends StatelessWidget {
  const SafetyQuestApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'SafetyQuest',
    debugShowCheckedModeBanner: false,
    theme: questTheme(),
    home: const AppGate(),
  );
}

class AppGate extends StatefulWidget {
  const AppGate({super.key});
  @override
  State<AppGate> createState() => _AppGateState();
}

class _AppGateState extends State<AppGate> {
  final api = QuestApi();
  String stage = 'splash';
  String? error;
  @override
  void initState() {
    super.initState();
    boot();
  }

  Future<void> boot() async {
    setState(() {
      error = null;
    });
    try {
      await Future.wait<Object?>([
        api.restore(),
        Future<void>.delayed(const Duration(milliseconds: 1800)),
      ]);
      if (!mounted) return;
      setState(() {
        stage = api.token != null ? 'home' : 'consent';
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          error = 'We could not open your saved session. Please try again.';
        });
      }
    }
  }

  void finishOnboarding() {
    if (mounted) {
      setState(() {
        stage = 'auth';
      });
    }
  }

  void signedIn() => setState(() {
    stage = 'home';
  });
  Future<void> signedOut() async {
    await api.clearToken();
    if (mounted) {
      setState(() {
        stage = 'auth';
      });
    }
  }

  @override
  void dispose() {
    api.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => switch (stage) {
    'consent' => ConsentScreen(
      onAccepted: () => setState(() => stage = 'onboarding'),
    ),
    'onboarding' => OnboardingScreen(onDone: finishOnboarding),
    'auth' => AuthScreen(api: api, onSignedIn: signedIn),
    'home' => HomeShell(api: api, onSignedOut: signedOut),
    _ => Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ClayCard(
                  padding: const EdgeInsets.all(22),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: Image.asset(
                      'assets/logo.png',
                      width: 94,
                      height: 94,
                    ),
                  ),
                ),
                const SizedBox(height: 30),
                Text(
                  'SafetyQuest',
                  style: Theme.of(context).textTheme.headlineLarge,
                ),
                const SizedBox(height: 10),
                const Text(
                  'Little quests. Lifelong confidence.',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 42),
                if (error == null)
                  const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: QuestColors.coral,
                    ),
                  )
                else ...[
                  Notice(error!, error: true),
                  const SizedBox(height: 16),
                  QuestButton('Try again', onPressed: boot),
                ],
                const SizedBox(height: 48),
                const Eyebrow('Learn • Play • Be ready'),
              ],
            ),
          ),
        ),
      ),
    ),
  };
}
