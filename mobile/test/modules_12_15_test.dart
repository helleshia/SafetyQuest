import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_catalog.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_models.dart';
import 'package:safetyquest_mobile/features/lessons/modules/bullying.dart';
import 'package:safetyquest_mobile/features/lessons/modules/first_aid.dart';
import 'package:safetyquest_mobile/features/lessons/modules/household_electricity.dart';
import 'package:safetyquest_mobile/features/lessons/modules/water_safety.dart';

void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));

  test('Modules 12–15 resolve by name and curriculum key', () {
    expect(contentFor('Basic First Aid', key: 'first-aid'), same(firstAid));
    expect(contentFor('Bullying Awareness', key: 'bullying'), same(bullying));
    expect(contentFor('Water Safety', key: 'water-safety'), same(waterSafety));
    expect(
      contentFor('Poison, Household & Electricity Safety',
          key: 'household-electricity'),
      same(householdElectricity),
    );
    expect(bullying.matches('Cyberbullying & Online Safety'), isFalse);
  });

  test('Modules 12–15 ship Learn + Check + Practice packs', () {
    for (final lesson in [
      firstAid,
      bullying,
      waterSafety,
      householdElectricity,
    ]) {
      expect(lesson.story.length, 7);
      expect(lesson.quiz.length, 7);
      expect(lesson.simulation.length, 6);
      expect(lessonCatalog.any((c) => c.key == lesson.key), isTrue);
    }
  });

  test('Module 15 hazard hunt uses invisible hotspots over the scene', () {
    final hunt = householdElectricity.simulation.firstWhere(
      (s) => s.kind == SimKind.findHazards,
    );
    expect(hunt.hotspots.where((h) => h.correct).length, greaterThanOrEqualTo(5));
    expect(hunt.scene.props, isEmpty);
    expect(hunt.scene.image, isNotNull);
  });

  test('Module 14 pool detective uses findHazards', () {
    expect(
      waterSafety.simulation.any((s) => s.kind == SimKind.findHazards),
      isTrue,
    );
  });

  test('Module 12 practice centers Check-Call-Care scenarios', () {
    expect(
      firstAid.simulation.any((s) => s.kind == SimKind.safetySequence),
      isTrue,
    );
    expect(
      firstAid.simulation.where((s) => s.kind == SimKind.sceneDecision).length,
      greaterThanOrEqualTo(3),
    );
  });
}
