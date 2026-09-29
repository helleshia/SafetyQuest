import 'package:flutter/material.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_models.dart';

// Module 9 - Stranger Danger & Personal Safety.
const _sky = [Color(0xFFFFF4E4), Color(0xFFFBE3CF)];
const _ground = Color(0xFFBFD9B4);

final strangerDanger = LessonContent(
  key: 'stranger-danger',
  title: 'Stranger Danger',
  emoji: '🧍',
  imageAsset: 'assets/modules/stranger_3d.png',
  color: const Color(0xFFFCE3AD),
  badge: 'Smart Explorer',
  badgeEmoji: '🛡️',
  matches: (name) {
    final n = name.toLowerCase();
    return n.contains('stranger');
  },
  story: const [
    StoryPage(
      title: 'What is a Stranger?',
      text:
          'A stranger is simply someone you do not know. Being unfamiliar does not always mean someone is dangerous, but we should watch out for unsafe behaviors and situations.',
      tip: 'Focus on whether a situation feels safe or unsafe.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/stranger_danger_p1.png',
      ),
    ),
    StoryPage(
      title: 'Warning Signs',
      text:
          'If an unfamiliar person asks you to go somewhere with them, or offers you unexpected gifts like candy or toys, do not go with them!',
      tip: 'A safe response is "No, thank you."',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/stranger_danger_p2.png',
      ),
    ),
    StoryPage(
      title: 'Unsafe Secrets',
      text:
          'Surprises like birthday parties are fun! But if an adult asks you to keep an unsafe secret from your parents, you should tell a trusted adult immediately.',
      tip: 'No adult should make you keep an unsafe secret.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/stranger_danger_p3.png',
      ),
    ),
    StoryPage(
      title: 'NO, GO, TELL!',
      text:
          'If you feel uncomfortable: Say NO, GO move away to a safe place, and TELL a trusted adult what happened. Keep telling until someone helps.',
      tip: 'Your safety is more important than being polite!',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/stranger_danger_p4.png',
      ),
    ),
    StoryPage(
      title: 'Trusted Adults',
      text:
          'A trusted adult is someone who cares about your safety, like your parents, grandparents, teachers, or a police officer. Always ask them for help.',
      tip: 'It is good to know more than one trusted adult.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/stranger_danger_p5.png',
      ),
    ),
    StoryPage(
      title: 'The Check First Rule',
      text:
          'Always "Check First" with your trusted adult before going anywhere, accepting a gift, or following someone, even if they say your parents sent them.',
      tip: 'Verify it with your parent or guardian first.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/stranger_danger_p6.png',
      ),
    ),
    StoryPage(
      title: 'Online Stranger Danger',
      text:
          'People you meet in online games or chats are also strangers! Never share personal info like your name, home address, or passwords.',
      tip:
          'Stop communicating and tell an adult if someone online asks for secrets.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/stranger_danger_p7.png',
      ),
    ),
  ],
  quiz: const [
    QuizQuestion(
      prompt:
          'What should you do if an unfamiliar person asks you to go somewhere with them?',
      choices: [
        Choice(
          '🗣️',
          'Say NO, run away, and tell a trusted adult',
          correct: true,
        ),
        Choice('🚗', 'Go with them if they seem nice'),
        Choice('🤐', 'Keep it a secret'),
      ],
      explain:
          'Never go anywhere with an unfamiliar person without checking with a trusted adult first.',
    ),
    QuizQuestion(
      prompt:
          'Which of the following information should you keep private online?',
      choices: [
        Choice('🔒', 'Your home address and passwords', correct: true),
        Choice('🎨', 'Your favorite color'),
        Choice('⭐', 'Your favorite animal'),
      ],
      explain:
          'You should never share personal information like your address or passwords online.',
    ),
    QuizQuestion(
      prompt: 'What does NO, GO, TELL mean?',
      choices: [
        Choice(
          '🗣️',
          'Say no, move to safety, tell a trusted adult',
          correct: true,
        ),
        Choice('🤫', 'Stay quiet and hope it stops'),
        Choice('🤐', 'Accept gifts and keep secrets'),
      ],
      explain:
          'Your safety matters more than being polite. Keep telling until someone helps.',
    ),
    QuizQuestion(
      prompt:
          'Someone offers unexpected candy to leave with them. What do you do?',
      choices: [
        Choice('🙅', 'Say “No, thank you? and tell an adult', correct: true),
        Choice('🍭', 'Take the candy and go'),
        Choice('🙈', 'Hide the candy and say nothing'),
      ],
      explain:
          'Unexpected gifts used to lure you away are a warning sign. Check First with a trusted adult.',
    ),
    QuizQuestion(
      prompt: 'Who is a trusted adult?',
      choices: [
        Choice(
          '🧑‍🏫',
          'A parent, teacher, or police officer who keeps you safe',
          correct: true,
        ),
        Choice('🎮', 'Anyone who plays the same game online'),
        Choice('🚗', 'A stranger with a nice car'),
      ],
      explain:
          'Trusted adults care about your safety. Know more than one person you can ask for help.',
    ),
    QuizQuestion(
      prompt:
          'An adult asks you to keep an unsafe secret from your parents. What should you do?',
      choices: [
        Choice('🗣️', 'Tell a trusted adult right away', correct: true),
        Choice('🤐', 'Keep the secret forever'),
        Choice('😅', 'Laugh and ignore it'),
      ],
      explain:
          'Birthday surprises are okay. Unsafe secrets are not — tell someone who can help.',
    ),
    QuizQuestion(
      prompt:
          'Someone says your parent sent them to pick you up. What is the Check First rule?',
      choices: [
        Choice('✅', 'Verify with your parent or guardian first', correct: true),
        Choice('🚶', 'Go immediately so you are not late'),
        Choice('📱', 'Post it online for likes'),
      ],
      explain:
          'Always Check First before going anywhere or accepting help from someone you do not know.',
    ),
  ],
  // Videos: assets/media/stranger-danger_sim_1..6.mp4 via practiceSceneAt().
  simulation: const [
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: A stranger offers candy to leave with them!',
      prompt: 'Watch the video. What is the safest action?',
      seconds: 10,
      scene: Scene(
        image: 'assets/modules/stranger_danger_p1.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice('🗣️', 'Say NO, move away, tell an adult', correct: true),
        Choice('🍭', 'Take the candy and go'),
        Choice('🤐', 'Keep it a secret'),
        Choice('🚗', 'Get in the car because they seem nice'),
      ],
      debrief: 'Use NO–GO–TELL. Simulation lang ito — practice for real life.',
    ),
    SimStep(
      kind: SimKind.safetySequence,
      alert: 'SITUATION: Practice NO, GO, TELL!',
      prompt: 'Tap the steps in order.',
      seconds: 12,
      scene: Scene(
        image: 'assets/modules/stranger_danger_p4.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice('🙅', 'Say NO'),
        Choice('⭐', 'GO to a safe place'),
        Choice('🗣️', 'TELL a trusted adult'),
      ],
      debrief: 'Say no, move to safety, and keep telling until someone helps.',
    ),
    SimStep(
      kind: SimKind.findObject,
      alert: 'SITUATION: Who can help you?',
      prompt: 'Tap a trusted adult who can help you.',
      seconds: 14,
      answer: 'police',
      scene: Scene(
        image: 'assets/modules/stranger_danger_p5.png',
        sky: _sky,
        ground: _ground,

        props: const [],
      ),
      hotspots: [
        SceneHotspot(
          id: 'police',
          x: 0.62,
          y: 0.37,
          width: 0.20,
          height: 0.35,
          correct: true,
          label: 'Police officer',
        ),
        SceneHotspot(
          id: 'teacher',
          x: 0.61,
          y: 0.10,
          width: 0.18,
          height: 0.26,
          correct: true,
          label: 'Teacher',
        ),
        SceneHotspot(
          id: 'grandma',
          x: 0.41,
          y: 0.05,
          width: 0.18,
          height: 0.25,
          correct: true,
          label: 'Grandparent',
        ),
        SceneHotspot(
          id: 'parent',
          x: 0.21,
          y: 0.12,
          width: 0.19,
          height: 0.22,
          correct: true,
          label: 'Parent',
        ),
        SceneHotspot(
          id: 'kid',
          x: 0.37,
          y: 0.32,
          width: 0.19,
          height: 0.25,
          correct: false,
          label: 'Another kid',
        ),
        SceneHotspot(
          id: 'kid2',
          x: 0.16,
          y: 0.36,
          width: 0.20,
          height: 0.34,
          correct: false,
          label: 'Another kid',
        ),
      ],
      debrief: 'Trusted adults include parents, teachers, and police officers.',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: Someone says your parent sent them!',
      prompt: 'What is the Check First rule?',
      seconds: 10,
      scene: Scene(
        image: 'assets/modules/stranger_danger_p6.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice('✅', 'Verify with your parent first', correct: true),
        Choice('🚶', 'Go with them right away'),
        Choice('📱', 'Post it online'),
        Choice('👪', 'Keep it secret from your family'),
      ],
      debrief:
          'Always Check First with your parent or guardian before leaving.',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: An adult asks you to keep an unsafe secret!',
      prompt: 'What should you do?',
      seconds: 10,
      scene: Scene(
        image: 'assets/modules/stranger_danger_p3.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice('🗣️', 'Tell a trusted adult right away', correct: true),
        Choice('🤐', 'Keep the secret forever'),
        Choice('😅', 'Laugh and ignore it'),
        Choice('🎁', 'Accept gifts to stay quiet'),
      ],
      debrief:
          'Birthday surprises are okay. Unsafe secrets are not — tell someone.',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: Online chat asks for your address!',
      prompt: 'What do you share?',
      seconds: 10,
      scene: Scene(
        image: 'assets/modules/stranger_danger_p7.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice('🚫', 'Nothing private — tell an adult', correct: true),
        Choice('🏠', 'Your home address'),
        Choice('🔑', 'Your password'),
        Choice('📍', 'Your live location'),
      ],
      debrief:
          'People online are strangers too. Never share address or passwords.',
    ),
  ],
);
