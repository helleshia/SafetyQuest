import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:safetyquest_mobile/features/badges/badge_medal.dart';
import 'package:safetyquest_mobile/core/api/quest_api.dart';
import 'package:safetyquest_mobile/core/theme/clay_icon.dart';
import 'package:safetyquest_mobile/core/theme/quest_theme.dart';
import 'package:safetyquest_mobile/features/lessons/answer_record.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_catalog.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_models.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_widgets.dart';
import 'package:safetyquest_mobile/features/lessons/quiz_view.dart';
import 'package:safetyquest_mobile/features/lessons/scene_view.dart';
import 'package:safetyquest_mobile/features/lessons/simulation_view.dart';

enum _Stage { intro, story, quiz, practiceIntro, simulation, results }

enum _QuestStepState { locked, current, done }

/// One module, start to finish: Phase 1 (story and quiz), then Phase 2
/// (practical simulation) when the teacher has unlocked it.
class LessonScreen extends StatefulWidget {
  const LessonScreen({
    super.key,
    required this.api,
    required this.content,
    required this.lesson,
    required this.studentId,
    required this.passMark,
    this.progress = const LessonProgress(),
  });
  final QuestApi api;
  final LessonContent content;

  /// The school's module record from `/api/mobile/state`.
  final Map<String, dynamic> lesson;
  final String studentId;
  final int passMark;
  final LessonProgress progress;
  @override
  State<LessonScreen> createState() => _LessonScreenState();
}

class _LessonScreenState extends State<LessonScreen> {
  _Stage stage = _Stage.intro;
  final pages = PageController(keepPage: false);
  int page = 0;
  int quizPercent = 0;
  final List<SimResult> results = [];
  late int attemptsLeft = widget.lesson['preview'] == true
      ? 1
      : (widget.lesson['attemptsLeft'] as num?)?.toInt() ?? 0;
  bool submitting = false;
  bool submitted = false;
  String? submitError;

  /// The run being sent, fixed when it ends so a resend never changes it.
  Map<String, dynamic>? run;

  @override
  void initState() {
    super.initState();
    // A run still waiting to reach the server has already used this try.
    if (!preview) {
      PendingAttempts.has(widget.studentId, moduleId).then((waiting) {
        if (waiting && mounted) setState(() => attemptsLeft = 0);
      });
    }
    quizPercent = widget.progress.quizBest > 0
        ? widget.progress.quizBest
        : (widget.lesson['quizBest'] as num?)?.toInt() ?? 0;
  }

  LessonContent get content => widget.content;
  int get moduleId => (widget.lesson['id'] as num).toInt();
  bool get practiceOpen => preview || widget.lesson['practice'] == true;

  /// A built-in lesson opened from the Lesson tab without a school assignment.
  /// Every phase plays, but nothing is sent to the teacher.
  bool get preview => widget.lesson['preview'] == true;

  /// The school's official score for this lesson (newest published attempt,
  /// teacher grade first), the same number the web consoles show. Only a
  /// preview, which never reaches the school, falls back to this phone's best.
  int get savedPractical {
    final fromLesson = (widget.lesson['practicalBest'] as num?)?.toInt();
    if (!preview && fromLesson != null) return fromLesson;
    return widget.progress.practicalBest;
  }

  int get practical => results.isEmpty
      ? savedPractical
      : (results.where((r) => r.safe).length / content.simulation.length * 100)
            .round();

  String get teacherFeedback =>
      (widget.lesson['feedback'] as String?)?.trim() ?? '';

  /// Points earned this run: quiz (10 each) + each safe simulation step's points.
  int get earnedPoints {
    if (results.isEmpty) {
      // Approximate from saved percents when reopening a finished quest.
      final quizPts =
          (quizPercent.clamp(0, 100) / 100 * content.quiz.length * 10).round();
      final simPts =
          (practical.clamp(0, 100) / 100 * content.simulation.length * 10)
              .round();
      return quizPts + simPts;
    }
    final quizPts =
        (quizPercent / 100 * content.quiz.length * 10).round();
    final simPts = results.fold<int>(0, (sum, row) => sum + row.points);
    return quizPts + simPts;
  }
  double get reaction => results.isEmpty
      ? 0
      : results.fold<double>(0, (sum, r) => sum + r.seconds) / results.length;

  @override
  void dispose() {
    pages.dispose();
    Narrator.stop();
    super.dispose();
  }

  void go(_Stage next) {
    Narrator.stop();
    setState(() => stage = next);
  }

  /// Starts a fresh simulation run.
  void startRun() {
    results.clear();
    run = null;
  }

  Future<void> submit({bool interrupted = false}) async {
    if (preview) return;
    // The try is spent the moment a run ends, before the server answers, and
    // the run is kept on the phone until the server has it. Going offline
    // therefore never hands back a free retake.
    if (run == null) {
      run = {
        'moduleId': moduleId,
        'quiz': quizPercent,
        'practical': practical,
        'reaction': double.parse(reaction.toStringAsFixed(1)),
        'quality': interrupted ? 'Interrupted' : 'Complete',
        // Each step played, from this lesson's own content, for the teacher.
        'steps': [
          for (var i = 0; i < results.length && i < content.simulation.length; i++)
            stepRecord(content.simulation[i], results[i]),
        ],
      };
      attemptsLeft = attemptsLeft > 0 ? attemptsLeft - 1 : 0;
    }
    await PendingAttempts.save(widget.studentId, run!);
    setState(() {
      submitting = true;
      submitError = null;
    });
    try {
      final response = await widget.api.request('attempt', data: run);
      await PendingAttempts.remove(widget.studentId, moduleId);
      attemptsLeft = (response['attemptsLeft'] as num?)?.toInt() ?? 0;
      submitted = true;
      // A finished run is published straight away, so it becomes the official
      // score here too. An interrupted one waits for the teacher.
      if (response['published'] == true) {
        await ProgressStore.record(
          widget.studentId,
          moduleId,
          practical: (response['score'] as num?)?.toInt() ?? practical,
          exactPractical: true,
        );
      }
    } on ApiException catch (e) {
      submitError = e.message;
      // The server answered and turned the run down (e.g. no tries left):
      // nothing to resend. Offline or a server fault: keep it for later.
      if (e.status >= 400 && e.status < 500) {
        await PendingAttempts.remove(widget.studentId, moduleId);
      } else {
        submitError =
            '${e.message} Your run is saved on this phone and will be sent '
            'automatically when you are back online.';
      }
    } finally {
      if (mounted) setState(() => submitting = false);
    }
  }

  /// Phase 1 Learn/Check → school record so teachers see progress before Practice.
  Future<void> syncProgress({
    bool? learned,
    int? quiz,
    List<Map<String, dynamic>>? answers,
  }) async {
    if (preview) return;
    final data = {
      'moduleId': moduleId,
      if (learned != null) 'learned': learned,
      if (quiz != null) 'quiz': quiz,
      // The Check answers, so the teacher sees what was really chosen.
      if (answers != null) 'answers': answers,
    };
    try {
      await widget.api.request('progress', data: data);
    } on ApiException catch (e) {
      // Offline or a server fault: keep it and send it on the next refresh,
      // since the school record replaces this phone's copy then.
      if (e.status == 0 || e.status >= 500) {
        await PendingProgress.save(widget.studentId, data);
      }
    }
  }

  Future<void> finishSimulation() async {
    // A preview stays on this phone. A school run is saved locally only once
    // the server accepts it, so the two never disagree.
    if (preview) {
      await ProgressStore.record(
        widget.studentId,
        moduleId,
        practical: practical,
      );
    }
    go(_Stage.results);
    await submit();
  }

  /// Leaving mid-simulation still spends the try, so a student cannot quit a
  /// run that is going badly and start over for free.
  Future<bool> confirmLeave() async {
    if (stage != _Stage.simulation || preview) return true;
    final leave = await showDialog<bool>(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: QuestColors.paper,
        insetPadding: const EdgeInsets.symmetric(horizontal: 28),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(22, 26, 22, 18),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: const BoxDecoration(
                  color: QuestColors.peach,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  PhosphorIconsFill.doorOpen,
                  size: 30,
                  color: QuestColors.coral,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Leave the simulation?',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Your try ends now and is sent to your teacher as unfinished. '
                'You can’t start it over.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  height: 1.45,
                  fontWeight: FontWeight.w600,
                  color: QuestColors.muted,
                ),
              ),
              const SizedBox(height: 22),
              QuestButton(
                'Keep going',
                onPressed: () => Navigator.pop(context, false),
                icon: PhosphorIconsBold.play,
              ),
              const SizedBox(height: 6),
              SizedBox(
                width: double.infinity,
                child: TextButton(
                  onPressed: () => Navigator.pop(context, true),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: const StadiumBorder(),
                  ),
                  child: const Text(
                    'Leave anyway',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: QuestColors.coral,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
    if (leave != true) return false;
    await submit(interrupted: true);
    return true;
  }

  Future<void> close() async {
    if (await confirmLeave() && mounted) Navigator.pop(context, true);
  }

  @override
  Widget build(BuildContext context) => PopScope(
    canPop: stage != _Stage.simulation,
    onPopInvokedWithResult: (didPop, _) {
      if (!didPop) close();
    },
    child: Scaffold(
      backgroundColor: QuestColors.paper,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 620),
            child: Column(
              children: [
                _topBar(),
                Expanded(
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 300),
                    child: KeyedSubtree(
                      key: ValueKey(stage),
                      child: switch (stage) {
                        _Stage.intro => _intro(),
                        _Stage.story => _story(),
                        _Stage.quiz => QuizView(
                          questions: content.quiz,
                          scenarios: [
                            for (var i = 0; i < content.quiz.length; i++)
                              content.quiz[i].scene ??
                                  content.scenarioAt(i),
                          ],
                          onDone: (correct, answers) async {
                            quizPercent = (correct / content.quiz.length * 100)
                                .round();
                            await ProgressStore.record(
                              widget.studentId,
                              moduleId,
                              learned: true,
                              quiz: quizPercent,
                            );
                            await syncProgress(
                              learned: true,
                              quiz: quizPercent,
                              answers: answers,
                            );
                            go(_Stage.practiceIntro);
                          },
                        ),
                        _Stage.practiceIntro => _practiceIntro(),
                        _Stage.simulation => SimulationView(
                          steps: [
                            for (var i = 0; i < content.simulation.length; i++)
                              SimStep(
                                kind: content.simulation[i].kind,
                                alert: content.simulation[i].alert,
                                prompt: content.simulation[i].prompt,
                                scene: content.practiceSceneAt(i),
                                debrief: content.simulation[i].debrief,
                                choices: content.simulation[i].choices,
                                hotspots: content.simulation[i].hotspots,
                                answer: content.simulation[i].answer,
                                seconds: content.simulation[i].seconds,
                                holdSeconds: content.simulation[i].holdSeconds,
                                hazardIds: content.simulation[i].hazardIds,
                                consequenceSafe:
                                    content.simulation[i].consequenceSafe,
                                consequenceUnsafe:
                                    content.simulation[i].consequenceUnsafe,
                                unsafeDebrief:
                                    content.simulation[i].unsafeDebrief,
                                points: content.simulation[i].points,
                              ),
                          ],
                          onStep: results.add,
                          onDone: finishSimulation,
                        ),
                        _Stage.results => _results(),
                      },
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    ),
  );

  ({String phase, String subtitle}) get _phaseMeta => switch (stage) {
        _Stage.intro => (phase: 'Quest', subtitle: content.title),
        _Stage.story => (phase: 'Phase 1', subtitle: 'Learn'),
        _Stage.quiz => (phase: 'Phase 1', subtitle: 'Check'),
        _Stage.practiceIntro =>
          (phase: 'Phase 2', subtitle: 'Practical simulation'),
        _Stage.simulation =>
          (phase: 'Phase 2', subtitle: 'Practical simulation'),
        _Stage.results => (phase: 'Complete', subtitle: 'Well done'),
      };

  Widget _topBar() {
    final meta = _phaseMeta;
    return LessonHeader(
      phase: meta.phase,
      subtitle: meta.subtitle,
      onClose: close,
    );
  }

  bool get _storyDone => widget.progress.learned;
  bool get _simDone =>
      savedPractical >= widget.passMark ||
      widget.lesson['completed'] == true;
  bool get _canSimulate => practiceOpen && attemptsLeft > 0 && _storyDone;

  String get _questBlurb {
    final tip = content.story.first.tip;
    if (tip != null && tip.trim().isNotEmpty) return tip.trim();
    final text = content.story.first.text.trim();
    final stop = text.indexOf('.');
    if (stop > 20 && stop < 110) return text.substring(0, stop + 1);
    return text.length <= 100 ? text : '${text.substring(0, 97)}…';
  }

  ({String label, VoidCallback? onPressed, IconData icon}) _primaryCta() {
    // Teacher-granted retake: try again even after a finished quest.
    if (_simDone && attemptsLeft > 0 && practiceOpen) {
      return (
        label: 'Take again',
        onPressed: () {
          startRun();
          quizPercent = quizPercent;
          go(_Stage.simulation);
        },
        icon: PhosphorIconsBold.arrowClockwise,
      );
    }
    if (_simDone) {
      return (
        label: 'View my score',
        onPressed: () => go(_Stage.results),
        icon: PhosphorIconsBold.star,
      );
    }
    if (!_storyDone) {
      return (
        label: 'Start Quest',
        onPressed: () => go(_Stage.story),
        icon: PhosphorIconsBold.arrowRight,
      );
    }
    // Quiz finished (learned flag) — next is simulation when open.
    if (_canSimulate) {
      return (
        label: 'Start Simulation',
        onPressed: () {
          startRun();
          go(_Stage.simulation);
        },
        icon: PhosphorIconsBold.arrowRight,
      );
    }
    if (_storyDone && !practiceOpen) {
      return (
        label: 'Review Story',
        onPressed: () {
          page = 0;
          go(_Stage.story);
        },
        icon: PhosphorIconsBold.bookOpenText,
      );
    }
    // Practice open but no tries left.
    return (
      label: 'No tries left',
      onPressed: null,
      icon: PhosphorIconsBold.lock,
    );
  }

  Widget _intro() {
    final title = widget.lesson['name'] as String? ?? content.title;
    final cta = _primaryCta();
    final quizCount = content.quiz.length;

    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 4, 20, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(18),
                  child: AspectRatio(
                    aspectRatio: ScenarioPanel.artAspect,
                    child: SceneView(
                      scene: content.story.first.scene,
                      height: ScenarioPanel.heroHeight(context),
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 26,
                    height: 1.15,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.4,
                    color: QuestColors.ink,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _questBlurb,
                  style: const TextStyle(
                    fontSize: 15,
                    height: 1.45,
                    fontWeight: FontWeight.w600,
                    color: QuestColors.muted,
                  ),
                ),
                const SizedBox(height: 26),
                const Text(
                  'QUEST PATH',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.4,
                    color: QuestColors.muted,
                  ),
                ),
                const SizedBox(height: 14),
                _questPath(
                  stages: [
                    (
                      code: '01',
                      verb: 'PHASE 1',
                      title: 'Learn',
                      detail:
                          'Story moments that teach what to do before, during, and after.',
                      state: _storyDone
                          ? _QuestStepState.done
                          : _QuestStepState.current,
                    ),
                    (
                      code: '02',
                      verb: 'PHASE 1',
                      title: 'Check',
                      detail: '$quizCount quick questions',
                      state: !_storyDone
                          ? _QuestStepState.locked
                          : _QuestStepState.done,
                    ),
                    (
                      code: '03',
                      verb: 'PHASE 2',
                      title: 'Practical simulation',
                      detail: !practiceOpen
                          ? 'Opens when your teacher unlocks the simulation'
                          : attemptsLeft <= 0 && !_simDone
                              ? 'No tries left'
                              : 'Make the right call in real situations',
                      state: _simDone
                          ? _QuestStepState.done
                          : (_canSimulate
                              ? _QuestStepState.current
                              : _QuestStepState.locked),
                    ),
                    (
                      code: '04',
                      verb: 'REWARD',
                      title: 'Earn your badge',
                      detail: _simDone
                          ? 'Quest completed'
                          : 'Finish the path to unlock ${content.badge}',
                      state: _simDone
                          ? _QuestStepState.done
                          : _QuestStepState.locked,
                    ),
                  ],
                ),
                const SizedBox(height: 28),
                const Text(
                  'REWARD',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.4,
                    color: QuestColors.muted,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    BadgeMedal(content: content, size: 40),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            content.badge,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: QuestColors.ink,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            _simDone
                                ? 'Quest completed.'
                                : 'Complete the quest to earn this badge.',
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: QuestColors.muted,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                if (preview) ...[
                  const SizedBox(height: 16),
                  Text(
                    'Preview mode — simulation only, not sent to your teacher.',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: QuestColors.muted.withValues(alpha: .9),
                    ),
                  ),
                ] else if (_simDone) ...[
                  const SizedBox(height: 16),
                  _savedScoreCard(),
                  const SizedBox(height: 12),
                  Text(
                    attemptsLeft <= 0
                        ? 'Ask your teacher if you need another try.'
                        : 'You can take the practical again if your teacher allowed it.',
                    style: const TextStyle(
                      fontSize: 13,
                      height: 1.4,
                      fontWeight: FontWeight.w600,
                      color: QuestColors.muted,
                    ),
                  ),
                ] else if (!_canSimulate && _storyDone && practiceOpen && attemptsLeft <= 0) ...[
                  const SizedBox(height: 16),
                  const Text(
                    'No simulation tries left. Ask your teacher to allow another try.',
                    style: TextStyle(
                      fontSize: 13,
                      height: 1.4,
                      fontWeight: FontWeight.w600,
                      color: QuestColors.muted,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
          child: QuestButton(
            cta.label,
            onPressed: cta.onPressed,
            icon: cta.icon,
          ),
        ),
      ],
    );
  }

  Widget _questPath({
    required List<
            ({
              String code,
              String verb,
              String title,
              String detail,
              _QuestStepState state,
            })>
        stages,
  }) {
    return Column(
      children: [
        for (var i = 0; i < stages.length; i++) ...[
          _questStep(stages[i]),
          if (i < stages.length - 1)
            Padding(
              padding: const EdgeInsets.only(left: 15),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Container(
                  width: 2,
                  height: 16,
                  color: stages[i].state == _QuestStepState.done
                      ? QuestColors.coral.withValues(alpha: .45)
                      : QuestColors.ink.withValues(alpha: .1),
                ),
              ),
            ),
        ],
      ],
    );
  }

  Widget _questStep(
    ({
      String code,
      String verb,
      String title,
      String detail,
      _QuestStepState state,
    }) stage,
  ) {
    final done = stage.state == _QuestStepState.done;
    final current = stage.state == _QuestStepState.current;
    final locked = stage.state == _QuestStepState.locked;
    final ink = locked
        ? QuestColors.muted.withValues(alpha: .55)
        : QuestColors.ink;
    final muted = locked
        ? QuestColors.muted.withValues(alpha: .45)
        : QuestColors.muted;

    return Opacity(
      opacity: locked ? 0.72 : 1,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 32,
            height: 32,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: done
                  ? QuestColors.coral
                  : current
                      ? QuestColors.peach
                      : QuestColors.surface,
              border: Border.all(
                color: done || current
                    ? QuestColors.coral.withValues(alpha: .5)
                    : QuestColors.ink.withValues(alpha: .12),
                width: current ? 2 : 1,
              ),
            ),
            child: done
                ? const Icon(Icons.check_rounded, size: 16, color: Colors.white)
                : Text(
                    stage.code,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: current ? QuestColors.ink : muted,
                    ),
                  ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  stage.verb,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.3,
                    color: current ? QuestColors.coral : muted,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  stage.title,
                  style: TextStyle(
                    fontSize: current ? 17 : 16,
                    fontWeight: FontWeight.w800,
                    color: ink,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  stage.detail,
                  style: TextStyle(
                    fontSize: 13,
                    height: 1.35,
                    fontWeight: FontWeight.w600,
                    color: muted,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _story() {
    final last = page == content.story.length - 1;
    return Column(
      children: [
        LessonProgressBar(total: content.story.length, current: page),
        Expanded(
          child: PageView.builder(
            controller: pages,
            itemCount: content.story.length,
            onPageChanged: (value) {
              Narrator.stop();
              setState(() => page = value);
            },
            itemBuilder: (context, i) => _storyPage(content.story[i]),
          ),
        ),
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
            child: QuestButton(
              last ? 'Start Check' : 'Next',
              onPressed: () => last
                  ? go(_Stage.quiz)
                  : pages.nextPage(
                      duration: const Duration(milliseconds: 350),
                      curve: Curves.easeOutCubic,
                    ),
              icon: PhosphorIconsBold.arrowRight,
            ),
          ),
        ),
      ],
    );
  }

  Widget _storyPage(StoryPage story) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 2, 20, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ScenarioPanel(
            scene: story.scene,
            height: ScenarioPanel.heroHeight(context),
            soft: true,
          ),
          const SizedBox(height: 16),
          Text(
            story.title,
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              fontSize: 22,
              height: 1.2,
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 8),
          ListenButton('${story.title}. ${story.text}'),
          const SizedBox(height: 10),
          Text(
            story.text,
            style: const TextStyle(
              fontSize: 15,
              height: 1.5,
              color: QuestColors.muted,
              fontWeight: FontWeight.w600,
            ),
          ),
          if (story.tip != null && story.tip!.trim().isNotEmpty) ...[
            const SizedBox(height: 14),
            KeyIdea(story.tip!),
          ],
        ],
      ),
    );
  }

  Widget _practiceIntro() {
    final canPractice = practiceOpen && attemptsLeft > 0;
    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 8, 24, 16),
            child: Column(
              children: [
                const SizedBox(height: 12),
                // Soft clay stage behind the 3D simulation icon
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 28),
                  decoration: Clay.raised(
                    color: QuestColors.peach.withValues(alpha: .55),
                    radius: 28,
                  ),
                  child: Column(
                    children: [
                      Clay3DIcon(
                        icon: PhosphorIconsFill.gameController,
                        color: QuestColors.coral,
                        size: 132,
                      ),
                      const SizedBox(height: 18),
                      const Text(
                        'PHASE 2',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.4,
                          color: QuestColors.coral,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Practical simulation',
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'Check complete',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontSize: 24,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  quizPercent >= 80
                      ? 'Nice work. Ready for a live safety scenario?'
                      : 'Good effort. You can review the story anytime.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 15,
                    height: 1.45,
                    fontWeight: FontWeight.w600,
                    color: QuestColors.muted,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  canPractice
                      ? 'Make decisions in realistic safety situations. Tap objects in the scene, choose actions, and stay calm. Simulation lang ito.'
                      : practiceOpen
                          ? 'You used all simulation tries for this quest. Ask your teacher if you need another try.'
                          : 'The practical simulation opens when your teacher unlocks it.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 14,
                    height: 1.45,
                    fontWeight: FontWeight.w600,
                    color: QuestColors.muted,
                  ),
                ),
                if (canPractice) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 10,
                    ),
                    decoration: Clay.raised(
                      color: QuestColors.surface,
                      radius: 16,
                      elevated: false,
                    ),
                    child: Text(
                      '$attemptsLeft ${attemptsLeft == 1 ? 'simulation try' : 'simulation tries'} left for this quest',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 13,
                        color: QuestColors.coral,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
            child: QuestButton(
              canPractice ? 'Start Simulation' : 'Back to quests',
              onPressed: canPractice
                  ? () {
                      startRun();
                      go(_Stage.simulation);
                    }
                  : () => Navigator.pop(context, true),
              icon: canPractice
                  ? PhosphorIconsBold.arrowRight
                  : PhosphorIconsBold.house,
            ),
          ),
        ),
      ],
    );
  }

  /// Average decision time of the scored run, from the school record.
  double? get savedReaction => (widget.lesson['reaction'] as num?)?.toDouble();

  /// The saved result, then the teacher's remarks in a card of their own.
  Widget _savedScoreCard() {
    final score = savedPractical;
    final passed = score >= widget.passMark;
    final stars = starsFor(score);
    final quiz = widget.progress.quizBest > 0
        ? widget.progress.quizBest
        : (widget.lesson['quizBest'] as num?)?.toInt() ?? quizPercent;
    final reactionText =
        savedReaction == null ? '—' : '${savedReaction!.toStringAsFixed(1)}s';
    const green = Color(0xFF2F6B4C);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.fromLTRB(18, 16, 18, 16),
          decoration: Clay.raised(color: QuestColors.surface, radius: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Expanded(
                    child: Text(
                      'YOUR SCORECARD',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.3,
                        color: QuestColors.muted,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: passed
                          ? QuestColors.mint
                          : QuestColors.peach.withValues(alpha: .8),
                      borderRadius: BorderRadius.circular(99),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          passed
                              ? PhosphorIconsFill.checkCircle
                              : PhosphorIconsFill.arrowCounterClockwise,
                          size: 13,
                          color: passed ? green : QuestColors.coral,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          passed ? 'Passed' : 'Below pass mark',
                          style: TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w800,
                            color: passed ? green : QuestColors.coral,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '$score%',
                    style: const TextStyle(
                      fontSize: 44,
                      height: 1,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -1.5,
                      color: QuestColors.ink,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      children: [
                        for (var i = 0; i < 3; i++)
                          Padding(
                            padding: const EdgeInsets.only(right: 2),
                            child: Icon(
                              PhosphorIconsFill.star,
                              size: 20,
                              color: i < stars
                                  ? const Color(0xFFF2B53B)
                                  : QuestColors.ink.withValues(alpha: .12),
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                'Practical score · pass mark ${widget.passMark}%',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: QuestColors.muted,
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: _scoreTile(
                      PhosphorIconsFill.shieldCheck,
                      '$score%',
                      'Practical',
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _scoreTile(
                      PhosphorIconsFill.checkSquare,
                      '$quiz%',
                      'Check',
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _scoreTile(
                      PhosphorIconsFill.lightning,
                      reactionText,
                      'Avg. reaction',
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        _remarksCard(),
      ],
    );
  }

  Widget _scoreTile(IconData icon, String value, String label) => Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
        decoration: Clay.inset(radius: 16),
        child: Column(
          children: [
            Icon(icon, size: 18, color: QuestColors.coral),
            const SizedBox(height: 4),
            Text(
              value,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: QuestColors.ink,
              ),
            ),
            const SizedBox(height: 1),
            Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 10.5,
                fontWeight: FontWeight.w700,
                color: QuestColors.muted,
              ),
            ),
          ],
        ),
      );

  /// What the teacher wrote about this run, kept apart from the numbers.
  Widget _remarksCard() {
    final has = teacherFeedback.isNotEmpty;
    const purple = Color(0xFF6B5A8E);
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
      decoration: Clay.raised(
        color: QuestColors.lilac.withValues(alpha: .6),
        radius: 22,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: .8),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              PhosphorIconsFill.chalkboardTeacher,
              size: 20,
              color: purple,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  "TEACHER'S REMARKS",
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.3,
                    color: purple,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  has
                      ? '“$teacherFeedback”'
                      : 'No remarks from your teacher yet.',
                  style: TextStyle(
                    fontSize: has ? 15 : 13,
                    height: 1.4,
                    fontWeight: has ? FontWeight.w700 : FontWeight.w600,
                    fontStyle: has ? FontStyle.normal : FontStyle.italic,
                    color: has ? QuestColors.ink : QuestColors.muted,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _results() {
    final passed = practical >= widget.passMark;
    final safe = results.isEmpty
        ? (practical / 100 * content.simulation.length).round()
        : results.where((r) => r.safe).length;
    final total = content.simulation.length;
    final stars = starsForSafe(safe, total);
    final hasLiveResults = results.isNotEmpty;
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 32),
      child: Column(
        children: [
          const Eyebrow('Final score'),
          const SizedBox(height: 8),
          StarRow(stars),
          const SizedBox(height: 6),
          Text(
            '$practical%',
            style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                  fontSize: 52,
                  height: 1,
                  letterSpacing: -1.5,
                ),
          ),
          const SizedBox(height: 6),
          Text(
            passed
                ? 'Passed · pass mark ${widget.passMark}%'
                : 'Below pass mark ${widget.passMark}% · keep practicing',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w800,
              color: passed ? const Color(0xFF2F6B4C) : QuestColors.coral,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            passed ? 'You stayed safe!' : 'Keep practicing, hero!',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              Expanded(child: _stat('🛡️', '$safe/$total', 'Safe choices')),
              const SizedBox(width: 10),
              Expanded(
                child: _stat(
                  '⚡',
                  hasLiveResults
                      ? '${reaction.toStringAsFixed(1)}s'
                      : savedReaction == null
                      ? '—'
                      : '${savedReaction!.toStringAsFixed(1)}s',
                  'Avg. reaction',
                ),
              ),
              const SizedBox(width: 10),
              Expanded(child: _stat('⭐', '$earnedPoints', 'Points')),
            ],
          ),
          const SizedBox(height: 18),
          if (hasLiveResults) ...[
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Your answers',
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ),
            const SizedBox(height: 10),
            ...List.generate(content.simulation.length, (i) {
              final step = content.simulation[i];
              final result = i < results.length ? results[i] : null;
              final ok = result?.safe == true;
              final timedOut =
                  result != null && !result.safe && result.actions.isEmpty;
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: ClayCard(
                  color: ok
                      ? QuestColors.mint.withValues(alpha: .55)
                      : QuestColors.peach.withValues(alpha: .45),
                  padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        ok ? Icons.check_circle_rounded : Icons.cancel_rounded,
                        size: 22,
                        color: ok ? const Color(0xFF2F6B4C) : QuestColors.coral,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Step ${i + 1} · ${ok ? 'Safe' : timedOut ? 'Time up' : 'Try again'}',
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                                color: QuestColors.ink,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              step.prompt,
                              style: const TextStyle(
                                fontSize: 12.5,
                                fontWeight: FontWeight.w700,
                                height: 1.3,
                                color: QuestColors.ink,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              ok
                                  ? step.debrief
                                  : (step.unsafeDebrief ?? step.debrief),
                              style: const TextStyle(
                                fontSize: 12,
                                height: 1.35,
                                fontWeight: FontWeight.w600,
                                color: QuestColors.muted,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Text(
                        '+${result?.points ?? 0}',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color:
                              ok ? const Color(0xFF2F6B4C) : QuestColors.muted,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
          ] else ...[
            _remarksCard(),
            const SizedBox(height: 10),
            const Notice(
                'This is your saved automatic score. Finish a new try to see each step again.',
              ),
          ],
          const SizedBox(height: 8),
          if (passed)
            PopOnce(
              child: ClayCard(
                color: QuestColors.yellow,
                child: Row(
                  children: [
                    Moving(
                      motion: Motion.bounce,
                      child: BadgeMedal(content: content, size: 64),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Eyebrow('Badge unlocked'),
                          const SizedBox(height: 4),
                          Text(
                            content.badge,
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'You’ll find this award on your Profile.',
                            style: TextStyle(
                              fontSize: 13,
                              height: 1.35,
                              fontWeight: FontWeight.w600,
                              color: QuestColors.muted,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          const SizedBox(height: 16),
          if (preview)
            const Notice('Preview mode: this run was not sent to your teacher.')
          else if (submitting)
            const Notice('Saving your automatic score…')
          else if (submitError != null) ...[
            Notice(submitError!, error: true),
            const SizedBox(height: 10),
            QuestButton(
              'Try sending again',
              onPressed: () => submit(),
              icon: PhosphorIconsBold.arrowClockwise,
            ),
          ] else if (submitted || (!hasLiveResults && savedPractical > 0))
            Notice(
              passed
                  ? 'Score saved automatically. Class average uses this $practical%.'
                  : 'Score saved automatically ($practical%). Ask your teacher only if something went wrong.',
            ),
          const SizedBox(height: 18),
          QuestButton(
            'Back to my quests',
            onPressed: submitting ? null : () => Navigator.pop(context, true),
            icon: PhosphorIconsBold.house,
          ),
        ],
      ),
    );
  }

  Widget _stat(String emoji, String value, String label) => ClayCard(
    padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
    child: Column(
      children: [
        ClayIcon(emoji, size: 36),
        const SizedBox(height: 6),
        Text(
          value,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w800,
            color: QuestColors.ink,
          ),
        ),
        Text(
          label,
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 11),
        ),
      ],
    ),
  );
}
