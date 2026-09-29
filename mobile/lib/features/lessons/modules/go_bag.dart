import 'package:flutter/material.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_models.dart';

// Module 7 - Emergency Go Bag preparedness.
const _sky = [Color(0xFFFFF4E4), Color(0xFFFBE3CF)];
const _ground = Color(0xFFE9C9AE);

final goBagPreparedness = LessonContent(
  key: 'go-bag',
  title: 'Emergency Go Bag',
  emoji: '🎒',
  imageAsset: 'assets/modules/gobag_3d.png',
  color: const Color(0xFFFCE3AD),
  badge: 'Go Bag Hero',
  badgeEmoji: '🎒',
  matches: (name) {
    final n = name.toLowerCase();
    return n.contains('go bag') || n.contains('bag');
  },
  story: const [
    StoryPage(
      title: 'What is a Go-Bag?',
      text:
          'An emergency go-bag is a "ready-to-go safety backpack" containing essential supplies. It helps you evacuate quickly without wasting time searching for things!',
      tip: 'Remember: PACK IT → CHECK IT → STORE IT → TAKE IT.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/go_bag_p1.png',
      ),
    ),
    StoryPage(
      title: 'Water and Food',
      text:
          'Water is one of the most important supplies! Pack safe drinking water and shelf-stable, ready-to-eat food like biscuits or canned goods.',
      tip: 'Pack food that doesn\'t spoil quickly and is easy to eat.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/go_bag_p2.png',
      ),
    ),
    StoryPage(
      title: 'Lights and Communication',
      text:
          'Bring a flashlight with extra batteries to see in the dark and move safely. Also include a power bank and important contact numbers.',
      tip:
          'Keep contact information on paper just in case phones run out of battery!',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/go_bag_p3.png',
      ),
    ),
    StoryPage(
      title: 'First-Aid and Hygiene',
      text:
          'A basic first-aid kit helps with minor injuries. Don\'t forget soap, wipes, and a toothbrush to keep clean when normal bathrooms aren\'t available.',
      tip: 'Include personal medicines if your family needs them.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/go_bag_p4.png',
      ),
    ),
    StoryPage(
      title: 'Keep It Light!',
      text:
          'Only pack for safety and basic needs—not comfort or luxury. Avoid packing heavy toys, fragile objects, or unnecessary electronics.',
      tip: 'Your backpack should be easy to carry so you can move quickly.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/go_bag_p5.png',
      ),
    ),
    StoryPage(
      title: 'Check and Store',
      text:
          'Keep your go-bag where it is easy to find, like near the door. Check it regularly to replace expired food and dead batteries!',
      tip: 'A perfect emergency bag is not useful if nobody can find it.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/go_bag_p6.png',
      ),
    ),
    StoryPage(
      title: 'Ready to Go!',
      text:
          'When instructed to evacuate, take your go-bag and leave safely. Never delay evacuation to look for extra belongings.',
      tip: 'Safety comes before property. Do not wait!',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/go_bag_p7.png',
      ),
    ),
  ],
  quiz: const [
    QuizQuestion(
      prompt: 'Which items belong in an emergency Go-Bag?',
      choices: [
        Choice('🔦', 'Water, flashlight, whistle, first aid', correct: true),
        Choice('🎮', 'Heavy video game console'),
        Choice('⭐', 'Ice cream and chocolate bars'),
      ],
      explain:
          'Essential survival items keep you safe and hydrated during emergencies.',
    ),
    QuizQuestion(
      prompt: 'Where should a go-bag ideally be kept?',
      choices: [
        Choice('🚪', 'In an accessible location near the door', correct: true),
        Choice('📦', 'Hidden in the attic'),
        Choice('🌳', 'Outside in the garden'),
      ],
      explain:
          'A go-bag should be easy to locate and access when needed quickly.',
    ),
    QuizQuestion(
      prompt: 'Why should a go-bag be checked regularly?',
      choices: [
        Choice(
          '🔋',
          'To replace expired food and dead batteries',
          correct: true,
        ),
        Choice('🧱', 'To make it heavier'),
        Choice('🧸', 'To add more toys'),
      ],
      explain:
          'Emergency supplies must remain usable and appropriate for your current needs.',
    ),
    QuizQuestion(
      prompt: 'What is the Go Bag rule to remember?',
      choices: [
        Choice('📦', 'PACK IT → CHECK IT → STORE IT → TAKE IT', correct: true),
        Choice('😴', 'Hide it and forget it'),
        Choice('⭐', 'Fill it with party supplies'),
      ],
      explain:
          'Pack useful items, check them often, store the bag where you can grab it, then take it when you evacuate.',
    ),
    QuizQuestion(
      prompt: 'Why keep the Go Bag light?',
      choices: [
        Choice('🚗', 'So you can carry it and move quickly', correct: true),
        Choice('⭐', 'So it looks impressive'),
        Choice('🧸', 'So there is room for more toys'),
      ],
      explain:
          'Pack for safety and basic needs only. Heavy bags slow you down.',
    ),
    QuizQuestion(
      prompt: 'Besides a flashlight, what helps with communication?',
      choices: [
        Choice('📇', 'A power bank and written contact numbers', correct: true),
        Choice('🎸', 'A music speaker'),
        Choice('📺', 'A large television'),
      ],
      explain:
          'Phones can die. Paper contact numbers and a charged power bank help you reach family.',
    ),
    QuizQuestion(
      prompt: 'When told to evacuate, what should you do with the Go Bag?',
      choices: [
        Choice('🎒', 'Take it and leave safely right away', correct: true),
        Choice('⭐', 'Search the house for extra gadgets first'),
        Choice('⭐', 'Leave it and come back later alone'),
      ],
      explain:
          'Take your ready bag and go. Do not delay evacuation for extra belongings.',
    ),
  ],
  // Videos: assets/media/go-bag_sim_1..6.mp4 via practiceSceneAt().
  simulation: const [
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: Pack your Go Bag!',
      prompt: 'Watch the video. Which items belong inside?',
      seconds: 10,
      scene: Scene(
        image: 'assets/modules/go_bag_p1.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice('🔦', 'Water, flashlight, whistle, first aid', correct: true),
        Choice('🎮', 'Heavy game console'),
        Choice('⭐', 'Ice cream'),
        Choice('🧸', 'Only stuffed toys'),
      ],
      debrief:
          'Pack light survival items: water, light, whistle, and first aid. Simulation lang ito.',
    ),
    SimStep(
      kind: SimKind.findObject,
      alert: 'SITUATION: What MUST go in the bag?',
      prompt: 'Every Go Bag needs clean drinking water. Tap it!',
      seconds: 14,
      answer: 'water',
      scene: Scene(
        image: 'assets/modules/go_bag_p2.png',
        sky: _sky,
        ground: _ground,

        props: const [],
      ),
      hotspots: [
        SceneHotspot(
          id: 'water',
          x: 0.18,
          y: 0.16,
          width: 0.32,
          height: 0.34,
          correct: true,
          label: 'Water',
        ),
        SceneHotspot(
          id: 'crackers',
          x: 0.14,
          y: 0.44,
          width: 0.36,
          height: 0.26,
          correct: false,
          label: 'Crackers',
        ),
        SceneHotspot(
          id: 'cans',
          x: 0.53,
          y: 0.52,
          width: 0.23,
          height: 0.21,
          correct: false,
          label: 'Canned food',
        ),
        SceneHotspot(
          id: 'bag',
          x: 0.51,
          y: 0.12,
          width: 0.37,
          height: 0.44,
          correct: false,
          label: 'Backpack',
        ),
      ],
      debrief: 'Safe drinking water is one of the most important supplies.',
    ),
    SimStep(
      kind: SimKind.safetySequence,
      alert: 'SITUATION: Remember the Go Bag rule!',
      prompt: 'Tap the steps in order.',
      seconds: 14,
      scene: Scene(
        image: 'assets/modules/go_bag_p6.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice('📦', 'Pack it'),
        Choice('🔍', 'Check it'),
        Choice('🚪', 'Store it near the door'),
        Choice('🚶', 'Take it when you evacuate'),
      ],
      debrief: 'PACK IT → CHECK IT → STORE IT → TAKE IT.',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: Where should the Go Bag live?',
      prompt: 'Pick the best storage place.',
      seconds: 10,
      scene: Scene(
        image: 'assets/modules/go_bag_p6.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice('🚪', 'Near the door, easy to grab', correct: true),
        Choice('📦', 'Hidden in the attic'),
        Choice('🌳', 'Outside in the garden'),
        Choice('⭐', 'Buried under the bed clutter'),
      ],
      debrief: 'A perfect bag is useless if nobody can find it quickly.',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: Check day! Batteries and food expired.',
      prompt: 'What should you do?',
      seconds: 10,
      scene: Scene(
        image: 'assets/modules/go_bag_p6.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice('🔋', 'Replace expired food and dead batteries', correct: true),
        Choice('🧱', 'Add heavy toys to make it heavier'),
        Choice('🎒', 'Throw the whole bag away'),
        Choice('😴', 'Ignore it forever'),
      ],
      debrief: 'Check regularly so supplies stay usable when you need them.',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: Evacuation alert — leave now!',
      prompt: 'What do you do with the Go Bag?',
      seconds: 10,
      scene: Scene(
        image: 'assets/modules/go_bag_p7.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice('🎒', 'Take it and leave safely right away', correct: true),
        Choice('⭐', 'Search the house for extra gadgets first'),
        Choice('🧸', 'Leave it and grab toys instead'),
        Choice('⭐', 'Stay put and wait'),
      ],
      debrief: 'Take your ready bag and go. Do not delay for extra belongings.',
    ),
  ],
);
