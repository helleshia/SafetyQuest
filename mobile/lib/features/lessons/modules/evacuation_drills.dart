import 'package:flutter/material.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_models.dart';

// Module 6 - Earthquake & Fire Drills based on NDRRMC guidelines.
const _sky = [Color(0xFFFFF4E4), Color(0xFFFBE3CF)];
const _ground = Color(0xFFE9C9AE);

final evacuationDrills = LessonContent(
  key: 'evacuation-drills',
  title: 'Earthquake & Fire Evacuation Drills',
  emoji: '🚨',
  imageAsset: 'assets/modules/drills_3d.png',
  color: const Color(0xFFE2D4F0),
  badge: 'Drill Master',
  badgeEmoji: '🚩',
  matches: (name) {
    final n = name.toLowerCase();
    return n.contains('drill') || n.contains('evacuation');
  },
  story: const [
    StoryPage(
      title: 'Practice for Safety',
      text:
          'An evacuation drill is a practice for real emergencies like earthquakes and fires. The goal is to stay safe, follow instructions, and help everyone move calmly.',
      tip: 'Remember: it\'s not a race! Never push, run, or shout.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/evacuation_drills_p1.png',
      ),
    ),
    StoryPage(
      title: 'Earthquake: Drop, Cover, and Hold On',
      text:
          'When you feel an earthquake, do not run! Immediately DROP to the ground, COVER your head and neck under a sturdy desk, and HOLD ON until the shaking stops.',
      tip: 'This protects you from falling objects and debris.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/evacuation_drills_p2.png',
      ),
    ),
    StoryPage(
      title: 'Fire: Alert and Evacuate',
      text:
          'If a fire alarm sounds, treat it seriously. Leave your activity right away and follow your teacher to the designated exit. Do not try to fight the fire yourself.',
      tip: 'If there is smoke, stay as low as possible!',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/evacuation_drills_p3.png',
      ),
    ),
    StoryPage(
      title: 'Leave Belongings Behind',
      text:
          'When evacuating, do not return to the classroom for your backpack, phone, or toys. Your safety is much more important than your things.',
      tip: 'Personal belongings can be replaced. You cannot be!',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/evacuation_drills_p4.png',
      ),
    ),
    StoryPage(
      title: 'Move Quickly but Safely',
      text:
          'Walk quickly to the exit, using stairs carefully. Never use elevators during a fire or earthquake drill. Follow your assigned evacuation route.',
      tip: 'Stay with your group and do not use unauthorized routes.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/evacuation_drills_p5.png',
      ),
    ),
    StoryPage(
      title: 'The Assembly Area',
      text:
          'Proceed straight to your designated assembly area outside. This is a safe location away from danger where everyone gathers.',
      tip: 'Do not stop in hallways or block doorways on your way out.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/evacuation_drills_p6.png',
      ),
    ),
    StoryPage(
      title: 'Accountability Matters',
      text:
          'Once at the assembly area, stay with your class so your teacher can do a headcount. Never leave or re-enter the building until it is declared safe.',
      tip: 'Always report missing classmates to a responsible adult.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/evacuation_drills_p7.png',
      ),
    ),
  ],
  quiz: const [
    QuizQuestion(
      prompt: 'What should you do first during an earthquake?',
      choices: [
        Choice('🪑', 'Drop, Cover, and Hold On', correct: true),
        Choice('🏃', 'Run outside immediately'),
        Choice('🎒', 'Pack your bags'),
      ],
      explain:
          'During an earthquake, your immediate priority is to protect yourself from falling objects.',
    ),
    QuizQuestion(
      prompt:
          'If you leave your bag in the classroom during a fire alarm, what should you do?',
      choices: [
        Choice('🚶', 'Leave it and continue evacuating', correct: true),
        Choice('🔙', 'Go back quickly to get it'),
        Choice('😭', 'Cry and refuse to leave'),
      ],
      explain:
          'Your safety is the priority. Personal belongings can be replaced.',
    ),
    QuizQuestion(
      prompt: 'What is the purpose of an evacuation drill?',
      choices: [
        Choice('⭐', 'Practice staying safe and moving calmly', correct: true),
        Choice('🤕', 'Race classmates to the door'),
        Choice('🎮', 'Skip class for fun'),
      ],
      explain:
          'Drills teach everyone to follow instructions calmly before a real emergency.',
    ),
    QuizQuestion(
      prompt: 'During a fire or earthquake drill, should you use the elevator?',
      choices: [
        Choice('🚫', 'No — use the stairs carefully', correct: true),
        Choice('🛗', 'Yes, elevators are faster'),
        Choice('🤝', 'Only with a friend'),
      ],
      explain:
          'Elevators can fail in emergencies. Follow the assigned stair route.',
    ),
    QuizQuestion(
      prompt: 'Where do you go after leaving the building?',
      choices: [
        Choice('🚩', 'The designated assembly area', correct: true),
        Choice('⭐', 'Anywhere you like outside'),
        Choice('🚪', 'Back inside for your phone'),
      ],
      explain:
          'The assembly area is the safe meeting place where teachers check who is present.',
    ),
    QuizQuestion(
      prompt: 'If there is smoke while evacuating, what helps?',
      choices: [
        Choice('🚪', 'Stay low and keep moving to the exit', correct: true),
        Choice('☁️', 'Stand tall in the smoke'),
        Choice('🙈', 'Hide in a closet'),
      ],
      explain:
          'Cleaner air is lower. Never hide — keep following your teacher out.',
    ),
    QuizQuestion(
      prompt: 'At the assembly area, why stay with your class?',
      choices: [
        Choice('🧑‍🏫', 'So your teacher can do a headcount', correct: true),
        Choice('⭐', 'So you can leave early alone'),
        Choice('📸', 'So you can take group selfies'),
      ],
      explain:
          'Accountability keeps everyone safe. Report missing classmates to an adult.',
    ),
  ],
  // Videos: assets/media/evacuation-drills_sim_1..6.mp4 via practiceSceneAt().
  simulation: const [
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: Earthquake drill — the floor shakes!',
      prompt: 'Watch the video. What do you do first?',
      seconds: 10,
      scene: Scene(
        image: 'assets/modules/evacuation_drills_p1.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice('🪑', 'Drop, Cover, and Hold On', correct: true),
        Choice('🏃', 'Run toward the door'),
        Choice('🎒', 'Pack your bag'),
        Choice('📱', 'Film the shaking'),
      ],
      debrief:
          'Protect yourself from falling objects first. Simulation lang ito.',
    ),
    SimStep(
      kind: SimKind.safetySequence,
      alert: 'SITUATION: Show Duck, Cover, Hold!',
      prompt: 'Tap the steps in the right order.',
      seconds: 12,
      scene: Scene(
        image: 'assets/modules/evacuation_drills_p2.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice('🧎', 'Drop'),
        Choice('🙇', 'Cover'),
        Choice('✊', 'Hold On'),
      ],
      debrief:
          'Drop, then Cover your head and neck, then Hold On until shaking stops.',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: Fire alarm is ringing!',
      prompt: 'How do you leave the building?',
      seconds: 10,
      scene: Scene(
        image: 'assets/modules/evacuation_drills_p3.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice('🚶', 'Walk calmly with your teacher', correct: true),
        Choice('🤸', 'Push past others to exit faster'),
        Choice('🎒', 'Go back for your bag'),
        Choice('🛗', 'Take the elevator'),
      ],
      debrief: 'Walk calmly. Never use elevators. Leave belongings behind.',
    ),
    SimStep(
      kind: SimKind.findObject,
      alert: 'SITUATION: Find the assembly area!',
      prompt: 'You left the building. Tap where your class gathers.',
      seconds: 14,
      answer: 'assembly',
      scene: Scene(
        image: 'assets/modules/evacuation_drills_p6.png',
        sky: _sky,
        ground: _ground,

        props: const [],
      ),
      hotspots: [
        SceneHotspot(
          id: 'assembly',
          x: 0.30,
          y: 0.51,
          width: 0.50,
          height: 0.27,
          correct: true,
          label: 'Assembly area',
        ),
        SceneHotspot(
          id: 'building',
          x: 0.16,
          y: 0.13,
          width: 0.40,
          height: 0.35,
          correct: false,
          label: 'School building',
        ),
        SceneHotspot(
          id: 'trees',
          x: 0.66,
          y: 0.24,
          width: 0.25,
          height: 0.25,
          correct: false,
          label: 'Trees',
        ),
      ],
      debrief: 'Go straight to the open assembly area away from the building.',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: Smoke fills the hallway!',
      prompt: 'How do you move toward the exit?',
      seconds: 10,
      scene: Scene(
        image: 'assets/modules/evacuation_drills_p5.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice('⬇️', 'Stay low and keep moving out', correct: true),
        Choice('☁️', 'Stand tall in the smoke'),
        Choice('🙈', 'Hide in a closet'),
        Choice('🔙', 'Go back for your phone'),
      ],
      debrief: 'Stay low under the smoke and keep following your teacher out.',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: You reached the assembly area!',
      prompt: 'What do you do next?',
      seconds: 10,
      scene: Scene(
        image: 'assets/modules/evacuation_drills_p7.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice('🧑‍🏫', 'Stay with your class for headcount', correct: true),
        Choice('🏠', 'Leave alone to go home'),
        Choice('🚪', 'Sneak back inside the building'),
        Choice('🏃', 'Run around the playground'),
      ],
      debrief:
          'Stay with your class so your teacher can check everyone is safe.',
    ),
  ],
);
