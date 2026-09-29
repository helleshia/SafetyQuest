import 'dart:convert';
import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:safetyquest_mobile/core/api/quest_api.dart';
import 'package:safetyquest_mobile/core/theme/quest_theme.dart';
import 'package:safetyquest_mobile/features/auth/auth_screen.dart';
import 'package:safetyquest_mobile/features/home/home_shell.dart';
import 'package:safetyquest_mobile/features/lessons/scene_view.dart';
import 'package:safetyquest_mobile/features/onboarding/onboarding_screen.dart';

class FakeApi extends QuestApi {
  final calls = <String>[];
  bool registered = false;
  bool unknown = false;
  bool empty = false;
  Map<String, dynamic>? attempt;
  @override
  Future<void> saveToken(String value) async {
    token = value;
  }

  @override
  Future<Map<String, dynamic>> request(
    String route, {
    Map<String, dynamic>? data,
  }) async {
    calls.add(route);
    return switch (route) {
      'lookup' =>
        unknown
            ? throw const ApiException('Student ID not found.', 404)
            : {'registered': registered},
      'register' => {'token': 'test-token', 'notification': 'accepted'},
      'login' => {'token': 'test-token'},
      'attempt' => () {
        attempt = data;
        return {'ok': true, 'attemptsLeft': 1};
      }(),
      'state' =>
        jsonDecode(
              empty
                  ? '''{"student":{"studentId":"SQ-001","name":"Maya Santos","section":"Grade 5 · Kindness","completed":0,"score":0,"passMark":70},"lessons":[],"leaderboard":{"scope":"Your classroom","entries":[]},"parentContact":{"kind":"email","value":"parent@example.com"},"notification":"accepted"}'''
                  : '''{"student":{"studentId":"SQ-001","name":"Maya Santos","section":"Grade 5 · Kindness","completed":2,"score":88,"passMark":70},"lessons":[{"id":1,"name":"Understanding Emergencies & Disaster Preparedness","domain":"Disaster preparedness","pages":7,"completed":true,"practice":true,"attemptsLeft":2},{"id":2,"name":"Earthquake safety","domain":"Disaster preparedness","pages":4,"completed":true,"practice":false,"attemptsLeft":0},{"id":9,"name":"Basic first aid","domain":"Personal safety","pages":3,"completed":false,"practice":false,"attemptsLeft":0}],"leaderboard":{"scope":"Your classroom","entries":[{"label":"Explorer 02","isYou":false,"completed":3,"score":94,"rank":1},{"label":"You","isYou":true,"completed":2,"score":88,"rank":2},{"label":"Explorer 04","isYou":false,"completed":2,"score":81,"rank":3},{"label":"Explorer 01","isYou":false,"completed":1,"score":72,"rank":4}]},"parentContact":{"kind":"email","value":"parent@example.com"},"notification":"accepted"}''',
            )
            as Map<String, dynamic>,
      _ => {},
    };
  }
}

Future<void> tapVisible(WidgetTester tester, Finder finder) async {
  await tester.ensureVisible(finder);
  await tester.pump();
  await tester.tap(finder);
  await tester.pumpAndSettle();
}

/// Taps without waiting to settle: a running simulation timer never settles,
/// and waiting for it would let the emergency time out.
Future<void> tapNow(WidgetTester tester, Finder finder) async {
  await tester.ensureVisible(finder);
  await tester.pump();
  await tester.tap(finder);
  await tester.pump();
  await tester.pump(const Duration(milliseconds: 450));
}

/// The tappable ring around a scene prop, for hotspot steps.
Finder hotspot(String art) => find
    .ancestor(
      of: find.byWidgetPredicate((w) => w is PropArt && w.art == art),
      matching: find.byType(GestureDetector),
    )
    .first;

/// The app with looping animations switched off, as the reduce-motion setting
/// does on a phone, so tests can wait for the screen to settle.
Widget testApp(Widget home, {GlobalKey? key, double textScale = 1}) =>
    MaterialApp(
      theme: questTheme(),
      builder: (context, child) => RepaintBoundary(
        key: key,
        child: MediaQuery(
          data: MediaQuery.of(context).copyWith(
            disableAnimations: true,
            textScaler: TextScaler.linear(textScale),
          ),
          child: child!,
        ),
      ),
      home: home,
    );

void phoneSize(WidgetTester tester, {double width = 390, double height = 844}) {
  tester.view.physicalSize = Size(width, height);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
}

/// Saves a screenshot to build/previews when run with
/// `--dart-define=PREVIEWS=true`. Off by default: it renders on the real clock,
/// where the test's stand-in fonts and network rules can fail the test.
Future<void> capture(WidgetTester tester, GlobalKey key, String name) async {
  if (!const bool.fromEnvironment('PREVIEWS')) return;
  final boundary =
      key.currentContext!.findRenderObject()! as RenderRepaintBoundary;
  // Rendering to an image finishes on the real clock, so it runs outside the
  // test's fake time; inside it, the test can hang on teardown.
  await tester.runAsync(() async {
    final image = await boundary.toImage(pixelRatio: 2);
    final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
    image.dispose();
    await Directory('build/previews').create(recursive: true);
    await File(
      'build/previews/$name.png',
    ).writeAsBytes(bytes!.buffer.asUint8List());
  });
}

void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));

  testWidgets('three onboarding pages advance and finish on a small phone', (
    tester,
  ) async {
    phoneSize(tester, width: 320, height: 568);
    var done = false;
    await tester.pumpWidget(
      MaterialApp(
        theme: questTheme(),
        home: OnboardingScreen(
          animate: false,
          onDone: () {
            done = true;
          },
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Learn & Be Ready'), findsOneWidget);
    await tapVisible(tester, find.text('Next adventure'));
    expect(find.text('Think & Choose'), findsOneWidget);
    await tapVisible(tester, find.text('Next adventure'));
    expect(find.text('Level Up'), findsOneWidget);
    await tapVisible(tester, find.text('Let’s get started'));
    expect(done, isTrue);
    expect(tester.takeException(), isNull);
  });

  testWidgets('unknown student cannot proceed to password setup', (
    tester,
  ) async {
    phoneSize(tester);
    final api = FakeApi()..unknown = true;
    addTearDown(api.dispose);
    await tester.pumpWidget(testApp(AuthScreen(api: api, onSignedIn: () {})));
    await tester.enterText(find.byType(TextFormField), 'MISSING');
    await tapVisible(tester, find.text('Find my account'));
    expect(find.text('Student ID not found.'), findsOneWidget);
    expect(api.calls, ['lookup']);
  });

  testWidgets(
    'registration requires matching passwords and a parent email, with no code',
    (tester) async {
      phoneSize(tester);
      final api = FakeApi();
      addTearDown(api.dispose);
      var done = false;
      await tester.pumpWidget(
        testApp(
          AuthScreen(
            api: api,
            onSignedIn: () {
              done = true;
            },
          ),
        ),
      );
      await tester.enterText(find.byType(TextFormField), 'SQ-001');
      await tapVisible(tester, find.text('Find my account'));
      await tester.enterText(
        find.byType(TextFormField).at(0),
        'my safe password',
      );
      await tester.enterText(
        find.byType(TextFormField).at(1),
        'different password',
      );
      await tapVisible(tester, find.text('Continue'));
      expect(find.text('Passwords do not match.'), findsOneWidget);
      await tester.enterText(
        find.byType(TextFormField).at(1),
        'my safe password',
      );
      await tapVisible(tester, find.text('Continue'));
      await tapVisible(tester, find.text('Finish setup'));
      expect(find.text('Enter a valid email address.'), findsOneWidget);
      await tester.enterText(find.byType(TextFormField), 'parent@example.com');
      await tapVisible(tester, find.byType(CheckboxListTile));
      await tapVisible(tester, find.text('Finish setup'));
      expect(api.calls, ['lookup', 'register']);
      expect(api.token, 'test-token');
      expect(done, isFalse);
      await tapVisible(tester, find.text('Explore my home'));
      expect(done, isTrue);
    },
  );

  testWidgets('existing student signs in without creating a password', (
    tester,
  ) async {
    phoneSize(tester);
    final api = FakeApi()..registered = true;
    addTearDown(api.dispose);
    var done = false;
    await tester.pumpWidget(
      testApp(
        AuthScreen(
          api: api,
          onSignedIn: () {
            done = true;
          },
        ),
      ),
    );
    await tester.enterText(find.byType(TextFormField), 'SQ-001');
    await tapVisible(tester, find.text('Find my account'));
    expect(find.text('Welcome back,\nexplorer.'), findsOneWidget);
    await tester.enterText(find.byType(TextFormField), 'my safe password');
    await tapVisible(tester, find.text('Let’s go'));
    expect(done, isTrue);
    expect(api.calls, ['lookup', 'login']);
  });

  testWidgets('all four tabs work and render preview images', (tester) async {
    phoneSize(tester);
    final api = FakeApi();
    addTearDown(api.dispose);
    final key = GlobalKey();
    await tester.pumpWidget(
      testApp(
        HomeShell(api: api, onSignedOut: () async {}),
        key: key,
      ),
    );
    await tester.pumpAndSettle();
    expect(find.textContaining('safety quest'), findsWidgets);
    await capture(tester, key, 'home');
    await tapVisible(tester, find.text('Lessons'));
    expect(find.text('Earthquake safety'), findsOneWidget);
    await capture(tester, key, 'lesson');
    await tester.scrollUntilVisible(find.text('Basic first aid'), 200);
    await tapVisible(tester, find.text('Basic first aid'));
    expect(find.textContaining('future app update'), findsOneWidget);
    await tapVisible(tester, find.text('Got it'));
    await tapVisible(tester, find.text('Board'));
    expect(find.text('YOUR PLACE'), findsOneWidget);
    expect(find.textContaining('2nd place', findRichText: true), findsOneWidget);
    expect(find.text('TOP 3 QUESTERS'), findsOneWidget);
    // Ranks 1–3 stand on the podium; everyone after is on the full board.
    expect(find.text('You'), findsOneWidget);
    expect(find.text('Explorer 02'), findsOneWidget);
    expect(find.text('FULL BOARD'), findsOneWidget);
    expect(find.text('Explorer 01'), findsOneWidget);
    // 94% and 88% both earn 3 stars, so the average decides the order.
    expect(find.textContaining('Level on stars with #1'), findsOneWidget);
    await capture(tester, key, 'leaderboard');
    await tapVisible(tester, find.text('Profile'));
    expect(find.text('Maya Santos'), findsOneWidget);
    await capture(tester, key, 'profile');
    expect(tester.takeException(), isNull);
  });

  testWidgets('empty states fit small phones with larger text', (tester) async {
    phoneSize(tester, width: 320, height: 568);
    final api = FakeApi()..empty = true;
    addTearDown(api.dispose);
    await tester.pumpWidget(
      testApp(HomeShell(api: api, onSignedOut: () async {}), textScale: 1.3),
    );
    await tester.pumpAndSettle();
    for (final tab in ['Lessons', 'Board', 'News', 'Profile', 'Home']) {
      await tapVisible(tester, find.text(tab));
      expect(tester.takeException(), isNull);
    }
  });

  testWidgets('Module 1 runs story, quiz and simulation, then submits', (
    tester,
  ) async {
    phoneSize(tester);
    final api = FakeApi();
    addTearDown(api.dispose);
    final key = GlobalKey();
    await tester.pumpWidget(
      testApp(
        HomeShell(api: api, onSignedOut: () async {}),
        key: key,
      ),
    );
    await tester.pumpAndSettle();
    await tapVisible(tester, find.text('Start quest'));
    expect(find.text('Start the story'), findsOneWidget);
    await capture(tester, key, 'lesson-intro');

    // Phase 1: seven story pages.
    await tapVisible(tester, find.text('Start the story'));
    expect(find.text('What is an emergency?'), findsOneWidget);
    for (var i = 0; i < 6; i++) {
      if (i == 3) await capture(tester, key, 'lesson-story');
      await tapVisible(tester, find.text('Next'));
    }
    expect(find.text('Call 911 for help'), findsOneWidget);
    await tapVisible(tester, find.text('Start the quiz'));

    // Phase 1: picture quiz, answering one wrong to see the feedback.
    await tapVisible(tester, find.text('It is lunch time'));
    expect(find.text('Good try!'), findsOneWidget);
    await capture(tester, key, 'lesson-quiz');
    await tapVisible(tester, find.text('Next question'));
    for (final answer in [
      'A typhoon',
      'PAGASA',
      'Stay calm and tell an adult',
    ]) {
      await tapVisible(tester, find.text(answer));
      await tapVisible(tester, find.text('Next question'));
    }
    await tapVisible(tester, find.text('911'));
    await tapVisible(tester, find.text('See my score'));
    expect(find.text('80%'), findsOneWidget);

    // Phase 2: timed simulation.
    await tapNow(tester, find.text('Start the simulation'));
    expect(
      find.text('Oh no! Your classmate slipped and hurt their head!'),
      findsOneWidget,
    );
    await capture(tester, key, 'lesson-simulation');
    await tapNow(tester, find.text('Tell the teacher right away'));
    await tapNow(tester, find.text('Next emergency'));

    // Hotspot: tap the trusted adult.
    await tapNow(tester, hotspot('🧑‍🏫'));
    expect(find.textContaining('Safe!'), findsOneWidget);
    await tapNow(tester, find.text('Next emergency'));

    // Sequence: Know, Plan, Pack.
    for (final step in ['Know', 'Plan', 'Pack']) {
      await tapNow(tester, find.text(step));
    }
    expect(find.textContaining('Safe!'), findsOneWidget);
    await tapNow(tester, find.text('Next emergency'));

    await tapNow(tester, find.text('Stop and listen to your teacher'));
    await tapNow(tester, find.text('Next emergency'));

    // Hotspot: the Go Bag item.
    await tapNow(tester, hotspot('🔦'));
    expect(find.textContaining('Safe!'), findsOneWidget);
    await tapNow(tester, find.text('Next emergency'));

    await tapNow(tester, find.text('What happened and where you are'));
    await tapVisible(tester, find.text('See my results'));

    expect(find.text('You stayed safe!'), findsOneWidget);
    expect(find.text('Ready Explorer'), findsOneWidget);
    expect(api.attempt?['moduleId'], 1);
    expect(api.attempt?['quiz'], 80);
    expect(api.attempt?['practical'], 100);
    expect(api.attempt?['quality'], 'Complete');
    await capture(tester, key, 'lesson-results');
    await tapVisible(tester, find.text('Back to my quests'));
    // Back home, the quest now shows as started.
    expect(find.text('Continue quest'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('onboarding visual preview', (tester) async {
    phoneSize(tester);
    final key = GlobalKey();
    await tester.pumpWidget(
      MaterialApp(
        theme: questTheme(),
        home: RepaintBoundary(
          key: key,
          child: OnboardingScreen(onDone: () {}, animate: false),
        ),
      ),
    );
    await tester.pumpAndSettle();
    await capture(tester, key, 'onboarding');
    expect(tester.takeException(), isNull);
  });
}
