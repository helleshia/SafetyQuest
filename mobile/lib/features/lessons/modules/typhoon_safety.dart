import 'package:flutter/material.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_models.dart';

// Module 5 - Typhoon Safety based on PAGASA signal warnings.
const _sky = [Color(0xFF5C6B73), Color(0xFF9EA1A8)];
const _ground = Color(0xFF8B9B90);

final typhoonSafety = LessonContent(
  key: 'typhoon-safety',
  title: 'Typhoon Safety',
  emoji: '🌀',
  imageAsset: 'assets/modules/typhoon_3d.png',
  color: const Color(0xFFC5D3E8),
  badge: 'Storm Defender',
  badgeEmoji: '🌪️',
  matches: (name) {
    final n = name.toLowerCase();
    return n.contains('typhoon');
  },
  story: const [
    StoryPage(
      title: 'What is a Typhoon?',
      text:
          'A typhoon is a very large storm with strong winds and heavy rain. It can cause floods and landslides.',
      tip: 'Stay informed, prepare early, and stay with trusted adults!',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/typhoon_safety_p1.png',
      ),
    ),
    StoryPage(
      title: 'Prepare an Emergency Kit',
      text:
          'Before the storm hits, pack drinking water, ready-to-eat food, flashlights, extra batteries, and first-aid supplies.',
      tip: 'Charge all mobile phones and power banks.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/typhoon_safety_p2.png',
      ),
    ),
    StoryPage(
      title: 'Secure the Home',
      text:
          'Bring loose toys and outdoor objects indoors. Close and secure all windows and doors so they do not get damaged.',
      tip: 'Move important belongings to higher places if it might flood.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/typhoon_safety_p3.png',
      ),
    ),
    StoryPage(
      title: 'During the Typhoon',
      text:
          'Stay safely indoors. Keep away from windows and glass doors, especially when the strong winds begin to blow.',
      tip: 'Do not go outside simply to observe the storm.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/typhoon_safety_p4.png',
      ),
    ),
    StoryPage(
      title: 'Beware of Floodwater',
      text:
          'Never walk, swim, or play in floodwater! It can be deep, very dirty, and hide sharp objects or electrical wires.',
      tip: 'Never touch electrical appliances with wet hands.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/typhoon_safety_p5.png',
      ),
    ),
    StoryPage(
      title: 'Follow Evacuation Orders',
      text:
          'If authorities say to evacuate, go to a safer place immediately! Follow your family and stay calm.',
      tip: 'Do not wait until floodwaters rise before deciding to leave.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/typhoon_safety_p6.png',
      ),
    ),
    StoryPage(
      title: 'After the Typhoon',
      text:
          'Wait for official clearance before going outside. Stay away from damaged buildings, broken glass, and fallen trees.',
      tip: 'Never touch fallen electrical wires!',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/typhoon_safety_p7.png',
      ),
    ),
  ],
  quiz: const [
    QuizQuestion(
      prompt: 'Where is the safest place to stay during a typhoon?',
      choices: [
        Choice(
          '🪟',
          'Inside a sturdy shelter away from windows',
          correct: true,
        ),
        Choice('🌳', 'Under a big tree outside'),
        Choice('🚲', 'Riding your bicycle on the street'),
      ],
      explain:
          'Staying indoors protects you from flying debris and strong winds.',
    ),
    QuizQuestion(
      prompt: 'What should you do if there is floodwater?',
      choices: [
        Choice('🚫', 'Stay away from it', correct: true),
        Choice('🌊', 'Swim and play in the water'),
        Choice('🚶', 'Walk through to check how deep it is'),
      ],
      explain:
          'Floodwater can contain hidden dangers, sharp objects, and electrical hazards.',
    ),
    QuizQuestion(
      prompt: 'What should you pack before a typhoon arrives?',
      choices: [
        Choice('🔦', 'Water, food, flashlight, and batteries', correct: true),
        Choice('🪁', 'Kites to fly in the wind'),
        Choice('🧸', 'Only heavy toys'),
      ],
      explain:
          'An emergency kit helps your family stay ready if power or stores fail.',
    ),
    QuizQuestion(
      prompt: 'How do you help secure the home before a storm?',
      choices: [
        Choice('🪟', 'Bring loose items in and close windows', correct: true),
        Choice('🚪', 'Open all doors wide'),
        Choice('🪴', 'Leave plants and tools outside'),
      ],
      explain:
          'Loose objects can become flying hazards. Close and secure windows and doors.',
    ),
    QuizQuestion(
      prompt:
          'If authorities order evacuation during a typhoon, what do you do?',
      choices: [
        Choice('🚶', 'Leave promptly with your family', correct: true),
        Choice('🛌', 'Wait until water enters the house'),
        Choice('📸', 'Stay to film the storm'),
      ],
      explain:
          'Follow evacuation orders early. Do not wait for floodwater to rise.',
    ),
    QuizQuestion(
      prompt: 'Should you go outside just to watch the typhoon?',
      choices: [
        Choice('🚫', 'No — stay indoors with adults', correct: true),
        Choice('👀', 'Yes, if the wind looks exciting'),
        Choice('🌳', 'Yes, under a tall tree'),
      ],
      explain: 'Strong winds and debris make outdoor watching unsafe.',
    ),
    QuizQuestion(
      prompt: 'After a typhoon, what should you avoid?',
      choices: [
        Choice(
          '⚡',
          'Fallen wires, broken glass, and damaged buildings',
          correct: true,
        ),
        Choice('📻', 'Listening to official news'),
        Choice('👪', 'Staying with your family'),
      ],
      explain: 'Wait for clearance. Never touch fallen electrical wires.',
    ),
  ],
  // Videos: assets/media/typhoon-safety_sim_1..6.mp4 via practiceSceneAt().
  simulation: const [
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: Strong typhoon winds begin!',
      prompt: 'Watch the video. What is the safest action?',
      seconds: 10,
      scene: Scene(
        image: 'assets/modules/typhoon_safety_p4.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice('🪟', 'Stay indoors away from windows', correct: true),
        Choice('🪁', 'Go outside to fly a kite'),
        Choice('🌳', 'Stand under a tall tree'),
        Choice('🚲', 'Ride your bike on the street'),
      ],
      debrief:
          'Indoors, away from glass, protects you from flying debris. Simulation lang ito.',
    ),
    SimStep(
      kind: SimKind.findObject,
      alert: 'SITUATION: Secure the home!',
      prompt: 'Tap what you close and lock to secure the home.',
      seconds: 14,
      answer: 'window',
      scene: Scene(
        image: 'assets/modules/typhoon_safety_p3.png',
        sky: _sky,
        ground: _ground,

        props: const [],
      ),
      hotspots: [
        SceneHotspot(
          id: 'window',
          x: 0.39,
          y: 0.22,
          width: 0.17,
          height: 0.15,
          correct: true,
          label: 'Window shutters',
        ),
        SceneHotspot(
          id: 'window2',
          x: 0.70,
          y: 0.37,
          width: 0.14,
          height: 0.14,
          correct: true,
          label: 'Window shutters',
        ),
        SceneHotspot(
          id: 'pot',
          x: 0.10,
          y: 0.57,
          width: 0.11,
          height: 0.14,
          correct: false,
          label: 'Flower pot',
        ),
        SceneHotspot(
          id: 'basket',
          x: 0.48,
          y: 0.64,
          width: 0.16,
          height: 0.16,
          correct: false,
          label: 'Vegetable basket',
        ),
      ],
      debrief:
          'Close and secure windows and doors. Bring loose outdoor items inside.',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: Floodwater appears near your street!',
      prompt: 'What should you do about the water?',
      seconds: 10,
      scene: Scene(
        image: 'assets/modules/typhoon_safety_p5.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice('🚫', 'Stay away from floodwater', correct: true),
        Choice('🌊', 'Swim and play in it'),
        Choice('🚶', 'Wade through to check depth'),
        Choice('🔌', 'Touch wet appliances'),
      ],
      debrief: 'Floodwater can hide sharp objects and live wires. Stay away.',
    ),
    SimStep(
      kind: SimKind.safetySequence,
      alert: 'SITUATION: Prepare before the storm hits!',
      prompt: 'Tap the prepare steps in order.',
      seconds: 14,
      scene: Scene(
        image: 'assets/modules/typhoon_safety_p2.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice('🔦', 'Pack water, food, flashlight'),
        Choice('🔌', 'Charge phones and power banks'),
        Choice('🪟', 'Secure windows and doors'),
        Choice('🚪', 'Stay indoors with adults'),
      ],
      debrief:
          'Pack, charge, secure the home, then stay inside with trusted adults.',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: Officials order evacuation!',
      prompt: 'What should your family do?',
      seconds: 10,
      scene: Scene(
        image: 'assets/modules/typhoon_safety_p6.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice('🚶', 'Leave promptly to a safer place', correct: true),
        Choice('🛌', 'Wait until water enters the house'),
        Choice('📸', 'Stay to film the storm'),
        Choice('🙈', 'Hide and ignore the order'),
      ],
      debrief:
          'Follow evacuation orders early. Do not wait for floodwater to rise.',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: After the typhoon — fallen wires outside!',
      prompt: 'What do you avoid?',
      seconds: 10,
      scene: Scene(
        image: 'assets/modules/typhoon_safety_p7.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice(
          '⚡',
          'Fallen wires, glass, and damaged buildings',
          correct: true,
        ),
        Choice('📻', 'Listening to official news'),
        Choice('👪', 'Staying with your family'),
        Choice('✅', 'Waiting for clearance'),
      ],
      debrief: 'Wait for clearance. Never touch fallen electrical wires.',
    ),
  ],
);
