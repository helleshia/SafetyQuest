import 'package:flutter/material.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_models.dart';

// Adapted for young learners from assets/lessons/Module-3-Fire-Safety.pdf.
// Learners evacuate and get help; firefighting is left to trained adults.
const _room = [Color(0xFFFFF4E4), Color(0xFFFBE3CF)];
const _floor = Color(0xFFE9C9AE);

// Interactive targets use invisible SceneHotspot regions over the still.
// Never draw floating labels on the scene.

/// Desk room: candle + paper (hazards), books + bag (safe distractors).
const _hazardsScene = Scene(
  image: 'assets/modules/fire_safety_sim_1.png',
  sky: _room,
  ground: _floor,
);

const _hazardHotspots = [
  SceneHotspot(
    id: 'candle',
    x: 0.14,
    y: 0.46,
    width: 0.16,
    height: 0.22,
    correct: true,
    label: 'Candle',
  ),
  SceneHotspot(
    id: 'paper',
    x: 0.30,
    y: 0.52,
    width: 0.22,
    height: 0.28,
    correct: true,
    label: 'Paper',
  ),
  SceneHotspot(
    id: 'books',
    x: 0.48,
    y: 0.04,
    width: 0.28,
    height: 0.22,
    correct: false,
    label: 'Books',
  ),
  SceneHotspot(
    id: 'bag',
    x: 0.72,
    y: 0.38,
    width: 0.22,
    height: 0.28,
    correct: false,
    label: 'Bag',
  ),
];

const _alarmScene = Scene(
  image: 'assets/modules/fire_safety_sim_2.png',
  sky: _room,
  ground: _floor,
);

const _exitScene = Scene(
  image: 'assets/modules/fire_safety_sim_3.png',
  sky: _room,
  ground: _floor,
);

const _exitHotspots = [
  SceneHotspot(
    id: 'exit',
    x: 0.04,
    y: 0.22,
    width: 0.24,
    height: 0.58,
    correct: true,
    label: 'Safe exit',
  ),
  SceneHotspot(
    id: 'fire',
    x: 0.46,
    y: 0.42,
    width: 0.20,
    height: 0.30,
    correct: false,
    label: 'Fire',
  ),
  SceneHotspot(
    id: 'blocked',
    x: 0.70,
    y: 0.48,
    width: 0.26,
    height: 0.32,
    correct: false,
    label: 'Blocked path',
  ),
];

const _smokeScene = Scene(
  image: 'assets/modules/fire_safety_sim_4.png',
  sky: [Color(0xFFC6CBD2), Color(0xFFE8E5E1)],
  ground: _floor,
);

const _clothesScene = Scene(
  image: 'assets/modules/fire_safety_sim_6.png',
  sky: _room,
  ground: _floor,
);

const _meetingScene = Scene(
  image: 'assets/modules/fire_safety_sim_6.png',
  sky: [Color(0xFFD6E7EF), Color(0xFFEAF3F6)],
  ground: Color(0xFFBFD9B4),
);

const _smallFireScene = Scene(
  image: 'assets/modules/fire_safety_sim_5.png',
  sky: _room,
  ground: _floor,
);

final fireSafety = LessonContent(
  key: 'fire-safety',
  title: 'Fire Safety',
  emoji: '🚒',
  imageAsset: 'assets/modules/fire_safety_p1.png',
  color: const Color(0xFFE85D4C),
  badge: 'Fire Safety Champion',
  badgeEmoji: '🔥',
  matches: (name) {
    final n = name.toLowerCase();
    return n.contains('fire') && !n.contains('evacuat');
  },
  story: const [
    StoryPage(
      title: 'Fire can help or hurt',
      text:
          'Fire cooks food and keeps us warm. It can also grow fast and hurt people. Learn how to stay safe.',
      tip: 'Treat every real fire alarm as real.',
      scene: Scene(
        sky: _room,
        ground: _floor,
        image: 'assets/modules/fire_safety_p1.png',
      ),
    ),
    StoryPage(
      title: 'Spot fire hazards',
      text:
          'A candle near paper, matches left out, or a frayed wire can start a fire. Tell an adult.',
      tip: 'If you see a hazard, do not touch it — tell a grown-up.',
      scene: Scene(
        sky: _room,
        ground: _floor,
        image: 'assets/modules/fire_safety_p2.png',
      ),
    ),
    StoryPage(
      title: 'Know your exits',
      text:
          'Every room has a way out. Practice two paths with your class so you are ready.',
      tip: 'Never hide during a fire drill.',
      scene: Scene(
        sky: _room,
        ground: _floor,
        image: 'assets/modules/fire_safety_p3.png',
      ),
    ),
    StoryPage(
      title: 'When the alarm rings',
      text:
          'Stop what you are doing. Line up with your teacher. Leave bags behind.',
      tip: 'Walk — do not run.',
      scene: Scene(
        sky: _room,
        ground: _floor,
        image: 'assets/modules/fire_safety_p5.png',
      ),
    ),
    StoryPage(
      title: 'Stay low in smoke',
      text:
          'Smoke rises. Keep your head low and crawl or walk bent toward the exit.',
      tip: 'Feel doors with the back of your hand before opening.',
      scene: Scene(
        sky: [Color(0xFFC6CBD2), Color(0xFFE8E5E1)],
        ground: _floor,
        image: 'assets/modules/fire_safety_p6.png',
      ),
    ),
    StoryPage(
      title: 'Stop, Drop, and Roll',
      text:
          'If your clothes catch fire: stop moving, drop to the ground, cover your face, and roll.',
      tip: 'Do not run — running feeds the flames.',
      scene: Scene(
        sky: _room,
        ground: _floor,
        image: 'assets/modules/fire_safety_p7.png',
      ),
    ),
    StoryPage(
      title: 'Meeting place',
      text:
          'Go to the meeting place with your class. Stay there so teachers can count everyone.',
      tip: 'Never go back inside for things.',
      scene: Scene(
        sky: [Color(0xFFD6E7EF), Color(0xFFEAF3F6)],
        ground: Color(0xFFBFD9B4),
        image: 'assets/modules/fire_safety_p8.png',
      ),
    ),
    StoryPage(
      title: 'Let trained helpers handle fire',
      text:
          'From a safe place, alert an adult. Extinguishers are for trained people.',
      tip: 'If fire spreads or an exit is threatened, leave immediately.',
      scene: Scene(
        sky: [Color(0xFFD6E7EF), Color(0xFFEAF3F6)],
        ground: Color(0xFFBFD9B4),
        image: 'assets/modules/fire_safety_p9.png',
      ),
    ),
  ],
  quiz: const [
    QuizQuestion(
      prompt: 'Find every fire hazard in the scene.',
      choices: [
        Choice('', 'Candle and paper near each other', correct: true),
        Choice('', 'A clear exit door'),
        Choice('', 'Your teacher'),
      ],
      explain:
          'A candle near paper can start a fire. Stay away and tell an adult.',
      interaction: SimStep(
        kind: SimKind.findHazards,
        alert: 'Look at the scene',
        prompt: 'Find every hazard in the scene.',
        scene: _hazardsScene,
        hotspots: _hazardHotspots,
        debrief:
            'The candle and paper together can start a fire. Tell an adult.',
        unsafeDebrief:
            'Look for things that can start a fire — not the books or the bag.',
        seconds: 22,
        points: 15,
      ),
    ),
    QuizQuestion(
      prompt: 'Which is a fire hazard at home or school?',
      choices: [
        Choice('', 'A clear exit'),
        Choice('', 'An escape plan on the wall'),
        Choice('', 'An overloaded electrical outlet', correct: true),
      ],
      explain: 'Overloaded outlets can cause fires. Report them to an adult.',
    ),
    QuizQuestion(
      prompt: 'The fire alarm rings. What should you do?',
      choices: [
        Choice('', 'Follow your teacher to the safe exit', correct: true),
        Choice('', 'Finish your worksheet first'),
        Choice('', 'Go back for your bag and phone'),
      ],
      explain: 'Leave right away with your teacher. Leave bags behind.',
      interaction: SimStep(
        kind: SimKind.sceneDecision,
        alert: 'Look at the scene',
        prompt: 'The alarm is ringing. What do you do?',
        scene: _alarmScene,
        choices: [
          Choice('', 'Pack your bag first'),
          Choice('', 'Follow your teacher to the exit', correct: true),
          Choice('', 'Look for the fire yourself'),
        ],
        debrief: 'Leave with your teacher. Do not pack or fight the fire.',
        seconds: 16,
      ),
    ),
    QuizQuestion(
      prompt: 'When do you Stop, Drop, and Roll?',
      choices: [
        Choice('', 'Whenever any alarm rings'),
        Choice('', 'Only when your clothes catch fire', correct: true),
        Choice('', 'Whenever you see smoke'),
      ],
      explain: 'Stop, Drop, and Roll is only for burning clothing.',
      interaction: SimStep(
        kind: SimKind.safetySequence,
        alert: 'Look at the scene',
        prompt: 'Clothes caught fire. Tap the steps in order.',
        scene: _clothesScene,
        seconds: 24,
        choices: [
          Choice('', 'Stop moving'),
          Choice('', 'Drop to the ground and cover your face'),
          Choice('', 'Roll until the flames are out'),
          Choice('', 'Get help from an adult'),
        ],
        debrief: 'Stop → Drop → Roll → get an adult. Do not run.',
      ),
    ),
    QuizQuestion(
      prompt: 'There is smoke while you leave. What helps?',
      choices: [
        Choice('', 'Hide in a closet'),
        Choice('', 'Stand tall in the smoke'),
        Choice('', 'Stay low and go to the safe exit', correct: true),
      ],
      explain: 'Stay low under the smoke and keep moving to the exit.',
      interaction: SimStep(
        kind: SimKind.sceneDecision,
        alert: 'Look at the scene',
        prompt: 'Smoke fills the hallway. What do you do?',
        scene: _smokeScene,
        choices: [
          Choice('', 'Stay low and go to the exit', correct: true),
          Choice('', 'Hide in the bathroom'),
          Choice('', 'Stand tall and walk through smoke'),
        ],
        debrief: 'Stay low and keep going out. Never hide.',
        seconds: 16,
      ),
    ),
    QuizQuestion(
      prompt: 'You are outside. Your phone is still inside. What do you do?',
      choices: [
        Choice('', 'Stay at the meeting place with your class', correct: true),
        Choice('', 'Run back inside quickly'),
        Choice('', 'Send a friend inside to get it'),
      ],
      explain: 'Get out and stay out. Belongings can be replaced.',
    ),
    QuizQuestion(
      prompt: 'Why learn a second escape route?',
      choices: [
        Choice('', 'So you can look for the fire'),
        Choice('', 'The main exit might be blocked', correct: true),
        Choice('', 'So you can skip fire drills'),
      ],
      explain: 'Another safe way out helps if the main exit is blocked.',
    ),
  ],
  simulation: const [
    SimStep(
      kind: SimKind.findHazards,
      alert: 'Look at the scene',
      prompt: 'Find every hazard in the scene.',
      seconds: 22,
      scene: _hazardsScene,
      hotspots: _hazardHotspots,
      debrief: 'Candle beside paper can start a fire. Tell an adult.',
      unsafeDebrief:
          'Keep looking for things that can start a fire — not toys or bags.',
      points: 15,
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'Look at the scene',
      prompt: 'The fire alarm is sounding. What should you do?',
      scene: _alarmScene,
      choices: [
        Choice('', 'Pack your bag first'),
        Choice('', 'Follow your teacher to the exit', correct: true),
        Choice('', 'Look for the fire to put it out'),
      ],
      debrief: 'Leave with your teacher. Do not pack or fight the fire.',
      points: 10,
    ),
    SimStep(
      kind: SimKind.tapSafeArea,
      alert: 'Look at the scene',
      prompt: 'One path is on fire. Tap the safe exit.',
      scene: _exitScene,
      hotspots: _exitHotspots,
      answer: 'exit',
      debrief:
          'Use the clear green door. Never go toward the fire or the blocked path.',
      unsafeDebrief: 'Keep looking for the open door — not the fire or rubble.',
      points: 10,
      seconds: 18,
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'Look at the scene',
      prompt: 'You see a small fire. What is safest for you?',
      scene: _smallFireScene,
      choices: [
        Choice('', 'Tell an adult and leave if needed', correct: true),
        Choice('', 'Try to put it out yourself'),
        Choice('', 'Hide nearby and watch'),
      ],
      debrief:
          'Your job is to get help and stay safe. Trained adults handle extinguishers. Simulation lang ito.',
      unsafeDebrief:
          'Do not fight the fire yourself. Tell an adult and evacuate if needed.',
      points: 15,
      seconds: 16,
    ),
    SimStep(
      kind: SimKind.safetySequence,
      alert: 'Look at the scene',
      prompt: 'Clothes caught fire. Tap the next correct step.',
      seconds: 24,
      scene: _clothesScene,
      choices: [
        Choice('', 'Stop moving'),
        Choice('', 'Drop and cover your face'),
        Choice('', 'Roll until flames are out'),
        Choice('', 'Get help from an adult'),
      ],
      debrief: 'Stop → Drop → Roll → adult help. Do not run.',
      points: 15,
    ),
    SimStep(
      kind: SimKind.chooseAction,
      alert: 'Look at the scene',
      prompt: 'You are at the meeting place. Your bag is still inside.',
      scene: _meetingScene,
      choices: [
        Choice('', 'Run back for the bag'),
        Choice('', 'Ask a friend to go inside'),
        Choice('', 'Stay with your class at the meeting place', correct: true),
      ],
      debrief: 'Stay with your class. Tell a teacher if someone is missing.',
      points: 10,
    ),
  ],
);
