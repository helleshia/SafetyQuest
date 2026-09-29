import 'package:flutter/material.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_models.dart';

// Module 15 — Poison, Household Hazards & Electricity Safety.
// Source: assets/lessons/Module 15 - Poison, Household Hazards & Electricity Safety.pdf
// Curriculum key: household-electricity
const _sky = [Color(0xFFFFF4E8), Color(0xFFF8E8D8)];
const _floor = Color(0xFFE2C4A8);

/// Household hazard hunt — baked scene with hazards seated on real surfaces.
/// Invisible hotspots only (no floating sticker layers).
const _hazardHotspots = [
  // Knife lying flat on the kitchen countertop (left of sink).
  SceneHotspot(
    id: 'knife',
    x: 0.28,
    y: 0.34,
    width: 0.14,
    height: 0.08,
    correct: true,
    label: 'Knife near counter edge',
  ),
  // Lit candle standing on the countertop between sink and stove.
  SceneHotspot(
    id: 'candle',
    x: 0.42,
    y: 0.24,
    width: 0.08,
    height: 0.14,
    correct: true,
    label: 'Unattended candle',
  ),
  // Cord from rice cooker trailing to outlet (+ damaged wall wires).
  SceneHotspot(
    id: 'cord',
    x: 0.08,
    y: 0.22,
    width: 0.30,
    height: 0.16,
    correct: true,
    label: 'Damaged electrical cord',
  ),
  // Cleaning chemical on the floor beside / under the sink cabinets.
  SceneHotspot(
    id: 'cleaner',
    x: 0.16,
    y: 0.52,
    width: 0.12,
    height: 0.16,
    correct: true,
    label: 'Cleaning products',
  ),
  // Water spill flat on the floor in front of the sink.
  SceneHotspot(
    id: 'wet_floor',
    x: 0.28,
    y: 0.62,
    width: 0.16,
    height: 0.12,
    correct: true,
    label: 'Wet floor',
  ),
  // Hot kettle sitting on the countertop / stove with steam.
  SceneHotspot(
    id: 'kettle',
    x: 0.52,
    y: 0.22,
    width: 0.14,
    height: 0.16,
    correct: true,
    label: 'Hot kettle',
  ),
  // Safe distractors — miss flash only; not required finds.
  SceneHotspot(
    id: 'sofa',
    x: 0.70,
    y: 0.55,
    width: 0.28,
    height: 0.30,
    correct: false,
    label: 'Sofa',
  ),
  SceneHotspot(
    id: 'armchair',
    x: 0.38,
    y: 0.72,
    width: 0.22,
    height: 0.22,
    correct: false,
    label: 'Armchair',
  ),
];

const _hazardScene = Scene(
  image: 'assets/modules/household_hazards_scene.png',
  sky: _sky,
  ground: _floor,
  props: [],
);

final householdElectricity = LessonContent(
  key: 'household-electricity',
  title: 'Poison, Household & Electricity Safety',
  emoji: '⚡',
  imageAsset: 'assets/modules/household_3d.png',
  color: const Color(0xFFFFF4E8),
  badge: 'Home Safety Hero',
  badgeEmoji: '🛡',
  matches: (name) {
    final n = name.toLowerCase();
    return n.contains('household') ||
        n.contains('electric') ||
        n.contains('poison');
  },
  story: const [
    StoryPage(
      title: 'What is a poison?',
      text:
          'A poison is a substance that can harm you if swallowed, breathed in, or touched. Medicines, cleaning products, pesticides, and button batteries can be dangerous when misused.',
      tip: 'If something may be poisonous — do not experiment. Stop, move away, tell a trusted adult.',
      scene: Scene(
        sky: _sky,
        ground: _floor,
        props: const [],
        image: 'assets/modules/household_electricity_p1.png',
      ),
    ),
    StoryPage(
      title: 'Medicine is not candy',
      text:
          'Medicine can help when used correctly, but it can harm you if taken by the wrong person or in the wrong amount. Only take medicine when a responsible adult or healthcare professional says so.',
      tip: 'Never share prescription medicine or pretend medicine is candy.',
      scene: Scene(
        sky: _sky,
        ground: _floor,
        props: const [],
        image: 'assets/modules/household_electricity_p2.png',
      ),
    ),
    StoryPage(
      title: 'Household chemicals',
      text:
          'Cleaning products are not food or drinks. Never mix cleaning chemicals — some combinations can make dangerous gases. Keep chemicals in labelled containers, away from food and drinks.',
      tip: 'Unknown bottle? STOP — do not touch or taste — MOVE AWAY — TELL A TRUSTED ADULT.',
      scene: Scene(
        sky: _sky,
        ground: _floor,
        props: const [],
        image: 'assets/modules/household_electricity_p3.png',
      ),
    ),
    StoryPage(
      title: 'Household hazards',
      text:
          'Wet floors, sharp objects, hot surfaces, matches, and small batteries can cause falls, cuts, burns, fires, or choking. Button batteries need urgent adult help if swallowed.',
      tip: 'Keep walkways clear. Never play with knives, matches, or loose batteries.',
      scene: Scene(
        sky: _sky,
        ground: _floor,
        props: const [],
        image: 'assets/modules/household_electricity_p4.png',
      ),
    ),
    StoryPage(
      title: 'Electricity safety',
      text:
          'Never put fingers or objects into outlets. Do not touch outlets or appliances with wet hands. Stay away from frayed wires, cracked insulation, or exposed wires — tell an adult.',
      tip: 'Water and electricity do not mix. Keep appliances away from sinks, baths, and wet floors.',
      scene: Scene(
        sky: _sky,
        ground: _floor,
        props: const [],
        image: 'assets/modules/household_electricity_p5.png',
      ),
    ),
    StoryPage(
      title: 'If someone may be shocked',
      text:
          'Do not touch a person who may still be in contact with electricity. Alert an adult immediately. Have power disconnected safely if possible. Call emergency help when appropriate.',
      tip: 'Do not put yourself at risk trying to grab someone who is being shocked.',
      scene: Scene(
        sky: _sky,
        ground: _floor,
        props: const [],
        image: 'assets/modules/household_electricity_p6.png',
      ),
    ),
    StoryPage(
      title: 'STOP — MOVE AWAY — TELL',
      text:
          'You do not have to fix dangerous things yourself. For unknown substances, damaged cords, or electrical problems: stop, move away, and tell a trusted adult.',
      tip: 'Do not touch it. Do not taste it. Do not experiment. Get adult help.',
      scene: Scene(
        sky: _sky,
        ground: _floor,
        props: const [],
        image: 'assets/modules/household_electricity_p7.png',
      ),
    ),
  ],
  quiz: const [
    QuizQuestion(
      prompt: 'You find a bottle with a liquid you do not recognize. What should you do?',
      choices: [
        Choice('🛡', 'Move away and tell a trusted adult', correct: true),
        Choice('👃', 'Smell it to find out what it is'),
        Choice('👅', 'Taste a small amount'),
      ],
      explain:
          'Unknown substances should never be tasted, smelled closely, or handled unnecessarily.',
    ),
    QuizQuestion(
      prompt: 'Which statement about medicine is safest?',
      choices: [
        Choice(
          '💊',
          'Use medicine only as directed by an appropriate adult or healthcare professional',
          correct: true,
        ),
        Choice('🍬', 'Medicine is always safe because it comes in a bottle'),
        Choice('🤝', 'Children can share prescription medicine with friends'),
      ],
      explain:
          'Medicine must be used appropriately and should not be shared or taken without proper direction.',
    ),
    QuizQuestion(
      prompt: 'Why should cleaning products not be mixed?',
      choices: [
        Choice('☠️', 'They may produce dangerous reactions or substances', correct: true),
        Choice('🎨', 'They may only change color'),
        Choice('💰', 'They may become expensive'),
      ],
      explain:
          'Some chemical combinations can create dangerous reactions or harmful gases.',
    ),
    QuizQuestion(
      prompt: 'You notice an electrical cord with exposed wires. What should you do?',
      choices: [
        Choice('🚫', 'Stay away and tell an adult', correct: true),
        Choice('✋', 'Touch the wires carefully'),
        Choice('🩹', 'Cover them yourself with tape'),
      ],
      explain:
          'Damaged electrical equipment can cause shock or fire. Do not attempt to repair it yourself.',
    ),
    QuizQuestion(
      prompt: 'True or False: It is safe to use an electrical appliance with wet hands if you are careful.',
      choices: [
        Choice('❌', 'False — wet hands increase shock risk', correct: true),
        Choice('✅', 'True — being careful is enough'),
        Choice('🤷', 'Only for small chargers'),
      ],
      explain: 'Wet hands can increase the risk of electric shock.',
    ),
    QuizQuestion(
      prompt: 'You see a young child holding a button battery. What should you do?',
      choices: [
        Choice(
          '🚨',
          'Tell a trusted adult immediately and keep the battery away',
          correct: true,
        ),
        Choice('🎮', 'Let the child play with it'),
        Choice('👄', 'Put it in your mouth to show it is not food'),
      ],
      explain:
          'Button or coin batteries can be extremely dangerous if swallowed.',
    ),
    QuizQuestion(
      prompt: 'A friend is receiving an electric shock. What should you NOT do?',
      choices: [
        Choice('🚫', 'Grab the person immediately with your bare hands', correct: true),
        Choice('📣', 'Alert an adult'),
        Choice('🚨', 'Seek emergency assistance when appropriate'),
      ],
      explain:
          'Touching someone still connected to electricity can put you in danger too.',
    ),
  ],
  simulation: const [
    SimStep(
      kind: SimKind.findHazards,
      alert: 'SITUATION: Hazard Hunters — inspect this home!',
      prompt: 'Tap every hazard you can find. Safe objects do not count.',
      seconds: 40,
      scene: _hazardScene,
      hotspots: _hazardHotspots,
      debrief:
          'Knives near edges, unattended candles, damaged cords, cleaners, wet floors, and hot kettles are hazards. Move away and tell an adult.',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: Unknown liquid bottle on the floor!',
      prompt: 'What is the safest action?',
      seconds: 10,
      scene: const Scene(
        image: 'assets/modules/household_electricity_sim_2.png',
        sky: _sky,
        ground: _floor,
        props: [],
      ),
      choices: [
        Choice('🛡', 'Move away and tell a trusted adult', correct: true),
        Choice('✋', 'Touch it to inspect it'),
        Choice('👅', 'Taste a drop'),
        Choice('🙈', 'Ignore it'),
      ],
      debrief: 'STOP — MOVE AWAY — TELL A TRUSTED ADULT.',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: Phone charger with exposed wires!',
      prompt: 'What should you do?',
      seconds: 10,
      scene: const Scene(
        image: 'assets/modules/household_electricity_sim_3.png',
        sky: _sky,
        ground: _floor,
        props: [],
      ),
      choices: [
        Choice('🚫', 'Do not touch it. Tell an adult.', correct: true),
        Choice('🔧', 'Try to fix the wires yourself'),
        Choice('🔌', 'Keep using it carefully'),
        Choice('💧', 'Rinse the cord with water'),
      ],
      debrief: 'Damaged cords can cause shock or fire. Stay away and tell an adult.',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: Wet electrical appliance!',
      prompt: 'What should you do?',
      seconds: 10,
      scene: const Scene(
        image: 'assets/modules/household_electricity_sim_4.png',
        sky: _sky,
        ground: _floor,
        props: [],
      ),
      choices: [
        Choice('🛡', 'Stay away and tell an adult', correct: true),
        Choice('✋', 'Pick it up with wet hands'),
        Choice('🛁', 'Reach into water to grab it'),
        Choice('🔌', 'Plug it in to test it'),
      ],
      debrief:
          'Water and electricity do not mix. If an appliance falls into water, do not reach in — tell an adult.',
    ),
    SimStep(
      kind: SimKind.safetySequence,
      alert: 'SITUATION: You spot something dangerous at home!',
      prompt: 'Tap the safety steps in order.',
      seconds: 14,
      scene: const Scene(
        image: 'assets/modules/household_electricity_sim_5.png',
        sky: _sky,
        ground: _floor,
        props: [],
      ),
      choices: [
        Choice('🛑', 'STOP'),
        Choice('🚶', 'MOVE AWAY'),
        Choice('📣', 'TELL A TRUSTED ADULT'),
      ],
      debrief:
          'STOP — MOVE AWAY — TELL A TRUSTED ADULT. Do not experiment or fix it alone.',
    ),
    SimStep(
      kind: SimKind.sceneDecision,
      alert: 'SITUATION: Someone may have swallowed a household chemical!',
      prompt: 'What should happen first?',
      seconds: 12,
      scene: const Scene(
        image: 'assets/modules/household_electricity_sim_6.png',
        sky: _sky,
        ground: _floor,
        props: [],
      ),
      choices: [
        Choice(
          '🚨',
          'Tell a trusted adult immediately and contact professional help',
          correct: true,
        ),
        Choice('🤮', 'Make the person vomit right away'),
        Choice('🧪', 'Give another chemical to neutralize it'),
        Choice('🙈', 'Leave the person alone'),
      ],
      debrief:
          'Suspected poisoning needs prompt adult help and professional guidance. Do not induce vomiting unless a qualified professional instructs you.',
    ),
  ],
);
