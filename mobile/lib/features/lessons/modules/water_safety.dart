import 'package:flutter/material.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_models.dart';

// Module 14 — Water Safety.
// Source: assets/lessons/Module 14 - Water Safety.pdf
const _sky = [Color(0xFFD6EFFF), Color(0xFFEAF7FF)];
const _water = Color(0xFF7EB8D4);

/// Pool scene hazards for Water Safety Detective (source Animation 1).
const _poolHotspots = [
  SceneHotspot(
    id: 'running',
    x: 0.28,
    y: 0.32,
    width: 0.28,
    height: 0.42,
    correct: true,
    label: 'Running near the pool',
  ),
  SceneHotspot(
    id: 'phone_adult',
    x: 0.62,
    y: 0.28,
    width: 0.28,
    height: 0.42,
    correct: true,
    label: 'Distracted adult / weak supervision',
  ),
  SceneHotspot(
    id: 'wet_deck',
    x: 0.34,
    y: 0.68,
    width: 0.22,
    height: 0.16,
    correct: true,
    label: 'Wet pool deck',
  ),
  SceneHotspot(
    id: 'life_ring',
    x: 0.48,
    y: 0.08,
    width: 0.14,
    height: 0.14,
    correct: false,
    label: 'Life ring',
  ),
];

final waterSafety = LessonContent(
  key: 'water-safety',
  title: 'Water Safety',
  emoji: '🌊',
  imageAsset: 'assets/modules/water_3d.png',
  color: const Color(0xFFD6EFFF),
  badge: 'Water Safety Champion',
  badgeEmoji: '🌊',
  matches: (name) {
    final n = name.toLowerCase();
    return n.contains('water');
  },
  story: const [
    StoryPage(
      title: 'Water can be fun — and dangerous',
      text:
          'Water safety means knowing how to prevent drowning and injuries around pools, beaches, rivers, lakes, and other water. Even strong swimmers can face unexpected hazards.',
      tip: 'Never assume water is safe simply because it looks calm.',
      scene: Scene(
        sky: _sky,
        ground: _water,
        props: const [],
        image: 'assets/modules/water_safety_p1.png',
      ),
    ),
    StoryPage(
      title: 'STOP — LOOK — ASK',
      text:
          'Before entering water: STOP — do not rush in. LOOK for warning signs, depth markers, lifeguards, designated areas, and unsafe conditions. ASK a responsible adult if it is safe.',
      tip: 'Check the environment before you enter.',
      scene: Scene(
        sky: _sky,
        ground: _water,
        props: const [],
        image: 'assets/modules/water_safety_p2.png',
      ),
    ),
    StoryPage(
      title: 'Never swim alone',
      text:
          'Always swim with appropriate supervision. An adult nearby but distracted by a phone may not be watching carefully. Supervision means an adult who can notice and respond quickly.',
      tip: 'Never swim alone — stay with a responsible adult or group.',
      scene: Scene(
        sky: _sky,
        ground: _water,
        props: const [],
        image: 'assets/modules/water_safety_p3.png',
      ),
    ),
    StoryPage(
      title: 'Know your limits and equipment',
      text:
          'Comfort in shallow water does not mean you can safely swim in deep water or open water. Wear a properly fitted life jacket when required — inflatable toys are not a substitute.',
      tip: 'There is no shame in saying, "I cannot swim that far."',
      scene: Scene(
        sky: _sky,
        ground: _water,
        props: const [],
        image: 'assets/modules/water_safety_p4.png',
      ),
    ),
    StoryPage(
      title: 'Safe swimming boundaries',
      text:
          'Walk near pools — do not run. Stay within designated swimming areas. Never dive into shallow or unknown water. Follow lifeguards, pool rules, and posted signs.',
      tip: 'If friends jump from a "No Diving" area, do not copy them.',
      scene: Scene(
        sky: _sky,
        ground: _water,
        props: const [],
        image: 'assets/modules/water_safety_p5.png',
      ),
    ),
    StoryPage(
      title: 'Reach or throw — don\'t go',
      text:
          'If someone is struggling in the water, do not automatically jump in. Alert a lifeguard or adult. From a safe place, REACH with an object or THROW a flotation aid when appropriate.',
      tip: 'An untrained rescuer can also become a victim.',
      scene: Scene(
        sky: _sky,
        ground: _water,
        props: const [],
        image: 'assets/modules/water_safety_p6.png',
      ),
    ),
    StoryPage(
      title: 'Listen to lifeguards and weather',
      text:
          'Leave the water immediately when a lifeguard or responsible adult tells you to. Stop water activities during thunderstorms, lightning, dangerous waves, flooding, or other warnings.',
      tip: 'Know the water. Know your limits. Stay supervised. Follow the rules.',
      scene: Scene(
        sky: _sky,
        ground: _water,
        props: const [],
        image: 'assets/modules/water_safety_p7.png',
      ),
    ),
  ],
  quiz: const [
    QuizQuestion(
      prompt: 'Which is the safest general rule for children around water?',
      choices: [
        Choice(
          '👀',
          'Swim only when appropriate supervision is available',
          correct: true,
        ),
        Choice('🏊', 'Swim alone if you are a strong swimmer'),
        Choice('😌', 'Enter whenever the water looks calm'),
      ],
      explain:
          'Appropriate supervision is an important part of preventing water-related emergencies.',
    ),
    QuizQuestion(
      prompt: 'True or False: Dive into water even when the depth is unknown.',
      choices: [
        Choice('❌', 'False — never dive into unknown or shallow water', correct: true),
        Choice('✅', 'True — diving is always fine'),
        Choice('🤷', 'Only if friends dive first'),
      ],
      explain: 'Diving into unknown or shallow water can cause serious injuries.',
    ),
    QuizQuestion(
      prompt: 'Which can be a hazard in open water?',
      choices: [
        Choice('🌊', 'Strong currents, depth changes, and hidden objects', correct: true),
        Choice('📚', 'Only books on the shore'),
        Choice('🎵', 'Only loud music'),
      ],
      explain:
          'Open water can contain many hazards that may not be visible from the surface.',
    ),
    QuizQuestion(
      prompt: 'You see someone struggling in deep water. What should you generally do?',
      choices: [
        Choice(
          '🛟',
          'Alert a lifeguard or adult and use reach-or-throw when safe',
          correct: true,
        ),
        Choice('🏊', 'Jump in immediately'),
        Choice('🙈', 'Ignore the situation'),
      ],
      explain:
          'An untrained rescuer can become a victim. Get trained help and use reach-or-throw when safe.',
    ),
    QuizQuestion(
      prompt: 'Which item is designed as flotation safety equipment?',
      choices: [
        Choice('🦺', 'A properly fitted life jacket', correct: true),
        Choice('🎾', 'An inflatable ball'),
        Choice('🧸', 'A plastic toy'),
      ],
      explain:
          'A properly fitted life jacket is designed as safety equipment. Toys are not substitutes.',
    ),
    QuizQuestion(
      prompt: 'A lifeguard tells everyone to leave the water. What should you do?',
      choices: [
        Choice('🚪', 'Leave the water and follow the lifeguard\'s instructions', correct: true),
        Choice('😎', 'Stay because you are not scared'),
        Choice('👯', 'Keep swimming with friends'),
      ],
      explain:
          'Lifeguards monitor conditions. Their directions should be followed promptly.',
    ),
    QuizQuestion(
      prompt: 'Which behavior is unsafe around a swimming pool?',
      choices: [
        Choice('🏃', 'Running', correct: true),
        Choice('🚶', 'Walking'),
        Choice('👂', 'Listening to the lifeguard'),
      ],
      explain:
          'Running around a pool increases the risk of slipping, falling, and injury.',
    ),
  ],
  simulation: [
    const SimStep(
      kind: SimKind.findHazards,
      alert: 'SITUATION: Water Safety Detective — inspect the pool!',
      prompt: 'Tap every unsafe behavior or hazard you can find.',
      seconds: 20,
      scene: Scene(
        image: 'assets/modules/water_safety_sim_1.png',
        sky: _sky,
        ground: _water,
        props: [],
      ),
      hotspots: _poolHotspots,
      debrief:
          'Running, weak supervision, and diving risks are pool hazards. Alert an adult or lifeguard.',
    ),
    const SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: Friends invite you to a fast, muddy river after heavy rain!',
      prompt: 'What should you do?',
      seconds: 12,
      scene: Scene(
        image: 'assets/modules/water_safety_sim_2.png',
        sky: _sky,
        ground: _water,
        props: [],
      ),
      choices: [
        Choice('🚫', 'Do not enter the river', correct: true),
        Choice('🏊', 'Swim because friends are going'),
        Choice('😎', 'Enter if the water looks exciting'),
        Choice('🧒', 'Ask another child to test it first'),
      ],
      debrief:
          'Heavy rain can change levels and currents. Floodwater and fast rivers are not safe swimming places.',
    ),
    const SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: The lifeguard says leave the water — conditions are dangerous!',
      prompt: 'What should you do?',
      seconds: 10,
      scene: Scene(
        image: 'assets/modules/water_safety_sim_3.png',
        sky: _sky,
        ground: _water,
        props: [],
      ),
      choices: [
        Choice('🚪', 'Leave the water immediately', correct: true),
        Choice('😎', 'Stay because you feel fine'),
        Choice('👯', 'Keep swimming with friends'),
        Choice('🙈', 'Ignore the warning'),
      ],
      debrief: 'If a lifeguard or adult tells you to leave, leave immediately.',
    ),
    const SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: Someone is struggling in the water!',
      prompt: 'What is the safest response?',
      seconds: 12,
      scene: Scene(
        image: 'assets/modules/water_safety_sim_4.png',
        sky: _sky,
        ground: _water,
        props: [],
      ),
      choices: [
        Choice(
          '🛟',
          'Alert an adult/lifeguard and use reach-or-throw when safe',
          correct: true,
        ),
        Choice('🏊', 'Jump into the water immediately'),
        Choice('🏃', 'Run away and tell no one'),
        Choice('🧒', 'Ask another child to jump in'),
      ],
      debrief:
          'REACH or THROW, DON\'T GO. Get adult or emergency help. Do not put yourself in danger.',
    ),
    const SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: Life jacket check!',
      prompt: 'Which is designed as safety equipment?',
      seconds: 12,
      scene: Scene(
        image: 'assets/modules/water_safety_sim_5.png',
        sky: _sky,
        ground: _water,
        props: [],
      ),
      choices: [
        Choice('🦺', 'A properly fitted life jacket', correct: true),
        Choice('🍩', 'An inflatable pool ring toy'),
        Choice('🎾', 'An inflatable ball'),
        Choice('🧸', 'A plastic beach toy'),
      ],
      debrief:
          'A properly fitted life jacket is safety equipment. Inflatable toys are not substitutes.',
    ),
    const SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: You feel tired and are having trouble staying afloat!',
      prompt: 'What is the safest action?',
      seconds: 10,
      scene: Scene(
        image: 'assets/modules/water_safety_sim_6.png',
        sky: _sky,
        ground: _water,
        props: [],
      ),
      choices: [
        Choice('🆘', 'Signal for help and follow safety instructions', correct: true),
        Choice('💪', 'Keep swimming to prove you are strong'),
        Choice('🌊', 'Move farther from shore'),
        Choice('🤿', 'Hold your breath and dive underwater'),
      ],
      debrief:
          'Recognizing difficulty early and seeking help can prevent a more serious emergency.',
    ),
  ],
);
