import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:safetyquest_mobile/core/theme/quest_theme.dart';
import 'package:safetyquest_mobile/features/badges/badge_medal.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_models.dart';

typedef AwardItem = ({LessonContent content, bool earned});

/// Every badge the app can award, collected ones first, locked ones greyed.
class AwardsScreen extends StatelessWidget {
  const AwardsScreen({super.key, required this.items});
  final List<AwardItem> items;

  @override
  Widget build(BuildContext context) {
    final sorted = [
      ...items.where((item) => item.earned),
      ...items.where((item) => !item.earned),
    ];
    final got = items.where((item) => item.earned).length;
    return Scaffold(
      backgroundColor: QuestColors.paper,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 8, 20, 0),
              sliver: SliverToBoxAdapter(
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(PhosphorIconsBold.arrowLeft),
                      tooltip: 'Back',
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'My awards',
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                  ],
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 6),
              sliver: SliverToBoxAdapter(
                child: Container(
                  padding: const EdgeInsets.fromLTRB(18, 16, 18, 18),
                  decoration: Clay.raised(
                    color: QuestColors.yellow.withValues(alpha: .7),
                    radius: 24,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '$got of ${items.length} badges collected',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: QuestColors.ink,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Pass a quest’s practical simulation to earn its badge.',
                        style: TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w600,
                          color: QuestColors.muted,
                        ),
                      ),
                      const SizedBox(height: 12),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(99),
                        child: LinearProgressIndicator(
                          value: items.isEmpty ? 0 : got / items.length,
                          minHeight: 10,
                          backgroundColor: Colors.white.withValues(alpha: .7),
                          valueColor: const AlwaysStoppedAnimation(
                            Color(0xFFE39B2B),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 14,
                  crossAxisSpacing: 14,
                  childAspectRatio: .78,
                ),
                delegate: SliverChildBuilderDelegate(
                  (context, i) => _AwardCard(item: sorted[i]),
                  childCount: sorted.length,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AwardCard extends StatelessWidget {
  const _AwardCard({required this.item});
  final AwardItem item;

  @override
  Widget build(BuildContext context) {
    final earned = item.earned;
    return Semantics(
      button: true,
      label: '${item.content.badge} badge, ${earned ? 'earned' : 'locked'}',
      child: GestureDetector(
        onTap: () => showAwardDetail(context, item),
        child: Container(
          padding: const EdgeInsets.fromLTRB(10, 16, 10, 12),
          decoration: Clay.raised(
            color: earned ? QuestColors.surface : const Color(0xFFF1ECE6),
            radius: 22,
            elevated: earned,
          ),
          child: Column(
            children: [
              Expanded(
                child: Center(
                  child: BadgeMedal(
                    content: item.content,
                    earned: earned,
                    size: 84,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                item.content.badge,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 13,
                  height: 1.2,
                  fontWeight: FontWeight.w800,
                  color: earned ? QuestColors.ink : QuestColors.muted,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                earned ? 'Earned' : 'Locked',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  letterSpacing: .6,
                  color: earned ? const Color(0xFF2F6B4C) : QuestColors.muted,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// A closer look at one badge: what it is and how it is earned.
void showAwardDetail(BuildContext context, AwardItem item) {
  final style = badgeStyle(item.content);
  showModalBottomSheet<void>(
    context: context,
    backgroundColor: QuestColors.paper,
    showDragHandle: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
    ),
    builder: (context) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            BadgeMedal(content: item.content, earned: item.earned, size: 140),
            const SizedBox(height: 18),
            Text(
              item.content.badge,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
              decoration: BoxDecoration(
                color: style.color.withValues(alpha: .14),
                borderRadius: BorderRadius.circular(99),
              ),
              child: Text(
                item.content.title,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: style.color,
                ),
              ),
            ),
            const SizedBox(height: 14),
            Text(
              item.earned
                  ? 'You earned this by passing the ${item.content.title} practical. Great job staying safe!'
                  : 'Pass the ${item.content.title} practical simulation to unlock this badge.',
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 14,
                height: 1.45,
                fontWeight: FontWeight.w600,
                color: QuestColors.muted,
              ),
            ),
          ],
        ),
      ),
    ),
  );
}
