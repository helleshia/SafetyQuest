import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:safetyquest_mobile/core/theme/quest_theme.dart';
import 'package:safetyquest_mobile/features/lessons/interactive_scene.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_models.dart';
import 'package:safetyquest_mobile/features/lessons/modules/fire_safety.dart';

void main() {
  // The "found" check pops with an overshooting curve. Every frame of it, and
  // of the miss mark, must keep opacity within 0–1 or Flutter throws.
  testWidgets('finding and missing hazards animates without errors', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    final step = fireSafety.simulation.firstWhere(
      (s) => s.kind == SimKind.findHazards,
    );
    final hit = step.hotspots.firstWhere((h) => h.correct);
    final miss = step.hotspots.firstWhere(
      (h) => !h.correct,
      orElse: () => hit,
    );

    Widget scene({Set<String> found = const {}, String? missId}) =>
        MaterialApp(
          theme: questTheme(),
          home: Scaffold(
            body: InteractiveScene(
              scene: step.scene,
              hotspots: step.hotspots,
              found: found,
              missId: missId,
              onTapHotspot: (_) {},
            ),
          ),
        );

    await tester.pumpWidget(scene());
    await tester.pumpWidget(scene(found: {hit.id}));
    for (var i = 0; i < 30; i++) {
      await tester.pump(const Duration(milliseconds: 16));
      expect(tester.takeException(), isNull);
    }
    await tester.pumpWidget(scene(found: {hit.id}, missId: miss.id));
    for (var i = 0; i < 30; i++) {
      await tester.pump(const Duration(milliseconds: 16));
      expect(tester.takeException(), isNull);
    }
  });
}
