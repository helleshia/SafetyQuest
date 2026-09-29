part of 'home_shell.dart';

extension on _HomeShellState {
  List<Widget> home(BuildContext context) {
    final first = (student['name'] as String).split(' ').first;
    final next = nextLesson;
    final nextContent = next == null
        ? null
        : packFor(next);
    final recent = recentAchievement;
    final challenge = quickChallenge;

    return [
      // 1. Greeting: you, a hello, and the bell for your teacher's posts.
      Row(
        children: [
          Semantics(
            button: true,
            label: 'My profile',
            child: GestureDetector(
              onTap: () => selectTab(4),
              child: Container(
                width: 54,
                height: 54,
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFFF7A97F), QuestColors.coral],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: QuestColors.coral.withValues(alpha: .28),
                      blurRadius: 12,
                      offset: const Offset(0, 5),
                    ),
                  ],
                ),
                child: Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: QuestColors.peach,
                    border: Border.all(color: Colors.white, width: 2),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: Image.asset(
                    'assets/cool_student.png',
                    fit: BoxFit.cover,
                    errorBuilder: (_, _, _) => Center(
                      child: Text(
                        first.isEmpty ? 'S' : first[0].toUpperCase(),
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: QuestColors.ink,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  greeting.toUpperCase(),
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.3,
                    color: QuestColors.muted,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  first.isEmpty ? 'Explorer' : first,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: QuestColors.ink,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          NotificationBell(unread: unreadPosts, onTap: () => selectTab(3)),
        ],
      ),
      const SizedBox(height: 18),
      Text(
        "Ready for today's safety quest?",
        style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.w800,
              height: 1.15,
            ),
      ),
      const SizedBox(height: 22),

      // 2. Today's Quest
      sectionTitle(context, 'Pick up where you left off', "TODAY'S QUEST"),
      const SizedBox(height: 12),
      if (next == null)
        emptyCard(
          context,
          PhosphorIconsDuotone.compass,
          lessons.isEmpty ? 'Your quests are on the way' : 'Every quest done!',
          lessons.isEmpty
              ? 'When your teacher shares a lesson, it will appear right here.'
              : 'Amazing work, explorer. Review any quest from Lessons.',
        )
      else
        todayQuestCard(context, next, nextContent),
      const SizedBox(height: 22),

      // 3. Quick Challenge
      sectionTitle(context, 'A short hidden-object drill', 'QUICK CHALLENGE'),
      const SizedBox(height: 12),
      quickChallengeCard(context, challenge),
      const SizedBox(height: 22),

      // 4. Safety Paths
      sectionTitle(context, 'Two trails to explore', 'YOUR SAFETY PATHS'),
      const SizedBox(height: 12),
      IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              child: pathCard(
                context,
                PhosphorIconsFill.lifebuoy,
                'Disaster Preparedness',
                (d) => d.contains('disaster'),
                const Color(0xFF2F7FD1),
                QuestColors.blue,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: pathCard(
                context,
                PhosphorIconsFill.shieldCheck,
                'Personal Safety',
                (d) => d.contains('personal'),
                const Color(0xFF2F8A5B),
                QuestColors.mint,
              ),
            ),
          ],
        ),
      ),
      const SizedBox(height: 22),

      // 5. Recent Achievement
      sectionTitle(context, 'Keep collecting', 'RECENT ACHIEVEMENT'),
      const SizedBox(height: 12),
      if (recent == null)
        emptyCard(
          context,
          Icons.emoji_events_outlined,
          'Your first badge awaits',
          'Finish a quest to earn your first SafetyQuest badge.',
        )
      else
        recentAchievementCard(context, recent),
    ];
  }

  /// Latest earned badge, if any — including awards from lessons that already closed.
  LessonContent? get recentAchievement {
    final fromServer = {
      for (final key in (data?['earnedKeys'] as List? ?? const []))
        if (key is String) key,
    };
    for (final content in lessonCatalog.reversed) {
      if (fromServer.contains(content.key)) return content;
    }
    for (final lesson in lessons.reversed) {
      if (!earned(lesson)) continue;
      final c = packFor(lesson);
      if (c != null) return c;
    }
    return null;
  }

  /// Prefer a lesson with a findHazards / findObject step for the challenge.
  Map<String, dynamic>? get quickChallenge {
    for (final lesson in [...lessons.where((l) => l['completed'] != true), ...lessons]) {
      final c = packFor(lesson);
      if (c == null) continue;
      final hasFind = c.simulation.any(
        (s) =>
            s.kind == SimKind.findHazards ||
            s.kind == SimKind.findObject ||
            s.kind == SimKind.tapSafeArea,
      );
      if (hasFind) return lesson;
    }
    return nextLesson;
  }

  Widget todayQuestCard(
    BuildContext context,
    Map<String, dynamic> lesson,
    LessonContent? content,
  ) {
    final saved = progress[(lesson['id'] as num).toInt()];
    final learned = saved?.learned ?? false;
    final phase = lesson['practice'] == true
        ? (learned ? 'Practical simulation' : 'Learn + Simulation')
        : 'Learn';
    final subtitle = content?.story.first.title ?? 'Continue your safety quest';
    final id = (lesson['id'] as num).toInt();
    final lessonNo = id > 0 ? 'Lesson $id' : 'Preview';

    return ClayCard(
      color: content?.color.withValues(alpha: .35) ?? QuestColors.lilac,
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              lessonArt(content, size: 64),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      lesson['name'] as String,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        color: QuestColors.muted,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '$lessonNo • $phase',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: QuestColors.ink,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          QuestButton(
            content == null
                ? 'See details'
                : learned
                    ? 'Continue Quest'
                    : 'Start Quest',
            onPressed: () => openLesson(lesson),
            icon: PhosphorIconsBold.arrowRight,
          ),
        ],
      ),
    );
  }

  Widget quickChallengeCard(
    BuildContext context,
    Map<String, dynamic>? lesson,
  ) {
    final content =
        lesson == null ? null : packFor(lesson);
    return ClayCard(
      color: QuestColors.yellow,
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Moving(
                motion: Motion.float,
                child: const Magnifier3D(size: 60),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Can you spot the danger?',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      content == null
                          ? 'Hidden-object challenges appear when a quest is ready.'
                          : 'Look at the scene and tap the hidden safety hazards — like a mini find-the-object game.',
                      style: const TextStyle(
                        fontSize: 13,
                        height: 1.4,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          QuestButton(
            lesson == null ? 'Browse Lessons' : 'Start Challenge',
            onPressed: lesson == null
                ? () => rebuild(() => tab = 1)
                : () => openLesson(lesson),
            icon: PhosphorIconsBold.magnifyingGlass,
            tone: QuestButtonTone.ink,
          ),
        ],
      ),
    );
  }

  Widget recentAchievementCard(BuildContext context, LessonContent content) {
    return ClayCard(
      color: QuestColors.lilac,
      padding: const EdgeInsets.all(18),
      child: Row(
        children: [
          Moving(
            motion: Motion.float,
            child: BadgeMedal(content: content, size: 56),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  content.badge,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 4),
                Text(
                  'Completed your ${content.title} simulation.',
                  style: const TextStyle(
                    fontSize: 13,
                    height: 1.35,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  static const _tips = [
    ('🎒', 'Keep a Go Bag ready with water, a flashlight, and a whistle.'),
    ('🧎', 'When the ground shakes: Duck, Cover, and Hold.'),
    ('💨', 'In smoke, crawl low. Clean air stays near the floor.'),
    ('🚸', 'Cross the street only at the pedestrian lane, and look both ways.'),
    ('🔒', 'Never share your password or home address online.'),
    ('🙅', 'Keep a safe distance from strangers, and tell a trusted adult.'),
    ('🌊', 'Always swim with an adult watching you.'),
    ('🔌', 'Never touch plugs or switches with wet hands.'),
    ('☎️', '911 is the Philippine emergency hotline.'),
    ('🌀', 'Listen to PAGASA warnings before a typhoon arrives.'),
  ];

  /// The first assigned quest still to finish, preferring ones with lessons
  /// already built into the app.
  Map<String, dynamic>? get nextLesson {
    final open = lessons.where((l) => l['completed'] != true).toList();
    for (final lesson in open) {
      if (packFor(lesson) != null) return lesson;
    }
    return open.isEmpty ? null : open.first;
  }

  int get passMark => (student['passMark'] as num?)?.toInt() ?? 70;

  bool earned(Map<String, dynamic> lesson) =>
      lesson['completed'] == true ||
      (progress[(lesson['id'] as num).toInt()]?.practicalBest ?? 0) >= passMark;

  int get points =>
      progress.values.fold<int>(
        0,
        (sum, p) => sum + p.quizBest + p.practicalBest,
      ) +
      completed * 50;

  Widget levelCard(BuildContext context) {
    const perLevel = 200;
    final level = points ~/ perLevel + 1;
    final into = points % perLevel;
    final badgeCount = awardItems().where((item) => item.earned).length;
    return ClayCard(
      color: QuestColors.lilac,
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 54,
                height: 54,
                decoration: Clay.raised(
                  color: Colors.white.withValues(alpha: .85),
                  radius: 18,
                ),
                child: Center(
                  child: Text(
                    '$level',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                      color: QuestColors.ink,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Level $level ${_rank(level)}',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${perLevel - into} points to level ${level + 1}',
                      style: const TextStyle(fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Container(
            height: 14,
            decoration: Clay.inset(radius: 10),
            padding: const EdgeInsets.all(2),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: TweenAnimationBuilder<double>(
                tween: Tween(begin: 0, end: into / perLevel),
                duration: const Duration(milliseconds: 900),
                curve: Curves.easeOutCubic,
                builder: (context, value, _) => Align(
                  alignment: Alignment.centerLeft,
                  child: FractionallySizedBox(
                    widthFactor: value.clamp(0.02, 1),
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(8),
                        gradient: const LinearGradient(
                          colors: [Color(0xFF5A3034), QuestColors.ink],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: QuestColors.ink.withValues(alpha: .25),
                            blurRadius: 4,
                            offset: const Offset(0, 1),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              stat('⭐', '$points', 'points'),
              stat('🏅', '$badgeCount', badgeCount == 1 ? 'badge' : 'badges'),
              stat('✅', '$completed', 'done'),
            ],
          ),
        ],
      ),
    );
  }

  static String _rank(int level) => level >= 8
      ? 'Safety Champion'
      : level >= 5
      ? 'Safety Guardian'
      : level >= 3
      ? 'Safety Scout'
      : 'Safety Explorer';

  Widget stat(String emoji, String value, String label) => Expanded(
    child: Row(
      children: [
        ClayIcon(emoji, size: 18, flat: true),
        const SizedBox(width: 6),
        Flexible(
          child: Text.rich(
            TextSpan(
              children: [
                TextSpan(
                  text: value,
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    color: QuestColors.ink,
                  ),
                ),
                TextSpan(text: ' $label'),
              ],
            ),
            style: const TextStyle(fontSize: 13, color: QuestColors.ink),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    ),
  );

  Widget questHero(
    BuildContext context,
    Map<String, dynamic> lesson,
    LessonContent? content,
  ) {
    final saved = progress[(lesson['id'] as num).toInt()];
    final learned = saved?.learned ?? false;
    return ClayCard(
      color: content?.color ?? QuestColors.blue,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (content != null)
            SceneView(scene: content.story.first.scene, height: 160)
          else
            const Center(child: QuestBuddy(size: 150)),
          const SizedBox(height: 16),
          Eyebrow(lesson['domain'] as String? ?? ''),
          const SizedBox(height: 6),
          Text(
            lesson['name'] as String,
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              phaseChip(
                learned ? '✅' : '📖',
                learned ? 'Phase 1 done' : 'Phase 1 • Learn',
              ),
              phaseChip(
                lesson['practice'] == true ? '🚨' : '🔒',
                lesson['practice'] == true
                    ? 'Phase 2 • Simulation'
                    : 'Simulation locked',
              ),
            ],
          ),
          const SizedBox(height: 16),
          QuestButton(
            content == null
                ? 'See details'
                : learned
                ? 'Continue quest'
                : 'Start quest',
            onPressed: () => openLesson(lesson),
            icon: PhosphorIconsBold.play,
          ),
        ],
      ),
    );
  }

  Widget phaseChip(String emoji, String label) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
    decoration: Clay.raised(
      color: Colors.white.withValues(alpha: .85),
      radius: 20,
      elevated: false,
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        ClayIcon(emoji, size: 14, flat: true),
        const SizedBox(width: 6),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w800,
            color: QuestColors.ink,
          ),
        ),
      ],
    ),
  );

  /// One safety trail: its symbol, how far along you are, and the way in.
  Widget pathCard(
    BuildContext context,
    IconData icon,
    String title,
    bool Function(String domain) inPath,
    Color accent,
    Color tint,
  ) {
    final mine = lessons
        .where((l) => inPath((l['domain'] as String? ?? '').toLowerCase()))
        .toList();
    final done = mine.where((l) => l['completed'] == true).length;
    final nextInPath = mine.where((l) => l['completed'] != true).isEmpty
        ? (mine.isEmpty ? null : mine.last)
        : mine.firstWhere((l) => l['completed'] != true);
    final share = mine.isEmpty ? 0.0 : done / mine.length;
    final action = mine.isEmpty
        ? 'Browse'
        : done == mine.length
        ? 'Review'
        : done == 0
        ? 'Start'
        : 'Continue';
    void open() {
      if (nextInPath != null) {
        openLesson(nextInPath);
      } else {
        rebuild(() => tab = 1);
      }
    }

    return Semantics(
      button: true,
      label: '$title, $done of ${mine.length} quests done. $action.',
      child: GestureDetector(
        onTap: open,
        child: Container(
          padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color.lerp(tint, Colors.white, .35)!, tint],
            ),
            border: Border.all(color: Colors.white.withValues(alpha: .7)),
            boxShadow: [
              BoxShadow(
                color: accent.withValues(alpha: .16),
                blurRadius: 16,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(icon, size: 22, color: accent),
                  ),
                  const Spacer(),
                  // Progress ring with the count inside.
                  SizedBox(
                    width: 40,
                    height: 40,
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        SizedBox.expand(
                          child: CircularProgressIndicator(
                            value: share,
                            strokeWidth: 4,
                            strokeCap: StrokeCap.round,
                            backgroundColor: Colors.white.withValues(alpha: .8),
                            valueColor: AlwaysStoppedAnimation(accent),
                          ),
                        ),
                        Text(
                          '$done/${mine.length}',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: QuestColors.ink,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 15,
                  height: 1.2,
                  fontWeight: FontWeight.w800,
                  color: QuestColors.ink,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                mine.isEmpty
                    ? 'No quests yet'
                    : '${mine.length} ${mine.length == 1 ? 'quest' : 'quests'} · $done done',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: QuestColors.muted,
                ),
              ),
              const Spacer(),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(99),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Shrinks on narrow phones with large text instead of overflowing.
                    Flexible(
                      child: Text(
                        action,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w800,
                          color: accent,
                        ),
                      ),
                    ),
                    const SizedBox(width: 4),
                    Icon(PhosphorIconsBold.arrowRight, size: 14, color: accent),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

}
