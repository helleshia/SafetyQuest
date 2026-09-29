import 'package:flutter/material.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_models.dart';

// Module 11 - Road & Traffic Safety based on LTO & DPWH guidelines.
const _sky = [Color(0xFFD6E7EF), Color(0xFFEAF3F6)];
const _road = Color(0xFF708090);

final roadSafety = LessonContent(
  key: 'road-safety',
  title: 'Road & Traffic Safety',
  emoji: '🚦',
  imageAsset: 'assets/modules/road_3d.png',
  color: const Color(0xFFD6E7EF),
  badge: 'Road Master',
  badgeEmoji: '🚸',
  matches: (name) {
    final n = name.toLowerCase();
    return n.contains('road') || n.contains('traffic');
  },
  story: const [
    StoryPage(
      title: 'Roads Are Shared Spaces',
      text:
          'Roads are busy places! We share them with cars, motorcycles, bicycles, and buses. Everyone needs to cooperate to stay safe.',
      tip: 'Vehicles move faster than you think and need time to stop.',
      scene: Scene(
        sky: _sky,
        ground: _road,
        props: const [],
        image: 'assets/modules/road_safety_p1.png',
      ),
    ),
    StoryPage(
      title: 'How to Cross Safely',
      text:
          'Always use pedestrian crossings! Before crossing, remember to STOP at the edge, LOOK both ways, LISTEN for cars, and THINK if it is safe to cross.',
      tip: 'Hold an adult’s hand when crossing busy streets.',
      scene: Scene(
        sky: _sky,
        ground: _road,
        props: const [],
        image: 'assets/modules/road_safety_p2.png',
      ),
    ),
    StoryPage(
      title: 'Follow Traffic Lights',
      text:
          'Red means STOP. Yellow means PREPARE TO STOP. Green means GO, but only if the way is clear! Always follow pedestrian signals too.',
      tip: 'A green light doesn’t mean you can stop looking for cars.',
      scene: Scene(
        sky: _sky,
        ground: _road,
        props: const [],
        image: 'assets/modules/road_safety_p3.png',
      ),
    ),
    StoryPage(
      title: 'Safe Passengers',
      text:
          'When riding in a car, always wear your seat belt and sit properly. Never open doors until it is safe and keep your body inside the vehicle.',
      tip: 'A seat belt should be used every time, even for short trips.',
      scene: Scene(
        sky: _sky,
        ground: _road,
        props: const [],
        image: 'assets/modules/road_safety_p4.png',
      ),
    ),
    StoryPage(
      title: 'Bicycle Safety',
      text:
          'Before riding, check your brakes and tires. Always wear a properly fitted helmet and follow traffic rules, just like a car.',
      tip: 'Avoid using a phone or listening to loud music while riding.',
      scene: Scene(
        sky: _sky,
        ground: _road,
        props: const [],
        image: 'assets/modules/road_safety_p5.png',
      ),
    ),
    StoryPage(
      title: 'Avoid Distractions',
      text:
          'Put your phone away when crossing the street! Keep your eyes and ears open. Even if you know the rules, distractions can be dangerous.',
      tip: 'Never assume a driver sees you. Stay alert!',
      scene: Scene(
        sky: _sky,
        ground: _road,
        props: const [],
        image: 'assets/modules/road_safety_p6.png',
      ),
    ),
    StoryPage(
      title: 'Watch for Blind Spots',
      text:
          'Large trucks and buses have big blind spots where the driver cannot see you. Do not walk or ride close to large vehicles.',
      tip: 'If you cannot see the driver, they probably cannot see you.',
      scene: Scene(
        sky: _sky,
        ground: _road,
        props: const [],
        image: 'assets/modules/road_safety_p7.png',
      ),
    ),
  ],
  quiz: const [
    QuizQuestion(
      prompt: 'What should you do before crossing a road?',
      choices: [
        Choice('🛑', 'Stop, look, listen, and think', correct: true),
        Choice('⭐', 'Run quickly'),
        Choice('📱', 'Look at your phone'),
      ],
      explain:
          'Stopping and checking the road helps you identify approaching vehicles and other hazards.',
    ),
    QuizQuestion(
      prompt: 'What does a red traffic light mean?',
      choices: [
        Choice('🛑', 'Stop completely', correct: true),
        Choice('⭐', 'Go if no one is looking'),
        Choice('🚦', 'Speed up'),
      ],
      explain:
          'Red generally means STOP. Do not proceed when the signal prohibits movement.',
    ),
    QuizQuestion(
      prompt: 'Why is standing close to a large truck dangerous?',
      choices: [
        Choice(
          '🙈',
          'The driver might not see you (blind spot)',
          correct: true,
        ),
        Choice('🔊', 'The truck is loud'),
        Choice('🛣️', 'It makes the road wider'),
      ],
      explain:
          'Large vehicles have blind spots where the driver cannot see pedestrians or cyclists.',
    ),
    QuizQuestion(
      prompt: 'Where should you cross the street?',
      choices: [
        Choice('🚸', 'At a pedestrian crossing', correct: true),
        Choice('🚗', 'Anywhere between moving cars'),
        Choice('📱', 'While texting in the middle of the road'),
      ],
      explain: 'Use crossings and hold an adult’s hand on busy streets.',
    ),
    QuizQuestion(
      prompt: 'When riding in a car, what should you always do?',
      choices: [
        Choice('🦺', 'Wear your seat belt and sit properly', correct: true),
        Choice('🚪', 'Open the door while moving'),
        Choice('🧍', 'Stand up to look outside'),
      ],
      explain: 'Seat belts protect you on every trip, even short ones.',
    ),
    QuizQuestion(
      prompt: 'Before riding a bicycle, what should you wear?',
      choices: [
        Choice('🦺', 'A properly fitted helmet', correct: true),
        Choice('🎧', 'Loud headphones only'),
        Choice('📱', 'Nothing — just hold your phone'),
      ],
      explain:
          'Check brakes and tires, wear a helmet, and follow traffic rules.',
    ),
    QuizQuestion(
      prompt: 'What should you do with your phone while crossing?',
      choices: [
        Choice('📵', 'Put it away and stay alert', correct: true),
        Choice('💬', 'Keep chatting so you do not notice cars'),
        Choice('📸', 'Film yourself crossing'),
      ],
      explain: 'Distractions are dangerous. Never assume a driver sees you.',
    ),
  ],
  // Videos: assets/media/road-safety_sim_1..6.mp4 via practiceSceneAt().
  simulation: const [
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: Pedestrian light turns RED!',
      prompt: 'Watch the video. What do you do?',
      seconds: 10,
      scene: Scene(
        image: 'assets/modules/road_safety_p3.png',
        sky: _sky,
        ground: _road,
        props: const [],
      ),
      choices: [
        Choice('🛑', 'Stop on the curb and wait', correct: true),
        Choice('🏃', 'Run across anyway'),
        Choice('📱', 'Cross while texting'),
        Choice('👀', 'Close your eyes and go'),
      ],
      debrief: 'Red means stop. Wait for a safe signal. Simulation lang ito.',
    ),
    SimStep(
      kind: SimKind.safetySequence,
      alert: 'SITUATION: Cross the street safely!',
      prompt: 'Tap Stop, Look, Listen, Think in order.',
      seconds: 14,
      scene: Scene(
        image: 'assets/modules/road_safety_p2.png',
        sky: _sky,
        ground: _road,
        props: const [],
      ),
      choices: [
        Choice('🛑', 'Stop'),
        Choice('👀', 'Look both ways'),
        Choice('👂', 'Listen for cars'),
        Choice('🧠', 'Think — is it safe?'),
      ],
      debrief: 'Stop, Look, Listen, Think before you cross.',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: A text pops up while you cross!',
      prompt: 'What should you do?',
      seconds: 10,
      scene: Scene(
        image: 'assets/modules/road_safety_p6.png',
        sky: _sky,
        ground: _road,
        props: const [],
      ),
      choices: [
        Choice('📵', 'Put the phone away and watch for cars', correct: true),
        Choice('💬', 'Read the message while walking'),
        Choice('📸', 'Film yourself crossing'),
        Choice('🎧', 'Put on loud music'),
      ],
      debrief: 'Distractions hide cars. Eyes and ears stay on the road.',
    ),
    SimStep(
      kind: SimKind.findObject,
      alert: 'SITUATION: Where should you cross?',
      prompt: 'Where should you cross the street? Tap it.',
      seconds: 14,
      answer: 'crosswalk',
      scene: Scene(
        image: 'assets/modules/road_safety_p2.png',
        sky: _sky,
        ground: _road,

        props: const [],
      ),
      hotspots: [
        SceneHotspot(
          id: 'crosswalk',
          x: 0.36,
          y: 0.36,
          width: 0.44,
          height: 0.36,
          correct: true,
          label: 'Crosswalk',
        ),
        SceneHotspot(
          id: 'traffic',
          x: 0.80,
          y: 0.55,
          width: 0.13,
          height: 0.22,
          correct: false,
          label: 'Road away from the crossing',
        ),
        SceneHotspot(
          id: 'tree',
          x: 0.26,
          y: 0.05,
          width: 0.19,
          height: 0.25,
          correct: false,
          label: 'Tree',
        ),
      ],
      debrief:
          'Use pedestrian crossings. Hold an adult\'s hand on busy streets.',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: A large truck is nearby!',
      prompt: 'Why is standing close dangerous?',
      seconds: 10,
      scene: Scene(
        image: 'assets/modules/road_safety_p7.png',
        sky: _sky,
        ground: _road,
        props: const [],
      ),
      choices: [
        Choice('🙈', 'The driver may not see you (blind spot)', correct: true),
        Choice('🔊', 'Only because the truck is loud'),
        Choice('🛣️', 'It makes the road wider'),
        Choice('😎', 'It looks cool to stand there'),
      ],
      debrief: 'If you cannot see the driver, they probably cannot see you.',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: Riding in a car / on a bike!',
      prompt: 'What keeps you safer?',
      seconds: 10,
      scene: Scene(
        image: 'assets/modules/road_safety_p5.png',
        sky: _sky,
        ground: _road,
        props: const [],
      ),
      choices: [
        Choice('🦺', 'Seat belt in cars; helmet on bikes', correct: true),
        Choice('🚪', 'Open the door while moving'),
        Choice('🚗', 'Stand up in the car'),
        Choice('🎧', 'Loud headphones while biking'),
      ],
      debrief:
          'Seat belts every trip. Helmets every ride. Follow traffic rules.',
    ),
  ],
);
