import 'package:flutter/material.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_models.dart';

// Module 13 — Bullying Awareness.
// Source: assets/lessons/Module-13-Bullying-Awareness.pdf
const _sky = [Color(0xFFE8F0FF), Color(0xFFF3F6FF)];
const _ground = Color(0xFFC5D4E8);

final bullying = LessonContent(
  key: 'bullying',
  title: 'Bullying Awareness',
  emoji: '🤝',
  imageAsset: 'assets/modules/bullying_3d.png',
  color: const Color(0xFFE8F0FF),
  badge: 'Bullying Awareness Champion',
  badgeEmoji: '🌟',
  matches: (name) {
    final n = name.toLowerCase();
    return n.contains('bully') && !n.contains('cyber');
  },
  story: const [
    StoryPage(
      title: 'What is bullying?',
      text:
          'Bullying is when someone repeatedly hurts, scares, embarrasses, or leaves another person out on purpose. It can happen with words, actions, relationships, or through the internet.',
      tip: 'Not every disagreement is bullying — but serious harm should still be reported.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/bullying_p1.png',
      ),
    ),
    StoryPage(
      title: 'Forms of bullying',
      text:
          'Bullying can be physical (hitting, pushing), verbal (name-calling, threats), social (excluding, spreading rumors), or cyberbullying through apps, games, and messages.',
      tip: 'Recognizing the form helps you know when to get help.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/bullying_p2.png',
      ),
    ),
    StoryPage(
      title: 'Conflict is not always bullying',
      text:
          'Friends may disagree about a game, or someone may accidentally say something hurtful. That may need guidance, but it is not automatically bullying. If you are unsure, tell a trusted adult.',
      tip: 'Context matters. You do not have to classify it alone.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/bullying_p3.png',
      ),
    ),
    StoryPage(
      title: 'If you are being bullied',
      text:
          'Prioritize safety, move toward a safer place, and tell a trusted adult. Explain what happened, who was involved, where and when it happened, and whether there is evidence.',
      tip: 'Asking for help is not a sign of weakness.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/bullying_p4.png',
      ),
    ),
    StoryPage(
      title: 'Be a safe bystander',
      text:
          'A bystander witnesses harmful behavior. You can avoid joining in, support the person being targeted, tell a trusted adult, and help them reach a safe place — without putting yourself in danger.',
      tip: 'An upstander takes a safe, constructive action — not a dangerous fight.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/bullying_p5.png',
      ),
    ),
    StoryPage(
      title: 'Cyberbullying safety',
      text:
          'If someone sends harmful online messages: do not escalate the argument, save evidence when it is safe, use blocking or reporting tools, and tell a trusted adult.',
      tip: 'Do not respond to serious online harassment with more harassment.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/bullying_p6.png',
      ),
    ),
    StoryPage(
      title: 'Safety first',
      text:
          'Do not physically fight back or retaliate. Do not spread rumors or encourage harmful posts. Report threats, violence, or serious safety concerns immediately to a trusted adult.',
      tip: 'Recognize harm. Stay safe. Support others when safe. Tell a trusted adult.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/bullying_p7.png',
      ),
    ),
  ],
  quiz: const [
    QuizQuestion(
      prompt: 'Which statement best describes bullying?',
      choices: [
        Choice(
          '⚠️',
          'Harmful behavior that may involve repetition, a power imbalance, or difficulty defending oneself',
          correct: true,
        ),
        Choice('🎮', 'Every disagreement between two learners'),
        Choice('😄', 'Any joke between friends'),
      ],
      explain:
          'Bullying commonly involves harmful repeated behavior or a power imbalance. Serious one-time incidents should also be reported.',
    ),
    QuizQuestion(
      prompt: 'Which is an example of cyberbullying?',
      choices: [
        Choice(
          '💻',
          'Repeatedly posting humiliating comments about a classmate online',
          correct: true,
        ),
        Choice('📓', 'Forgetting to bring a notebook'),
        Choice('🙋', 'Asking a teacher a question'),
      ],
      explain:
          'Cyberbullying is harmful behavior carried out through digital technology or online platforms.',
    ),
    QuizQuestion(
      prompt: 'True or False: A learner should physically fight back when bullied.',
      choices: [
        Choice('❌', 'False — prioritize safety and seek help', correct: true),
        Choice('✅', 'True — always fight back'),
        Choice('🤷', 'Only if no adults are nearby'),
      ],
      explain:
          'Physical retaliation can increase danger. Prioritize safety and seek help from trusted adults.',
    ),
    QuizQuestion(
      prompt: 'You witness a classmate being repeatedly excluded. What should you do?',
      choices: [
        Choice(
          '🤝',
          'Avoid participating and seek help from a trusted adult',
          correct: true,
        ),
        Choice('👥', 'Join the group so you will not be excluded'),
        Choice('📣', 'Spread the story to other classmates'),
      ],
      explain:
          'A safe bystander response is to avoid encouraging the behavior and seek appropriate assistance.',
    ),
    QuizQuestion(
      prompt: 'Which is an appropriate action when experiencing cyberbullying?',
      choices: [
        Choice('📸', 'Save relevant evidence and seek help', correct: true),
        Choice('😤', 'Threaten the sender'),
        Choice('📢', 'Post the sender\'s private information'),
      ],
      explain:
          'Keeping evidence and seeking help helps adults address the situation without escalating the conflict.',
    ),
    QuizQuestion(
      prompt: 'What is an upstander?',
      choices: [
        Choice(
          '🌟',
          'Someone who safely takes constructive action when witnessing harmful behavior',
          correct: true,
        ),
        Choice('😂', 'Someone who encourages bullying'),
        Choice('🙈', 'Someone who ignores every problem'),
      ],
      explain:
          'An upstander takes a safe action such as supporting someone or seeking adult help.',
    ),
    QuizQuestion(
      prompt: 'Which situation requires immediate adult attention?',
      choices: [
        Choice('🚨', 'A learner receives a serious threat of violence', correct: true),
        Choice('🎮', 'Two friends disagree about which game to play'),
        Choice('📝', 'A learner forgets homework'),
      ],
      explain:
          'Serious threats of violence should be reported immediately to a trusted adult.',
    ),
  ],
  simulation: const [
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: Three learners repeatedly make fun of a classmate at lunch!',
      prompt: 'What should you do?',
      seconds: 12,
      scene: Scene(
        image: 'assets/modules/bullying_sim_1.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice(
          '🤝',
          'Safely support the learner and tell a trusted adult',
          correct: true,
        ),
        Choice('😂', 'Laugh so they will not target you'),
        Choice('👥', 'Join the group'),
        Choice('👊', 'Threaten the group'),
      ],
      debrief:
          'Avoid encouraging the behavior, support the learner when appropriate, and seek adult help.',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: Hurtful messages keep arriving in a group chat!',
      prompt: 'What is the safest response?',
      seconds: 12,
      scene: Scene(
        image: 'assets/modules/bullying_sim_2.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice(
          '🛡',
          'Save evidence, use reporting/blocking tools, and tell a trusted adult',
          correct: true,
        ),
        Choice('😤', 'Send more insulting messages'),
        Choice('👊', 'Threaten the person'),
        Choice('📢', 'Share the messages publicly to embarrass them'),
      ],
      debrief:
          'Escalating online may make things worse. Preserve evidence and seek appropriate help.',
    ),
    SimStep(
      kind: SimKind.safetySequence,
      alert: 'SITUATION: You notice harmful behavior!',
      prompt: 'Tap STOP → THINK → ACT in order.',
      seconds: 14,
      scene: Scene(
        image: 'assets/modules/bullying_sim_3.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice('🛑', 'STOP — identify what is happening'),
        Choice('💭', 'THINK — choose the safest response'),
        Choice('✅', 'ACT — tell an adult / support safely'),
      ],
      debrief:
          'STOP, THINK, then ACT: move to safety, support when safe, and tell a trusted adult.',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: A group spreads rumors and tells others not to talk to someone!',
      prompt: 'What should you do?',
      seconds: 12,
      scene: Scene(
        image: 'assets/modules/bullying_sim_4.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice(
          '🚫',
          'Do not join the exclusion — seek help from a trusted adult',
          correct: true,
        ),
        Choice('📣', 'Help spread the rumor'),
        Choice('👥', 'Join so you stay popular'),
        Choice('🙈', 'Ignore serious harm forever'),
      ],
      debrief:
          'Do not join exclusion or rumors. Avoid spreading harm and tell a trusted adult.',
    ),
    SimStep(
      kind: SimKind.findObject,
      alert: 'SITUATION: Who can help?',
      prompt: 'Tap the trusted adult in the scene.',
      seconds: 14,
      answer: 'adult',
      scene: Scene(
        image: 'assets/modules/bullying_sim_2.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      hotspots: [
        // Adult is only the caregiver's head/shoulders above the learner —
        // a tall box over both figures made tapping the child count as correct.
        SceneHotspot(
          id: 'adult',
          x: 0.40,
          y: 0.04,
          width: 0.38,
          height: 0.28,
          correct: true,
          label: 'Trusted adult',
        ),
        SceneHotspot(
          id: 'phone',
          x: 0.36,
          y: 0.56,
          width: 0.30,
          height: 0.24,
          correct: false,
          label: 'Phone',
        ),
        // Child covers the learner's head and torso so that area is never "adult".
        SceneHotspot(
          id: 'child',
          x: 0.26,
          y: 0.24,
          width: 0.42,
          height: 0.48,
          correct: false,
          label: 'Learner',
        ),
      ],
      debrief:
          'Tell a parent, guardian, teacher, counselor, or another responsible adult.',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: Someone makes a serious threat of violence!',
      prompt: 'What should you do?',
      seconds: 12,
      scene: Scene(
        image: 'assets/modules/bullying_sim_6.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice(
          '🚨',
          'Tell a trusted adult immediately — seek emergency help if needed',
          correct: true,
        ),
        Choice('🤐', 'Keep it secret'),
        Choice('😂', 'Treat it as just a joke'),
        Choice('👊', 'Threaten them back'),
      ],
      debrief:
          'Serious threats require immediate adult attention and appropriate safety procedures.',
    ),
  ],
);
