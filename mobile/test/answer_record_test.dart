import 'package:flutter_test/flutter_test.dart';
import 'package:safetyquest_mobile/features/lessons/answer_record.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_models.dart';
import 'package:safetyquest_mobile/features/lessons/modules/fire_safety.dart';
import 'package:safetyquest_mobile/features/lessons/simulation_view.dart';

/// The teacher console shows these records as they are, so they must carry
/// the lesson's own questions and the learner's real choice.
void main() {
  test('a Check answer carries the real question, options and pick', () {
    final question = fireSafety.quiz.firstWhere((q) => q.interaction == null);
    final wrong = question.choices.indexWhere((c) => !c.correct);
    final record = choiceRecord(question, wrong);
    expect(record['prompt'], question.prompt);
    expect(record['choices'], [for (final c in question.choices) c.label]);
    expect(record['chosen'], wrong);
    expect(record['answer'], question.choices.indexWhere((c) => c.correct));
    expect(record['chose'], question.choices[wrong].label);
    expect(record['correct'], isFalse);
    expect(record['explain'], question.explain);
  });

  test('a hazard hunt records which hazards were found and which were missed', () {
    final step = fireSafety.simulation.firstWhere(
      (s) => s.kind == SimKind.findHazards,
    );
    final first = step.effectiveHazardIds.first;
    final record = stepRecord(
      step,
      SimResult(
        safe: false,
        seconds: 4.26,
        kind: step.kind,
        actions: ['tap:$first'],
      ),
    );
    expect(record['prompt'], step.prompt);
    expect(record['correct'], isFalse);
    expect(record['seconds'], 4.3);
    expect(record['chose'], startsWith('Found: '));
    expect(
      (record['expected'] as String).split(', ').length,
      step.effectiveHazardIds.length,
    );
  });

  test('a choice step records the option picked in words', () {
    final step = fireSafety.simulation.firstWhere(
      (s) =>
          (s.kind == SimKind.chooseAction || s.kind == SimKind.sceneDecision) &&
          s.choices.isNotEmpty,
    );
    final right = step.choices.indexWhere((c) => c.correct);
    final record = stepRecord(
      step,
      SimResult(
        safe: true,
        seconds: 2,
        kind: step.kind,
        actions: ['choice:${step.choices[right].label}'],
        choiceIndex: right,
      ),
    );
    expect(record['chose'], step.choices[right].label);
    expect(record['chosen'], right);
    expect(record['correct'], isTrue);
  });
}
