import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

abstract final class QuestColors {
  /// Warm paper — calm base, not muddy grey-cream.
  static const paper = Color(0xFFFAF7F2);

  /// Deep burgundy ink for titles and primary text.
  static const ink = Color(0xFF3A1C1F);

  /// Secondary text — cooler brown for readable hierarchy.
  static const muted = Color(0xFF7A6562);

  /// Accent / primary CTA.
  static const coral = Color(0xFFE45D3C);

  static const peach = Color(0xFFF6D9CC);
  static const mint = Color(0xFFD8E8D9);
  static const lilac = Color(0xFFE4DCF0);
  static const yellow = Color(0xFFF3E2A8);
  static const blue = Color(0xFFD5E6EF);

  /// Soft surface for cards sitting on paper.
  static const surface = Color(0xFFFFFCF9);

  /// Hairline borders.
  static const line = Color(0xFFE8DDD6);
}

ThemeData questTheme() => ThemeData(
  useMaterial3: true,
  fontFamily: GoogleFonts.manrope().fontFamily,
  scaffoldBackgroundColor: QuestColors.paper,
  colorScheme: ColorScheme.fromSeed(
    seedColor: QuestColors.coral,
    primary: QuestColors.ink,
    surface: QuestColors.paper,
  ),
  textTheme: GoogleFonts.manropeTextTheme(
    const TextTheme(
      headlineLarge: TextStyle(
        fontSize: 36,
        height: 1.12,
        fontWeight: FontWeight.w800,
        letterSpacing: -0.8,
        color: QuestColors.ink,
      ),
      headlineMedium: TextStyle(
        fontSize: 28,
        height: 1.15,
        fontWeight: FontWeight.w800,
        letterSpacing: -0.5,
        color: QuestColors.ink,
      ),
      titleLarge: TextStyle(
        fontSize: 21,
        fontWeight: FontWeight.w800,
        letterSpacing: 0,
        color: QuestColors.ink,
      ),
      titleMedium: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w700,
        color: QuestColors.ink,
      ),
      bodyLarge: TextStyle(
        fontSize: 16,
        height: 1.55,
        color: QuestColors.muted,
      ),
      bodyMedium: TextStyle(
        fontSize: 14,
        height: 1.5,
        color: QuestColors.muted,
      ),
    ),
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: const Color(0xFFFFFBF7),
    contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(18),
      borderSide: const BorderSide(color: Color(0xFFE8D9D1)),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(18),
      borderSide: const BorderSide(color: Color(0xFFE8D9D1)),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(18),
      borderSide: const BorderSide(color: QuestColors.coral, width: 2),
    ),
    labelStyle: const TextStyle(color: QuestColors.muted),
  ),
  filledButtonTheme: FilledButtonThemeData(
    style: FilledButton.styleFrom(
      backgroundColor: QuestColors.coral,
      foregroundColor: Colors.white,
      disabledBackgroundColor: QuestColors.ink.withValues(alpha: .12),
      disabledForegroundColor: QuestColors.muted,
      minimumSize: const Size(double.infinity, 54),
      maximumSize: const Size(double.infinity, 54),
      padding: const EdgeInsets.symmetric(horizontal: 20),
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      textStyle: GoogleFonts.manrope(
        fontSize: 16,
        fontWeight: FontWeight.w800,
        letterSpacing: .2,
      ),
    ),
  ),
);

class ClayCard extends StatelessWidget {
  const ClayCard({
    super.key,
    required this.child,
    this.color = QuestColors.surface,
    this.padding = const EdgeInsets.all(18),
    this.elevated = true,
    this.radius = 24,
  });
  final Widget child;
  final Color color;
  final EdgeInsetsGeometry padding;
  final bool elevated;
  final double radius;

  @override
  Widget build(BuildContext context) => Container(
    padding: padding,
    decoration: Clay.raised(
      color: color,
      radius: radius,
      elevated: elevated,
    ),
    child: child,
  );
}

/// Shared claymorphism recipes — soft dual shadows, no harsh flat cards.
abstract final class Clay {
  static BoxDecoration raised({
    Color color = QuestColors.surface,
    double radius = 24,
    bool elevated = true,
  }) =>
      BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: Colors.white.withValues(alpha: .85), width: 1.5),
        boxShadow: elevated
            ? [
                // Soft ambient drop.
                BoxShadow(
                  color: QuestColors.ink.withValues(alpha: .08),
                  offset: const Offset(0, 10),
                  blurRadius: 22,
                  spreadRadius: -2,
                ),
                // Bottom-right emboss.
                BoxShadow(
                  color: QuestColors.ink.withValues(alpha: .05),
                  offset: const Offset(4, 6),
                  blurRadius: 10,
                ),
                // Top-left clay highlight.
                BoxShadow(
                  color: Colors.white.withValues(alpha: .9),
                  offset: const Offset(-3, -3),
                  blurRadius: 8,
                ),
              ]
            : null,
      );

  static BoxDecoration pill({
    Color color = QuestColors.surface,
    double radius = 28,
  }) =>
      BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: Colors.white.withValues(alpha: .9), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: QuestColors.ink.withValues(alpha: .12),
            offset: const Offset(0, 12),
            blurRadius: 28,
            spreadRadius: -4,
          ),
          BoxShadow(
            color: Colors.white.withValues(alpha: .95),
            offset: const Offset(-2, -2),
            blurRadius: 8,
          ),
        ],
      );

  static BoxDecoration inset({
    Color color = const Color(0xFFF3EDE6),
    double radius = 14,
  }) =>
      BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(radius),
        boxShadow: [
          BoxShadow(
            color: QuestColors.ink.withValues(alpha: .08),
            offset: const Offset(0, 2),
            blurRadius: 4,
            spreadRadius: 0,
          ),
          const BoxShadow(
            color: Colors.white,
            offset: Offset(0, -1),
            blurRadius: 2,
          ),
        ],
      );
}


class QuestButton extends StatelessWidget {
  const QuestButton(
    this.label, {
    super.key,
    required this.onPressed,
    this.busy = false,
    this.icon = Icons.arrow_forward_rounded,
    this.tone = QuestButtonTone.accent,
  });
  final String label;
  final VoidCallback? onPressed;
  final bool busy;
  final IconData icon;
  final QuestButtonTone tone;

  @override
  Widget build(BuildContext context) {
    final bg = switch (tone) {
      QuestButtonTone.accent => QuestColors.coral,
      QuestButtonTone.ink => QuestColors.ink,
      QuestButtonTone.soft => QuestColors.surface,
    };
    final fg = tone == QuestButtonTone.soft ? QuestColors.ink : Colors.white;
    return Container(
      width: double.infinity,
      height: 54,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        boxShadow: onPressed == null || busy
            ? null
            : [
                BoxShadow(
                  color: (tone == QuestButtonTone.soft
                          ? QuestColors.ink
                          : bg)
                      .withValues(alpha: .28),
                  offset: const Offset(0, 8),
                  blurRadius: 16,
                  spreadRadius: -2,
                ),
                BoxShadow(
                  color: Colors.white.withValues(alpha: .55),
                  offset: const Offset(0, -2),
                  blurRadius: 4,
                ),
              ],
      ),
      child: FilledButton(
        onPressed: busy ? null : onPressed,
        style: FilledButton.styleFrom(
          backgroundColor: bg,
          foregroundColor: fg,
          disabledBackgroundColor: QuestColors.ink.withValues(alpha: .12),
          elevation: 0,
          shadowColor: Colors.transparent,
          padding: const EdgeInsets.symmetric(horizontal: 18),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
            side: tone == QuestButtonTone.soft
                ? BorderSide(color: Colors.white.withValues(alpha: .9))
                : BorderSide(color: Colors.white.withValues(alpha: .25)),
          ),
        ),
        child: busy
            ? SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(
                  strokeWidth: 2.4,
                  color: fg,
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Flexible(
                    child: Text(
                      label,
                      textAlign: TextAlign.center,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: fg,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Icon(icon, size: 20, color: fg),
                ],
              ),
      ),
    );
  }
}

enum QuestButtonTone { accent, ink, soft }

class Eyebrow extends StatelessWidget {
  const Eyebrow(this.text, {super.key});
  final String text;
  @override
  Widget build(BuildContext context) => Text(
    text.toUpperCase(),
    maxLines: 1,
    overflow: TextOverflow.ellipsis,
    style: const TextStyle(
      fontSize: 11,
      fontWeight: FontWeight.w800,
      letterSpacing: 1.4,
      color: QuestColors.muted,
    ),
  );
}

class Brand extends StatelessWidget {
  const Brand({super.key});
  @override
  Widget build(BuildContext context) => Wrap(
    crossAxisAlignment: WrapCrossAlignment.center,
    spacing: 9,
    children: [
      ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Image.asset('assets/logo.png', width: 36, height: 36),
      ),
      const Text(
        'SafetyQuest',
        style: TextStyle(
          fontWeight: FontWeight.w800,
          fontSize: 19,
          letterSpacing: -.8,
          color: QuestColors.ink,
        ),
        overflow: TextOverflow.ellipsis,
      ),
    ],
  );
}

// The large logo lockup used at the top of the login and welcome steps.
class BrandHero extends StatelessWidget {
  const BrandHero({super.key});
  @override
  Widget build(BuildContext context) => Semantics(
    label: 'SafetyQuest',
    image: true,
    child: ExcludeSemantics(
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          // The artwork carries transparent glow on each side; trim it so the
          // wordmark sits right against the shield.
          SizedBox(
            width: 112,
            height: 108,
            child: OverflowBox(
              maxWidth: 144,
              child: Image.asset(
                'assets/logo.png',
                width: 144,
                height: 108,
                fit: BoxFit.contain,
              ),
            ),
          ),
          const SizedBox(width: 10),
          // Shrinks on narrow phones or large text settings instead of overflowing.
          Flexible(
            child: FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Text(
                'Safety\nQuest',
                style: Theme.of(
                  context,
                ).textTheme.headlineLarge?.copyWith(fontSize: 40, height: .95),
              ),
            ),
          ),
        ],
      ),
    ),
  );
}

// A clay illustration on a soft tinted halo, floating gently. The badge echoes
// the moment (a plus to begin, a check when done, a star for progress).
class QuestBuddy extends StatefulWidget {
  const QuestBuddy({
    super.key,
    this.size = 240,
    this.color = QuestColors.coral,
    this.symbol = Icons.add_rounded,
    this.image = 'assets/cool_student.png',
  });
  final double size;
  final Color color;
  final IconData symbol;
  final String image;
  @override
  State<QuestBuddy> createState() => _QuestBuddyState();
}

class _QuestBuddyState extends State<QuestBuddy>
    with SingleTickerProviderStateMixin {
  late final AnimationController _float = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 2800),
  );

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (MediaQuery.disableAnimationsOf(context)) {
      _float.stop();
    } else if (!_float.isAnimating) {
      _float.repeat(reverse: true);
    }
  }

  @override
  void dispose() {
    _float.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final color = widget.color;
    final lift = CurvedAnimation(parent: _float, curve: Curves.easeInOut);
    return Semantics(
      label: 'SafetyQuest illustration',
      image: true,
      child: SizedBox(
        width: widget.size,
        height: widget.size,
        child: FittedBox(
          child: SizedBox(
            width: 260,
            height: 260,
            child: Stack(
              alignment: Alignment.center,
              children: [
                Container(
                  width: 214,
                  height: 214,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        Color.lerp(color, Colors.white, .72)!,
                        Color.lerp(color, Colors.white, .86)!,
                        Color.lerp(color, QuestColors.paper, .94)!,
                      ],
                      stops: const [0, .7, 1],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.white.withValues(alpha: .9),
                        offset: const Offset(-6, -6),
                        blurRadius: 14,
                      ),
                      BoxShadow(
                        color: QuestColors.ink.withValues(alpha: .08),
                        offset: const Offset(6, 10),
                        blurRadius: 22,
                      ),
                    ],
                  ),
                ),
                AnimatedBuilder(
                  animation: lift,
                  builder: (context, child) {
                    final t = lift.value;
                    return Stack(
                      alignment: Alignment.center,
                      children: [
                        Positioned(
                          bottom: 30,
                          child: Container(
                            width: 96 - 14 * t,
                            height: 12,
                            decoration: BoxDecoration(
                              color: QuestColors.ink.withValues(
                                alpha: .10 - .03 * t,
                              ),
                              borderRadius: BorderRadius.circular(50),
                            ),
                          ),
                        ),
                        Transform.translate(
                          offset: Offset(0, -8 * t),
                          child: child,
                        ),
                      ],
                    );
                  },
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: Image.asset(
                      widget.image,
                      width: 220,
                      height: 220,
                      fit: BoxFit.contain,
                      filterQuality: FilterQuality.medium,
                    ),
                  ),
                ),
                Positioned(
                  top: 34,
                  right: 30,
                  child: Container(
                    width: 46,
                    height: 46,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [Color.lerp(color, Colors.white, .25)!, color],
                      ),
                      border: Border.all(color: Colors.white, width: 3),
                      boxShadow: [
                        BoxShadow(
                          color: QuestColors.ink.withValues(alpha: .16),
                          offset: const Offset(3, 5),
                          blurRadius: 8,
                        ),
                      ],
                    ),
                    child: Icon(
                      widget.symbol,
                      size: 26,
                      color: const Color(0xFFFFF4E9),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class Notice extends StatelessWidget {
  const Notice(this.message, {super.key, this.error = false});
  final String message;
  final bool error;
  @override
  Widget build(BuildContext context) => Semantics(
    liveRegion: true,
    child: Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: Clay.raised(
        color: error ? QuestColors.peach : QuestColors.mint,
        radius: 18,
      ),
      child: Text(
        message,
        style: const TextStyle(color: QuestColors.ink, height: 1.5),
      ),
    ),
  );
}

/// A puffy raised clay disc with an icon inside, drawn in code so it stays
/// crisp at every density. Shared by onboarding and the sign-in flow.
class Clay3DIcon extends StatelessWidget {
  const Clay3DIcon({
    super.key,
    required this.icon,
    required this.color,
    required this.size,
  });
  final IconData icon;
  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) => Container(
    width: size,
    height: size,
    decoration: BoxDecoration(
      color: QuestColors.paper,
      shape: BoxShape.circle,
      border: Border.all(color: Colors.white, width: 3),
      boxShadow: [
        // Top-left white highlight — simulates the light source.
        BoxShadow(
          color: Colors.white,
          offset: Offset(-size * .09, -size * .09),
          blurRadius: size * .18,
        ),
        // Bottom-right coloured glow — gives the raised 3D lift.
        BoxShadow(
          color: color.withValues(alpha: .45),
          offset: Offset(size * .09, size * .09),
          blurRadius: size * .21,
        ),
        // Close dark shadow for a crisp emboss separation.
        BoxShadow(
          color: QuestColors.ink.withValues(alpha: .07),
          offset: const Offset(4, 4),
          blurRadius: 8,
        ),
      ],
    ),
    child: Center(
      child: Container(
        // Inner coloured puck — gives the "filled bubble" feel.
        padding: EdgeInsets.all(size * .15),
        decoration: BoxDecoration(
          color: color.withValues(alpha: .18),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, size: size * .42, color: QuestColors.ink),
      ),
    ),
  );
}
