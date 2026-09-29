import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:safetyquest_mobile/core/theme/clay_icon.dart';
import 'package:safetyquest_mobile/core/theme/quest_theme.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_models.dart';
import 'package:video_player/video_player.dart';

/// Draws a [Scene]: props pop in one after another, then keep moving.
class SceneView extends StatelessWidget {
  const SceneView({
    super.key,
    required this.scene,
    this.height = 220,
    this.onTapProp,
    this.marked = const {},
    this.draggableIds = const {},
    this.dropTargetIds = const {},
    this.onDrop,
    this.dimIds = const {},
  });
  final Scene scene;
  final double height;

  /// When set, props with an id become tappable targets.
  final ValueChanged<String>? onTapProp;

  /// Prop ids to ring, mapped to green (true) or red (false).
  final Map<String, bool> marked;

  /// Prop ids the student may drag.
  final Set<String> draggableIds;

  /// Prop ids that accept a drop.
  final Set<String> dropTargetIds;

  /// Called when [draggedId] is dropped onto [targetId].
  final void Function(String draggedId, String targetId)? onDrop;

  /// Prop ids already used / collected (hidden or dimmed).
  final Set<String> dimIds;

  @override
  Widget build(BuildContext context) {
    final count = scene.props.length;
    final hasVideo = scene.video != null;
    final hasImage = scene.image != null;
    final hasArt = hasImage || hasVideo;
    final wash = hasArt
        ? const [Color(0xFFFFFBF8), Color(0xFFF4EFE8)]
        : scene.sky;
    final showGround = scene.ground != null && !hasArt;
    Widget view = ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: Container(
        height: height,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: wash,
          ),
        ),
        child: Stack(
          fit: StackFit.expand,
          children: [
            if (showGround)
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                height: height * .22,
                child: ColoredBox(color: scene.ground!),
              ),
            // Poster still — always present; video covers it when playing.
            // Square module art fills the frame; cover only when props need a pad.
            if (hasImage)
              Padding(
                padding: EdgeInsets.all(
                  hasVideo
                      ? 0
                      : (count == 0
                          ? 0
                          : (scene.props.any((p) => p.isHitbox) ? 4 : 8)),
                ),
                child: Image.asset(
                  scene.image!,
                  fit: hasVideo || count == 0 ? BoxFit.cover : BoxFit.contain,
                  alignment: Alignment.center,
                  filterQuality: FilterQuality.medium,
                  errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                ),
              ),
            if (hasVideo) SceneVideo(scene.video!),
            for (var i = 0; i < count; i++)
              Align(
                alignment: Alignment(scene.props[i].x, scene.props[i].y),
                child: _entrance(i, count, _prop(context, scene.props[i])),
              ),
          ],
        ),
      ),
    );
    if (scene.quake) view = Moving(motion: Motion.shake, child: view);
    return view;
  }

  Widget _prop(BuildContext context, Prop prop) {
    final id = prop.id;
    final dimmed = id != null && dimIds.contains(id);
    if (dimmed) return const SizedBox.shrink();

    final mark = id == null ? null : marked[id];
    final canDrag = id != null && draggableIds.contains(id) && onDrop != null;
    final canDrop = id != null && dropTargetIds.contains(id) && onDrop != null;
    final canTap = id != null && onTapProp != null;

    // Hitboxes: no floating emoji — soft ring over the object in the image.
    if (prop.isHitbox) {
      if (id == null) return const SizedBox.shrink();
      Widget zone = _HitZone(
        size: prop.size,
        mark: mark,
        dropTarget: canDrop,
        glowing: false,
      );
      if (canTap) {
        zone = Semantics(
          button: true,
          label: prop.label ?? 'Tap target',
          child: GestureDetector(onTap: () => onTapProp!(id), child: zone),
        );
      }
      if (canDrop) {
        zone = DragTarget<String>(
          onWillAcceptWithDetails: (details) => details.data != id,
          onAcceptWithDetails: (details) => onDrop!(details.data, id),
          builder: (context, candidate, rejected) {
            return _HitZone(
              size: prop.size,
              mark: mark,
              dropTarget: true,
              glowing: candidate.isNotEmpty,
            );
          },
        );
      }
      return zone;
    }

    Widget art = Moving(
      motion: prop.motion,
      phase: prop.phase,
      child: PropArt(prop.art, size: prop.size),
    );

    if (id == null) return art;

    Widget ring(Widget child) => Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: mark == null
            ? Colors.white.withValues(alpha: canDrop ? .45 : .3)
            : (mark ? const Color(0xFF79A991) : QuestColors.coral)
                  .withValues(alpha: .45),
        border: Border.all(
          color: mark == null
              ? (canDrop ? QuestColors.coral : Colors.white)
              : (mark ? const Color(0xFF3F7D5C) : QuestColors.coral),
          width: canDrop ? 4 : 3,
        ),
      ),
      child: child,
    );

    if (canDrag) {
      art = Draggable<String>(
        data: id,
        feedback: Material(
          color: Colors.transparent,
          child: PropArt(prop.art, size: prop.size * 1.15),
        ),
        childWhenDragging: Opacity(
          opacity: .3,
          child: PropArt(prop.art, size: prop.size),
        ),
        child: Semantics(
          button: true,
          label: 'Drag ${prop.label ?? prop.art}',
          child: ring(art),
        ),
      );
    } else if (canTap) {
      art = Semantics(
        button: true,
        label: prop.label ?? prop.art,
        child: GestureDetector(
          onTap: () => onTapProp!(id),
          child: ring(art),
        ),
      );
    } else if (canDrop || mark != null) {
      art = ring(art);
    }

    if (canDrop) {
      art = DragTarget<String>(
        onWillAcceptWithDetails: (details) => details.data != id,
        onAcceptWithDetails: (details) => onDrop!(details.data, id),
        builder: (context, candidate, rejected) {
          final hot = candidate.isNotEmpty;
          return AnimatedScale(
            scale: hot ? 1.12 : 1,
            duration: const Duration(milliseconds: 120),
            child: art,
          );
        },
      );
    }

    return art;
  }

  Widget _entrance(int index, int count, Widget child) {
    final start = count <= 1 ? 0.0 : index / (count + 1);
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: Duration(milliseconds: 450 + count * 140),
      curve: Interval(start, 1, curve: Curves.easeOutBack),
      builder: (context, t, child) => Opacity(
        opacity: t.clamp(0, 1),
        child: Transform.scale(scale: .4 + .6 * t, child: child),
      ),
      child: child,
    );
  }
}


class _HitZone extends StatelessWidget {
  const _HitZone({
    required this.size,
    required this.mark,
    required this.dropTarget,
    required this.glowing,
  });
  final double size;
  final bool? mark;
  final bool dropTarget;
  final bool glowing;

  @override
  Widget build(BuildContext context) {
    Color border;
    Color fill;
    if (mark == true) {
      border = const Color(0xFF3F7D5C);
      fill = const Color(0xFF79A991).withValues(alpha: .4);
    } else if (mark == false) {
      border = QuestColors.coral;
      fill = QuestColors.coral.withValues(alpha: .4);
    } else if (glowing) {
      border = QuestColors.coral;
      fill = QuestColors.coral.withValues(alpha: .22);
    } else if (dropTarget) {
      border = QuestColors.coral.withValues(alpha: .7);
      fill = Colors.white.withValues(alpha: .06);
    } else {
      // Soft ring only — the object is already in the image.
      border = Colors.white.withValues(alpha: .55);
      fill = Colors.transparent;
    }
    return AnimatedContainer(
      duration: const Duration(milliseconds: 120),
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: fill,
        border: Border.all(
          color: border,
          width: mark != null || dropTarget || glowing ? 3.5 : 2,
        ),
        boxShadow: glowing
            ? [
                BoxShadow(
                  color: QuestColors.coral.withValues(alpha: .4),
                  blurRadius: 10,
                  spreadRadius: 1,
                ),
              ]
            : null,
      ),
    );
  }
}

/// Renders a prop's picture. Emoji become cartoon art on every phone; a few
/// shapes that have no emoji, like a classroom table, are drawn here.
class PropArt extends StatelessWidget {
  const PropArt(this.art, {super.key, this.size = 64});
  final String art;
  final double size;

  @override
  Widget build(BuildContext context) => switch (art) {
    'table' => _table(),
    'hit' => SizedBox(width: size, height: size),
    'cross' => Icon(Icons.close_rounded, size: size, color: QuestColors.coral),
    _ => ClayIcon(art, size: size * .92),
  };

  Widget _table() {
    final wood = const Color(0xFFB9784A);
    final legs = const Color(0xFF8E5530);
    return SizedBox(
      width: size * 1.9,
      height: size,
      child: Stack(
        children: [
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: size * .2,
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: wood,
                borderRadius: BorderRadius.circular(size * .08),
                boxShadow: [
                  BoxShadow(
                    color: QuestColors.ink.withValues(alpha: .2),
                    offset: const Offset(0, 3),
                    blurRadius: 4,
                  ),
                ],
              ),
            ),
          ),
          for (final left in [size * .12, size * 1.62])
            Positioned(
              top: size * .18,
              left: left,
              width: size * .16,
              bottom: 0,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: legs,
                  borderRadius: BorderRadius.circular(size * .05),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// Loops a [Motion] on its child. Honors the phone's reduce-motion setting.
class Moving extends StatefulWidget {
  const Moving({
    super.key,
    required this.motion,
    required this.child,
    this.phase = 0,
  });
  final Motion motion;
  final Widget child;
  final double phase;
  @override
  State<Moving> createState() => _MovingState();
}

class _MovingState extends State<Moving> with SingleTickerProviderStateMixin {
  late final AnimationController _loop = AnimationController(
    vsync: this,
    duration: _duration(widget.motion),
  );

  static Duration _duration(Motion motion) => Duration(
    milliseconds: switch (motion) {
      Motion.shake => 900,
      Motion.flicker => 700,
      Motion.bounce => 1100,
      Motion.pulse => 1400,
      Motion.rise => 3200,
      Motion.drift => 5000,
      Motion.spin => 2800,
      _ => 2600,
    },
  );

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _sync();
  }

  @override
  void didUpdateWidget(Moving old) {
    super.didUpdateWidget(old);
    if (old.motion != widget.motion) {
      _loop.duration = _duration(widget.motion);
      _loop.stop();
      _sync();
    }
  }

  void _sync() {
    final still =
        widget.motion == Motion.still ||
        MediaQuery.disableAnimationsOf(context);
    if (still) {
      _loop.stop();
    } else if (!_loop.isAnimating) {
      _loop.repeat();
    }
  }

  @override
  void dispose() {
    _loop.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.motion == Motion.still) return widget.child;
    return AnimatedBuilder(
      animation: _loop,
      child: widget.child,
      builder: (context, child) {
        final t = (_loop.value + widget.phase) % 1;
        final wave = math.sin(t * 2 * math.pi);
        return switch (widget.motion) {
          Motion.shake => Transform.translate(
            offset: Offset(math.sin(t * 2 * math.pi * 6) * 5, wave * 1.5),
            child: child,
          ),
          Motion.bounce => Transform.translate(
            offset: Offset(0, -math.sin(t * math.pi).abs() * 12),
            child: child,
          ),
          Motion.float => Transform.translate(
            offset: Offset(0, wave * 7),
            child: child,
          ),
          Motion.pulse => Transform.scale(scale: 1 + wave * .08, child: child),
          Motion.flicker => Opacity(
            opacity: .82 + .18 * math.sin(t * 2 * math.pi * 3).abs(),
            child: Transform.scale(
              scaleY: 1 + math.sin(t * 2 * math.pi * 2) * .1,
              alignment: Alignment.bottomCenter,
              child: child,
            ),
          ),
          Motion.sway => Transform.rotate(angle: wave * .09, child: child),
          Motion.spin => Transform.rotate(
            angle: t * 2 * math.pi,
            child: child,
          ),
          Motion.rise => Opacity(
            opacity: (1 - t).clamp(0, 1),
            child: Transform.translate(
              offset: Offset(wave * 6, 24 - t * 70),
              child: child,
            ),
          ),
          Motion.drift => Transform.translate(
            offset: Offset(wave * 30, 0),
            child: child,
          ),
          Motion.still => child!,
        };
      },
    );
  }
}

/// A silent, looping video. Covers the poster image once it is ready.
class SceneVideo extends StatefulWidget {
  const SceneVideo(this.asset, {super.key});
  final String asset;
  @override
  State<SceneVideo> createState() => _SceneVideoState();
}

class _SceneVideoState extends State<SceneVideo> {
  VideoPlayerController? _video;
  bool _ready = false;

  @override
  void initState() {
    super.initState();
    _start();
  }

  @override
  void didUpdateWidget(SceneVideo old) {
    super.didUpdateWidget(old);
    if (old.asset != widget.asset) {
      _video?.dispose();
      _video = null;
      _ready = false;
      _start();
    }
  }

  Future<void> _start() async {
    final controller = VideoPlayerController.asset(widget.asset);
    _video = controller;
    try {
      await controller.initialize();
      await controller.setVolume(0);
      await controller.setLooping(true);
      if (!mounted || _video != controller) return;
      if (!MediaQuery.disableAnimationsOf(context)) await controller.play();
      if (mounted && _video == controller) setState(() => _ready = true);
    } catch (_) {
      // Missing file or codec: poster image stays.
    }
  }

  @override
  void dispose() {
    _video?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final video = _video;
    if (!_ready || video == null || !video.value.isInitialized) {
      return const SizedBox.expand();
    }
    return FittedBox(
      fit: BoxFit.cover,
      clipBehavior: Clip.hardEdge,
      child: SizedBox(
        width: video.value.size.width,
        height: video.value.size.height,
        child: VideoPlayer(video),
      ),
    );
  }
}
