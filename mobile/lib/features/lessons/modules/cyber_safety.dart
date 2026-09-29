import 'package:flutter/material.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_models.dart';

// Module 10 - Cyberbullying & Online Safety.
const _sky = [Color(0xFFE2D4F0), Color(0xFFF3E5F5)];
const _ground = Color(0xFFC5D3E8);

final cyberSafety = LessonContent(
  key: 'cyber-safety',
  title: 'Cyberbullying & Online Safety',
  emoji: '💻',
  imageAsset: 'assets/modules/cyber_3d.png',
  color: const Color(0xFFE2D4F0),
  badge: 'Cyber Sentinel',
  badgeEmoji: '🔒',
  matches: (name) {
    final n = name.toLowerCase();
    return n.contains('cyber') || n.contains('online');
  },
  story: const [
    StoryPage(
      title: 'The Internet Community',
      text:
          'The internet is a big community! Just like at school or the park, we should always be respectful and kind to others online.',
      tip: 'Remember that behind every username is a real person.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/cyber_safety_p1.png',
      ),
    ),
    StoryPage(
      title: 'What is Cyberbullying?',
      text:
          'Cyberbullying is when someone uses digital devices to repeatedly hurt, embarrass, or threaten another person. It\'s not a joke if it makes you feel unsafe.',
      tip: 'It is never your fault if someone bullies you online.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/cyber_safety_p2.png',
      ),
    ),
    StoryPage(
      title: 'STOP, SAVE, BLOCK, TELL',
      text:
          'If someone is mean online, use this strategy! Stop and don\'t reply, Save proof like screenshots, Block the person, and Tell a trusted adult.',
      tip: 'Pause and take a breath before you respond.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/cyber_safety_p3.png',
      ),
    ),
    StoryPage(
      title: 'Protect Personal Info',
      text:
          'Keep your passwords, home address, and location a secret! Never share them with strangers or even friends online.',
      tip: 'Treat passwords like your toothbrush—don’t share them with anyone!',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/cyber_safety_p4.png',
      ),
    ),
    StoryPage(
      title: 'THINK Before You Post',
      text:
          'Before you share a message or photo, check if it\'s T-H-I-N-K: True, Helpful, Important, Necessary, and Kind. If it might hurt someone, don\'t post it.',
      tip: 'Once something is posted online, it\'s hard to remove.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/cyber_safety_p5.png',
      ),
    ),
    StoryPage(
      title: 'Be a Responsible Bystander',
      text:
          'If you see a classmate being bullied, don\'t join in or laugh. Support them privately, report the harmful content, and ask an adult for help.',
      tip: 'Telling an adult helps stop cyberbullying safely.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/cyber_safety_p6.png',
      ),
    ),
    StoryPage(
      title: 'Watch Out for Scams',
      text:
          'Not everyone online is who they claim to be. Never click on suspicious links, even if they say you won a free prize!',
      tip:
          'Unexpected prizes combined with requests for info are warning signs.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/cyber_safety_p7.png',
      ),
    ),
  ],
  quiz: const [
    QuizQuestion(
      prompt: 'What should you do if someone sends mean messages online?',
      choices: [
        Choice(
          '🚫',
          'Do not reply, save proof, and tell an adult',
          correct: true,
        ),
        Choice('😡', 'Send mean messages back'),
        Choice('🙈', 'Keep it a secret'),
      ],
      explain: 'Telling a trusted adult helps stop cyberbullying safely.',
    ),
    QuizQuestion(
      prompt: 'Which information should generally be kept private?',
      choices: [
        Choice('🔒', 'Your password', correct: true),
        Choice('⚽', 'Your favorite sport'),
        Choice('🎨', 'Your favorite color'),
      ],
      explain:
          'Passwords and home addresses should be kept private and protected.',
    ),
    QuizQuestion(
      prompt:
          'You get a message saying "You won a phone! Send your password now!" What do you do?',
      choices: [
        Choice(
          '🙅',
          'Do not provide it, report it, and tell an adult',
          correct: true,
        ),
        Choice('📱', 'Send your password quickly'),
        Choice('🔗', 'Share the message with everyone'),
      ],
      explain:
          'Unexpected prizes asking for personal information are often scams.',
    ),
    QuizQuestion(
      prompt: 'What does STOP, SAVE, BLOCK, TELL mean?',
      choices: [
        Choice(
          '🗣️',
          'Pause, keep proof, block the person, tell an adult',
          correct: true,
        ),
        Choice('🔥', 'Argue online until you win'),
        Choice('🙈', 'Delete everything and stay silent'),
      ],
      explain:
          'This strategy helps you stay safe and get help without making the bullying worse.',
    ),
    QuizQuestion(
      prompt:
          'Before you post a message or photo, use THINK. What does it check?',
      choices: [
        Choice(
          '💚',
          'True, Helpful, Important, Necessary, Kind',
          correct: true,
        ),
        Choice('😂', 'Trendy, Hilarious, Instant, Noisy, Cool'),
        Choice('🤫', 'That nobody will ever see it'),
      ],
      explain:
          'If a post might hurt someone, do not share it. Online words are hard to remove.',
    ),
    QuizQuestion(
      prompt:
          'You see a classmate being bullied online. What should a responsible bystander do?',
      choices: [
        Choice(
          '🤝',
          'Support them, report it, and ask an adult for help',
          correct: true,
        ),
        Choice('😂', 'Join in and laugh'),
        Choice('👀', 'Watch quietly and do nothing'),
      ],
      explain:
          'Do not join the harm. Private support plus adult help can stop cyberbullying.',
    ),
    QuizQuestion(
      prompt: 'Someone online asks for your home address. What do you do?',
      choices: [
        Choice('🚫', 'Do not share it — tell a trusted adult', correct: true),
        Choice('🏠', 'Send your exact address'),
        Choice('📍', 'Share your live location for fun'),
      ],
      explain:
          'Location and address are private. Never share them with online strangers.',
    ),
  ],
  // Videos: assets/media/cyber-safety_sim_1..6.mp4 via practiceSceneAt().
  simulation: const [
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: Someone asks for your home address online!',
      prompt: 'Watch the video. What do you do?',
      seconds: 10,
      scene: Scene(
        image: 'assets/modules/cyber_safety_p4.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice('🙅', 'Refuse, block, and tell a parent', correct: true),
        Choice('🏠', 'Type your exact address'),
        Choice('📍', 'Share live location for fun'),
        Choice('🔑', 'Send your password too'),
      ],
      debrief: 'Private info stays private. Simulation lang ito.',
    ),
    SimStep(
      kind: SimKind.safetySequence,
      alert: 'SITUATION: Mean messages arrive!',
      prompt: 'Tap STOP, SAVE, BLOCK, TELL in order.',
      seconds: 14,
      scene: Scene(
        image: 'assets/modules/cyber_safety_p3.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice('🛑', 'Stop — do not reply'),
        Choice('📸', 'Save proof'),
        Choice('🚫', 'Block the person'),
        Choice('🗣️', 'Tell a trusted adult'),
      ],
      debrief: 'Do not reply mean. Save proof, block, and get adult help.',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: Group chat shares an embarrassing photo!',
      prompt: 'What is the safest response?',
      seconds: 10,
      scene: Scene(
        image: 'assets/modules/cyber_safety_p6.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice('🚫', 'Do not share — report and tell an adult', correct: true),
        Choice('😂', 'Laugh and forward it'),
        Choice('🔥', 'Add mean comments'),
        Choice('👀', 'Watch and do nothing forever'),
      ],
      debrief: 'Be a responsible bystander. Do not spread harmful content.',
    ),
    SimStep(
      kind: SimKind.findObject,
      alert: 'SITUATION: Protect your secrets!',
      prompt: 'Tap what keeps your password and secrets locked away.',
      seconds: 14,
      answer: 'password',
      scene: Scene(
        image: 'assets/modules/cyber_safety_p4.png',
        sky: _sky,
        ground: _ground,

        props: const [],
      ),
      hotspots: [
        SceneHotspot(
          id: 'password',
          x: 0.25,
          y: 0.38,
          width: 0.18,
          height: 0.26,
          correct: true,
          label: 'Padlock',
        ),
        SceneHotspot(
          id: 'safe',
          x: 0.75,
          y: 0.46,
          width: 0.16,
          height: 0.18,
          correct: true,
          label: 'Safe',
        ),
        SceneHotspot(
          id: 'window',
          x: 0.20,
          y: 0.28,
          width: 0.09,
          height: 0.11,
          correct: false,
          label: 'Window',
        ),
        SceneHotspot(
          id: 'heart',
          x: 0.72,
          y: 0.21,
          width: 0.09,
          height: 0.09,
          correct: false,
          label: 'Heart',
        ),
      ],
      debrief:
          'Passwords and home addresses stay private — not colors or sports.',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: “You won a phone! Send your password!?',
      prompt: 'What do you do?',
      seconds: 10,
      scene: Scene(
        image: 'assets/modules/cyber_safety_p7.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice(
          '🙅',
          'Do not send it — report and tell an adult',
          correct: true,
        ),
        Choice('📱', 'Send your password quickly'),
        Choice('🔗', 'Click every prize link'),
        Choice('📣', 'Share the scam with younger kids as real'),
      ],
      debrief: 'Unexpected prizes that ask for passwords are scams.',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: Before you post a photo…',
      prompt: 'What does THINK remind you to check?',
      seconds: 10,
      scene: Scene(
        image: 'assets/modules/cyber_safety_p5.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice(
          '💚',
          'True, Helpful, Important, Necessary, Kind',
          correct: true,
        ),
        Choice('😂', 'Only if it gets many likes'),
        Choice('🤫', 'That nobody will ever see it'),
        Choice('⚡', 'Post first, think later'),
      ],
      debrief: 'If a post might hurt someone, do not share it.',
    ),
  ],
);
