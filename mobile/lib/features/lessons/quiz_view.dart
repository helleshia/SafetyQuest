import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:safetyquest_mobile/features/lessons/answer_record.dart';
import 'package:safetyquest_mobile/features/lessons/interactive_scene.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_catalog.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_models.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_widgets.dart';
import 'package:safetyquest_mobile/features/lessons/simulation_view.dart';

/// Phase 1 quiz: static MCQ **or** interactive mini-simulation per question.
class QuizView extends StatefulWidget {
  const QuizView({
    super.key,
    required this.questions,
    required this.onDone,
    this.scenarios = const [],
  });
  final List<QuizQuestion> questions;

  /// One scenario illustration per question (usually from story pages).
  final List<Scene> scenarios;

  /// Called with the number answered right on the first try, and a record of
  /// every answer (see answer_record.dart) for the teacher.
  final void Function(int correct, List<Map<String, dynamic>> answers) onDone;
  @override
  State<QuizView> createState() => _QuizViewState();
}

class _QuizViewState extends State<QuizView> {
  int index = 0;
  int? picked;
  int correct = 0;
  bool interactiveDone = false;
  final List<Map<String, dynamic>> answers = [];

  /// Display order for MCQ options (original indices). Reshuffled each question.
  List<int> order = [];

  QuizQuestion get question => widget.questions[index];

  Scene? get scenario {
    if (question.scene != null) return question.scene;
    if (index < widget.scenarios.length) return widget.scenarios[index];
    return null;
  }

  @override
  void initState() {
    super.initState();
    _shuffleChoices();
  }

  void _shuffleChoices() {
    final n = question.choices.length;
    order = List.generate(n, (i) => i)..shuffle();
    // Avoid leaving options in the authored order by chance.
    if (n > 1 && List.generate(n, (i) => i).every((i) => order[i] == i)) {
      order = [...order.skip(1), order.first];
    }
  }

  void pick(int displayIndex) {
    if (picked != null) return;
    final choice = order[displayIndex];
    final right = question.choices[choice].correct;
    right ? HapticFeedback.lightImpact() : HapticFeedback.heavyImpact();
    setState(() {
      picked = choice;
      if (right) correct++;
      answers.add(choiceRecord(question, choice));
    });
  }

  void onInteractiveStep(SimResult result) {
    if (interactiveDone) return;
    setState(() {
      interactiveDone = true;
      if (result.safe) correct++;
      answers.add(interactiveRecord(question, result));
    });
  }

  void next() {
    Narrator.stop();
    if (index + 1 >= widget.questions.length) {
      widget.onDone(correct, List.unmodifiable(answers));
      return;
    }
    setState(() {
      index++;
      picked = null;
      interactiveDone = false;
      _shuffleChoices();
    });
  }

  @override
  Widget build(BuildContext context) {
    // Interactive questionnaire item — full mini-game for this question.
    if (question.interaction != null) {
      return Column(
        children: [
          LessonProgressBar(
            total: widget.questions.length,
            current: index,
            filledThroughCurrent: interactiveDone,
          ),
          Expanded(
            child: SimulationView(
              key: ValueKey('quiz-sim-$index'),
              steps: [question.interaction!],
              eyebrowPrefix: 'Activity',
              onStep: onInteractiveStep,
              onDone: next,
            ),
          ),
        ],
      );
    }

    final answered = picked != null;
    final right = answered && question.choices[picked!].correct;
    final scene = scenario;
    final displayChoices = [for (final i in order) question.choices[i]];
    final displayPicked =
        picked == null ? null : order.indexOf(picked!);
    return Column(
      children: [
        LessonProgressBar(
          total: widget.questions.length,
          current: index,
          filledThroughCurrent: answered,
        ),
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (scene != null) ...[
                  ScenarioPanel(
                    key: ValueKey('quiz-scene-$index'),
                    scene: scene,
                    height: ScenarioPanel.stageHeight(context),
                    soft: true,
                  ),
                  const SizedBox(height: 18),
                ],
                Text(
                  question.prompt,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                    height: 1.25,
                    fontSize: 20,
                  ),
                ),
                const SizedBox(height: 10),
                ListenButton(question.prompt),
                const SizedBox(height: 16),
                TextChoiceList(
                  key: ValueKey(index),
                  choices: displayChoices,
                  onPick: pick,
                  picked: displayPicked,
                  showResult: answered,
                ),
                if (answered) ...[
                  const SizedBox(height: 14),
                  SimulationFeedback(
                    key: ValueKey('feedback-$index'),
                    good: right,
                    body: question.explain,
                    nextLabel: index + 1 >= widget.questions.length
                        ? 'Continue'
                        : 'Next',
                    onNext: next,
                  ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }
}
