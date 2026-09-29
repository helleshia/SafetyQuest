import 'dart:math' as math;

import 'package:flutter/material.dart';

/// A 3D magnifying glass drawn in code, in the same finish as the badges:
/// a soft shadow, a coral handle, a gold bevelled rim and a glossy lens.
class Magnifier3D extends StatelessWidget {
  const Magnifier3D({super.key, this.size = 64});
  final double size;

  @override
  Widget build(BuildContext context) =>
      CustomPaint(size: Size.square(size), painter: const _MagnifierPainter());
}

class _MagnifierPainter extends CustomPainter {
  const _MagnifierPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final s = size.width;
    final lens = Offset(s * .42, s * .40);
    final r = s * .27;

    // Ground shadow.
    canvas.drawOval(
      Rect.fromCenter(
        center: Offset(s * .52, s * .92),
        width: s * .7,
        height: s * .12,
      ),
      Paint()
        ..color = const Color(0x333A1C1F)
        ..maskFilter = MaskFilter.blur(BlurStyle.normal, s * .03),
    );

    // Handle: a rounded bar pointing down-right, lit along its top edge.
    canvas.save();
    canvas.translate(lens.dx, lens.dy);
    canvas.rotate(math.pi / 4);
    final handle = RRect.fromRectAndRadius(
      Rect.fromLTWH(r * .9, -s * .075, s * .42, s * .15),
      Radius.circular(s * .075),
    );
    canvas.drawRRect(
      handle.shift(Offset(0, s * .02)),
      Paint()..color = const Color(0x40000000),
    );
    canvas.drawRRect(
      handle,
      Paint()
        ..shader = const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFFF7A97F), Color(0xFFE45D3C), Color(0xFFB8402A)],
          stops: [0, .5, 1],
        ).createShader(handle.outerRect),
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(r * .9 + s * .05, -s * .055, s * .3, s * .035),
        Radius.circular(s * .02),
      ),
      Paint()..color = Colors.white.withValues(alpha: .45),
    );
    // Gold collar where the handle meets the rim.
    final collar = RRect.fromRectAndRadius(
      Rect.fromLTWH(r * .82, -s * .085, s * .09, s * .17),
      Radius.circular(s * .03),
    );
    canvas.drawRRect(
      collar,
      Paint()
        ..shader = const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFFFFE9A6), Color(0xFFD99A1E), Color(0xFFB57A0E)],
        ).createShader(collar.outerRect),
    );
    canvas.restore();

    // Rim: a thick gold ring with a metallic sweep.
    final rimRect = Rect.fromCircle(center: lens, radius: r);
    canvas.drawCircle(
      lens.translate(0, s * .02),
      r + s * .04,
      Paint()..color = const Color(0x33000000),
    );
    canvas.drawCircle(
      lens,
      r + s * .035,
      Paint()
        ..shader = const SweepGradient(
          colors: [
            Color(0xFFFFE08A),
            Color(0xFFD99A1E),
            Color(0xFFFFF1B8),
            Color(0xFFC98612),
            Color(0xFFFFE08A),
          ],
          transform: GradientRotation(-math.pi / 4),
        ).createShader(rimRect.inflate(s * .035)),
    );

    // Lens: pale glass, brighter towards the light.
    canvas.drawCircle(
      lens,
      r - s * .005,
      Paint()
        ..shader = const RadialGradient(
          center: Alignment(-.4, -.45),
          radius: 1.1,
          colors: [Color(0xFFFFFFFF), Color(0xFFD5ECF7), Color(0xFF8CC3E0)],
          stops: [0, .45, 1],
        ).createShader(rimRect),
    );
    // Inner shade along the lower edge, for depth.
    canvas.drawCircle(
      lens,
      r - s * .005,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = s * .025
        ..shader = const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0x00000000), Color(0x332D5F7A)],
        ).createShader(rimRect),
    );
    // Glints.
    canvas.drawArc(
      Rect.fromCircle(center: lens, radius: r * .68),
      math.pi * 1.05,
      math.pi * .45,
      false,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round
        ..strokeWidth = s * .045
        ..color = Colors.white.withValues(alpha: .85),
    );
    canvas.drawCircle(
      lens.translate(r * .42, r * .38),
      s * .025,
      Paint()..color = Colors.white.withValues(alpha: .6),
    );
  }

  @override
  bool shouldRepaint(_MagnifierPainter oldDelegate) => false;
}
