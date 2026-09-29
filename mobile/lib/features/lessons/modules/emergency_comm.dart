import 'package:flutter/material.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_models.dart';

// Module 8 - Emergency Communication based on 911 hotline tips.
const _sky = [Color(0xFFD6E7EF), Color(0xFFEAF3F6)];
const _ground = Color(0xFFC5D3E8);

final emergencyComm = LessonContent(
  key: 'emergency-comm',
  title: 'Emergency Communication',
  emoji: '📞',
  imageAsset: 'assets/modules/comm_3d.png',
  color: const Color(0xFFD6E7EF),
  badge: 'Lifeline Communicator',
  badgeEmoji: '☎️',
  matches: (name) {
    final n = name.toLowerCase();
    return n.contains('communication') ||
        n.contains('911') ||
        n.contains('hotline');
  },
  story: const [
    StoryPage(
      title: 'What is Emergency Communication?',
      text:
          'In an emergency, stay calm, get reliable info, communicate clearly, and help others. It is like a safety bridge connecting people to important instructions!',
      tip: 'Do not panic—listen to trusted adults!',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/emergency_comm_p1.png',
      ),
    ),
    StoryPage(
      title: 'The CALM Method',
      text:
          'C - Check the source.\nA - Assess the situation.\nL - Listen to official instructions.\nM - Message clearly and accurately.',
      tip: 'Remember CALM to stay safe!',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/emergency_comm_p2.png',
      ),
    ),
    StoryPage(
      title: 'Receiving Alerts',
      text:
          'When you receive an emergency alert: Read it carefully, identify the hazard, and follow safety instructions.',
      tip: 'Never forward a message without verifying it first!',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/emergency_comm_p3.png',
      ),
    ),
    StoryPage(
      title: 'Sending Short Messages',
      text:
          'Keep text messages short and clear so networks do not get clogged. Say "I am safe at school. Will update later." instead of a long story.',
      tip: 'Short messages save phone battery and help others communicate!',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/emergency_comm_p4.png',
      ),
    ),
    StoryPage(
      title: 'Calling for Help',
      text:
          'Only call emergency numbers like 911 for real emergencies. Tell them: 1. Your name 2. What happened 3. Where you are.',
      tip: 'Never call hotlines for fun or jokes!',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/emergency_comm_p5.png',
      ),
    ),
    StoryPage(
      title: 'Have a Backup Plan',
      text:
          'Sometimes phones or internet do not work. Know your family meeting place and listen to a battery-powered radio for news.',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/emergency_comm_p6.png',
      ),
    ),
    StoryPage(
      title: 'Stop, Check, Think, Share',
      text:
          'Before sharing an alarming post online, check if it is true! Fake news causes unnecessary panic.',
      tip: 'Safety comes first. Do not enter danger to get information!',
      scene: Scene(
        sky: _sky,
        ground: _ground,
        props: const [],
        image: 'assets/modules/emergency_comm_p7.png',
      ),
    ),
  ],
  quiz: const [
    QuizQuestion(
      prompt: 'What is the best way to message your family during a disaster?',
      choices: [
        Choice('📱', 'A short text saying you are safe', correct: true),
        Choice('📱', 'A very long voice message'),
        Choice('📸', 'Sending many photos'),
      ],
      explain:
          'Short texts are best because they use less battery and do not clog the network.',
    ),
    QuizQuestion(
      prompt: 'What should you do before forwarding an emergency message?',
      choices: [
        Choice('🤔', 'Check if it comes from a reliable source', correct: true),
        Choice('⚡', 'Send it immediately to everyone'),
        Choice('🔥', 'Add more scary words'),
      ],
      explain: 'False messages can cause panic. Always verify first!',
    ),
    QuizQuestion(
      prompt: 'What is the Philippine national emergency hotline number?',
      choices: [
        Choice('📞', '911', correct: true),
        Choice('🔢', '123'),
        Choice('📱', '8888'),
      ],
      explain:
          '911 connects you to emergency responders like police, fire, and ambulance.',
    ),
    QuizQuestion(
      prompt: 'What does the CALM method remind you to do?',
      choices: [
        Choice(
          '🧭',
          'Check the source, Assess, Listen, Message clearly',
          correct: true,
        ),
        Choice('😴', 'Cry, Argue, Leave, Mute everyone'),
        Choice('🎮', 'Chat, Attack, Laugh, Meme'),
      ],
      explain:
          'CALM helps you stay steady: verify, assess, follow officials, and speak clearly.',
    ),
    QuizQuestion(
      prompt: 'When calling 911, what should you tell them?',
      choices: [
        Choice(
          '⭐',
          'Your name, what happened, and where you are',
          correct: true,
        ),
        Choice('😂', 'A joke to see if they answer'),
        Choice('🤫', 'Nothing — hang up right away'),
      ],
      explain:
          'Clear facts help responders reach you. Never call hotlines for fun.',
    ),
    QuizQuestion(
      prompt: 'If phones stop working, what is a good backup?',
      choices: [
        Choice(
          '📍',
          'A family meeting place and a battery radio',
          correct: true,
        ),
        Choice('🏃', 'Wandering alone to look for news'),
        Choice('📢', 'Shouting rumors in the street'),
      ],
      explain:
          'Agree on a meeting place and listen to trusted broadcasts when networks fail.',
    ),
    QuizQuestion(
      prompt: 'Before sharing an alarming post online, you should…',
      choices: [
        Choice('💚', 'Stop, check if it is true, then think', correct: true),
        Choice('🚀', 'Share it as fast as possible'),
        Choice('😱', 'Add fake details to make it scarier'),
      ],
      explain: 'Fake news causes panic. Verify before you share.',
    ),
  ],
  // Videos: assets/media/emergency-comm_sim_1..6.mp4 via practiceSceneAt().
  simulation: const [
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: Scary unverified flood message online!',
      prompt: 'Watch the video. What should you do?',
      seconds: 10,
      scene: Scene(
        image: 'assets/modules/emergency_comm_p7.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice('✅', 'Check official announcements first', correct: true),
        Choice('📤', 'Share it with everyone now'),
        Choice('🔥', 'Add scarier words then post'),
        Choice('😱', 'Panic and run alone'),
      ],
      debrief: 'Stop and verify. Fake news causes panic. Simulation lang ito.',
    ),
    SimStep(
      kind: SimKind.safetySequence,
      alert: 'SITUATION: Use the CALM method!',
      prompt: 'Tap CALM in the right order.',
      seconds: 14,
      scene: Scene(
        image: 'assets/modules/emergency_comm_p2.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice('🔍', 'Check the source'),
        Choice('👀', 'Assess the situation'),
        Choice('👂', 'Listen to officials'),
        Choice('💬', 'Message clearly'),
      ],
      debrief: 'C-A-L-M: Check, Assess, Listen, Message clearly.',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: Real fire nearby — call for help!',
      prompt: 'Who do you call?',
      seconds: 10,
      scene: Scene(
        image: 'assets/modules/emergency_comm_p5.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice('📞', 'Call 911', correct: true),
        Choice('📸', 'Post it on social media first'),
        Choice('😂', 'Call a hotline as a joke'),
        Choice('🤫', 'Say nothing to anyone'),
      ],
      debrief: 'Call 911 for real emergencies. Never call hotlines for fun.',
    ),
    SimStep(
      kind: SimKind.findObject,
      alert: 'SITUATION: Tell 911 the right facts!',
      prompt: 'When you call 911, tell them where you are. Tap it!',
      seconds: 14,
      answer: 'where',
      scene: Scene(
        image: 'assets/modules/emergency_comm_p5.png',
        sky: _sky,
        ground: _ground,

        props: const [],
      ),
      hotspots: [
        SceneHotspot(
          id: 'where',
          x: 0.42,
          y: 0.33,
          width: 0.43,
          height: 0.35,
          correct: true,
          label: 'Where you are',
        ),
        SceneHotspot(
          id: 'tree',
          x: 0.76,
          y: 0.24,
          width: 0.15,
          height: 0.18,
          correct: false,
          label: 'Tree',
        ),
        SceneHotspot(
          id: 'rock',
          x: 0.12,
          y: 0.55,
          width: 0.16,
          height: 0.12,
          correct: false,
          label: 'Bush and rock',
        ),
      ],
      debrief:
          'Say your name, what happened, and where you are. Stay on the line.',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: Message your family — networks are busy!',
      prompt: 'What is the best message?',
      seconds: 10,
      scene: Scene(
        image: 'assets/modules/emergency_comm_p4.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice('📱', 'Short text: “I am safe at school.?', correct: true),
        Choice('🗣️', 'A very long voice story'),
        Choice('📸', 'Many photo uploads'),
        Choice('🎥', 'A long live video'),
      ],
      debrief: 'Short texts use less battery and do not clog the network.',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: Phones and internet stop working!',
      prompt: 'What is a good backup plan?',
      seconds: 10,
      scene: Scene(
        image: 'assets/modules/emergency_comm_p6.png',
        sky: _sky,
        ground: _ground,
        props: const [],
      ),
      choices: [
        Choice('📍', 'Family meeting place + battery radio', correct: true),
        Choice('🏃', 'Wander alone looking for rumors'),
        Choice('📢', 'Shout scary news in the street'),
        Choice('😴', 'Do nothing and hide alone'),
      ],
      debrief: 'Agree on a meeting place and listen to trusted broadcasts.',
    ),
  ],
);
