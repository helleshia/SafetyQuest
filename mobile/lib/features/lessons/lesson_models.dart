import 'package:flutter/material.dart';

/// How a scene prop moves while it is on screen.
enum Motion {
  still,
  shake,
  bounce,
  float,
  pulse,
  flicker,
  sway,
  rise,
  drift,

  /// Full spins — use for typhoon funnels and swirling hazards.
  spin,
}

/// Decorative / animated picture inside a scene (emoji or built-in art).
/// Interactive taps use [SceneHotspot], not labeled props.
class Prop {
  const Prop(
    this.art, {
    this.x = 0,
    this.y = 0,
    this.size = 64,
    this.motion = Motion.still,
    this.phase = 0,
    this.id,
    this.label,
  });
  final String art;
  final double x;
  final double y;
  final double size;
  final Motion motion;
  final double phase;

  /// Legacy prop id (prefer [SceneHotspot] for new content).
  final String? id;
  final String? label;

  bool get isHitbox => art == 'hit';
}

/// Invisible tap region over a scene image.
///
/// Coordinates are **normalized 0–1** relative to the displayed image
/// (top-left origin). [x]/[y] are the top-left of the rect.
///
/// When [art] is set it is ignored for on-scene drawing — hitboxes stay
/// invisible so students tap objects already in the still (hidden-object).
class SceneHotspot {
  const SceneHotspot({
    required this.id,
    required this.x,
    required this.y,
    this.width = 0.14,
    this.height = 0.16,
    this.correct = false,
    this.label,
    this.art,
    this.layer,
  });

  final String id;
  final double x;
  final double y;
  final double width;
  final double height;
  final bool correct;

  /// Accessibility label only — never drawn on the scene.
  final String? label;

  /// Legacy optional glyph key — not drawn on the scene (image-only hits).
  final String? art;

  /// Optional removable sticker over the base scene (find-hazards layers).
  /// Drawn in this hotspot's rect until the learner finds it, then removed.
  final String? layer;

  Rect rectIn(Size imageSize) => Rect.fromLTWH(
    x * imageSize.width,
    y * imageSize.height,
    width * imageSize.width,
    height * imageSize.height,
  );
}

/// Illustrated environment: optional clay still, looping video, decorative props.
class Scene {
  const Scene({
    required this.sky,
    this.ground,
    this.props = const [],
    this.quake = false,
    this.image,
    this.video,
  });

  final String? image;
  final String? video;
  final List<Color> sky;
  final Color? ground;
  final List<Prop> props;
  final bool quake;
}

class StoryPage {
  const StoryPage({
    required this.title,
    required this.text,
    required this.scene,
    this.tip,
  });
  final String title;
  final String text;
  final Scene scene;
  final String? tip;
}

class Choice {
  const Choice(this.emoji, this.label, {this.correct = false});
  final String emoji;
  final String label;
  final bool correct;
}

class QuizQuestion {
  const QuizQuestion({
    required this.prompt,
    required this.choices,
    required this.explain,
    this.scene,
    this.interaction,
  });
  final String prompt;
  final List<Choice> choices;
  final String explain;
  final Scene? scene;

  /// When set, this item plays as an interactive mini-simulation.
  final SimStep? interaction;
}

/// Interactive simulation types for questionnaire + Phase 2 practice.
enum SimKind {
  /// Tap every hazard inside the scene (invisible hitboxes).
  findHazards,

  /// Find one specific object in the scene.
  findObject,

  /// Read a scenario and pick a text action.
  chooseAction,

  /// Observe the scene, then choose what to do next (text).
  sceneDecision,

  /// Pick the next correct step in a safety procedure (text, in order).
  safetySequence,

  /// Tap the safe area / exit directly in the scene.
  tapSafeArea,

  /// Press and hold until the danger passes.
  hold,
}

/// One interactive assessment step — scene + gesture + feedback.
class SimStep {
  const SimStep({
    required this.kind,
    required this.alert,
    required this.prompt,
    required this.scene,
    required this.debrief,
    this.choices = const [],
    this.hotspots = const [],
    this.answer,
    this.seconds = 10,
    this.holdSeconds = 5,
    this.hazardIds = const [],
    this.consequenceSafe,
    this.consequenceUnsafe,
    this.unsafeDebrief,
    this.points = 10,
  });

  final SimKind kind;
  final String alert;
  final String prompt;
  final Scene scene;
  final String debrief;

  /// Text options for chooseAction / sceneDecision / safetySequence.
  final List<Choice> choices;

  /// Invisible regions over the scene image (preferred for scene taps).
  final List<SceneHotspot> hotspots;

  /// Target hotspot / prop id for findObject / tapSafeArea.
  final String? answer;

  final int seconds;
  final int holdSeconds;

  /// Ids that must be found for [SimKind.findHazards]
  /// (defaults to every hotspot with `correct: true`).
  final List<String> hazardIds;

  final Scene? consequenceSafe;
  final Scene? consequenceUnsafe;
  final String? unsafeDebrief;
  final int points;

  /// Resolved hazard ids for find-hazards steps.
  List<String> get effectiveHazardIds {
    if (hazardIds.isNotEmpty) return hazardIds;
    return [
      for (final h in hotspots)
        if (h.correct) h.id,
    ];
  }
}

class LessonContent {
  const LessonContent({
    required this.key,
    required this.title,
    required this.emoji,
    this.imageAsset,
    required this.color,
    required this.badge,
    required this.badgeEmoji,
    required this.story,
    required this.quiz,
    required this.simulation,
    required this.matches,
  });
  final String key;
  final String title;
  final String emoji;
  final String? imageAsset;
  final Color color;
  final String badge;
  final String badgeEmoji;
  final List<StoryPage> story;
  final List<QuizQuestion> quiz;
  final List<SimStep> simulation;

  final bool Function(String name) matches;

  Scene scenarioAt(int i) => story[i % story.length].scene;

  String simVideoAt(int i) => 'assets/media/${key}_sim_${i + 1}.mp4';

  /// Practice scene for step [i]. Prefer the simulation still; never swap in
  /// unrelated story art for tap games (that mismatched questions to answers).
  Scene practiceSceneAt(int i) {
    final step = simulation[i];
    final base = step.scene;
    final sceneTap =
        step.kind == SimKind.findHazards ||
        step.kind == SimKind.findObject ||
        step.kind == SimKind.tapSafeArea;
    final image = base.image ?? (sceneTap ? null : scenarioAt(i).image);
    return Scene(
      sky: base.sky,
      ground: base.ground,
      props: (sceneTap || image != null) ? const [] : base.props,
      quake: base.quake,
      image: image,
      video: sceneTap ? null : base.video,
    );
  }
}

extension SceneBackdrop on Scene {
  Scene withMedia({String? image, String? video}) {
    return Scene(
      sky: sky,
      ground: ground,
      props: props,
      quake: quake,
      image: image ?? this.image,
      video: video ?? this.video,
    );
  }

  Scene withBackdrop(String? image) => withMedia(image: image);
}
