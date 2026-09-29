import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_catalog.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_models.dart';
import 'package:safetyquest_mobile/features/lessons/modules/fire_safety.dart';

void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));

  test('Fire Safety resolves without claiming the separate evacuation module', () {
    expect(contentFor('Fire Safety'), same(fireSafety));
    expect(contentFor('Module 3: FIRE SAFETY'), same(fireSafety));
    expect(contentFor('anything', key: 'fire-safety'), same(fireSafety));
    expect(contentFor('Basic First Aid', key: 'first-aid'), isNotNull);
    expect(fireSafety.matches('Earthquake and Fire Evacuation Drills'), isFalse);
    expect(fireSafety.matches('Evacuation Drills'), isFalse);
  });

  test('Fire Safety simulation uses scene-first kinds and invisible hotspots', () {
    expect(fireSafety.quiz.length, 7);
    expect(fireSafety.simulation.length, 6);

    final hazards = fireSafety.simulation.firstWhere(
      (s) => s.kind == SimKind.findHazards,
    );
    expect(hazards.hotspots, isNotEmpty);
    expect(hazards.hotspots.any((h) => h.correct), isTrue);
    // No floating prop stickers on the hazard scene.
    expect(hazards.scene.props, isEmpty);

    expect(
      fireSafety.simulation.any((s) => s.kind == SimKind.tapSafeArea),
      isTrue,
    );
    expect(
      fireSafety.simulation.any((s) => s.kind == SimKind.safetySequence),
      isTrue,
    );
    // Matching / drag-drop removed from the experience.
    expect(
      fireSafety.simulation.every(
        (s) =>
            s.kind != SimKind.findHazards ||
            s.hotspots.every((h) => h.label == null || h.label!.isNotEmpty),
      ),
      isTrue,
    );
  });
}
