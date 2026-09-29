import 'package:safetyquest_mobile/features/lessons/lesson_models.dart';
import 'package:safetyquest_mobile/features/lessons/simulation_view.dart';

/* What the learner actually answered, written from the lesson they played.

   Each record carries the question's own text, so the teacher console shows
   the real lesson content and the real choice, never a reconstruction:
   - prompt:   the question or step, as the learner saw it
   - choices:  every option, for multiple-choice items (empty otherwise)
   - answer:   index of the right option in [choices], if any
   - chosen:   index the learner picked in [choices], if any
   - chose:    what the learner did, in words
   - expected: what the lesson wanted, in words
   - correct:  whether it counted as right / safe
   - seconds:  time to the first action, for simulation steps
   - explain:  the lesson's own explanation */

String _labelOf(SimStep step, String id) {
  for (final spot in step.hotspots) {
    if (spot.id == id && (spot.label?.trim().isNotEmpty ?? false)) {
      return spot.label!.trim();
    }
  }
  for (final prop in step.scene.props) {
    if (prop.id == id && (prop.label?.trim().isNotEmpty ?? false)) {
      return prop.label!.trim();
    }
  }
  final words = id.replaceAll(RegExp(r'[-_]+'), ' ').trim();
  return words.isEmpty
      ? id
      : '${words[0].toUpperCase()}${words.substring(1)}';
}

List<String> _tapped(SimResult result, String prefix) => [
  for (final action in result.actions)
    if (action.startsWith(prefix)) action.substring(prefix.length),
];

int? _firstCorrect(List<Choice> choices) {
  final i = choices.indexWhere((c) => c.correct);
  return i < 0 ? null : i;
}

/// What a step wants done, in words, from the lesson itself.
String expectedFor(SimStep step) => switch (step.kind) {
  SimKind.chooseAction || SimKind.sceneDecision => [
    for (final c in step.choices)
      if (c.correct) c.label,
  ].join(' / '),
  SimKind.safetySequence => [for (final c in step.choices) c.label].join(' → '),
  SimKind.findHazards => step.effectiveHazardIds
      .map((id) => _labelOf(step, id))
      .join(', '),
  SimKind.findObject ||
  SimKind.tapSafeArea => step.answer == null ? '' : _labelOf(step, step.answer!),
  SimKind.hold => 'Hold for ${step.holdSeconds} seconds',
};

/// One simulation step (or an interactive Check item) and what was done in it.
Map<String, dynamic> stepRecord(SimStep step, SimResult result) {
  final timedOut = !result.safe && result.actions.isEmpty;
  final labels = [for (final c in step.choices) c.label];
  final expected = expectedFor(step);
  String chose;
  switch (step.kind) {
    case SimKind.chooseAction || SimKind.sceneDecision:
      chose = result.choiceIndex != null
          ? labels[result.choiceIndex!]
          : 'No answer before time ran out';
    case SimKind.safetySequence:
      final order = _tapped(result, 'seq:');
      chose = order.isEmpty ? 'No steps tapped' : order.join(' → ');
    case SimKind.findHazards:
      final found = {
        for (final id in _tapped(result, 'tap:'))
          if (step.effectiveHazardIds.contains(id)) id,
      };
      final wrong = {
        for (final id in _tapped(result, 'tap:'))
          if (!step.effectiveHazardIds.contains(id)) id,
      };
      chose = [
        found.isEmpty
            ? 'Found no hazards'
            : 'Found: ${found.map((id) => _labelOf(step, id)).join(', ')}',
        if (wrong.isNotEmpty)
          'Also tapped: ${wrong.map((id) => _labelOf(step, id)).join(', ')}',
      ].join(' · ');
    case SimKind.findObject || SimKind.tapSafeArea:
      final taps = _tapped(result, 'tap:');
      chose = result.selectedId != null
          ? _labelOf(step, result.selectedId!)
          : taps.isEmpty
          ? 'Tapped nothing'
          : 'Tapped: ${taps.map((id) => _labelOf(step, id)).join(', ')}';
    case SimKind.hold:
      chose = result.safe
          ? 'Held on until it was safe'
          : result.actions.isEmpty
          ? 'Did not hold'
          : 'Let go too early';
  }
  if (timedOut && step.kind != SimKind.hold) {
    chose = 'No answer before time ran out';
  }
  return {
    'prompt': step.prompt,
    'kind': step.kind.name,
    'choices': labels,
    'answer': ?_firstCorrect(step.choices),
    'chosen': ?result.choiceIndex,
    'chose': chose,
    'expected': expected,
    'correct': result.safe,
    'seconds': double.parse(result.seconds.toStringAsFixed(1)),
    'explain': result.safe ? step.debrief : (step.unsafeDebrief ?? step.debrief),
  };
}

/// One multiple-choice Check question and the option picked.
Map<String, dynamic> choiceRecord(QuizQuestion question, int picked) {
  final labels = [for (final c in question.choices) c.label];
  return {
    'prompt': question.prompt,
    'kind': 'choice',
    'choices': labels,
    'answer': ?_firstCorrect(question.choices),
    'chosen': picked,
    'chose': labels[picked],
    'expected': [
      for (final c in question.choices)
        if (c.correct) c.label,
    ].join(' / '),
    'correct': question.choices[picked].correct,
    'explain': question.explain,
  };
}

/// A Check question played as a mini-simulation.
Map<String, dynamic> interactiveRecord(QuizQuestion question, SimResult result) {
  final record = stepRecord(question.interaction!, result);
  return {
    ...record,
    'prompt': question.prompt.trim().isEmpty
        ? record['prompt']
        : question.prompt,
    'explain': question.explain.trim().isEmpty
        ? record['explain']
        : question.explain,
  };
}

/// A step as the lesson defines it, with no learner in it.
Map<String, dynamic> _stepQuestion(SimStep step, {String? prompt, String? explain}) => {
  'prompt': prompt ?? step.prompt,
  'kind': step.kind.name,
  'choices': [for (final c in step.choices) c.label],
  'answer': ?_firstCorrect(step.choices),
  'expected': expectedFor(step),
  'explain': explain ?? step.debrief,
};

/// Every Check question and simulation step of a lesson, exactly as the app
/// plays them. Exported to the server's database so the web consoles can show
/// a lesson's real questions (see tool/export_lesson_content_test.dart).
Map<String, dynamic> lessonQuestionBank(LessonContent lesson) => {
  'key': lesson.key,
  'title': lesson.title,
  'badge': lesson.badge,
  'quiz': [
    for (final q in lesson.quiz)
      q.interaction != null
          ? _stepQuestion(
              q.interaction!,
              prompt: q.prompt.trim().isEmpty ? null : q.prompt,
              explain: q.explain.trim().isEmpty ? null : q.explain,
            )
          : {
              'prompt': q.prompt,
              'kind': 'choice',
              'choices': [for (final c in q.choices) c.label],
              'answer': ?_firstCorrect(q.choices),
              'expected': [
                for (final c in q.choices)
                  if (c.correct) c.label,
              ].join(' / '),
              'explain': q.explain,
            },
  ],
  'steps': [for (final step in lesson.simulation) _stepQuestion(step)],
};
