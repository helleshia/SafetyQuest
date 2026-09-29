import 'package:flutter/material.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_models.dart';

// Module 4 - Flood Safety based on NDRRMC and PAGASA guidelines.
const _ground = Color(0xFFC4DFAA);
const _sky = [Color(0xFF87CEEB), Color(0xFFE0F7FA)];

final floodSafety = LessonContent(
  key: 'flood-safety',
  title: 'Flood Safety',
  emoji: '🌊',
  imageAsset: 'assets/modules/flood_3d.png',
  color: const Color(0xFFD0E8F2),
  badge: 'Flood Guardian',
  badgeEmoji: '🌊',
  matches: (name) {
    final n = name.toLowerCase();
    return n.contains('flood');
  },
  story: const [
    StoryPage(
      title: 'What is a Flood?',
      text:
          'A flood happens when too much water covers normally dry land. It can happen from heavy rain or overflowing rivers.',
      tip: 'Floodwater can be dangerous, so we should never play in it.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/flood_safety_p1.png',
      ),
    ),
    StoryPage(
      title: 'Listen to Warnings!',
      text:
          'PAGASA tells us when flooding is possible. If authorities say to evacuate, follow them and move to a safe, higher place.',
      tip: 'A warning is useful only if people act on it.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/flood_safety_p2.png',
      ),
    ),
    StoryPage(
      title: 'Prepare an Emergency Kit',
      text:
          'Before a flood, pack an emergency kit with a flashlight, extra batteries, a radio, safe drinking water, and first-aid supplies.',
      tip: 'Keep important documents in waterproof protection.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/flood_safety_p3.png',
      ),
    ),
    StoryPage(
      title: 'Evacuate Safely',
      text:
          'When asked to leave, go to higher ground immediately. Move essential belongings high up if it is safe.',
      tip: 'Do not wait until roads become impassable. People come first!',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/flood_safety_p4.png',
      ),
    ),
    StoryPage(
      title: 'Stay Out of the Water!',
      text:
          'Floodwater can hide broken glass, sharp metal, and electrical hazards. If you cannot see what is beneath the water, do not enter it.',
      tip: 'Moving water can be extremely powerful and sweep people away.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/flood_safety_p5.png',
      ),
    ),
    StoryPage(
      title: 'Water and Electricity',
      text:
          'Electricity and water can be deadly together. Stay away from wet electrical equipment, submerged outlets, and fallen power lines.',
      tip: 'Do not touch electrical equipment while standing in water.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/flood_safety_p6.png',
      ),
    ),
    StoryPage(
      title: 'Return Safely',
      text:
          'Wait for the official clearance before returning home. Do not eat food or drink water that might be contaminated by floodwater.',
      tip: 'Wash your hands regularly and protect any cuts or wounds.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/flood_safety_p7.png',
      ),
    ),
  ],
  quiz: const [
    QuizQuestion(
      prompt: 'What should you do when floodwaters start to rise?',
      choices: [
        Choice('🌊', 'Go swimming outside'),
        Choice('⭐', 'Move to higher ground immediately', correct: true),
        Choice('🧸', 'Stay on the floor and play'),
      ],
      explain: 'Moving to higher ground keeps you safe from rising water.',
    ),
    QuizQuestion(
      prompt: 'What is an important rule about floodwater?',
      choices: [
        Choice('🚷', 'Do not play or swim in it', correct: true),
        Choice('🥤', 'It is safe to drink'),
        Choice('🩴', 'It is fine to wade in it barefoot'),
      ],
      explain:
          'Floodwater can hide dangerous debris, chemicals, and electrical hazards.',
    ),
    QuizQuestion(
      prompt: 'If authorities tell you to evacuate, what should you do?',
      choices: [
        Choice('📺', 'Stay inside and watch TV'),
        Choice('🛑', 'Wait until the water is inside the house'),
        Choice('🎒', 'Evacuate immediately to a safe place', correct: true),
      ],
      explain:
          'Evacuation orders should be followed promptly before roads become dangerous.',
    ),
    QuizQuestion(
      prompt: 'Who gives flood and heavy-rain warnings in the Philippines?',
      choices: [
        Choice('🌦️', 'PAGASA', correct: true),
        Choice('🎮', 'A game streamer'),
        Choice('🛒', 'The sari-sari store'),
      ],
      explain:
          'PAGASA issues weather and flood-related warnings. Listen and act early.',
    ),
    QuizQuestion(
      prompt: 'What belongs in a flood emergency kit?',
      choices: [
        Choice('🔦', 'Flashlight, water, first-aid supplies', correct: true),
        Choice('🧸', 'Only soft toys'),
        Choice('⭐', 'Melting ice cream'),
      ],
      explain:
          'Pack light, useful supplies: light, clean water, and first aid.',
    ),
    QuizQuestion(
      prompt: 'Why stay away from wet electrical equipment?',
      choices: [
        Choice(
          '⚡',
          'Water and electricity can be deadly together',
          correct: true,
        ),
        Choice('🎨', 'It looks messy'),
        Choice('📱', 'It drains your phone battery'),
      ],
      explain:
          'Never touch outlets, appliances, or fallen wires while standing in water.',
    ),
    QuizQuestion(
      prompt: 'When is it safe to return home after a flood?',
      choices: [
        Choice('✅', 'After official clearance is given', correct: true),
        Choice('🌦️', 'As soon as the rain slows'),
        Choice('📸', 'When you want photos of the damage'),
      ],
      explain:
          'Wait for authorities. Flooded food and water may also be unsafe.',
    ),
  ],
  // Videos auto-load as assets/media/flood-safety_sim_1..6.mp4 via practiceSceneAt().
  simulation: const [
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: Floodwater is rising outside!',
      prompt: 'Watch the video. Where do you go right away?',
      seconds: 10,
      scene: Scene(
        image: 'assets/modules/flood_safety_p1.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice('⭐', 'Move up to higher ground', correct: true),
        Choice('🌊', 'Go swim in the flood'),
        Choice('🧸', 'Stay on the floor and play'),
        Choice('🚪', 'Open the door to look outside'),
      ],
      debrief:
          'Higher ground keeps you above rising water. Simulation lang ito.',
    ),
    SimStep(
      kind: SimKind.findObject,
      alert: 'SITUATION: Pick a safe place!',
      prompt: 'Water is rising. Tap the safest place to go.',
      seconds: 14,
      answer: 'high',
      scene: Scene(
        image: 'assets/modules/flood_safety_p4.png',
        sky: _sky,
        ground: _ground,

        props: const [],
      ),
      hotspots: [
        SceneHotspot(
          id: 'high',
          x: 0.40,
          y: 0.03,
          width: 0.43,
          height: 0.40,
          correct: true,
          label: 'High ground',
        ),
        SceneHotspot(
          id: 'low',
          x: 0.55,
          y: 0.50,
          width: 0.30,
          height: 0.22,
          correct: false,
          label: 'Low ground by the water',
        ),
        SceneHotspot(
          id: 'flood',
          x: 0.05,
          y: 0.78,
          width: 0.90,
          height: 0.16,
          correct: false,
          label: 'Floodwater',
        ),
      ],
      debrief: 'High ground or an upper floor is safest when water rises.',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: A flooded road blocks your way!',
      prompt: 'What is the safest choice?',
      seconds: 10,
      scene: Scene(
        image: 'assets/modules/flood_safety_p5.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice('🔄', 'Turn around — find another safe route', correct: true),
        Choice('🚶', 'Walk through the floodwater'),
        Choice('🚗', 'Drive fast through the deep water'),
        Choice('📸', 'Stop to take photos'),
      ],
      debrief:
          'Turn Around, Don\'t Drown! You cannot see what is under floodwater.',
    ),
    SimStep(
      kind: SimKind.safetySequence,
      alert: 'SITUATION: Authorities say evacuate!',
      prompt: 'Tap the safe steps in order.',
      seconds: 14,
      scene: Scene(
        image: 'assets/modules/flood_safety_p4.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice('👂', 'Listen to the warning'),
        Choice('🎒', 'Grab your emergency kit'),
        Choice('👪', 'Leave with your family'),
        Choice('⭐', 'Go to higher safe ground'),
      ],
      debrief:
          'Listen, pack light essentials, leave with family, move to higher ground.',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: You see a wet outlet and fallen wire!',
      prompt: 'What do you do?',
      seconds: 10,
      scene: Scene(
        image: 'assets/modules/flood_safety_p6.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice('🚫', 'Stay away and tell an adult', correct: true),
        Choice('🔌', 'Touch it to unplug'),
        Choice('💧', 'Splash water on it'),
        Choice('🤳', 'Stand in water for a selfie'),
      ],
      debrief:
          'Water and electricity are deadly together. Never touch wet wires or outlets.',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: The rain slowed. Can you go home now?',
      prompt: 'When is it safe to return?',
      seconds: 10,
      scene: Scene(
        image: 'assets/modules/flood_safety_p7.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice('✅', 'Only after official clearance', correct: true),
        Choice('🌦️', 'Right when the rain slows'),
        Choice('📸', 'When you want damage photos'),
        Choice('🥤', 'When you want floodwater to drink'),
      ],
      debrief:
          'Wait for official clearance. Flooded food and water may still be unsafe.',
    ),
  ],
);
