import 'package:flutter/material.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_models.dart';

// Follows Bureau of Fire Protection and Philippine Red Cross fire safety tips.

const _room = [Color(0xFFFFF4E4), Color(0xFFFBE3CF)];
const _roomFloor = Color(0xFFE9C9AE);
const _smoky = [Color(0xFFB9B2AE), Color(0xFFE7DCD3)];
const _hall = Color(0xFFD9C3B1);
const _outside = [Color(0xFFD6E7EF), Color(0xFFEAF3F6)];
const _grass = Color(0xFFBFD9B4);

final fire = LessonContent(
  key: 'fire',
  title: 'Fire Safety',
  emoji: '🔥',
  color: const Color(0xFFF5E4AF),
  badge: 'Smoke Smart',
  badgeEmoji: '🧯',
  matches: (name) {
    final n = name.toLowerCase();
    return n.contains('fire') && !n.contains('drill');
  },
  story: const [
    StoryPage(
      title: 'Fire spreads fast',
      text:
          'A small fire can grow very big in just a few minutes. When there is a fire, get out fast and stay out.',
      tip: 'Things can be replaced. You cannot.',
      scene: Scene(
        sky: _room,
        ground: _roomFloor,
        props: [
          Prop('🔥', x: -.4, y: .35, size: 58, motion: Motion.flicker),
          Prop(
            '🔥',
            x: .05,
            y: .4,
            size: 74,
            motion: Motion.flicker,
            phase: .3,
          ),
          Prop(
            '🔥',
            x: .5,
            y: .38,
            size: 52,
            motion: Motion.flicker,
            phase: .6,
          ),
          Prop('⭐', x: .7, y: -.6, size: 42, motion: Motion.pulse),
        ],
      ),
    ),
    StoryPage(
      title: 'Smoke goes up',
      text:
          'Smoke is hot and it rises. The clean air stays down low, near the floor.',
      tip: 'Breathing smoke is more dangerous than the flames.',
      scene: Scene(
        sky: _smoky,
        ground: _hall,
        props: [
          Prop('💨', x: -.5, y: -.2, size: 50, motion: Motion.rise),
          Prop('💨', x: .1, y: -.3, size: 58, motion: Motion.rise, phase: .4),
          Prop('💨', x: .6, y: -.25, size: 48, motion: Motion.rise, phase: .7),
          Prop('⭐', x: 0, y: .7, size: 40, motion: Motion.drift),
        ],
      ),
    ),
    StoryPage(
      title: 'Get low and go',
      text:
          'If there is smoke, crawl on your hands and knees under it. Keep your head low and go to the nearest exit.',
      scene: Scene(
        sky: _smoky,
        ground: _hall,
        props: [
          Prop('💨', x: -.4, y: -.55, size: 52, motion: Motion.rise),
          Prop('💨', x: .35, y: -.6, size: 52, motion: Motion.rise, phase: .5),
          Prop('🧎', x: -.2, y: .6, size: 58, motion: Motion.drift),
          Prop('🚪', x: .8, y: .35, size: 60),
        ],
      ),
    ),
    StoryPage(
      title: 'Feel the door first',
      text:
          'Touch the door with the back of your hand. If it is hot, do not open it. Use another way out.',
      tip: 'A cool door? Open it slowly and check for smoke.',
      scene: Scene(
        sky: _room,
        ground: _roomFloor,
        props: [
          Prop('🚪', x: -.1, y: .2, size: 96),
          Prop('✋', x: .45, y: .05, size: 50, motion: Motion.float),
          Prop('⭐', x: -.72, y: -.45, size: 42, motion: Motion.pulse),
        ],
      ),
    ),
    StoryPage(
      title: 'Stop, Drop, and Roll',
      text:
          'If your clothes catch fire, do not run. STOP where you are, DROP to the ground, cover your face, and ROLL until the fire is out.',
      scene: Scene(
        sky: _outside,
        ground: _grass,
        props: [
          Prop('✋', x: -.62, y: .1, size: 48, motion: Motion.pulse),
          Prop('⭐', x: 0, y: .1, size: 48, motion: Motion.bounce),
          Prop('🔄', x: .62, y: .1, size: 48, motion: Motion.sway),
        ],
      ),
    ),
    StoryPage(
      title: 'Follow the evacuation line',
      text:
          'Walk with your class in a single line. Go to the meeting area and stay there. Never go back inside.',
      tip: 'Tell your teacher if a classmate is missing.',
      scene: Scene(
        sky: _outside,
        ground: _grass,
        props: [
          Prop('⭐', x: -.7, y: .4, size: 56, motion: Motion.bounce),
          Prop(
            '🧒',
            x: -.3,
            y: .45,
            size: 46,
            motion: Motion.bounce,
            phase: .25,
          ),
          Prop(
            '👧',
            x: .05,
            y: .45,
            size: 46,
            motion: Motion.bounce,
            phase: .5,
          ),
          Prop(
            '👦',
            x: .4,
            y: .45,
            size: 46,
            motion: Motion.bounce,
            phase: .75,
          ),
          Prop('🚩', x: .82, y: .05, size: 48, motion: Motion.sway),
        ],
      ),
    ),
    StoryPage(
      title: 'Call for help',
      text:
          'Once you are safe outside, tell an adult or call 911. Say your name, what is burning, and where you are.',
      tip: '911 is the Philippine emergency hotline.',
      scene: Scene(
        sky: _outside,
        ground: _grass,
        props: [
          Prop('⭐', x: -.45, y: .1, size: 64, motion: Motion.pulse),
          Prop('🚒', x: .45, y: .4, size: 72, motion: Motion.drift),
          Prop('🚨', x: .5, y: -.6, size: 38, motion: Motion.flicker),
        ],
      ),
    ),
  ],
  quiz: const [
    QuizQuestion(
      prompt: 'Where is the clean air when there is smoke?',
      choices: [
        Choice('⭐', 'Near the ceiling'),
        Choice('⭐', 'Near the floor', correct: true),
        Choice('🪟', 'By the window'),
        Choice('⭐', 'Under the bed'),
      ],
      explain: 'Smoke rises, so the cleaner air stays low near the floor.',
    ),
    QuizQuestion(
      prompt: 'How do you check if a door is safe?',
      choices: [
        Choice('✋', 'Back of your hand', correct: true),
        Choice('👀', 'Look through the keyhole'),
        Choice('🦶', 'Kick it open'),
        Choice('👂', 'Knock loudly'),
      ],
      explain:
          'Feel it with the back of your hand. A hot door means fire is on the other side.',
    ),
    QuizQuestion(
      prompt: 'Your sleeve catches fire! What do you do?',
      choices: [
        Choice('💧', 'Run for water'),
        Choice('🔄', 'Stop, Drop, and Roll', correct: true),
        Choice('👋', 'Wave your arm'),
        Choice('🙈', 'Hide'),
      ],
      explain:
          'Running makes fire bigger. Stop, drop, cover your face, and roll.',
    ),
    QuizQuestion(
      prompt: 'Where should you hide during a fire?',
      choices: [
        Choice('⭐', 'Under the bed'),
        Choice('🚪', 'In the closet'),
        Choice('🌳', 'Do not hide. Get out!', correct: true),
        Choice('🚽', 'In the bathroom'),
      ],
      explain:
          'Never hide from a fire. Firefighters need to find you, and smoke fills small spaces fast.',
    ),
    QuizQuestion(
      prompt: 'What number do you call for emergencies in the Philippines?',
      choices: [
        Choice('📞', '911', correct: true),
        Choice('📞', '123'),
        Choice('📞', '000'),
        Choice('📞', '555'),
      ],
      explain: '911 is the national emergency hotline in the Philippines.',
    ),
  ],
  simulation: const [
    SimStep(
      kind: SimKind.chooseAction,
      alert: 'FIRE ALARM! The bell is ringing!',
      prompt: 'What do you do first?',
      seconds: 8,
      scene: Scene(
        sky: _room,
        ground: _roomFloor,
        props: [
          Prop('🔔', x: -.6, y: -.55, size: 50, motion: Motion.shake),
          Prop('⭐', x: .55, y: .35, size: 58),
          Prop('🧒', x: -.1, y: .5, size: 52),
        ],
      ),
      choices: [
        Choice('🚶', 'Line up and follow the exit route', correct: true),
        Choice('🎒', 'Pack your bag first'),
        Choice('🙈', 'Hide under the desk'),
        Choice('😴', 'Wait to see if it is real'),
      ],
      debrief:
          'Every alarm is real until an adult says otherwise. Leave right away.',
    ),
    SimStep(
      kind: SimKind.chooseAction,
      alert: 'Smoke is filling the hallway!',
      prompt: 'How do you move?',
      seconds: 7,
      scene: Scene(
        sky: _smoky,
        ground: _hall,
        props: [
          Prop('💨', x: -.5, y: -.45, size: 56, motion: Motion.rise),
          Prop('💨', x: .2, y: -.5, size: 60, motion: Motion.rise, phase: .4),
          Prop('💨', x: .7, y: -.4, size: 52, motion: Motion.rise, phase: .7),
          Prop('🚪', x: .8, y: .4, size: 56),
        ],
      ),
      choices: [
        Choice('🧎', 'Crawl low under the smoke', correct: true),
        Choice('🧍', 'Stand up and run'),
        Choice('🧗', 'Climb up high'),
        Choice('🔙', 'Go back to the room'),
      ],
      debrief: 'Crawl low. The clean air is near the floor.',
    ),
    SimStep(
      kind: SimKind.findObject,
      alert: 'Two doors. One has fire behind it!',
      prompt: 'You felt both doors. Tap the COOL door to go through.',
      seconds: 8,
      answer: 'cool',
      scene: Scene(
        sky: _smoky,
        ground: _hall,
        props: [
          Prop('🚪', x: -.5, y: .2, size: 70, id: 'hot', label: 'Hot door'),
          Prop('🔥', x: -.5, y: -.55, size: 36, motion: Motion.flicker),
          Prop('🚪', x: .5, y: .2, size: 70, id: 'cool', label: 'Cool door'),
          Prop('⭐', x: .5, y: -.55, size: 32, motion: Motion.float),
        ],
      ),
      debrief:
          'A hot door means fire is behind it. Always take the cool way out.',
    ),
    SimStep(
      kind: SimKind.safetySequence,
      alert: 'A spark lands on your shirt!',
      prompt: 'Tap the steps in the right order.',
      seconds: 10,
      scene: Scene(
        sky: _outside,
        ground: _grass,
        props: [
          Prop('👕', x: 0, y: .1, size: 70),
          Prop('🔥', x: .25, y: -.1, size: 36, motion: Motion.flicker),
        ],
      ),
      choices: [
        Choice('✋', 'Stop'),
        Choice('⬇️', 'Drop'),
        Choice('🔄', 'Roll'),
      ],
      debrief:
          'Stop, Drop, and Roll puts the fire out. Cover your face as you roll.',
    ),
    SimStep(
      kind: SimKind.chooseAction,
      alert: 'You made it outside!',
      prompt: 'Your friend left a toy inside. What do you do?',
      seconds: 10,
      scene: Scene(
        sky: _outside,
        ground: _grass,
        props: [
          Prop('⭐', x: -.65, y: .1, size: 72),
          Prop('🔥', x: -.62, y: -.5, size: 36, motion: Motion.flicker),
          Prop('🚩', x: .6, y: .1, size: 50, motion: Motion.sway),
          Prop('👧', x: .2, y: .5, size: 48),
        ],
      ),
      choices: [
        Choice('🚩', 'Stay at the meeting area', correct: true),
        Choice('⭐', 'Run in to get it'),
        Choice('🧸', 'Help your friend go back'),
        Choice('🙈', 'Hide behind a car'),
      ],
      debrief: 'Get out and stay out. Toys can be replaced. You cannot.',
    ),
    SimStep(
      kind: SimKind.chooseAction,
      alert: 'You are calling 911.',
      prompt: 'What do you tell them?',
      seconds: 12,
      scene: Scene(
        sky: _outside,
        ground: _grass,
        props: [
          Prop('⭐', x: -.45, y: .05, size: 64, motion: Motion.pulse),
          Prop('🚒', x: .5, y: .45, size: 64, motion: Motion.drift),
        ],
      ),
      choices: [
        Choice('🔥', 'Your name, the fire, and where you are', correct: true),
        Choice('🎵', 'Sing a song'),
        Choice('📴', 'Hang up right away'),
        Choice('🤫', 'Say nothing'),
      ],
      debrief:
          'Stay calm and give your name, what is burning, and the address.',
    ),
  ],
);
