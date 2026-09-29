import 'package:flutter/material.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_models.dart';

// Follows the NDRRMC and PHIVOLCS "Duck, Cover, and Hold" guidance.

const _room = [Color(0xFFFFF4E4), Color(0xFFFBE3CF)];
const _roomFloor = Color(0xFFE9C9AE);
const _outside = [Color(0xFFD6E7EF), Color(0xFFEAF3F6)];
const _grass = Color(0xFFBFD9B4);

final earthquake = LessonContent(
  key: 'earthquake',
  title: 'Earthquake Safety',
  emoji: '🌏',
  imageAsset: 'assets/earthquake_3d.png',
  color: const Color(0xFFF8D6C6),
  badge: 'Steady Hero',
  badgeEmoji: '🛡️',
  matches: (name) {
    final n = name.toLowerCase();
    return n.contains('earthquake') && !n.contains('drill');
  },
  story: const [
    StoryPage(
      title: 'The ground can shake!',
      text:
          'An earthquake happens when big rocks deep under the ground suddenly move. The Philippines has many earthquakes, so every explorer should be ready.',
      tip: 'PHIVOLCS watches for earthquakes all over the country.',
      scene: Scene(
        sky: _outside,
        ground: _grass,
        quake: true,
        props: const [],
        image: 'assets/modules/earthquake_p1.png',
      ),
    ),
    StoryPage(
      title: 'Get ready before it happens',
      text:
          'Know the safe spots in your home and school. Keep heavy things on low shelves. Pack a Go Bag with water, a flashlight and a whistle.',
      tip: 'Practice drills with your family and class.',
      scene: Scene(
        sky: _room,
        ground: _roomFloor,
        props: const [],
        image: 'assets/modules/earthquake_p2.png',
      ),
    ),
    StoryPage(
      title: 'DUCK!',
      text:
          'When the shaking starts, drop down to your hands and knees right away. This keeps you from falling over.',
      tip: 'Do not run outside while the ground is shaking.',
      scene: Scene(
        sky: _room,
        ground: _roomFloor,
        quake: true,
        props: const [],
        image: 'assets/modules/earthquake_p3.png',
      ),
    ),
    StoryPage(
      title: 'COVER!',
      text:
          'Crawl under a strong table or desk. Protect your head and neck with your arms.',
      tip: 'No table nearby? Crouch by an inside wall and cover your head.',
      scene: Scene(
        sky: _room,
        ground: _roomFloor,
        quake: true,
        props: const [],
        image: 'assets/modules/earthquake_p4.png',
      ),
    ),
    StoryPage(
      title: 'HOLD!',
      text:
          'Hold on to a leg of the table. If the table moves, move with it. Stay there until the shaking stops.',
      scene: Scene(
        sky: _room,
        ground: _roomFloor,
        quake: true,
        props: const [],
        image: 'assets/modules/earthquake_p5.png',
      ),
    ),
    StoryPage(
      title: 'Stay away from danger',
      text:
          'Keep away from windows, glass, shelves and hanging things. They can break or fall.',
      scene: Scene(
        sky: _room,
        ground: _roomFloor,
        quake: true,
        props: const [],
        image: 'assets/modules/earthquake_p6.png',
      ),
    ),
    StoryPage(
      title: 'After the shaking',
      text:
          'Wait for your teacher. Walk calmly to the open area in a line. Do not push, run, or go back inside. Small shakes called aftershocks may come.',
      tip: 'Never use the elevator after an earthquake.',
      scene: Scene(
        sky: _outside,
        ground: _grass,
        props: const [],
        image: 'assets/modules/earthquake_p7.png',
      ),
    ),
  ],
  quiz: const [
    QuizQuestion(
      prompt: 'The ground starts shaking. What is the FIRST thing you do?',
      choices: [
        Choice('🏃', 'Run outside'),
        Choice('🧎', 'Duck, Cover, Hold', correct: true),
        Choice('📱', 'Take a video'),
        Choice('🪟', 'Look out the window'),
      ],
      explain:
          'Duck, Cover, and Hold right where you are. Running while the ground shakes can make you fall.',
    ),
    QuizQuestion(
      prompt: 'Where is the safest place to cover?',
      choices: [
        Choice('🪟', 'By the window'),
        Choice('📚', 'Beside a tall shelf'),
        Choice('table', 'Under a strong table', correct: true),
        Choice('🚪', 'In the doorway'),
      ],
      explain:
          'A strong table protects you from falling things. Windows and shelves can break or tip over.',
    ),
    QuizQuestion(
      prompt: 'What do you protect with your arms?',
      choices: [
        Choice('🦵', 'Your legs'),
        Choice('🧠', 'Your head and neck', correct: true),
        Choice('🎒', 'Your bag'),
        Choice('👟', 'Your shoes'),
      ],
      explain: 'Your head and neck are the most important to keep safe.',
    ),
    QuizQuestion(
      prompt: 'The shaking has stopped. What now?',
      choices: [
        Choice('🧑‍🏫', 'Follow your teacher calmly', correct: true),
        Choice('🛗', 'Take the elevator'),
        Choice('🧸', 'Go back for your toys'),
        Choice('🤸', 'Push to get out first'),
      ],
      explain:
          'Walk calmly with your class to the open area. Pushing and running cause accidents.',
    ),
    QuizQuestion(
      prompt: 'What should be inside your Go Bag?',
      choices: [
        Choice('🎮', 'Video games'),
        Choice('🔦', 'Water, flashlight, whistle', correct: true),
        Choice('🍭', 'Only candy'),
        Choice('🧸', 'Stuffed toys'),
      ],
      explain:
          'A Go Bag holds things that help you stay safe: water, food, a flashlight, a whistle and first aid.',
    ),
    QuizQuestion(
      prompt: 'Should you use the elevator after an earthquake?',
      choices: [
        Choice('🚫', 'No — use the stairs calmly', correct: true),
        Choice('🛗', 'Yes, it is the fastest way'),
        Choice('🤝', 'Only if your friend goes first'),
        Choice('📱', 'Yes, so you can take a selfie'),
      ],
      explain:
          'Elevators can get stuck or fail after an earthquake. Walk the stairs with your class.',
    ),
    QuizQuestion(
      prompt: 'What are aftershocks?',
      choices: [
        Choice('🎵', 'Loud music after class'),
        Choice('🫨', 'Smaller shakes that may come later', correct: true),
        Choice('🌦️', 'A sudden rainstorm'),
        Choice('🎈', 'Party balloons popping'),
      ],
      explain:
          'Aftershocks are smaller shakes that can follow a big earthquake. Stay ready and follow your teacher.',
    ),
  ],
  simulation: const [
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: Earthquake! The classroom is shaking!',
      prompt: 'Watch the video. Quick — what do you do?',
      seconds: 8,
      scene: Scene(
        image: 'assets/modules/earthquake_p1.png',
        sky: _room,
        ground: _roomFloor,
        quake: true,
        props: [
          Prop('📚', x: -.7, y: -.3, size: 46, motion: Motion.shake),
          Prop('💡', x: .1, y: -.8, size: 38, motion: Motion.sway),
          Prop('🧒', x: .1, y: .5, size: 60, motion: Motion.shake),
          Prop(
            '🪟',
            x: .72,
            y: -.25,
            size: 50,
            motion: Motion.shake,
            phase: .4,
          ),
        ],
      ),
      choices: [
        Choice('🏃', 'Run to the door'),
        Choice('🧎', 'Duck, Cover, Hold', correct: true),
        Choice('🪟', 'Go to the window'),
        Choice('😱', 'Scream and stand'),
      ],
      debrief: 'Duck, Cover, and Hold right away. Every second counts.',
    ),
    SimStep(
      kind: SimKind.findObject,
      alert: 'SITUATION: It is still shaking!',
      prompt: 'Tap the strong table to cover under.',
      seconds: 18,
      answer: 'table',
      scene: Scene(
        image: 'assets/modules/earthquake_cover_table.png',
        sky: _room,
        ground: _roomFloor,
        quake: true,
        props: const [],
      ),
      hotspots: [
        SceneHotspot(
          id: 'window',
          x: 0.08,
          y: 0.16,
          width: 0.26,
          height: 0.28,
          correct: false,
          label: 'Window',
          art: '🪟',
        ),
        SceneHotspot(
          id: 'shelf',
          x: 0.66,
          y: 0.18,
          width: 0.28,
          height: 0.36,
          correct: false,
          label: 'Tall shelf',
          art: '📚',
        ),
        SceneHotspot(
          id: 'door',
          x: 0.72,
          y: 0.52,
          width: 0.22,
          height: 0.32,
          correct: false,
          label: 'Door',
          art: '🚪',
        ),
        SceneHotspot(
          id: 'table',
          x: 0.28,
          y: 0.48,
          width: 0.40,
          height: 0.36,
          correct: true,
          label: 'Strong table',
          art: '🪑',
        ),
      ],
      debrief:
          'Under a strong table is safest. Windows and shelves can break or fall on you.',
    ),
    SimStep(
      kind: SimKind.hold,
      alert: 'Things are falling! Stay covered!',
      prompt: 'Press and HOLD the table leg until the shaking stops.',
      seconds: 6,
      holdSeconds: 5,
      scene: Scene(
        image: 'assets/modules/earthquake_p3.png',
        sky: _room,
        ground: _roomFloor,
        quake: true,
        props: [
          Prop('table', x: 0, y: .3, size: 76, motion: Motion.shake),
          Prop('🙇', x: 0, y: .62, size: 50, motion: Motion.shake),
          Prop('📕', x: -.6, y: -.6, size: 34, motion: Motion.bounce),
          Prop(
            '📘',
            x: .55,
            y: -.7,
            size: 34,
            motion: Motion.bounce,
            phase: .5,
          ),
        ],
      ),
      debrief: 'Holding on keeps you under cover, even if the table moves.',
    ),
    SimStep(
      kind: SimKind.safetySequence,
      alert: 'Your teacher asks you to show the class.',
      prompt: 'Tap the steps in the right order.',
      seconds: 12,
      scene: Scene(
        image: 'assets/modules/earthquake_p4.png',
        sky: _room,
        ground: _roomFloor,
        props: [
          Prop('⭐', x: -.6, y: .35, size: 60, motion: Motion.bounce),
          Prop('📋', x: .5, y: -.1, size: 54, motion: Motion.float),
        ],
      ),
      choices: [
        Choice('🧎', 'Duck'),
        Choice('🙇', 'Cover'),
        Choice('✊', 'Hold'),
      ],
      debrief: 'Duck, then Cover, then Hold. Say it, then do it!',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'The shaking has stopped.',
      prompt: 'Your teacher says it is time to go out. What do you do?',
      seconds: 10,
      scene: Scene(
        image: 'assets/modules/earthquake_p5.png',
        sky: _room,
        ground: _roomFloor,
        props: [
          Prop('⭐', x: -.6, y: .4, size: 58),
          Prop('🚪', x: .65, y: .3, size: 60),
          Prop('🧸', x: .05, y: .55, size: 40),
        ],
      ),
      choices: [
        Choice('🚶', 'Walk calmly in a line', correct: true),
        Choice('🏃', 'Run and push'),
        Choice('🧸', 'Grab your toys first'),
        Choice('🛗', 'Use the elevator'),
      ],
      debrief:
          'Walk in a line and follow your teacher. Leave your things behind.',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'Aftershock! The ground shakes again outside.',
      prompt: 'You are in the open field. Where do you stay?',
      seconds: 8,
      scene: Scene(
        image: 'assets/modules/earthquake_p6.png',
        sky: _outside,
        ground: _grass,
        quake: true,
        props: [
          Prop('⭐', x: -.7, y: .15, size: 70),
          Prop('⚡', x: .7, y: -.2, size: 46, motion: Motion.flicker),
          Prop('🧒', x: 0, y: .55, size: 50, motion: Motion.shake),
        ],
      ),
      choices: [
        Choice('🌾', 'Open space, crouch down', correct: true),
        Choice('🏫', 'Back inside the building'),
        Choice('⚡', 'Near the electric post'),
        Choice('🌳', 'Under a big tree'),
      ],
      debrief:
          'Stay in the open, away from buildings, posts and trees, and crouch until it stops.',
    ),
  ],
);
