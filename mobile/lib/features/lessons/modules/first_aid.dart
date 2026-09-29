import 'package:flutter/material.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_models.dart';

// Module 12 — Basic First Aid.
// Source: assets/lessons/Module-12-Basic-First-Aid.pdf
// Learners Check → Call → Care within their training; they are not doctors.
const _sky = [Color(0xFFFFF0EB), Color(0xFFFCE4DE)];
const _ground = Color(0xFFE8C4B8);

final firstAid = LessonContent(
  key: 'first-aid',
  title: 'Basic First Aid',
  emoji: '🩹',
  imageAsset: 'assets/modules/first_aid_3d.png',
  color: const Color(0xFFFCE4DE),
  badge: 'First Aid Champion',
  badgeEmoji: '🩹',
  matches: (name) {
    final n = name.toLowerCase();
    return n.contains('first aid') || n.contains('first-aid');
  },
  story: const [
    StoryPage(
      title: 'What is first aid?',
      text:
          'First aid is the immediate help you give someone who is hurt or suddenly ill while waiting for professional medical care. It does not replace doctors or nurses.',
      tip: 'Think of first aid as helping safely until the right help arrives.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/first_aid_p1.png',
      ),
    ),
    StoryPage(
      title: 'Check, Call, Care',
      text:
          'Use three basic emergency actions: CHECK the scene and the person, CALL for appropriate help, and CARE according to the condition and your training.',
      tip: 'STOP → CHECK → CALL → CARE. Your own safety comes first.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/first_aid_p2.png',
      ),
    ),
    StoryPage(
      title: 'First aid for bleeding',
      text:
          'For minor bleeding when it is safe: protect yourself from contact with blood when possible, apply direct pressure with clean gauze or a clean dressing, and seek help if the wound is serious.',
      tip: 'Do not remove an embedded object. Get help for life-threatening bleeding right away.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/first_aid_p3.png',
      ),
    ),
    StoryPage(
      title: 'First aid for burns',
      text:
          'For a minor thermal burn: move away from the heat if safe, remove clothing or jewelry near the burn if it is not stuck, and cool with clean, cool running water.',
      tip: 'Do not put butter, toothpaste, oil, or other household substances on a burn.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/first_aid_p4.png',
      ),
    ),
    StoryPage(
      title: 'First aid for choking',
      text:
          'Choking means something is blocking the airway. If the person can speak or cough forcefully, encourage coughing. If they cannot speak, cry, or cough effectively, get emergency help immediately.',
      tip: 'Never practice choking maneuvers on a classmate for fun — only in supervised training.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/first_aid_p5.png',
      ),
    ),
    StoryPage(
      title: 'When to get professional help',
      text:
          'Get emergency help right away if someone is unresponsive, not breathing normally, has life-threatening bleeding, severe breathing trouble, a serious burn, severe choking, or a suspected serious head, neck, or spinal injury.',
      tip: 'When in doubt, get help rather than assuming it is minor.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/first_aid_p6.png',
      ),
    ),
    StoryPage(
      title: 'Help safely within your training',
      text:
          'Stay calm, ask for help early, and perform only procedures you have been properly taught. Do not rush into an unsafe scene or move someone unnecessarily when a serious neck or spinal injury is suspected.',
      tip: 'Be safe. Stay calm. Get help. Give appropriate care.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/first_aid_p7.png',
      ),
    ),
  ],
  quiz: const [
    QuizQuestion(
      prompt: 'What should you do before helping an injured person?',
      choices: [
        Choice('👀', 'Check whether the scene is safe', correct: true),
        Choice('🏃', 'Immediately move the person'),
        Choice('💧', 'Give the person water'),
      ],
      explain:
          'Scene safety should be checked before approaching. Your safety is part of first aid.',
    ),
    QuizQuestion(
      prompt: 'What are the three basic emergency actions in this module?',
      choices: [
        Choice('🩹', 'Check, Call, Care', correct: true),
        Choice('🏃', 'Run, Hide, Wait'),
        Choice('👀', 'Look, Walk, Leave'),
      ],
      explain:
          'Check the scene and person, call for appropriate assistance, and provide appropriate care.',
    ),
    QuizQuestion(
      prompt: 'A person has severe bleeding. What is an important first-aid action?',
      choices: [
        Choice('🩹', 'Apply appropriate direct pressure', correct: true),
        Choice('🙈', 'Ignore the bleeding'),
        Choice('🍎', 'Give the person food'),
      ],
      explain:
          'Direct pressure helps control external bleeding while emergency assistance is obtained.',
    ),
    QuizQuestion(
      prompt: 'What should be used to cool a thermal burn?',
      choices: [
        Choice('💧', 'Clean, cool running water', correct: true),
        Choice('🧈', 'Butter'),
        Choice('🦷', 'Toothpaste'),
      ],
      explain:
          'Clean, cool running water is recommended. Do not use butter, toothpaste, or oil.',
    ),
    QuizQuestion(
      prompt:
          'A person is unresponsive and not breathing normally. What should happen?',
      choices: [
        Choice(
          '🚨',
          'Activate emergency assistance and provide CPR/AED care if trained',
          correct: true,
        ),
        Choice('🍎', 'Give them food'),
        Choice('🚶', 'Ask them to walk around'),
      ],
      explain:
          'An unresponsive person who is not breathing normally or is only gasping needs immediate emergency action.',
    ),
    QuizQuestion(
      prompt:
          'True or False: A learner should enter a dangerous area to rescue someone immediately.',
      choices: [
        Choice('❌', 'False — check the scene first', correct: true),
        Choice('✅', 'True — rush in right away'),
        Choice('🤷', 'Only if friends say so'),
      ],
      explain:
          'Do not place yourself in danger. Check the scene first and obtain appropriate assistance.',
    ),
    QuizQuestion(
      prompt: 'What is the most important overall principle when providing first aid?',
      choices: [
        Choice(
          '🛡',
          'Help safely and within your level of training',
          correct: true,
        ),
        Choice('🔧', 'Do everything possible, even without training'),
        Choice('⏳', 'Wait until someone else notices'),
      ],
      explain:
          'Good first aid means responding safely, getting help, and giving care appropriate to your training.',
    ),
  ],
  simulation: const [
    SimStep(
      kind: SimKind.safetySequence,
      alert: 'SITUATION: Someone is hurt!',
      prompt: 'Tap the emergency actions in order.',
      seconds: 14,
      scene: Scene(
        image: 'assets/modules/first_aid_sim_1.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice('👀', 'Check'),
        Choice('📞', 'Call'),
        Choice('🩹', 'Care'),
      ],
      debrief:
          'CHECK the scene and person, CALL for help, then CARE within your training.',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: Classmate has a bleeding cut!',
      prompt: 'What should you do first?',
      seconds: 12,
      scene: Scene(
        image: 'assets/modules/first_aid_sim_2.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice(
          '👀',
          'Check that the area is safe, get help, and provide first aid if trained',
          correct: true,
        ),
        Choice('🏃', 'Run away because there is blood'),
        Choice('🧪', 'Pour an unknown substance on the wound'),
        Choice('📚', 'Tell them to keep working'),
      ],
      debrief:
          'Make sure the situation is safe, get appropriate help, then care according to training.',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: Hot utensil burn on a hand!',
      prompt: 'What is the safest cooling step?',
      seconds: 12,
      scene: Scene(
        image: 'assets/modules/first_aid_sim_3.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice('💧', 'Cool with clean, cool running water', correct: true),
        Choice('🧈', 'Spread butter on the burn'),
        Choice('🦷', 'Put toothpaste on it'),
        Choice('🍳', 'Rub cooking oil on it'),
      ],
      debrief:
          'Cool with clean, cool running water. Never use butter, toothpaste, or oil.',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: Student cannot speak or cough while eating!',
      prompt: 'What should you do?',
      seconds: 12,
      scene: Scene(
        image: 'assets/modules/first_aid_sim_4.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice(
          '🚨',
          'Get immediate emergency assistance — this may be severe choking',
          correct: true,
        ),
        Choice('😂', 'Wait and see if they laugh it off'),
        Choice('🥤', 'Offer a big drink of water first'),
        Choice('🎭', 'Practice back blows on a classmate for fun'),
      ],
      debrief:
          'Someone who cannot speak, cry, or cough effectively needs immediate action and emergency help.',
      unsafeDebrief:
          'Severe choking is an emergency. Do not delay help or practice maneuvers for fun.',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: A person collapses and does not respond!',
      prompt: 'What is the safest response?',
      seconds: 12,
      scene: Scene(
        image: 'assets/modules/first_aid_sim_5.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice(
          '🚨',
          'Check safety, get adult/emergency help, and monitor breathing',
          correct: true,
        ),
        Choice('🍎', 'Give food or drink right away'),
        Choice('🧍', 'Make them stand up immediately'),
        Choice('🙈', 'Leave them alone'),
      ],
      debrief:
          'Check safety and responsiveness, get help, check breathing, and do not give food or drink to an unconscious person.',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: Possible fracture after a bicycle fall!',
      prompt: 'What should you generally avoid?',
      seconds: 12,
      scene: Scene(
        image: 'assets/modules/first_aid_sim_6.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice(
          '🚫',
          'Unnecessary movement or straightening the injured part',
          correct: true,
        ),
        Choice('📞', 'Calling for professional help'),
        Choice('👀', 'Keeping the person still and monitoring'),
        Choice('🛡', 'Keeping the area safe'),
      ],
      debrief:
          'Keep the person still, do not straighten the injured part, and get professional help.',
    ),
  ],
);
