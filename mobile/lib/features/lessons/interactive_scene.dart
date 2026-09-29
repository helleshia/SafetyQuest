import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:safetyquest_mobile/core/theme/quest_theme.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_models.dart';
import 'package:safetyquest_mobile/features/lessons/scene_view.dart';

/// Scene-first canvas: large still + invisible hitboxes (hidden-object style).
///
/// Targets are tapped on the picture itself — never floating emoji pills.
/// Correct finds get a Criminal Case–style ring only.
class InteractiveScene extends StatelessWidget {
  const InteractiveScene({
    super.key,
    required this.scene,
    required this.hotspots,
    this.height,
    this.onTapHotspot,
    this.found = const {},
    this.missId,
    this.enabled = true,
  });

  final Scene scene;
  final List<SceneHotspot> hotspots;
  final double? height;
  final ValueChanged<String>? onTapHotspot;
  final Set<String> found;
  final String? missId;
  final bool enabled;

  /// Tall stage so the still is readable on phones (~half the screen).
  static double stageHeight(BuildContext context) {
    final size = MediaQuery.sizeOf(context);
    final half = size.height * 0.52;
    final wide = (size.width - 8) / (4 / 3);
    return math.max(half, wide).clamp(300.0, size.height * 0.58);
  }

  @override
  Widget build(BuildContext context) {
    final h = height ?? stageHeight(context);
    return Container(
      height: h,
      width: double.infinity,
      decoration: BoxDecoration(
        color: QuestColors.surface,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: QuestColors.line, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: QuestColors.ink.withValues(alpha: .07),
            offset: const Offset(0, 8),
            blurRadius: 18,
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: scene.sky,
            ),
          ),
          child: Stack(
            fit: StackFit.expand,
            children: [
              if (scene.image == null && scene.video == null)
                SceneView(scene: scene, height: h)
              else if (scene.image != null)
                _HotspotImage(
                  asset: scene.image!,
                  hotspots: hotspots,
                  found: found,
                  missId: missId,
                  enabled: enabled && onTapHotspot != null,
                  onTap: onTapHotspot,
                  quake: scene.quake,
                )
              else if (scene.video != null)
                SceneVideo(scene.video!),
            ],
          ),
        ),
      ),
    );
  }
}

class _HotspotImage extends StatefulWidget {
  const _HotspotImage({
    required this.asset,
    required this.hotspots,
    required this.found,
    required this.missId,
    required this.enabled,
    required this.onTap,
    this.quake = false,
  });

  final String asset;
  final List<SceneHotspot> hotspots;
  final Set<String> found;
  final String? missId;
  final bool enabled;
  final ValueChanged<String>? onTap;
  final bool quake;

  @override
  State<_HotspotImage> createState() => _HotspotImageState();
}

class _HotspotImageState extends State<_HotspotImage> {
  ui.Image? _decoded;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(covariant _HotspotImage old) {
    super.didUpdateWidget(old);
    if (old.asset != widget.asset) _load();
  }

  Future<void> _load() async {
    try {
      final data = await rootBundle.load(widget.asset);
      final codec = await ui.instantiateImageCodec(data.buffer.asUint8List());
      final frame = await codec.getNextFrame();
      if (!mounted) return;
      setState(() => _decoded = frame.image);
    } catch (_) {
      if (mounted) setState(() => _decoded = null);
    }
  }

  Size _cover(Size src, Size max) {
    if (src.width <= 0 || src.height <= 0) return max;
    final scale = math.max(max.width / src.width, max.height / src.height);
    return Size(src.width * scale, src.height * scale);
  }

  @override
  Widget build(BuildContext context) {
    Widget body = LayoutBuilder(
      builder: (context, constraints) {
        final max = Size(constraints.maxWidth, constraints.maxHeight);
        final src = _decoded == null
            ? max
            : Size(_decoded!.width.toDouble(), _decoded!.height.toDouble());
        // Cover the stage so objects read large (hidden-object feel).
        final painted = _cover(src, max);
        final dx = (max.width - painted.width) / 2;
        final dy = (max.height - painted.height) / 2;

        return ClipRect(
          child: Stack(
            children: [
              Positioned(
                left: dx,
                top: dy,
                width: painted.width,
                height: painted.height,
                child: Image.asset(
                  widget.asset,
                  fit: BoxFit.fill,
                  filterQuality: FilterQuality.medium,
                  errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                ),
              ),
              // Removable hazard stickers — disappear when found.
              for (final spot in widget.hotspots)
                if (spot.layer != null && !widget.found.contains(spot.id))
                  Positioned(
                    left: dx + spot.x * painted.width,
                    top: dy + spot.y * painted.height,
                    width: spot.width * painted.width,
                    height: spot.height * painted.height,
                    child: IgnorePointer(
                      child: Align(
                        alignment: Alignment.bottomCenter,
                        child: _ChromaLayer(asset: spot.layer!),
                      ),
                    ),
                  ),
              for (final spot in widget.hotspots)
                Positioned(
                  left: dx + spot.x * painted.width,
                  top: dy + spot.y * painted.height,
                  width: spot.width * painted.width,
                  height: spot.height * painted.height,
                  child: _HiddenObjectTarget(
                    label: spot.label,
                    found: widget.found.contains(spot.id),
                    missed: widget.missId == spot.id,
                    enabled: widget.enabled && !widget.found.contains(spot.id),
                    onTap: () => widget.onTap?.call(spot.id),
                  ),
                ),
            ],
          ),
        );
      },
    );

    if (widget.quake) {
      body = TweenAnimationBuilder<double>(
        tween: Tween(begin: 0, end: 1),
        duration: const Duration(milliseconds: 900),
        builder: (context, t, child) => Transform.translate(
          offset: Offset(math.sin(t * math.pi * 10) * 3 * (1 - t), 0),
          child: child,
        ),
        child: body,
      );
    }
    return body;
  }
}

/// Invisible hit region over something already drawn in the still.
/// No hint rings — kids tap the picture itself like a hidden-object game.
class _HiddenObjectTarget extends StatelessWidget {
  const _HiddenObjectTarget({
    required this.label,
    required this.found,
    required this.missed,
    required this.enabled,
    required this.onTap,
  });

  final String? label;
  final bool found;
  final bool missed;
  final bool enabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: label ?? 'Scene object',
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: enabled
            ? () {
                HapticFeedback.selectionClick();
                onTap();
              }
            : null,
        child: Stack(
          alignment: Alignment.center,
          clipBehavior: Clip.none,
          children: [
            const SizedBox.expand(),
            if (found) const _FoundBurst(),
            if (missed) const _MissRipple(),
          ],
        ),
      ),
    );
  }
}

/// Hazard sticker (transparent PNG). Falls back to asset as-is.
class _ChromaLayer extends StatelessWidget {
  const _ChromaLayer({required this.asset});
  final String asset;

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      asset,
      fit: BoxFit.contain,
      filterQuality: FilterQuality.medium,
      errorBuilder: (_, _, _) => const SizedBox.shrink(),
    );
  }
}

/// Brief “found!” check — small, no large ring over the whole hitbox.
class _FoundBurst extends StatelessWidget {
  const _FoundBurst();

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.4, end: 1),
      duration: const Duration(milliseconds: 420),
      curve: Curves.easeOutBack,
      // easeOutBack overshoots past 1 for the pop. That overshoot drives the
      // size only; opacity must stay within 0–1 or Flutter throws.
      builder: (context, t, _) {
        return Opacity(
          opacity: t.clamp(0.0, 1.0),
          child: Transform.scale(
            scale: t,
            child: Container(
              width: 28,
              height: 28,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Color(0xFF79A991),
              ),
              child: const Icon(
                Icons.check_rounded,
                size: 16,
                color: Colors.white,
              ),
            ),
          ),
        );
      },
    );
  }
}

class _MissRipple extends StatelessWidget {
  const _MissRipple();

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: const Duration(milliseconds: 280),
      builder: (context, t, _) {
        return Opacity(
          opacity: 1 - t,
          child: Icon(
            Icons.close_rounded,
            size: 22,
            color: QuestColors.coral.withValues(alpha: .85),
          ),
        );
      },
    );
  }
}

class SimulationInstruction extends StatelessWidget {
  const SimulationInstruction({
    super.key,
    required this.eyebrow,
    required this.prompt,
    this.hint,
  });

  final String eyebrow;
  final String prompt;
  final String? hint;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          eyebrow.toUpperCase(),
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w800,
            letterSpacing: 1.6,
            color: QuestColors.muted,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          prompt,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w800,
            height: 1.25,
          ),
        ),
        if (hint != null) ...[
          const SizedBox(height: 6),
          Text(
            hint!,
            style: const TextStyle(
              fontSize: 14,
              height: 1.35,
              color: QuestColors.muted,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ],
    );
  }
}

class SimulationProgress extends StatelessWidget {
  const SimulationProgress({
    super.key,
    required this.found,
    required this.total,
  });

  final int found;
  final int total;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: QuestColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: QuestColors.line),
        boxShadow: [
          BoxShadow(
            color: QuestColors.ink.withValues(alpha: .05),
            offset: const Offset(0, 3),
            blurRadius: 8,
          ),
        ],
      ),
      child: Text(
        'Found $found of $total',
        style: const TextStyle(
          fontWeight: FontWeight.w800,
          fontSize: 13,
          color: QuestColors.ink,
        ),
      ),
    );
  }
}

class SimulationFeedback extends StatelessWidget {
  const SimulationFeedback({
    super.key,
    required this.good,
    required this.body,
    required this.nextLabel,
    required this.onNext,
  });

  final bool good;
  final String body;
  final String nextLabel;
  final VoidCallback onNext;

  @override
  Widget build(BuildContext context) {
    final accent = good ? const Color(0xFF2F6B4C) : QuestColors.coral;
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: const Duration(milliseconds: 280),
      curve: Curves.easeOutCubic,
      builder: (context, t, child) => Opacity(
        opacity: t,
        child: Transform.translate(
          offset: Offset(0, 8 * (1 - t)),
          child: child,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
            decoration: BoxDecoration(
              color: (good ? QuestColors.mint : QuestColors.peach)
                  .withValues(alpha: .55),
              borderRadius: BorderRadius.circular(12),
              border: Border(
                left: BorderSide(color: accent.withValues(alpha: .55), width: 3),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  good ? 'Nice work' : 'Try this next time',
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    color: accent,
                    fontSize: 13,
                    letterSpacing: .2,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  body,
                  style: const TextStyle(
                    fontSize: 14,
                    height: 1.4,
                    fontWeight: FontWeight.w600,
                    color: QuestColors.ink,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          QuestButton(nextLabel, onPressed: onNext),
        ],
      ),
    );
  }
}

/// Clean text rows — lightweight, no A/B/C badges or giant cards.
class TextChoiceList extends StatelessWidget {
  const TextChoiceList({
    super.key,
    required this.choices,
    required this.onPick,
    this.picked,
    this.showResult = false,
  });

  final List<Choice> choices;
  final ValueChanged<int> onPick;
  final int? picked;
  final bool showResult;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        for (var i = 0; i < choices.length; i++) ...[
          if (i > 0) const SizedBox(height: 8),
          _TextChoiceRow(
            label: choices[i].label,
            state: !showResult
                ? _RowState.idle
                : choices[i].correct
                ? _RowState.correct
                : i == picked
                ? _RowState.wrong
                : _RowState.dim,
            onTap: showResult ? null : () => onPick(i),
          ),
        ],
      ],
    );
  }
}

enum _RowState { idle, correct, wrong, dim }

class _TextChoiceRow extends StatelessWidget {
  const _TextChoiceRow({
    required this.label,
    required this.state,
    required this.onTap,
  });

  final String label;
  final _RowState state;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final bg = switch (state) {
      _RowState.correct => const Color(0xFFE8F3EC),
      _RowState.wrong => const Color(0xFFFDECEA),
      _ => Colors.transparent,
    };
    final border = switch (state) {
      _RowState.correct => const Color(0xFF3F7D5C).withValues(alpha: .35),
      _RowState.wrong => QuestColors.coral.withValues(alpha: .4),
      _ => QuestColors.ink.withValues(alpha: .1),
    };
    return AnimatedOpacity(
      duration: const Duration(milliseconds: 200),
      opacity: state == _RowState.dim ? .4 : 1,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: onTap,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            width: double.infinity,
            constraints: const BoxConstraints(minHeight: 52),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: bg,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: border),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    label,
                    style: const TextStyle(
                      fontSize: 15,
                      height: 1.3,
                      fontWeight: FontWeight.w700,
                      color: QuestColors.ink,
                    ),
                  ),
                ),
                if (state == _RowState.correct)
                  const Icon(
                    Icons.check_rounded,
                    size: 18,
                    color: Color(0xFF2F6B4C),
                  )
                else if (state == _RowState.wrong)
                  Icon(Icons.close_rounded, size: 18, color: QuestColors.coral),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
