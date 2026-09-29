import 'package:flutter/material.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_models.dart';

// Module 1. Follows NDRRMC preparedness messages: know the hazards, heed
// PAGASA and PHIVOLCS warnings, plan with your family, pack a Go Bag, call 911.

const _room = [Color(0xFFFFF4E4), Color(0xFFFBE3CF)];
const _roomFloor = Color(0xFFE9C9AE);
const _outside = [Color(0xFFD6E7EF), Color(0xFFEAF3F6)];
const _grass = Color(0xFFBFD9B4);
const _stormy = [Color(0xFFB8C4D6), Color(0xFFDDE4EE)];

final emergencyBasics = LessonContent(
  key: 'emergency-basics',
  title: 'Understanding Emergencies',
  emoji: '🧭',
  imageAsset: 'assets/emergency_3d.png',
  color: const Color(0xFFD6E7EF),
  badge: 'Ready Explorer',
  badgeEmoji: '🧭',
  matches: (name) {
    final n = name.toLowerCase();
    return n.contains('understanding') ||
        (n.contains('emergenc') && n.contains('prepared'));
  },
  story: const [
    StoryPage(
      title: 'What is an emergency?',
      text:
          'An emergency is a sudden, dangerous moment that needs help fast. Someone gets hurt, a fire starts, or the ground shakes.',
      tip: 'In an emergency, acting quickly and calmly keeps people safe.',
      scene: Scene(
        sky: _room,
        ground: _roomFloor,
        props: const [],
        image: 'assets/modules/emergency_basics_p1.png',
      ),
    ),
    StoryPage(
      title: 'Hazards and disasters',
      text:
          'A hazard is something that can hurt us, like a typhoon, flood, earthquake, fire or volcano. It becomes a disaster when it harms many people and places.',
      scene: Scene(
        sky: _outside,
        ground: _grass,
        props: const [],
        image: 'assets/modules/emergency_basics_p2.png',
      ),
    ),
    StoryPage(
      title: 'Why the Philippines?',
      text:
          'Our country sits on the Pacific Ring of Fire, where earthquakes and volcanoes happen. About 20 typhoons also visit us every year.',
      tip: 'That is why every Filipino explorer learns to be ready!',
      scene: Scene(
        sky: _stormy,
        ground: _grass,
        props: const [],
        image: 'assets/modules/emergency_basics_p3.png',
      ),
    ),
    StoryPage(
      title: 'Know, Plan, Pack',
      text:
          'KNOW the hazards where you live. PLAN with your family where to meet. PACK a Go Bag with water, food, a flashlight and a whistle.',
      scene: Scene(
        sky: _room,
        ground: _roomFloor,
        props: const [],
        image: 'assets/modules/emergency_basics_p4.png',
      ),
    ),
    StoryPage(
      title: 'Listen for warnings',
      text:
          'PAGASA warns us about typhoons and heavy rain. PHIVOLCS watches earthquakes and volcanoes. Listen to the radio, sirens, and your school bell.',
      tip: 'Warnings give you time to get ready before danger comes.',
      scene: Scene(
        sky: _stormy,
        ground: _grass,
        props: const [],
        image: 'assets/modules/emergency_basics_p5.png',
      ),
    ),
    StoryPage(
      title: 'Stay calm, find an adult',
      text:
          'When something scary happens, take a deep breath. Tell a trusted adult right away, like your teacher, parent, or a barangay official.',
      scene: Scene(
        sky: _room,
        ground: _roomFloor,
        props: const [],
        image: 'assets/modules/emergency_basics_p6.png',
      ),
    ),
    StoryPage(
      title: 'Call 911 for help',
      text:
          '911 is the emergency hotline in the Philippines. Say what happened and where you are. Stay on the phone until they tell you to hang up.',
      tip: 'Learn your home address and a parent’s phone number by heart.',
      scene: Scene(
        sky: _outside,
        ground: _grass,
        props: const [],
        image: 'assets/modules/emergency_basics_p7.png',
      ),
    ),
  ],
  quiz: const [
    QuizQuestion(
      prompt: 'Which one is an emergency?',
      choices: [
        Choice('🍱', 'It is lunch time'),
        Choice('🤕', 'A classmate fell and is bleeding', correct: true),
        Choice('📚', 'You have homework'),
        Choice('🌦️', 'A light rain shower'),
      ],
      explain:
          'Someone getting hurt is an emergency. It needs help from an adult right away.',
    ),
    QuizQuestion(
      prompt: 'Which one is a HAZARD?',
      choices: [
        Choice('🌈', 'A rainbow'),
        Choice('🎂', 'A birthday party'),
        Choice('🌀', 'A typhoon', correct: true),
        Choice('🌳', 'A shady tree'),
      ],
      explain: 'A typhoon is a hazard. It can cause floods and damage.',
    ),
    QuizQuestion(
      prompt: 'Who warns us about typhoons in the Philippines?',
      choices: [
        Choice('📺', 'A cartoon channel'),
        Choice('🌦️', 'PAGASA', correct: true),
        Choice('🎮', 'A video game'),
        Choice('🍞', 'The bakery'),
      ],
      explain:
          'PAGASA tracks the weather and gives typhoon warnings. PHIVOLCS watches earthquakes and volcanoes.',
    ),
    QuizQuestion(
      prompt: 'Something scary happens. What do you do first?',
      choices: [
        Choice('😌', 'Stay calm and tell an adult', correct: true),
        Choice('🙈', 'Hide and say nothing'),
        Choice('📱', 'Post it online'),
        Choice('🏃', 'Run home alone'),
      ],
      explain: 'Stay calm and tell a trusted adult. They can get help fast.',
    ),
    QuizQuestion(
      prompt: 'What is the emergency hotline in the Philippines?',
      choices: [
        Choice('📞', '911', correct: true),
        Choice('📞', '143'),
        Choice('📞', '000'),
        Choice('📞', '888'),
      ],
      explain: '911 connects you to police, fire and ambulance help.',
    ),
    QuizQuestion(
      prompt: 'What does KNOW, PLAN, PACK mean?',
      choices: [
        Choice('🎮', 'Know games, plan parties, pack toys'),
        Choice(
          '🎒',
          'Know hazards, plan a meeting place, pack a Go Bag',
          correct: true,
        ),
        Choice('📺', 'Know cartoons, plan snacks, pack candy'),
        Choice('😴', 'Know nothing and wait for help'),
      ],
      explain:
          'Know the hazards nearby, plan where your family will meet, and pack a Go Bag before danger comes.',
    ),
    QuizQuestion(
      prompt: 'Who watches earthquakes and volcanoes in the Philippines?',
      choices: [
        Choice('🌋', 'PHIVOLCS', correct: true),
        Choice('🛒', 'The market'),
        Choice('🏫', 'Only the principal'),
        Choice('🎪', 'A carnival'),
      ],
      explain:
          'PHIVOLCS monitors earthquakes and volcanoes. PAGASA covers weather and typhoons.',
    ),
  ],
  simulation: const [
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: Your classmate slipped and hurt their head!',
      prompt: 'What do you do?',
      seconds: 10,
      scene: Scene(
        image: 'assets/modules/emergency_basics_p6.png',
        sky: _room,
        ground: _roomFloor,
        props: [
          Prop('🤕', x: -.3, y: .45, size: 60, motion: Motion.float),
          Prop('💦', x: -.62, y: .55, size: 34),
          Prop('🧒', x: .45, y: .4, size: 54, motion: Motion.shake),
        ],
      ),
      choices: [
        Choice('🧑‍🏫', 'Tell the teacher right away', correct: true),
        Choice('📸', 'Take a photo'),
        Choice('🚶', 'Walk away'),
        Choice('😂', 'Laugh'),
      ],
      debrief: 'Getting a trusted adult fast is the best way to help.',
    ),
    SimStep(
      kind: SimKind.findObject,
      alert: 'SITUATION: You need help, fast!',
      prompt: 'Tap the trusted adult who can help you.',
      seconds: 18,
      answer: 'teacher',
      scene: Scene(
        image: 'assets/modules/emergency_basics_p2.png',
        sky: _outside,
        ground: _grass,
        props: const [],
      ),
      hotspots: [
        SceneHotspot(
          id: 'bird',
          x: 0.20,
          y: 0.04,
          width: 0.18,
          height: 0.18,
          correct: false,
          label: 'A bird',
          art: '🐦',
        ),
        SceneHotspot(
          id: 'dog',
          x: 0.04,
          y: 0.50,
          width: 0.22,
          height: 0.26,
          correct: false,
          label: 'A dog',
          art: '🐶',
        ),
        SceneHotspot(
          id: 'baby',
          x: 0.32,
          y: 0.62,
          width: 0.20,
          height: 0.22,
          correct: false,
          label: 'A baby',
          art: '👶',
        ),
        SceneHotspot(
          id: 'teacher',
          x: 0.64,
          y: 0.26,
          width: 0.28,
          height: 0.52,
          correct: true,
          label: 'Your teacher',
          art: '🧑‍🏫',
        ),
      ],
      debrief:
          'Teachers, parents and barangay officials are trusted adults who can help.',
    ),
    SimStep(
      kind: SimKind.safetySequence,
      alert: 'SITUATION: Typhoon season is coming!',
      prompt: 'Watch, then tap the ready steps in order.',
      seconds: 12,
      scene: Scene(
        image: 'assets/modules/emergency_basics_p4.png',
        sky: _stormy,
        ground: _grass,
        props: [
          Prop('🌀', x: -.6, y: -.35, size: 56, motion: Motion.sway),
          Prop('⭐', x: .45, y: .35, size: 64),
        ],
      ),
      choices: [
        Choice('🧠', 'Know'),
        Choice('📋', 'Plan'),
        Choice('🎒', 'Pack'),
      ],
      debrief:
          'Know the hazards, Plan with your family, then Pack your Go Bag.',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: The school siren is ringing!',
      prompt: 'What should you do?',
      seconds: 8,
      scene: Scene(
        image: 'assets/modules/emergency_basics_p5.png',
        sky: _outside,
        ground: _grass,
        props: [
          Prop('📢', x: -.55, y: -.4, size: 52, motion: Motion.shake),
          Prop('⚽', x: .35, y: .5, size: 40, motion: Motion.bounce),
          Prop('🧒', x: -.05, y: .45, size: 52),
        ],
      ),
      choices: [
        Choice('👂', 'Stop and listen to your teacher', correct: true),
        Choice('⚽', 'Keep playing'),
        Choice('🏃', 'Run home alone'),
        Choice('🚽', 'Hide in the CR'),
      ],
      debrief: 'A siren is a warning. Stop, listen, and follow your teacher.',
    ),
    SimStep(
      kind: SimKind.findObject,
      alert: 'SITUATION: Pack your Go Bag!',
      prompt: 'Tap the Go Bag item that helps when the lights go out.',
      seconds: 18,
      answer: 'flashlight',
      scene: Scene(
        image: 'assets/modules/emergency_basics_p5.png',
        sky: _room,
        ground: _roomFloor,
        props: const [],
      ),
      hotspots: [
        SceneHotspot(
          id: 'game',
          x: 0.21,
          y: 0.32,
          width: 0.25,
          height: 0.19,
          correct: false,
          label: 'Video game',
        ),
        SceneHotspot(
          id: 'toy',
          x: 0.20,
          y: 0.50,
          width: 0.22,
          height: 0.27,
          correct: false,
          label: 'Stuffed toy',
        ),
        SceneHotspot(
          id: 'cake',
          x: 0.55,
          y: 0.53,
          width: 0.23,
          height: 0.25,
          correct: false,
          label: 'Cake',
        ),
        SceneHotspot(
          id: 'flashlight',
          x: 0.58,
          y: 0.34,
          width: 0.16,
          height: 0.16,
          correct: true,
          label: 'Flashlight',
        ),
      ],
      debrief:
          'A flashlight helps when the power goes out. Add water, food and a whistle too.',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: You are calling 911.',
      prompt: 'What do you tell them?',
      seconds: 12,
      scene: Scene(
        image: 'assets/modules/emergency_basics_p7.png',
        sky: _outside,
        ground: _grass,
        props: [
          Prop('⭐', x: -.45, y: .05, size: 64, motion: Motion.pulse),
          Prop('🚑', x: .5, y: .45, size: 60, motion: Motion.drift),
        ],
      ),
      choices: [
        Choice('⭐', 'What happened and where you are', correct: true),
        Choice('🎵', 'Your favorite song'),
        Choice('📴', 'Nothing, then hang up'),
        Choice('😂', 'A funny joke'),
      ],
      debrief:
          'Tell them what happened and where you are, then listen and stay on the line.',
    ),
  ],
);
