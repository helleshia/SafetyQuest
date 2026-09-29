import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:safetyquest_mobile/core/theme/clay_icon.dart';
import 'package:safetyquest_mobile/core/theme/quest_theme.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_catalog.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_models.dart';
import 'package:safetyquest_mobile/features/lessons/scene_view.dart';

const questGreen = Color(0xFF79A991);
const questGreenInk = Color(0xFF2F6B4C);

enum TileState { idle, correct, wrong, dim }

/// Shared scenario art for story, quiz, and practice — one sizing system.
class ScenarioPanel extends StatelessWidget {
  const ScenarioPanel({
    super.key,
    required this.scene,
    this.height,
    this.onTapProp,
    this.marked = const {},
    this.label,
    this.draggableIds = const {},
    this.dropTargetIds = const {},
    this.onDrop,
    this.dimIds = const {},
    this.soft = false,
  });

  final Scene scene;
  final double? height;
  final ValueChanged<String>? onTapProp;
  final Map<String, bool> marked;
  final String? label;
  final Set<String> draggableIds;
  final Set<String> dropTargetIds;
  final void Function(String draggedId, String targetId)? onDrop;
  final Set<String> dimIds;

  /// Lighter frame for story learning moments (scene belongs to the page).
  final bool soft;

  /// Module stills through Module 15 are square (1:1). Match that so the art
  /// fills the frame edge-to-edge — no side letterbox.
  static const artAspect = 1.0;

  /// Tighter than body text padding so the art can use more width.
  static const artGutter = 12.0;

  static double artWidth(BuildContext context) =>
      MediaQuery.sizeOf(context).width - artGutter * 2;

  /// Intro / story hero — width-driven square, full still visible.
  static double heroHeight(BuildContext context) =>
      artWidth(context) / artAspect;

  /// Quiz / practice stage — same framing as the story hero.
  static double stageHeight(BuildContext context) =>
      artWidth(context) / artAspect;

  @override
  Widget build(BuildContext context) {
    final h = height ?? heroHeight(context);
    final radius = soft ? 18.0 : 22.0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (label != null) ...[
          Text(
            label!,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.4,
              color: QuestColors.muted,
            ),
          ),
          const SizedBox(height: 10),
        ],
        Container(
          height: h,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(radius),
            border: soft
                ? null
                : Border.all(color: QuestColors.line, width: 1.5),
            boxShadow: soft
                ? [
                    BoxShadow(
                      color: QuestColors.ink.withValues(alpha: .04),
                      offset: const Offset(0, 3),
                      blurRadius: 10,
                    ),
                  ]
                : [
                    BoxShadow(
                      color: QuestColors.ink.withValues(alpha: .07),
                      offset: const Offset(0, 8),
                      blurRadius: 18,
                    ),
                    BoxShadow(
                      color: Colors.white.withValues(alpha: .85),
                      offset: const Offset(-2, -2),
                      blurRadius: 6,
                    ),
                  ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(radius),
            child: SceneView(
              scene: scene,
              height: h,
              onTapProp: onTapProp,
              marked: marked,
              draggableIds: draggableIds,
              dropTargetIds: dropTargetIds,
              onDrop: onDrop,
              dimIds: dimIds,
            ),
          ),
        ),
      ],
    );
  }
}

/// Compact phase header: close · PHASE n / subtitle · optional trailing.
class LessonHeader extends StatelessWidget {
  const LessonHeader({
    super.key,
    required this.phase,
    required this.subtitle,
    required this.onClose,
    this.trailing,
  });

  final String phase;
  final String subtitle;
  final VoidCallback onClose;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 2, 12, 2),
      child: Row(
        children: [
          IconButton(
            tooltip: 'Close',
            onPressed: onClose,
            style: IconButton.styleFrom(
              foregroundColor: QuestColors.ink,
              backgroundColor: QuestColors.surface,
              side: BorderSide(color: QuestColors.ink.withValues(alpha: .08)),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            icon: const Icon(PhosphorIconsBold.x, size: 18),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  phase.toUpperCase(),
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.35,
                    color: QuestColors.coral,
                    height: 1.1,
                  ),
                ),
                Text(
                  subtitle,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: QuestColors.ink,
                    height: 1.2,
                  ),
                ),
              ],
            ),
          ),
          ?trailing,
        ],
      ),
    );
  }
}

/// Subtle segmented lesson progress — position, not percentage.
class LessonProgressBar extends StatelessWidget {
  const LessonProgressBar({
    super.key,
    required this.total,
    required this.current,
    this.filledThroughCurrent = true,
  });

  final int total;
  final int current;
  final bool filledThroughCurrent;

  @override
  Widget build(BuildContext context) {
    if (total <= 0) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 8),
      child: Row(
        children: [
          for (var i = 0; i < total; i++)
            Expanded(
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 280),
                curve: Curves.easeOutCubic,
                height: 3,
                margin: EdgeInsets.only(right: i < total - 1 ? 4 : 0),
                decoration: BoxDecoration(
                  color: (filledThroughCurrent ? i <= current : i < current)
                      ? QuestColors.coral
                      : QuestColors.ink.withValues(alpha: .1),
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// Soft key takeaway — part of the lesson, not a giant card.
class KeyIdea extends StatelessWidget {
  const KeyIdea(this.text, {super.key});
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
      decoration: BoxDecoration(
        color: QuestColors.mint.withValues(alpha: .45),
        borderRadius: BorderRadius.circular(12),
        border: Border(
          left: BorderSide(
            color: questGreenInk.withValues(alpha: .55),
            width: 3,
          ),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'KEY IDEA',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.3,
              color: questGreenInk.withValues(alpha: .85),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            text,
            style: const TextStyle(
              fontSize: 14,
              height: 1.4,
              fontWeight: FontWeight.w700,
              color: QuestColors.ink,
            ),
          ),
        ],
      ),
    );
  }
}

/// Secondary listen control — easy to tap, not a media player.
class ListenButton extends StatelessWidget {
  const ListenButton(this.text, {super.key});
  final String text;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: TextButton.icon(
        onPressed: () => Narrator.speak(text),
        style: TextButton.styleFrom(
          foregroundColor: QuestColors.ink,
          backgroundColor: QuestColors.surface,
          minimumSize: const Size(0, 40),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: BorderSide(color: QuestColors.ink.withValues(alpha: .1)),
          ),
        ),
        icon: const Icon(PhosphorIconsFill.speakerHigh, size: 18),
        label: const Text(
          'Listen',
          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
        ),
      ),
    );
  }
}

/// Answer tile: letter + clear text (kids should not rely on emoji meaning).
class ChoiceTile extends StatelessWidget {
  const ChoiceTile({
    super.key,
    required this.art,
    required this.label,
    required this.onTap,
    this.state = TileState.idle,
    this.badge,
    this.letter,
    this.showArt = false,
  });
  final String art;
  final String label;
  final VoidCallback? onTap;
  final TileState state;

  /// Sequence order badge (1, 2, 3…).
  final String? badge;

  /// A / B / C / D — primary visual cue.
  final String? letter;

  /// Optional small decoration; off by default so labels stay readable.
  final bool showArt;

  @override
  Widget build(BuildContext context) {
    final color = switch (state) {
      TileState.correct => QuestColors.mint,
      TileState.wrong => QuestColors.peach,
      _ => QuestColors.surface,
    };
    Widget tile = AnimatedOpacity(
      duration: const Duration(milliseconds: 250),
      opacity: state == TileState.dim ? .4 : 1,
      child: Semantics(
        button: true,
        label: label,
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(18),
            onTap: onTap,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              padding: const EdgeInsets.fromLTRB(12, 14, 12, 12),
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: switch (state) {
                    TileState.correct => questGreenInk.withValues(alpha: .45),
                    TileState.wrong => QuestColors.coral.withValues(alpha: .55),
                    _ => QuestColors.line,
                  },
                  width: state == TileState.idle || state == TileState.dim
                      ? 1
                      : 2,
                ),
              ),
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (letter != null)
                        CircleAvatar(
                          radius: 18,
                          backgroundColor: QuestColors.ink,
                          child: Text(
                            letter!,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w900,
                              fontSize: 16,
                            ),
                          ),
                        )
                      else if (showArt)
                        SizedBox(
                          height: 44,
                          child: Center(child: PropArt(art, size: 36)),
                        ),
                      const SizedBox(height: 8),
                      Text(
                        label,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 15,
                          height: 1.25,
                          fontWeight: FontWeight.w800,
                          color: QuestColors.ink,
                        ),
                      ),
                    ],
                  ),
                  if (badge != null)
                    Positioned(
                      top: -6,
                      left: -2,
                      child: CircleAvatar(
                        radius: 12,
                        backgroundColor: QuestColors.ink,
                        child: Text(
                          badge!,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ),
                  if (state == TileState.correct || state == TileState.wrong)
                    Positioned(
                      top: -6,
                      right: -2,
                      child: Icon(
                        state == TileState.correct
                            ? PhosphorIconsFill.checkCircle
                            : PhosphorIconsFill.xCircle,
                        color: state == TileState.correct
                            ? questGreenInk
                            : QuestColors.coral,
                        size: 24,
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
    if (state == TileState.wrong) tile = ShakeOnce(child: tile);
    if (state == TileState.correct) tile = PopOnce(child: tile);
    return tile;
  }
}

/// Lays tiles out two per row, each row as tall as its tallest tile.
class TileGrid extends StatelessWidget {
  const TileGrid({super.key, required this.children});
  final List<Widget> children;
  @override
  Widget build(BuildContext context) => Column(
    children: [
      for (var i = 0; i < children.length; i += 2)
        Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(child: children[i]),
                const SizedBox(width: 12),
                Expanded(
                  child: i + 1 < children.length
                      ? children[i + 1]
                      : const SizedBox(),
                ),
              ],
            ),
          ),
        ),
    ],
  );
}

class ShakeOnce extends StatelessWidget {
  const ShakeOnce({super.key, required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context) => TweenAnimationBuilder<double>(
    tween: Tween(begin: 0, end: 1),
    duration: const Duration(milliseconds: 450),
    builder: (context, t, child) => Transform.translate(
      offset: Offset(math.sin(t * math.pi * 6) * 8 * (1 - t), 0),
      child: child,
    ),
    child: child,
  );
}

class PopOnce extends StatelessWidget {
  const PopOnce({super.key, required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context) => TweenAnimationBuilder<double>(
    tween: Tween(begin: 0, end: 1),
    duration: const Duration(milliseconds: 420),
    builder: (context, t, child) =>
        Transform.scale(scale: 1 + math.sin(t * math.pi) * .08, child: child),
    child: child,
  );
}

/// The flashing red strip that tells the student an emergency is happening.
class AlertBanner extends StatelessWidget {
  const AlertBanner(this.text, {super.key});
  final String text;
  @override
  Widget build(BuildContext context) => Moving(
    motion: Motion.pulse,
    child: Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFE2553A), Color(0xFFEC6E4D)],
        ),
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFE2553A).withValues(alpha: .35),
            blurRadius: 14,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Row(
        children: [
          const ClayIcon('🚨', size: 38),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w800,
                fontSize: 15,
                height: 1.3,
              ),
            ),
          ),
        ],
      ),
    ),
  );
}

/// A result strip after an answer: what happened and why, in one line or two.
class FeedbackCard extends StatelessWidget {
  const FeedbackCard({
    super.key,
    required this.good,
    required this.title,
    required this.body,
    required this.onNext,
    required this.nextLabel,
  });
  final bool good;
  final String title;
  final String body;
  final VoidCallback onNext;
  final String nextLabel;
  @override
  Widget build(BuildContext context) => TweenAnimationBuilder<double>(
    tween: Tween(begin: 0, end: 1),
    duration: const Duration(milliseconds: 350),
    curve: Curves.easeOutCubic,
    builder: (context, t, child) => Opacity(
      opacity: t,
      child: Transform.translate(offset: Offset(0, 30 * (1 - t)), child: child),
    ),
    child: Semantics(
      liveRegion: true,
      child: ClayCard(
        color: good ? QuestColors.mint : QuestColors.peach,
        elevated: false,
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                ClayIcon(good ? '🎉' : '💡', size: 36),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    title,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontSize: 18,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              body,
              style: const TextStyle(
                color: QuestColors.muted,
                fontSize: 14,
                height: 1.45,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 14),
            QuestButton(nextLabel, onPressed: onNext),
          ],
        ),
      ),
    ),
  );
}

class NarrateButton extends StatelessWidget {
  const NarrateButton(this.text, {super.key});
  final String text;
  @override
  Widget build(BuildContext context) => ListenButton(text);
}

class StarRow extends StatelessWidget {
  const StarRow(this.stars, {super.key});
  final int stars;
  @override
  Widget build(BuildContext context) => Row(
    mainAxisAlignment: MainAxisAlignment.center,
    children: [
      for (var i = 0; i < 3; i++)
        TweenAnimationBuilder<double>(
          tween: Tween(begin: 0, end: 1),
          duration: Duration(milliseconds: 500 + i * 250),
          curve: Interval(i * .2, 1, curve: Curves.elasticOut),
          builder: (context, t, child) =>
              Transform.scale(scale: t, child: child),
          child: Padding(
            padding: EdgeInsets.only(
              left: 6,
              right: 6,
              bottom: i == 1 ? 14 : 0,
            ),
            child: Icon(
              PhosphorIconsFill.star,
              size: i == 1 ? 58 : 46,
              color: i < stars
                  ? const Color(0xFFF2B53B)
                  : QuestColors.ink.withValues(alpha: .12),
            ),
          ),
        ),
    ],
  );
}

/// Stars for a saved simulation score. Same cut-offs as [starsForSafe] (5 of 6
/// safe = 83%, 4 of 6 = 67%, 2 of 6 = 33%) and as the server's class board.
int starsFor(int percent) => percent >= 83
    ? 3
    : percent >= 67
    ? 2
    : percent >= 33
    ? 1
    : 0;

/// Stars from how many simulation steps were safe (matches the Safe choices card).
int starsForSafe(int safe, int total) {
  if (total <= 0 || safe <= 0) return 0;
  final ratio = safe / total;
  if (ratio >= 5 / 6) return 3; // 5–6 of 6
  if (ratio >= 4 / 6) return 2; // 4 of 6
  if (ratio >= 2 / 6) return 1; // 2–3 of 6
  return 0;
}
