part of 'home_shell.dart';

extension on _HomeShellState {
  List<Widget> lessonPage(BuildContext context) {
    final visible = lessons
        .where(
          (item) =>
              filter == 'All' ||
              (filter == 'Completed'
                  ? item['completed'] == true
                  : item['completed'] != true),
        )
        .toList();
    return [
      const Eyebrow('Your learning trail'),
      const SizedBox(height: 10),
      // One line, big and bold, like the Class Quest Board title.
      FittedBox(
        fit: BoxFit.scaleDown,
        alignment: Alignment.centerLeft,
        child: Text(
          'My Safety Quests',
          maxLines: 1,
          style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                height: 1.05,
                fontWeight: FontWeight.w800,
              ),
        ),
      ),
      const SizedBox(height: 10),
      Text(
        [
          if ((student['section'] as String?)?.trim().isNotEmpty == true)
            (student['section'] as String).trim(),
          '${lessons.length} ${lessons.length == 1 ? 'quest' : 'quests'} open',
          '${lessons.where((l) => l['completed'] == true).length} complete',
        ].join(' · '),
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w700,
          color: QuestColors.muted,
        ),
      ),
      const SizedBox(height: 22),
      Wrap(
        spacing: 8,
        runSpacing: 8,
        children: ['All', 'To explore', 'Completed']
            .map(
              (value) {
                final selected = filter == value;
                return GestureDetector(
                  onTap: () => rebuild(() => filter = value),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 10,
                    ),
                    decoration: Clay.raised(
                      color: selected ? QuestColors.peach : QuestColors.surface,
                      radius: 20,
                      elevated: selected,
                    ),
                    child: Text(
                      value,
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 13,
                        color: selected ? QuestColors.ink : QuestColors.muted,
                      ),
                    ),
                  ),
                );
              },
            )
            .toList(),
      ),
      const SizedBox(height: 24),
      if (visible.isEmpty)
        emptyCard(
          context,
          Icons.auto_stories_outlined,
          filter == 'Completed'
              ? 'Your wins will live here'
              : 'Waiting for your teacher',
          filter == 'Completed'
              ? 'Completed quests appear after your teacher publishes your results.'
              : 'No quests are open for your class yet. Ask your teacher to open lessons in Assessment details.',
        )
      else
        ...visible.map(
          (lesson) => Padding(
            padding: const EdgeInsets.only(bottom: 18),
            child: lessonTile(context, lesson),
          ),
        ),
    ];
  }


  Widget lessonArt(LessonContent? content, {double size = 64}) {
    final radius = BorderRadius.circular(size * .22);
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: content?.color.withValues(alpha: .45) ?? QuestColors.surface,
        borderRadius: radius,
        border: Border.all(color: QuestColors.line, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: QuestColors.ink.withValues(alpha: .06),
            offset: const Offset(0, 3),
            blurRadius: 6,
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: content?.imageAsset != null
          ? Image.asset(
              content!.imageAsset!,
              width: size,
              height: size,
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) =>
                  Center(child: ClayIcon(content.emoji, size: size * .88)),
            )
          : Center(
              child: ClayIcon(content?.emoji ?? '📖', size: size * .88),
            ),
    );
  }

  Widget lessonTile(BuildContext context, Map<String, dynamic> lesson) {
    final content = packFor(lesson);
    final done = lesson['completed'] == true;
    final saved = progress[(lesson['id'] as num).toInt()];
    final learned = saved?.learned ?? false;
    final practiced = done || (saved?.practicalBest ?? 0) > 0;
    final percent = done ? 100 : (learned ? 50 : 0) + (practiced ? 50 : 0);
    final status = content == null
        ? 'Coming soon'
        : percent == 100
        ? 'Complete'
        : learned
        ? 'Phase 1 done'
        : 'Not started';
    return Semantics(
      button: true,
      label: '${lesson['name']}, $status, $percent percent',
      child: InkWell(
        borderRadius: BorderRadius.circular(28),
        onTap: () => openLesson(lesson),
        child: ClayCard(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 18),
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
                          (lesson['domain'] as String? ?? '').toUpperCase(),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 1.1,
                            color: QuestColors.muted,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          lesson['name'] as String,
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: [
                            _statusPill(status),
                            if ((lesson['due'] as String?)?.trim().isNotEmpty ==
                                true)
                              _metaPill(
                                PhosphorIconsBold.calendarBlank,
                                'Ends ${_shortDate(lesson['due'] as String)}',
                                background: Colors.white,
                                foreground: QuestColors.muted,
                                border: true,
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const Icon(
                    PhosphorIconsBold.caretRight,
                    size: 18,
                    color: QuestColors.muted,
                  ),
                ],
              ),
              if (content != null) ...[
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: phaseBar(
                        'Learn',
                        learned || done,
                        QuestColors.blue,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: phaseBar(
                        'Simulation',
                        practiced,
                        QuestColors.peach,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      '$percent%',
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: QuestColors.ink,
                      ),
                    ),
                  ],
                ),
                if (saved != null &&
                    (saved.quizBest > 0 || saved.practicalBest > 0)) ...[
                  const SizedBox(height: 10),
                  Text(
                    'Best quiz ${saved.quizBest}%'
                    '${saved.practicalBest > 0 ? '  •  Best simulation ${saved.practicalBest}%' : ''}',
                    style: const TextStyle(fontSize: 11.5),
                  ),
                ],
              ],
            ],
          ),
        ),
      ),
    );
  }

  /// One phase of a lesson's progress: a soft inset track that fills in clay.
  Widget phaseBar(String label, bool filled, Color color) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Container(
        height: 10,
        decoration: BoxDecoration(
          color: QuestColors.ink.withValues(alpha: .1),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: QuestColors.ink.withValues(alpha: .06)),
        ),
        child: AnimatedFractionallySizedBox(
          duration: const Duration(milliseconds: 600),
          curve: Curves.easeOutCubic,
          alignment: Alignment.centerLeft,
          widthFactor: filled ? 1 : 0,
          child: DecoratedBox(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              gradient: LinearGradient(
                colors: [
                  Color.lerp(color, Colors.white, .3)!,
                  Color.lerp(color, QuestColors.ink, .15)!,
                ],
              ),
            ),
          ),
        ),
      ),
      const SizedBox(height: 5),
      Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: filled ? QuestColors.ink : QuestColors.muted,
        ),
      ),
    ],
  );

}
