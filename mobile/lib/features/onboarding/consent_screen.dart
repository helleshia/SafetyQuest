import 'package:flutter/material.dart';
import 'package:safetyquest_mobile/core/theme/quest_theme.dart';

class ConsentScreen extends StatefulWidget {
  const ConsentScreen({super.key, required this.onAccepted});

  final VoidCallback onAccepted;

  @override
  State<ConsentScreen> createState() => _ConsentScreenState();
}

class _ConsentScreenState extends State<ConsentScreen> {
  bool _accepted = false;

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: QuestColors.paper,
    body: SafeArea(
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 560),
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Brand(),
                const SizedBox(height: 24),

                // Top Banner / Hero section with Clay3DIcon
                ClayCard(
                  color: QuestColors.peach,
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      const Clay3DIcon(
                        icon: Icons.shield_rounded,
                        color: QuestColors.coral,
                        size: 64,
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Eyebrow('Before your first quest'),
                            const SizedBox(height: 4),
                            Text(
                              'Terms & Conditions',
                              style: Theme.of(context).textTheme.headlineMedium
                                  ?.copyWith(
                                    fontSize: 24,
                                    fontWeight: FontWeight.w900,
                                  ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                Text(
                  'Please review these rules together with your parent or guardian before starting.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: QuestColors.muted,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 16),

                // Terms content list inside a ClayCard
                ClayCard(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      for (final section in const [
                        (
                          icon: Icons.health_and_safety_rounded,
                          title: '1. Learn safely',
                          desc:
                              'SafetyQuest teaches personal safety and disaster preparedness. Activities are for practice inside the app. In a real emergency, always follow local authorities and trusted adults.',
                        ),
                        (
                          icon: Icons.favorite_rounded,
                          title: '2. Be kind & responsible',
                          desc:
                              'Use only your assigned account. Keep your password and verification codes private. Treat fellow learners and teachers with respect.',
                        ),
                        (
                          icon: Icons.privacy_tip_rounded,
                          title: '3. Your learning information',
                          desc:
                              'We store your student ID, module progress, and quiz scores. Parent contact info is only used for setup and account recovery.',
                        ),
                        (
                          icon: Icons.verified_user_rounded,
                          title: '4. Voluntary participation',
                          desc:
                              'Ask your teacher or parent if you have questions. You can stop using the app at any time if you prefer not to participate.',
                        ),
                      ]) ...[
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: QuestColors.coral.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(
                                section.icon,
                                color: QuestColors.coral,
                                size: 22,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    section.title,
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleMedium
                                        ?.copyWith(fontWeight: FontWeight.w800),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    section.desc,
                                    style: const TextStyle(
                                      fontSize: 13,
                                      height: 1.5,
                                      color: QuestColors.muted,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 18),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Agreement checkbox styled cleanly
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.6),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: QuestColors.ink.withOpacity(0.08),
                    ),
                  ),
                  child: CheckboxListTile(
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 4,
                    ),
                    controlAffinity: ListTileControlAffinity.leading,
                    activeColor: QuestColors.coral,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    value: _accepted,
                    onChanged: (value) =>
                        setState(() => _accepted = value ?? false),
                    title: const Text(
                      'I have read and agree to the Terms and Conditions, and I want to participate.',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: QuestColors.ink,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                QuestButton(
                  'Agree & Continue',
                  onPressed: _accepted ? widget.onAccepted : null,
                ),
                const SizedBox(height: 12),
                const Center(
                  child: Text(
                    'If you do not agree, ask your teacher or parent for assistance.',
                    style: TextStyle(fontSize: 12, color: QuestColors.muted),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    ),
  );
}
