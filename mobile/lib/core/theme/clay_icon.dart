import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:safetyquest_mobile/core/theme/quest_theme.dart';

/// Pastel tints for clay icons, drawn from the landing palette.
abstract final class ClayTint {
  static const coral = Color(0xFFF3A189);
  static const red = Color(0xFFEE8573);
  static const peach = Color(0xFFF7C8AE);
  static const yellow = Color(0xFFF4D68C);
  static const mint = Color(0xFFA9D6BB);
  static const sky = Color(0xFFA9CDE4);
  static const lilac = Color(0xFFC8B7E6);
  static const stone = Color(0xFFD9CFC6);
  static const wood = Color(0xFFD7A77F);
}

class ClayGlyph {
  const ClayGlyph(this.icon, this.tint);
  final IconData icon;
  final Color tint;
}

/// Every symbol the lessons use, as a glyph on a clay tile. Lesson content
/// names its pictures with these keys, so the look stays in one place.
const clayGlyphs = <String, ClayGlyph>{
  // Danger and alerts
  '🔥': ClayGlyph(PhosphorIconsFill.fire, ClayTint.coral),
  '🕯️': ClayGlyph(PhosphorIconsFill.fire, ClayTint.yellow),
  '🚨': ClayGlyph(PhosphorIconsFill.siren, ClayTint.red),
  '⚡': ClayGlyph(PhosphorIconsFill.lightning, ClayTint.yellow),
  '💨': ClayGlyph(PhosphorIconsFill.cloudFog, ClayTint.stone),
  '🌬️': ClayGlyph(PhosphorIconsFill.wind, ClayTint.sky),
  '🌀': ClayGlyph(PhosphorIconsFill.hurricane, ClayTint.sky),
  '🌊': ClayGlyph(PhosphorIconsFill.waves, ClayTint.sky),
  '🌋': ClayGlyph(PhosphorIconsFill.mountains, ClayTint.coral),
  '🌧️': ClayGlyph(PhosphorIconsFill.cloudRain, ClayTint.sky),
  '🌦️': ClayGlyph(PhosphorIconsFill.cloudSun, ClayTint.sky),
  '☁️': ClayGlyph(PhosphorIconsFill.cloud, ClayTint.sky),
  '❄️': ClayGlyph(PhosphorIconsFill.snowflake, ClayTint.sky),
  '🌡️': ClayGlyph(PhosphorIconsFill.thermometerHot, ClayTint.coral),
  '🚫': ClayGlyph(PhosphorIconsFill.prohibit, ClayTint.red),
  '🛑': ClayGlyph(PhosphorIconsFill.hand, ClayTint.red),
  '🔌': ClayGlyph(PhosphorIconsFill.plug, ClayTint.yellow),
  '🌈': ClayGlyph(PhosphorIconsFill.rainbow, ClayTint.lilac),
  '🇵🇭': ClayGlyph(PhosphorIconsFill.globeHemisphereEast, ClayTint.sky),
  '🌪️': ClayGlyph(PhosphorIconsFill.tornado, ClayTint.sky),
  '⛰️': ClayGlyph(PhosphorIconsFill.mountains, ClayTint.mint),
  '🪁': ClayGlyph(PhosphorIconsFill.wind, ClayTint.lilac),

  // Safety gear and help
  '🎒': ClayGlyph(PhosphorIconsFill.backpack, ClayTint.coral),
  '🔦': ClayGlyph(PhosphorIconsFill.flashlight, ClayTint.yellow),
  '💧': ClayGlyph(PhosphorIconsFill.drop, ClayTint.sky),
  '💦': ClayGlyph(PhosphorIconsFill.dropHalf, ClayTint.sky),
  '🩹': ClayGlyph(PhosphorIconsFill.bandaids, ClayTint.peach),
  '🤕': ClayGlyph(PhosphorIconsFill.bandaids, ClayTint.peach),
  '🧯': ClayGlyph(PhosphorIconsFill.fireExtinguisher, ClayTint.red),
  '🛡️': ClayGlyph(PhosphorIconsFill.shieldCheck, ClayTint.mint),
  '📢': ClayGlyph(PhosphorIconsFill.megaphone, ClayTint.coral),
  '🔔': ClayGlyph(PhosphorIconsFill.bell, ClayTint.yellow),
  '📻': ClayGlyph(PhosphorIconsFill.radio, ClayTint.peach),
  '☎️': ClayGlyph(PhosphorIconsFill.phoneCall, ClayTint.mint),
  '📞': ClayGlyph(PhosphorIconsFill.phone, ClayTint.mint),
  '📱': ClayGlyph(PhosphorIconsFill.deviceMobile, ClayTint.lilac),
  '📴': ClayGlyph(PhosphorIconsFill.phoneX, ClayTint.stone),
  '🚑': ClayGlyph(PhosphorIconsFill.ambulance, ClayTint.red),
  '🚒': ClayGlyph(PhosphorIconsFill.fireTruck, ClayTint.red),
  '🚩': ClayGlyph(PhosphorIconsFill.flag, ClayTint.coral),
  '📍': ClayGlyph(PhosphorIconsFill.mapPin, ClayTint.coral),
  '🧭': ClayGlyph(PhosphorIconsFill.compass, ClayTint.sky),
  '🏅': ClayGlyph(PhosphorIconsFill.medal, ClayTint.yellow),
  '⭐': ClayGlyph(PhosphorIconsFill.star, ClayTint.yellow),
  '✅': ClayGlyph(PhosphorIconsFill.checkCircle, ClayTint.mint),
  '🎉': ClayGlyph(PhosphorIconsFill.confetti, ClayTint.yellow),
  '💡': ClayGlyph(PhosphorIconsFill.lightbulb, ClayTint.yellow),
  '🔒': ClayGlyph(PhosphorIconsFill.lock, ClayTint.stone),
  '⏱️': ClayGlyph(PhosphorIconsFill.timer, ClayTint.lilac),

  // Places and things
  '🏠': ClayGlyph(PhosphorIconsFill.house, ClayTint.peach),
  '🏫': ClayGlyph(PhosphorIconsFill.buildings, ClayTint.peach),
  '🚪': ClayGlyph(PhosphorIconsFill.door, ClayTint.wood),
  '🪟': ClayGlyph(PhosphorIconsFill.squaresFour, ClayTint.sky),
  '🖼️': ClayGlyph(PhosphorIconsFill.image, ClayTint.lilac),
  '🛗': ClayGlyph(PhosphorIconsFill.elevator, ClayTint.stone),
  '🛏️': ClayGlyph(PhosphorIconsFill.bed, ClayTint.lilac),
  '🛁': ClayGlyph(PhosphorIconsFill.bathtub, ClayTint.sky),
  '🚽': ClayGlyph(PhosphorIconsFill.toilet, ClayTint.sky),
  '🌳': ClayGlyph(PhosphorIconsFill.tree, ClayTint.mint),
  '🌾': ClayGlyph(PhosphorIconsFill.plant, ClayTint.mint),
  '🪵': ClayGlyph(PhosphorIconsFill.tree, ClayTint.wood),
  '📚': ClayGlyph(PhosphorIconsFill.books, ClayTint.lilac),
  '📕': ClayGlyph(PhosphorIconsFill.book, ClayTint.coral),
  '📘': ClayGlyph(PhosphorIconsFill.book, ClayTint.sky),
  '📖': ClayGlyph(PhosphorIconsFill.bookOpen, ClayTint.sky),
  '📄': ClayGlyph(PhosphorIconsFill.fileText, ClayTint.stone),
  '📋': ClayGlyph(PhosphorIconsFill.clipboardText, ClayTint.lilac),
  '✏️': ClayGlyph(PhosphorIconsFill.pencilSimple, ClayTint.yellow),
  '👕': ClayGlyph(PhosphorIconsFill.tShirt, ClayTint.sky),
  '👟': ClayGlyph(PhosphorIconsFill.sneaker, ClayTint.coral),
  '🎮': ClayGlyph(PhosphorIconsFill.gameController, ClayTint.lilac),
  '🧸': ClayGlyph(PhosphorIconsFill.baby, ClayTint.wood),
  '🎂': ClayGlyph(PhosphorIconsFill.cake, ClayTint.peach),
  '🍭': ClayGlyph(PhosphorIconsFill.cookie, ClayTint.peach),
  '🍱': ClayGlyph(PhosphorIconsFill.bowlFood, ClayTint.yellow),
  '🍞': ClayGlyph(PhosphorIconsFill.bread, ClayTint.wood),
  '📺': ClayGlyph(PhosphorIconsFill.television, ClayTint.lilac),
  '📸': ClayGlyph(PhosphorIconsFill.camera, ClayTint.lilac),
  '🎵': ClayGlyph(PhosphorIconsFill.musicNotes, ClayTint.lilac),
  '⚽': ClayGlyph(PhosphorIconsFill.soccerBall, ClayTint.stone),
  '🐶': ClayGlyph(PhosphorIconsFill.dog, ClayTint.wood),
  '🐦': ClayGlyph(PhosphorIconsFill.bird, ClayTint.sky),
  '🍦': ClayGlyph(PhosphorIconsFill.iceCream, ClayTint.peach),
  '🥫': ClayGlyph(PhosphorIconsFill.bowlSteam, ClayTint.yellow),
  '🚲': ClayGlyph(PhosphorIconsFill.bicycle, ClayTint.sky),
  '🔢': ClayGlyph(PhosphorIconsFill.numpad, ClayTint.lilac),
  '🗣️': ClayGlyph(PhosphorIconsFill.userSound, ClayTint.mint),
  '🏊': ClayGlyph(PhosphorIconsFill.personSimpleSwim, ClayTint.sky),

  // People and actions
  '🧒': ClayGlyph(PhosphorIconsFill.student, ClayTint.peach),
  '👧': ClayGlyph(PhosphorIconsFill.student, ClayTint.lilac),
  '👦': ClayGlyph(PhosphorIconsFill.student, ClayTint.sky),
  '👫': ClayGlyph(PhosphorIconsFill.users, ClayTint.peach),
  '👶': ClayGlyph(PhosphorIconsFill.baby, ClayTint.peach),
  '🧑‍🏫': ClayGlyph(PhosphorIconsFill.chalkboardTeacher, ClayTint.mint),
  '🚶': ClayGlyph(PhosphorIconsFill.personSimpleWalk, ClayTint.mint),
  '🚸': ClayGlyph(PhosphorIconsFill.personSimpleWalk, ClayTint.yellow),
  '🏃': ClayGlyph(PhosphorIconsFill.personSimpleRun, ClayTint.coral),
  '🧗': ClayGlyph(PhosphorIconsFill.personSimpleHike, ClayTint.coral),
  '🤸': ClayGlyph(PhosphorIconsFill.personArmsSpread, ClayTint.coral),
  '🧎': ClayGlyph(PhosphorIconsFill.arrowFatLinesDown, ClayTint.mint),
  '🙇': ClayGlyph(PhosphorIconsFill.shield, ClayTint.mint),
  '✊': ClayGlyph(PhosphorIconsFill.handGrabbing, ClayTint.mint),
  '✋': ClayGlyph(PhosphorIconsFill.hand, ClayTint.peach),
  '👋': ClayGlyph(PhosphorIconsFill.handWaving, ClayTint.peach),
  '👇': ClayGlyph(PhosphorIconsFill.handPointing, ClayTint.peach),
  '🙅': ClayGlyph(PhosphorIconsFill.prohibit, ClayTint.coral),
  '👀': ClayGlyph(PhosphorIconsFill.eye, ClayTint.lilac),
  '👂': ClayGlyph(PhosphorIconsFill.ear, ClayTint.peach),
  '🦵': ClayGlyph(PhosphorIconsFill.footprints, ClayTint.peach),
  '🦶': ClayGlyph(PhosphorIconsFill.footprints, ClayTint.peach),
  '🧠': ClayGlyph(PhosphorIconsFill.brain, ClayTint.lilac),
  '🙈': ClayGlyph(PhosphorIconsFill.eyeClosed, ClayTint.stone),
  '🤫': ClayGlyph(PhosphorIconsFill.speakerSlash, ClayTint.stone),
  '🙂': ClayGlyph(PhosphorIconsFill.smiley, ClayTint.yellow),
  '🔍': ClayGlyph(PhosphorIconsFill.magnifyingGlass, ClayTint.sky),
  '😌': ClayGlyph(PhosphorIconsFill.smileyBlank, ClayTint.mint),
  '😮‍💨': ClayGlyph(PhosphorIconsFill.wind, ClayTint.mint),
  '😂': ClayGlyph(PhosphorIconsFill.smileyWink, ClayTint.yellow),
  '😱': ClayGlyph(PhosphorIconsFill.smileyNervous, ClayTint.coral),
  '😴': ClayGlyph(PhosphorIconsFill.moon, ClayTint.lilac),

  // Directions
  '⬆️': ClayGlyph(PhosphorIconsFill.arrowFatUp, ClayTint.sky),
  '⬇️': ClayGlyph(PhosphorIconsFill.arrowFatDown, ClayTint.mint),
  '🔄': ClayGlyph(PhosphorIconsFill.arrowsClockwise, ClayTint.mint),
  '🔙': ClayGlyph(PhosphorIconsFill.arrowUUpLeft, ClayTint.stone),
};

/// A puffy clay tile holding one glyph: soft gradient, a lit top edge, and a
/// gentle drop shadow. Asset paths (`.png`, `.jpg`, `.webp`) render as the
/// clay illustration itself, with no tile.
class ClayIcon extends StatelessWidget {
  const ClayIcon(this.symbol, {super.key, this.size = 56, this.flat = false});
  final String symbol;
  final double size;

  /// Draws only the glyph, without the tile, for tight spots like chips.
  final bool flat;

  static bool isAsset(String symbol) =>
      symbol.startsWith('assets/') ||
      symbol.endsWith('.png') ||
      symbol.endsWith('.jpg') ||
      symbol.endsWith('.webp');

  @override
  Widget build(BuildContext context) {
    if (isAsset(symbol)) {
      return Image.asset(
        symbol,
        width: size * 1.25,
        height: size * 1.25,
        fit: BoxFit.contain,
        filterQuality: FilterQuality.medium,
      );
    }
    // Never a raw emoji: a symbol no one has mapped yet gets a plain sparkle.
    final glyph =
        clayGlyphs[symbol] ??
        const ClayGlyph(PhosphorIconsFill.sparkle, ClayTint.lilac);
    final ink = Color.lerp(glyph.tint, QuestColors.ink, .62)!;
    final icon = Icon(
      glyph.icon,
      size: flat ? size : size * .52,
      color: ink,
      shadows: flat
          ? null
          : [
              Shadow(
                color: Colors.white.withValues(alpha: .7),
                offset: Offset(-size * .012, -size * .012),
              ),
            ],
    );
    if (flat) return icon;
    final radius = BorderRadius.circular(size * .34);
    return SizedBox(
      width: size,
      height: size,
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: radius,
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color.lerp(glyph.tint, Colors.white, .55)!,
              glyph.tint,
              Color.lerp(glyph.tint, QuestColors.ink, .1)!,
            ],
            stops: const [0, .55, 1],
          ),
          border: Border.all(
            color: Colors.white.withValues(alpha: .65),
            width: size * .025,
          ),
          boxShadow: [
            BoxShadow(
              color: QuestColors.ink.withValues(alpha: .16),
              offset: Offset(size * .05, size * .09),
              blurRadius: size * .18,
            ),
            BoxShadow(
              color: Colors.white.withValues(alpha: .8),
              offset: Offset(-size * .03, -size * .03),
              blurRadius: size * .1,
            ),
          ],
        ),
        child: Stack(
          children: [
            // The soft highlight that makes the tile read as puffy clay.
            Positioned(
              top: size * .08,
              left: size * .12,
              child: Container(
                width: size * .42,
                height: size * .16,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(size),
                  gradient: LinearGradient(
                    colors: [
                      Colors.white.withValues(alpha: .55),
                      Colors.white.withValues(alpha: 0),
                    ],
                  ),
                ),
              ),
            ),
            Center(child: icon),
          ],
        ),
      ),
    );
  }
}
