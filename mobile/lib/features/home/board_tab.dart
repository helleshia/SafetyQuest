part of 'home_shell.dart';

extension on _HomeShellState {
  List<Widget> leaderboard(BuildContext context) {
    final board = data!['leaderboard'] as Map<String, dynamic>;
    final entries = (board['entries'] as List? ?? [])
        .cast<Map<String, dynamic>>();
    final sectionName = (student['section'] as String?)?.trim() ?? '';
    final you = entries.where((e) => e['isYou'] == true).firstOrNull;
    final yourRank = you == null ? null : (you['rank'] as num).toInt();
    // The board is ranked by simulation stars collected, so the gap to beat
    // is counted in stars against the learner just above you.
    final yourIndex = you == null ? -1 : entries.indexOf(you);
    final above = yourIndex > 0 ? entries[yourIndex - 1] : null;
    final badgeCount = awardItems().where((item) => item.earned).length;
    final gap = you != null && above != null
        ? _starsOf(above) - _starsOf(you)
        : null;
    final yourStars = you == null ? 0 : _starsOf(you);
    // The board arrives best-first. The first three stand on the podium by
    // position, so a tie (two at rank 1) never leaves a spot empty or drops
    // anyone; everyone from the fourth onwards is on the full board.
    final podium = [
      for (final spot in [1, 0, 2]) entries.elementAtOrNull(spot),
    ];
    final rest = entries.skip(3).toList();

    return [
      const Eyebrow('Arena standings'),
      const SizedBox(height: 10),
      // One line, still big and bold; shrinks only if a narrow phone needs it.
      FittedBox(
        fit: BoxFit.scaleDown,
        alignment: Alignment.centerLeft,
        child: Text(
          'Class Quest Board',
          maxLines: 1,
          style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                height: 1.05,
                fontWeight: FontWeight.w800,
              ),
        ),
      ),
      if (sectionName.isNotEmpty) ...[
        const SizedBox(height: 10),
        Text(
          sectionName,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: QuestColors.muted,
          ),
        ),
      ],
      const SizedBox(height: 22),

      if (entries.isEmpty) ...[
        Container(
          width: double.infinity,
          padding: const EdgeInsets.fromLTRB(22, 28, 22, 26),
          decoration: Clay.raised(
            color: QuestColors.peach.withValues(alpha: .45),
            radius: 26,
          ),
          child: Column(
            children: [
              Moving(
                motion: Motion.float,
                child: const Clay3DIcon(
                  icon: PhosphorIconsFill.trophy,
                  color: QuestColors.coral,
                  size: 112,
                ),
              ),
              const SizedBox(height: 18),
              Text(
                'The arena is empty',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 10),
              const Text(
                'Finish a practical simulation. When your teacher publishes it, your stars climb the board.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  height: 1.45,
                  fontWeight: FontWeight.w600,
                  color: QuestColors.muted,
                ),
              ),
            ],
          ),
        ),
      ] else ...[
        if (you != null)
          _yourPlaceCard(you, yourRank!, yourStars, gap: gap, above: above)
        else
          emptyCard(
            context,
            Icons.emoji_events_outlined,
            'Claim your spot',
            'Complete a practical and wait for your teacher to publish results.',
          ),

        const SizedBox(height: 26),
        if (entries.isNotEmpty) ...[
          const Text(
            'TOP 3 QUESTERS',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.4,
              color: QuestColors.muted,
            ),
          ),
          const SizedBox(height: 14),
          // 2 · 1 · 3, the champion standing tallest in the middle.
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              for (var i = 0; i < podium.length; i++)
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 3),
                    child: _podiumSlot(
                      context,
                      entry: podium[i],
                      place: const [2, 1, 3][i],
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 22),
        ],

        // Everyone after the podium, in one card like a ranked sheet.
        if (rest.isNotEmpty) ...[
          const Text(
            'FULL BOARD',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.4,
              color: QuestColors.muted,
            ),
          ),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
            decoration: Clay.raised(color: QuestColors.surface, radius: 24),
            child: Column(
              children: [
                for (final (i, entry) in rest.indexed) ...[
                  if (i > 0)
                    const Divider(
                      height: 1,
                      indent: 12,
                      endIndent: 12,
                      color: QuestColors.line,
                    ),
                  _rankRow(entry),
                ],
              ],
            ),
          ),
        ],
      ],

      const SizedBox(height: 20),
      Text(
        [
          '${student['completed']} ${student['completed'] == 1 ? 'quest' : 'quests'} done',
          '$badgeCount ${badgeCount == 1 ? 'badge' : 'badges'}',
          if (sectionName.isNotEmpty) sectionName,
        ].join('  ·  '),
        textAlign: TextAlign.center,
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          height: 1.4,
          color: QuestColors.muted,
        ),
      ),
    ];
  }

  Widget _podiumSlot(
    BuildContext context, {
    required Map<String, dynamic>? entry,
    required int place,
  }) {
    // The champion's block is coral; second and third step down in warmth.
    final heights = {1: 150.0, 2: 116.0, 3: 96.0};
    final block = {
      1: (const Color(0xFFF07A55), QuestColors.coral),
      2: (const Color(0xFFF7A97F), const Color(0xFFEE8A5E)),
      3: (const Color(0xFFF9C29C), const Color(0xFFF2A273)),
    };
    final ring = {
      1: const Color(0xFFF2B53B),
      2: const Color(0xFFB5C0CC),
      3: const Color(0xFFD4A27F),
    };
    final isYou = entry?['isYou'] == true;
    final score = entry == null ? null : _starsOf(entry);
    final label = entry == null
        ? 'Open spot'
        : isYou
            ? 'You'
            : entry['label'] as String;
    final avatarSize = place == 1 ? 68.0 : 56.0;
    return Column(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        if (place == 1)
          Moving(
            motion: Motion.float,
            child: Icon(PhosphorIconsFill.crown, size: 30, color: ring[1]),
          )
        else
          const SizedBox(height: 30),
        const SizedBox(height: 2),
        Opacity(
          opacity: entry == null ? .35 : 1,
          child: _boardAvatar(entry, size: avatarSize, ring: ring[place]),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 12.5,
            fontWeight: FontWeight.w800,
            color: entry == null
                ? QuestColors.muted
                : isYou
                    ? QuestColors.coral
                    : QuestColors.ink,
          ),
        ),
        const SizedBox(height: 4),
        if (score != null)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(99),
              border: Border.all(color: QuestColors.line),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  PhosphorIconsFill.star,
                  size: 11,
                  color: Color(0xFFF2B53B),
                ),
                const SizedBox(width: 3),
                Text(
                  '$score',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: QuestColors.ink,
                  ),
                ),
              ],
            ),
          )
        else
          const SizedBox(height: 20),
        const SizedBox(height: 10),
        AnimatedContainer(
          duration: const Duration(milliseconds: 500),
          curve: Curves.easeOutCubic,
          height: heights[place],
          width: double.infinity,
          decoration: BoxDecoration(
            borderRadius: const BorderRadius.vertical(
              top: Radius.circular(18),
              bottom: Radius.circular(6),
            ),
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [block[place]!.$1, block[place]!.$2],
            ),
            boxShadow: [
              BoxShadow(
                color: block[place]!.$2.withValues(alpha: .35),
                blurRadius: 14,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Column(
              children: [
                Text(
                  // The real rank, so a shared first place reads 1 and 1.
                  '${entry == null ? place : (entry['rank'] as num).toInt()}',
                  style: TextStyle(
                    fontSize: place == 1 ? 60 : 46,
                    height: 1,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                    shadows: [
                      Shadow(
                        color: Colors.black.withValues(alpha: .12),
                        offset: const Offset(0, 3),
                        blurRadius: 4,
                      ),
                    ],
                  ),
                ),
                if (score != null) ...[
                  const SizedBox(height: 6),
                  _starCount(score, size: 13, color: Colors.white),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }

  /// A round avatar for the board. You wear the app's student art; classmates
  /// get a colour and their initials (or their explorer number when no name is on file).
  Widget _boardAvatar(
    Map<String, dynamic>? entry, {
    double size = 40,
    Color? ring,
  }) {
    const tints = [
      QuestColors.peach,
      QuestColors.mint,
      QuestColors.lilac,
      QuestColors.yellow,
      QuestColors.blue,
    ];
    final isYou = entry?['isYou'] == true;
    final label = entry?['label'] as String? ?? '';
    final named = !RegExp(r'^Explorer \d+$').hasMatch(label);
    final words = label.trim().split(RegExp(r'\s+')).where((w) => w.isNotEmpty);
    final digits = named
        ? words.take(2).map((w) => w.substring(0, 1).toUpperCase()).join()
        : RegExp(r'\d+').firstMatch(label)?.group(0) ?? '?';
    final tint = tints[label.codeUnits.fold<int>(0, (a, b) => a + b) % tints.length];
    return Container(
      width: size,
      height: size,
      padding: EdgeInsets.all(ring == null ? 0 : 3),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: ring ?? Colors.transparent,
        boxShadow: ring == null
            ? null
            : [
                BoxShadow(
                  color: ring.withValues(alpha: .35),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
      ),
      child: Container(
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: isYou ? QuestColors.peach : tint,
          border: Border.all(color: Colors.white, width: 2),
        ),
        clipBehavior: Clip.antiAlias,
        child: isYou
            ? Image.asset('assets/cool_student.png', fit: BoxFit.cover)
            : Center(
                child: Text(
                  entry == null ? '?' : digits,
                  style: TextStyle(
                    fontSize: size * .32,
                    fontWeight: FontWeight.w800,
                    color: QuestColors.ink,
                  ),
                ),
              ),
      ),
    );
  }

  Widget _rankRow(Map<String, dynamic> entry) {
    final isYou = entry['isYou'] == true;
    final rank = (entry['rank'] as num).toInt();
    final label = isYou ? 'You' : entry['label'] as String;
    final score = (entry['score'] as num).round();
    final stars = _starsOf(entry);
    final completed = entry['completed'];

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 2),
      padding: const EdgeInsets.all(10),
      decoration: isYou
          ? BoxDecoration(
              color: QuestColors.mint.withValues(alpha: .75),
              borderRadius: BorderRadius.circular(16),
            )
          : null,
      child: Row(
        children: [
          SizedBox(
            width: 30,
            child: Text(
              '$rank',
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: QuestColors.muted,
              ),
            ),
          ),
          const SizedBox(width: 8),
          _boardAvatar(entry, size: 42),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 14.5,
                    fontWeight: FontWeight.w800,
                    color: isYou ? QuestColors.coral : QuestColors.ink,
                  ),
                ),
                const SizedBox(height: 3),
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        '$completed ${completed == 1 ? 'quest' : 'quests'} · $score% avg',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w600,
                          color: QuestColors.muted,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          _starCount(stars, size: 15),
        ],
      ),
    );
  }

  /// Your standing: who you are, where you are, and how many stars you hold.
  Widget _yourPlaceCard(
    Map<String, dynamic> you,
    int rank,
    int stars, {
    int? gap,
    Map<String, dynamic>? above,
  }) {
    final ring = switch (rank) {
      1 => const Color(0xFFF2B53B),
      2 => const Color(0xFFD9DEE4),
      3 => const Color(0xFFE0AE86),
      _ => Colors.white,
    };
    final suffix = rank % 100 >= 11 && rank % 100 <= 13
        ? 'th'
        : switch (rank % 10) {
            1 => 'st',
            2 => 'nd',
            3 => 'rd',
            _ => 'th',
          };
    final aboveRank = above == null ? null : (above['rank'] as num).toInt();
    final message = gap != null && gap > 0
        ? '$gap more ${gap == 1 ? 'star' : 'stars'} to catch #$aboveRank.'
        : gap == 0 && aboveRank != rank
            ? 'Level on stars with #$aboveRank. A higher score moves you up.'
            : rank == 1
                ? "You're the class champion right now!"
                : '${you['completed']} quests · ${you['score']}% average';
    final aboveStars = above == null ? 0 : _starsOf(above);
    final chase = gap != null && gap > 0 && aboveStars > 0;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(26),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFF28A63), QuestColors.coral],
        ),
        boxShadow: [
          BoxShadow(
            color: QuestColors.coral.withValues(alpha: .32),
            blurRadius: 22,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  _boardAvatar(you, size: 64, ring: ring),
                  if (rank == 1)
                    Positioned(
                      top: -14,
                      left: 0,
                      right: 0,
                      child: Icon(
                        PhosphorIconsFill.crown,
                        size: 22,
                        color: ring,
                      ),
                    ),
                ],
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'YOUR PLACE',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.3,
                        color: Colors.white.withValues(alpha: .8),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text.rich(
                      TextSpan(
                        children: [
                          TextSpan(
                            text: '$rank',
                            style: const TextStyle(fontSize: 34),
                          ),
                          TextSpan(
                            text: '$suffix place',
                            style: const TextStyle(fontSize: 18),
                          ),
                        ],
                      ),
                      style: const TextStyle(
                        height: 1.05,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -.5,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      message,
                      style: TextStyle(
                        fontSize: 12.5,
                        height: 1.35,
                        fontWeight: FontWeight.w700,
                        color: Colors.white.withValues(alpha: .92),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Container(
                width: 70,
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Column(
                  children: [
                    const Icon(
                      PhosphorIconsFill.star,
                      size: 22,
                      color: Color(0xFFF2B53B),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '$stars',
                      style: const TextStyle(
                        fontSize: 22,
                        height: 1.1,
                        fontWeight: FontWeight.w800,
                        color: QuestColors.ink,
                      ),
                    ),
                    Text(
                      stars == 1 ? 'STAR' : 'STARS',
                      style: const TextStyle(
                        fontSize: 9.5,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1,
                        color: QuestColors.muted,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          // How close you are to the learner just ahead.
          if (chase) ...[
            const SizedBox(height: 14),
            ClipRRect(
              borderRadius: BorderRadius.circular(99),
              child: LinearProgressIndicator(
                value: (stars / aboveStars).clamp(0, 1).toDouble(),
                minHeight: 8,
                backgroundColor: Colors.white.withValues(alpha: .28),
                valueColor: const AlwaysStoppedAnimation(Colors.white),
              ),
            ),
          ],
        ],
      ),
    );
  }

  /// Simulation stars a board entry has collected (older servers: from the average).
  int _starsOf(Map<String, dynamic> entry) =>
      (entry['stars'] as num?)?.toInt() ??
      starsFor((entry['score'] as num).round());

  /// A star and a count, the board's unit of ranking.
  Widget _starCount(int stars, {double size = 14, Color? color}) => Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            PhosphorIconsFill.star,
            size: size,
            color: const Color(0xFFF2B53B),
          ),
          SizedBox(width: size * .25),
          Text(
            '$stars',
            style: TextStyle(
              fontSize: size,
              fontWeight: FontWeight.w800,
              color: color ?? QuestColors.ink,
            ),
          ),
        ],
      );

  /// Every badge in the app. Earned keys come from the school record so a badge
  /// stays collected after that lesson's open window ends.
  List<AwardItem> awardItems() {
    final fromServer = {
      for (final key in (data?['earnedKeys'] as List? ?? const []))
        if (key is String) key,
    };
    return [
      for (final content in lessonCatalog)
        (
          content: content,
          earned:
              fromServer.contains(content.key) ||
              lessons.any(
                (lesson) =>
                    packFor(lesson)?.key == content.key && earned(lesson),
              ),
        ),
    ];
  }

  void openAwards(List<AwardItem> awards) => Navigator.push(
    context,
    MaterialPageRoute<void>(builder: (_) => AwardsScreen(items: awards)),
  );

  /// One button on the profile; it opens every award.
  Widget awardsButton(List<AwardItem> awards, int collected) => Semantics(
    button: true,
    label: 'Awards, $collected of ${awards.length} collected',
    child: Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => openAwards(awards),
        borderRadius: BorderRadius.circular(22),
        child: Ink(
          padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
          decoration: Clay.raised(
            color: QuestColors.yellow.withValues(alpha: .75),
            radius: 22,
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: .85),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  PhosphorIconsFill.trophy,
                  size: 24,
                  color: Color(0xFFE39B2B),
                ),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Text(
                  'Awards',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: QuestColors.ink,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: .85),
                  borderRadius: BorderRadius.circular(99),
                ),
                child: Text(
                  '$collected/${awards.length}',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: QuestColors.ink,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              const Icon(
                PhosphorIconsBold.caretRight,
                size: 18,
                color: QuestColors.ink,
              ),
            ],
          ),
        ),
      ),
    ),
  );

}
