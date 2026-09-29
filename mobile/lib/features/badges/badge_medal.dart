import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:safetyquest_mobile/core/theme/quest_theme.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_models.dart';

/// Each quest's badge: an enamel colour and the symbol stamped on it.
({Color color, IconData icon}) badgeStyle(LessonContent content) =>
    switch (content.key) {
      'emergency-basics' => (
          color: const Color(0xFF2BA39A),
          icon: PhosphorIconsFill.compass,
        ),
      'earthquake' => (
          color: const Color(0xFFC0783D),
          icon: PhosphorIconsFill.buildings,
        ),
      'fire-safety' => (
          color: const Color(0xFFE4533A),
          icon: PhosphorIconsFill.fire,
        ),
      'fire' => (
          color: const Color(0xFFD9432F),
          icon: PhosphorIconsFill.fireExtinguisher,
        ),
      'flood-safety' => (
          color: const Color(0xFF2F7FD1),
          icon: PhosphorIconsFill.waves,
        ),
      'typhoon-safety' => (
          color: const Color(0xFF5B6BD6),
          icon: PhosphorIconsFill.hurricane,
        ),
      'evacuation-drills' => (
          color: const Color(0xFF3FA35B),
          icon: PhosphorIconsFill.flag,
        ),
      'go-bag' => (
          color: const Color(0xFFE39B2B),
          icon: PhosphorIconsFill.backpack,
        ),
      'emergency-comm' => (
          color: const Color(0xFF8E5BD6),
          icon: PhosphorIconsFill.phoneCall,
        ),
      'stranger-danger' => (
          color: const Color(0xFFD6508A),
          icon: PhosphorIconsFill.handPalm,
        ),
      'cyber-safety' => (
          color: const Color(0xFF2F9BB3),
          icon: PhosphorIconsFill.lockKey,
        ),
      'road-safety' => (
          color: const Color(0xFFEF7B2A),
          icon: PhosphorIconsFill.trafficCone,
        ),
      'first-aid' => (
          color: const Color(0xFFE86A6A),
          icon: PhosphorIconsFill.bandaids,
        ),
      'bullying' => (
          color: const Color(0xFF5B7FD6),
          icon: PhosphorIconsFill.handshake,
        ),
      'water-safety' => (
          color: const Color(0xFF2A9FD6),
          icon: PhosphorIconsFill.lifebuoy,
        ),
      'household-electricity' => (
          color: const Color(0xFFE3A12B),
          icon: PhosphorIconsFill.plug,
        ),
      _ => (color: content.color, icon: PhosphorIconsFill.sealCheck),
    };

Color _shade(Color c, double amount) {
  final hsl = HSLColor.fromColor(c);
  return hsl
      .withLightness((hsl.lightness + amount).clamp(0.0, 1.0))
      .toColor();
}

/// A 3D medal drawn in code: ribbon tails, a gold bevelled rim, a glossy
/// enamel face and an embossed symbol. Locked badges are grey with a padlock.
class BadgeMedal extends StatelessWidget {
  const BadgeMedal({
    super.key,
    required this.content,
    this.earned = true,
    this.size = 88,
  });
  final LessonContent content;
  final bool earned;
  final double size;

  @override
  Widget build(BuildContext context) {
    final style = badgeStyle(content);
    final medal = SizedBox(
      width: size,
      height: size * 1.22,
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.topCenter,
        children: [
          // Ribbon tails behind the medal.
          for (final side in [-1.0, 1.0])
            Positioned(
              top: size * .6,
              left: size / 2 - size * .17 + side * size * .15,
              child: Transform.rotate(
                angle: side * .32,
                child: CustomPaint(
                  size: Size(size * .34, size * .58),
                  painter: _RibbonPainter(
                    side < 0
                        ? _shade(style.color, -.12)
                        : _shade(style.color, -.2),
                  ),
                ),
              ),
            ),
          // Drop shadow + gold rim.
          Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const SweepGradient(
                colors: [
                  Color(0xFFFFE08A),
                  Color(0xFFD99A1E),
                  Color(0xFFFFF1B8),
                  Color(0xFFC98612),
                  Color(0xFFFFE08A),
                ],
                transform: GradientRotation(-math.pi / 4),
              ),
              boxShadow: [
                BoxShadow(
                  color: _shade(style.color, -.3).withValues(alpha: .35),
                  blurRadius: size * .18,
                  offset: Offset(0, size * .09),
                ),
              ],
            ),
            padding: EdgeInsets.all(size * .07),
            // Inner bevel: the rim's light and dark edges swapped.
            child: Container(
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFFB57A0E), Color(0xFFFFE9A6)],
                ),
              ),
              padding: EdgeInsets.all(size * .035),
              // Enamel face.
              child: Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    center: const Alignment(-.35, -.4),
                    radius: 1.05,
                    colors: [
                      _shade(style.color, .18),
                      style.color,
                      _shade(style.color, -.16),
                    ],
                    stops: const [0, .55, 1],
                  ),
                ),
                clipBehavior: Clip.antiAlias,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    // Embossed symbol: a dark drop below, the white face on top.
                    Transform.translate(
                      offset: Offset(0, size * .02),
                      child: Icon(
                        style.icon,
                        size: size * .4,
                        color: _shade(style.color, -.28).withValues(alpha: .7),
                      ),
                    ),
                    Icon(
                      style.icon,
                      size: size * .4,
                      color: Colors.white,
                      shadows: [
                        Shadow(
                          color: Colors.white.withValues(alpha: .6),
                          offset: Offset(0, -size * .008),
                        ),
                      ],
                    ),
                    // Gloss across the top half.
                    Positioned(
                      top: -size * .12,
                      left: size * .02,
                      right: size * .02,
                      child: Container(
                        height: size * .42,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.vertical(
                            bottom: Radius.elliptical(size, size * .3),
                          ),
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.white.withValues(alpha: .5),
                              Colors.white.withValues(alpha: 0),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );

    if (earned) return medal;
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Opacity(
          opacity: .45,
          child: ColorFiltered(
            colorFilter: const ColorFilter.matrix([
              .33, .33, .33, 0, 0, //
              .33, .33, .33, 0, 0,
              .33, .33, .33, 0, 0,
              0, 0, 0, 1, 0,
            ]),
            child: medal,
          ),
        ),
        Positioned(
          right: 0,
          top: size * .62,
          child: Container(
            width: size * .32,
            height: size * .32,
            decoration: BoxDecoration(
              color: QuestColors.ink,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 2),
            ),
            child: Icon(
              PhosphorIconsFill.lock,
              size: size * .16,
              color: Colors.white,
            ),
          ),
        ),
      ],
    );
  }
}

class _RibbonPainter extends CustomPainter {
  const _RibbonPainter(this.color);
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    // A tail with a V notch cut into its end.
    final path = Path()
      ..moveTo(0, 0)
      ..lineTo(w, 0)
      ..lineTo(w, h)
      ..lineTo(w / 2, h * .8)
      ..lineTo(0, h)
      ..close();
    canvas.drawPath(path, Paint()..color = color);
    canvas.drawRect(
      Rect.fromLTWH(w * .38, 0, w * .24, h * .86),
      Paint()..color = Colors.white.withValues(alpha: .25),
    );
  }

  @override
  bool shouldRepaint(_RibbonPainter old) => old.color != color;
}
