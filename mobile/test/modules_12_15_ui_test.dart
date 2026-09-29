import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_catalog.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_screen.dart';
import 'package:safetyquest_mobile/features/lessons/simulation_view.dart';

import 'lesson_learn_screen_test.dart';
import 'widget_test.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
    GoogleFonts.config.allowRuntimeFetching = false;
  });

  for (final key in [
    'first-aid',
    'bullying',
    'water-safety',
    'household-electricity',
  ]) {
    testWidgets('$key learn screen opens with story moment', (tester) async {
      phoneSize(tester);
      final api = FakeApi();
      addTearDown(api.dispose);
      final content = lessonCatalog.firstWhere((c) => c.key == key);
      final boundary = GlobalKey();

      await tester.pumpWidget(
        lessonTestApp(
          LessonScreen(
            api: api,
            content: content,
            lesson: {
              'id': 12,
              'name': content.title,
              'preview': true,
              'practice': true,
              'attemptsLeft': 1,
            },
            studentId: 'SQ-001',
            passMark: 70,
          ),
          key: boundary,
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('Start Quest'), findsOneWidget);
      await tapVisible(tester, find.text('Start Quest'));
      await tester.pumpAndSettle();

      expect(find.text('PHASE 1'), findsWidgets);
      expect(find.text('Learn'), findsOneWidget);
      expect(find.text(content.story.first.title), findsOneWidget);
      expect(find.text('Listen'), findsOneWidget);
      expect(find.text('Next'), findsOneWidget);
      await capture(tester, boundary, 'm_${key.replaceAll('-', '_')}_learn');
      expect(tester.takeException(), isNull);
    });
  }

  testWidgets('household hazard practice starts interactive scene', (
    tester,
  ) async {
    phoneSize(tester);
    final api = FakeApi();
    addTearDown(api.dispose);
    final content =
        lessonCatalog.firstWhere((c) => c.key == 'household-electricity');

    await tester.pumpWidget(
      lessonTestApp(
        Scaffold(
          body: SimulationView(
            steps: content.simulation,
            onStep: (_) {},
            onDone: () {},
          ),
        ),
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));

    expect(find.textContaining('Tap every hazard'), findsWidgets);
    expect(find.byType(SimulationView), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
