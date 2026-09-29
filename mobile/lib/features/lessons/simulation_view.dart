import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:safetyquest_mobile/core/theme/quest_theme.dart';
import 'package:safetyquest_mobile/features/lessons/interactive_scene.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_catalog.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_models.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_widgets.dart';

/// One finished interactive step — scoring, sync, teacher review.
class SimResult {
  const SimResult({
    required this.safe,
    required this.seconds,
    required this.kind,
    required this.actions,
    this.points = 0,
    this.choiceIndex,
    this.selectedId,
  });

  final bool safe;
  final double seconds;
  final SimKind kind;
  final List<String> actions;
  final int points;
  final int? choiceIndex;
  final String? selectedId;

  Map<String, dynamic> toJson() => {
    'safe': safe,
    'seconds': seconds,
    'kind': kind.name,
    'actions': actions,
    'points': points,
    if (choiceIndex != null) 'choiceIndex': choiceIndex,
    if (selectedId != null) 'selectedId': selectedId,
  };
}

/// Scene-first interactive practice / questionnaire engine.
class SimulationView extends StatefulWidget {
  const SimulationView({
    super.key,
    required this.steps,
    required this.onStep,
    required this.onDone,
    this.eyebrowPrefix = 'Activity',
  });

  final List<SimStep> steps;
  final ValueChanged<SimResult> onStep;
  final VoidCallback onDone;
  final String eyebrowPrefix;

  @override
  State<SimulationView> createState() => _SimulationViewState();
}

enum _Outcome { safe, unsafe, timeout }

class _SimulationViewState extends State<SimulationView>
    with SingleTickerProviderStateMixin {
  int index = 0;

  late final Ticker ticker = createTicker(tick);
  double now = 0;
  double left = 0;
  double? firstAction;
  _Outcome? outcome;

  int? pickedChoice;
  List<int> order = [];
  final List<int> tapped = [];
  int? wrongTap;
  bool sequenceMistake = false;
  bool holding = false;
  double held = 0;

  final List<String> actionLog = [];
  final Set<String> foundIds = {};
  String? missId;
  Timer? _missClear;

  SimStep get step => widget.steps[index];

  bool get _isSceneTap =>
      step.kind == SimKind.findHazards ||
      step.kind == SimKind.findObject ||
      step.kind == SimKind.tapSafeArea;

  bool get _isTextChoice =>
      step.kind == SimKind.chooseAction || step.kind == SimKind.sceneDecision;

  List<SceneHotspot> get _hotspots {
    if (step.hotspots.isNotEmpty) return step.hotspots;
    return [
      for (final p in step.scene.props)
        if (p.id != null)
          SceneHotspot(
            id: p.id!,
            x: ((p.x + 1) / 2) - 0.07,
            y: ((p.y + 1) / 2) - 0.08,
            width: 0.14,
            height: 0.16,
            correct: step.kind == SimKind.findHazards
                ? step.effectiveHazardIds.contains(p.id)
                : p.id == step.answer,
            label: p.label,
            art: p.isHitbox ? null : p.art,
          ),
    ];
  }

  @override
  void initState() {
    super.initState();
    begin();
  }

  @override
  void dispose() {
    _missClear?.cancel();
    ticker.dispose();
    Narrator.stop();
    super.dispose();
  }

  void begin() {
    order = List.generate(step.choices.length, (i) => i)..shuffle();
    if (order.length > 1 &&
        List.generate(order.length, (i) => i).every((i) => order[i] == i)) {
      order = [...order.skip(1), order.first];
    }
    tapped.clear();
    wrongTap = null;
    sequenceMistake = false;
    pickedChoice = null;
    holding = false;
    held = 0;
    firstAction = null;
    outcome = null;
    actionLog.clear();
    foundIds.clear();
    missId = null;
    _missClear?.cancel();
    left = step.seconds.toDouble();
    HapticFeedback.mediumImpact();
    now = 0;
    ticker
      ..stop()
      ..start();
  }

  void tick(Duration elapsed) {
    if (outcome != null || !mounted) return;
    now = elapsed.inMicroseconds / 1e6;
    setState(() {
      if (step.kind == SimKind.hold && holding) {
        held = now - firstAction!;
        if (held >= step.holdSeconds) finish(_Outcome.safe);
        return;
      }
      left = (step.seconds - now).clamp(0, step.seconds.toDouble());
      if (left <= 0) finish(_Outcome.timeout);
    });
  }

  void act([String? detail]) {
    firstAction ??= now;
    if (detail != null) actionLog.add(detail);
  }

  void finish(_Outcome result, {int? choiceIndex, String? selectedId}) {
    if (outcome != null) return;
    ticker.stop();
    act();
    outcome = result;
    result == _Outcome.safe
        ? HapticFeedback.lightImpact()
        : HapticFeedback.vibrate();
    widget.onStep(
      SimResult(
        safe: result == _Outcome.safe,
        seconds: result == _Outcome.timeout
            ? step.seconds.toDouble()
            : (firstAction ?? step.seconds.toDouble()),
        kind: step.kind,
        actions: List.unmodifiable(actionLog),
        points: result == _Outcome.safe ? step.points : 0,
        choiceIndex: choiceIndex,
        selectedId: selectedId,
      ),
    );
    setState(() {});
  }

  void next() {
    Narrator.stop();
    if (index + 1 >= widget.steps.length) {
      widget.onDone();
      return;
    }
    setState(() {
      index++;
      begin();
    });
  }

  void pickChoice(int i) {
    if (outcome != null) return;
    setState(() {
      pickedChoice = i;
      act('choice:${step.choices[i].label}');
      finish(
        step.choices[i].correct ? _Outcome.safe : _Outcome.unsafe,
        choiceIndex: i,
      );
    });
  }

  void tapHotspot(String id) {
    if (outcome != null) return;
    final spot = _hotspots.where((h) => h.id == id).firstOrNull;
    final isCorrect =
        spot?.correct == true ||
        (step.kind == SimKind.findHazards &&
            step.effectiveHazardIds.contains(id)) ||
        ((step.kind == SimKind.findObject ||
                step.kind == SimKind.tapSafeArea) &&
            id == step.answer);

    act('tap:$id');

    if (step.kind == SimKind.findHazards) {
      if (isCorrect) {
        setState(() {
          foundIds.add(id);
          if (foundIds.length >= step.effectiveHazardIds.length) {
            finish(_Outcome.safe, selectedId: id);
          }
        });
      } else {
        _flashMiss(id);
      }
      return;
    }

    // findObject / tapSafeArea — wrong taps are soft; keep searching.
    if (isCorrect) {
      setState(() {
        foundIds.add(id);
        finish(_Outcome.safe, selectedId: id);
      });
    } else {
      _flashMiss(id);
    }
  }

  void _flashMiss(String id) {
    HapticFeedback.heavyImpact();
    setState(() => missId = id);
    _missClear?.cancel();
    _missClear = Timer(const Duration(milliseconds: 450), () {
      if (mounted) setState(() => missId = null);
    });
  }

  void tapSequence(int choice) {
    if (outcome != null || tapped.contains(choice)) return;
    act('seq:${step.choices[choice].label}');
    setState(() {
      if (choice == tapped.length) {
        tapped.add(choice);
        wrongTap = null;
        HapticFeedback.selectionClick();
        if (tapped.length == step.choices.length) {
          finish(sequenceMistake ? _Outcome.unsafe : _Outcome.safe);
        }
      } else {
        wrongTap = choice;
        sequenceMistake = true;
        HapticFeedback.heavyImpact();
      }
    });
  }

  void holdDown() {
    if (outcome != null) return;
    act('hold:start');
    setState(() => holding = true);
  }

  void holdUp() {
    if (outcome != null || !holding) return;
    if (held < step.holdSeconds) {
      finish(_Outcome.unsafe);
    }
  }

  Scene get _displayScene {
    if (outcome == _Outcome.safe && step.consequenceSafe != null) {
      return step.consequenceSafe!;
    }
    if (outcome != null &&
        outcome != _Outcome.safe &&
        step.consequenceUnsafe != null) {
      return step.consequenceUnsafe!;
    }
    return step.scene;
  }

  String get _hint => switch (step.kind) {
    SimKind.findHazards =>
      'Look carefully. Tap every hazard you find in the picture.',
    SimKind.findObject =>
      'Search the scene like a hidden-object game. Tap the right object.',
    SimKind.tapSafeArea => 'Tap the safest place in the picture.',
    SimKind.chooseAction ||
    SimKind.sceneDecision => 'Choose the safest action.',
    SimKind.safetySequence => 'Tap the next correct step.',
    SimKind.hold => 'Press and hold until it is safe.',
  };

  String get _feedbackBody {
    if (outcome == _Outcome.safe) return step.debrief;
    if (outcome == _Outcome.timeout) {
      return step.unsafeDebrief ?? 'Time is up. ${step.debrief}';
    }
    return step.unsafeDebrief ?? step.debrief;
  }

  @override
  Widget build(BuildContext context) {
    final done = outcome != null;
    final hazards = step.effectiveHazardIds;

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(12, 4, 12, 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Row(
              children: [
                Expanded(
                  child: SimulationInstruction(
                    eyebrow: 'Your mission',
                    prompt: step.prompt,
                    hint: done ? null : _hint,
                  ),
                ),
                if (!done && left > 0 && step.seconds > 0)
                  _TimerChip(left: left, total: step.seconds.toDouble()),
              ],
            ),
          ),
          if (step.kind == SimKind.findHazards && !done) ...[
            const SizedBox(height: 10),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: SimulationProgress(
                found: foundIds.length,
                total: hazards.length,
              ),
            ),
          ],
          const SizedBox(height: 10),
          if (_isSceneTap)
            InteractiveScene(
              key: ValueKey('scene-$index'),
              scene: _displayScene,
              hotspots: _hotspots,
              height: InteractiveScene.stageHeight(context),
              onTapHotspot: done ? null : tapHotspot,
              found: foundIds,
              missId: missId,
              enabled: !done,
            )
          else
            ScenarioPanel(
              key: ValueKey('scene-$index'),
              scene: _displayScene,
              height: ScenarioPanel.stageHeight(context),
              label: null,
            ),
          const SizedBox(height: 14),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (_isTextChoice)
                  TextChoiceList(
                    key: ValueKey('choices-$index'),
                    choices: [for (final i in order) step.choices[i]],
                    onPick: (display) => pickChoice(order[display]),
                    picked: pickedChoice == null
                        ? null
                        : order.indexOf(pickedChoice!),
                    showResult: done,
                  )
                else if (step.kind == SimKind.safetySequence)
                  _SequenceList(
                    key: ValueKey('seq-$index'),
                    choices: step.choices,
                    order: order,
                    tapped: tapped,
                    wrongTap: wrongTap,
                    done: done,
                    onTap: tapSequence,
                  )
                else if (step.kind == SimKind.hold)
                  _HoldControl(
                    holding: holding,
                    held: held,
                    need: step.holdSeconds.toDouble(),
                    done: done,
                    onDown: holdDown,
                    onUp: holdUp,
                  ),
                if (done) ...[
                  const SizedBox(height: 14),
                  SimulationFeedback(
                    key: ValueKey('fb-$index'),
                    good: outcome == _Outcome.safe,
                    body: _feedbackBody,
                    nextLabel: index + 1 >= widget.steps.length
                        ? 'See my results'
                        : 'Continue',
                    onNext: next,
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TimerChip extends StatelessWidget {
  const _TimerChip({required this.left, required this.total});
  final double left;
  final double total;

  @override
  Widget build(BuildContext context) {
    final urgent = left <= 3;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: urgent
            ? QuestColors.coral.withValues(alpha: .12)
            : QuestColors.ink.withValues(alpha: .05),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        '${left.ceil()}s',
        style: TextStyle(
          fontWeight: FontWeight.w800,
          fontSize: 13,
          color: urgent ? QuestColors.coral : QuestColors.muted,
        ),
      ),
    );
  }
}

class _SequenceList extends StatelessWidget {
  const _SequenceList({
    super.key,
    required this.choices,
    required this.order,
    required this.tapped,
    required this.wrongTap,
    required this.done,
    required this.onTap,
  });

  final List<Choice> choices;
  final List<int> order;
  final List<int> tapped;
  final int? wrongTap;
  final bool done;
  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        for (final i in order) ...[
          if (i != order.first) const SizedBox(height: 8),
          Builder(
            builder: (context) {
              final doneStep = tapped.contains(i);
              final wrong = wrongTap == i;
              return Opacity(
                opacity: doneStep && done ? 1 : (doneStep ? .7 : 1),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(14),
                    onTap: done || doneStep ? null : () => onTap(i),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 14,
                      ),
                      decoration: BoxDecoration(
                        color: doneStep
                            ? const Color(0xFFE8F3EC)
                            : wrong
                            ? const Color(0xFFFDECEA)
                            : Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: doneStep
                              ? const Color(0xFF3F7D5C).withValues(alpha: .4)
                              : wrong
                              ? QuestColors.coral.withValues(alpha: .5)
                              : QuestColors.line,
                        ),
                      ),
                      child: Text(
                        choices[i].label,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: QuestColors.ink,
                        ),
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ],
      ],
    );
  }
}

class _HoldControl extends StatelessWidget {
  const _HoldControl({
    required this.holding,
    required this.held,
    required this.need,
    required this.done,
    required this.onDown,
    required this.onUp,
  });

  final bool holding;
  final double held;
  final double need;
  final bool done;
  final VoidCallback onDown;
  final VoidCallback onUp;

  @override
  Widget build(BuildContext context) {
    final t = (held / need).clamp(0.0, 1.0);
    return Center(
      child: GestureDetector(
        onTapDown: done ? null : (_) => onDown(),
        onTapUp: done ? null : (_) => onUp(),
        onTapCancel: done ? null : onUp,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 120),
          width: 140,
          height: 140,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: holding
                ? QuestColors.coral.withValues(alpha: .2)
                : Colors.white,
            border: Border.all(color: QuestColors.coral, width: 4),
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              SizedBox(
                width: 120,
                height: 120,
                child: CircularProgressIndicator(
                  value: t,
                  strokeWidth: 6,
                  color: QuestColors.coral,
                  backgroundColor: QuestColors.ink.withValues(alpha: .08),
                ),
              ),
              Text(
                holding ? 'Hold…' : 'Hold',
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 16,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
