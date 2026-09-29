import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:safetyquest_mobile/core/theme/quest_theme.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_catalog.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_models.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_screen.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_widgets.dart';

import 'widget_test.dart';

ThemeData _testTheme() {
  GoogleFonts.config.allowRuntimeFetching = false;
  // Avoid network font fetches under the test HTTP stub.
  return ThemeData(
    useMaterial3: true,
    scaffoldBackgroundColor: QuestColors.paper,
    colorScheme: ColorScheme.fromSeed(
      seedColor: QuestColors.coral,
      primary: QuestColors.ink,
      surface: QuestColors.paper,
    ),
    textTheme: const TextTheme(
      headlineLarge: TextStyle(
        fontSize: 36,
        height: 1.12,
        fontWeight: FontWeight.w800,
        color: QuestColors.ink,
      ),
      headlineMedium: TextStyle(
        fontSize: 28,
        height: 1.15,
        fontWeight: FontWeight.w800,
        color: QuestColors.ink,
      ),
      titleLarge: TextStyle(
        fontSize: 21,
        fontWeight: FontWeight.w800,
        color: QuestColors.ink,
      ),
      titleMedium: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w700,
        color: QuestColors.ink,
      ),
      bodyLarge: TextStyle(fontSize: 16, height: 1.55, color: QuestColors.muted),
      bodyMedium: TextStyle(fontSize: 14, height: 1.5, color: QuestColors.muted),
    ),
  );
}

Widget lessonTestApp(Widget home, {GlobalKey? key}) => MaterialApp(
  theme: _testTheme(),
  builder: (context, child) => RepaintBoundary(
    key: key,
    child: MediaQuery(
      data: MediaQuery.of(
        context,
      ).copyWith(disableAnimations: true, textScaler: TextScaler.noScaling),
      child: child!,
    ),
  ),
  home: home,
);

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
    GoogleFonts.config.allowRuntimeFetching = false;
  });

  testWidgets('story learning moment shows phase hierarchy and key idea', (
    tester,
  ) async {
    phoneSize(tester);
    final api = FakeApi();
    addTearDown(api.dispose);
    final content = lessonCatalog.firstWhere((c) => c.key == 'emergency-basics');
    final key = GlobalKey();

    await tester.pumpWidget(
      lessonTestApp(
        LessonScreen(
          api: api,
          content: content,
          lesson: {
            'id': 1,
            'name': content.title,
            'preview': true,
            'practice': true,
            'attemptsLeft': 1,
          },
          studentId: 'SQ-001',
          passMark: 70,
        ),
        key: key,
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Start Quest'), findsOneWidget);
    await tapVisible(tester, find.text('Start Quest'));
    await tester.pumpAndSettle();

    expect(find.text('PHASE 1'), findsWidgets);
    expect(find.text('Learn'), findsOneWidget);
    expect(find.text('What is an emergency?'), findsOneWidget);
    expect(find.text('Listen'), findsOneWidget);
    expect(find.text('KEY IDEA'), findsOneWidget);
    expect(find.text('Next'), findsOneWidget);
    expect(find.byType(LessonProgressBar), findsOneWidget);
    expect(find.byType(KeyIdea), findsOneWidget);
    expect(find.byTooltip('Previous page'), findsNothing);

    await capture(tester, key, 'lesson_story_moment');
    expect(tester.takeException(), isNull);
  });

  testWidgets('quiz check uses lightweight text choices', (tester) async {
    phoneSize(tester);
    final api = FakeApi();
    addTearDown(api.dispose);
    final content = LessonContent(
      key: 'preview-quiz',
      title: 'Quick Check',
      emoji: '🧭',
      color: const Color(0xFFD6E7EF),
      badge: 'Ready',
      badgeEmoji: '🧭',
      matches: (_) => false,
      story: const [
        StoryPage(
          title: 'Warm-up',
          text: 'A short moment.',
          tip: 'Stay calm.',
          scene: Scene(sky: [Color(0xFFFFF4E4), Color(0xFFFBE3CF)]),
        ),
      ],
      quiz: const [
        QuizQuestion(
          prompt: 'Which is a fire hazard at home or school?',
          choices: [
            Choice('', 'A clear exit'),
            Choice('', 'An escape plan on the wall'),
            Choice('', 'An overloaded electrical outlet', correct: true),
          ],
          explain: 'Overloaded outlets can overheat and start fires.',
        ),
      ],
      simulation: const [],
    );
    final key = GlobalKey();

    await tester.pumpWidget(
      lessonTestApp(
        LessonScreen(
          api: api,
          content: content,
          lesson: {
            'id': -99,
            'name': content.title,
            'preview': true,
            'practice': true,
            'attemptsLeft': 1,
          },
          studentId: 'SQ-001',
          passMark: 70,
        ),
        key: key,
      ),
    );
    await tester.pumpAndSettle();
    await tapVisible(tester, find.text('Start Quest'));
    await tester.pumpAndSettle();
    await tapVisible(tester, find.text('Start Check'));
    await tester.pumpAndSettle();

    expect(find.text('PHASE 1'), findsWidgets);
    expect(find.text('Check'), findsOneWidget);
    expect(
      find.text('Which is a fire hazard at home or school?'),
      findsOneWidget,
    );
    expect(find.text('An overloaded electrical outlet'), findsOneWidget);

    await capture(tester, key, 'lesson_quiz_check');
    expect(tester.takeException(), isNull);
  });
}
