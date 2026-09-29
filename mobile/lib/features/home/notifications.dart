import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:safetyquest_mobile/core/theme/quest_theme.dart';

/// Which teacher and school posts this student has already opened, kept on
/// the phone so the bell only counts new ones.
abstract final class SeenPosts {
  static String _key(String studentId) => 'seen_posts:$studentId';

  static Future<Set<String>> load(String studentId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return (prefs.getStringList(_key(studentId)) ?? const []).toSet();
    } catch (_) {
      return {};
    }
  }

  static Future<void> markAll(String studentId, Iterable<String> ids) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final seen = {...?prefs.getStringList(_key(studentId)), ...ids};
      await prefs.setStringList(_key(studentId), seen.toList());
    } catch (_) {}
  }
}

/// The bell: a round button with a red count of unread posts.
class NotificationBell extends StatelessWidget {
  const NotificationBell({super.key, required this.unread, required this.onTap});
  final int unread;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Semantics(
    button: true,
    label: unread == 0
        ? 'Notifications'
        : 'Notifications, $unread new',
    child: GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: 50,
        height: 50,
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: Clay.raised(color: QuestColors.surface, radius: 18),
              child: Icon(
                unread > 0 ? PhosphorIconsFill.bell : PhosphorIconsBold.bell,
                size: 23,
                color: unread > 0 ? QuestColors.coral : QuestColors.ink,
              ),
            ),
            if (unread > 0)
              Positioned(
                top: -4,
                right: -4,
                child: Container(
                  constraints: const BoxConstraints(minWidth: 22),
                  height: 22,
                  padding: const EdgeInsets.symmetric(horizontal: 6),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: QuestColors.coral,
                    borderRadius: BorderRadius.circular(99),
                    border: Border.all(color: QuestColors.paper, width: 2),
                  ),
                  child: Text(
                    unread > 9 ? '9+' : '$unread',
                    style: const TextStyle(
                      fontSize: 11,
                      height: 1,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    ),
  );
}

bool _fromTeacher(Map<String, dynamic> post) => post['from'] == 'Your teacher';

/// Every post for this student, newest first; new ones are marked. A filter
/// splits the teacher's class posts from the school's announcements. Laid out
/// as a column so it sits inside the home shell's scrolling tab.
class AnnouncementsFeed extends StatefulWidget {
  const AnnouncementsFeed({
    super.key,
    required this.posts,
    required this.unseen,
  });
  final List<Map<String, dynamic>> posts;

  /// Ids that were new when the tab opened, so they stay marked while read.
  final Set<String> unseen;

  @override
  State<AnnouncementsFeed> createState() => _AnnouncementsFeedState();
}

class _AnnouncementsFeedState extends State<AnnouncementsFeed> {
  String filter = 'All';

  @override
  Widget build(BuildContext context) {
    final shown = widget.posts.where((post) {
      if (filter == 'Teacher') return _fromTeacher(post);
      if (filter == 'School') return !_fromTeacher(post);
      return true;
    }).toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Wrap(
          spacing: 8,
          children: [
            for (final (value, label) in const [
              ('All', 'All'),
              ('Teacher', 'My teacher'),
              ('School', 'School'),
            ])
              ChoiceChip(
                label: Text(label),
                selected: filter == value,
                onSelected: (_) => setState(() => filter = value),
                showCheckmark: false,
                selectedColor: QuestColors.peach,
                backgroundColor: QuestColors.surface,
                side: const BorderSide(color: QuestColors.line),
                labelStyle: TextStyle(
                  fontWeight: FontWeight.w800,
                  color: filter == value ? QuestColors.coral : QuestColors.ink,
                ),
                shape: const StadiumBorder(),
              ),
          ],
        ),
        const SizedBox(height: 16),
        if (shown.isEmpty)
          Container(
            padding: const EdgeInsets.fromLTRB(20, 28, 20, 28),
            decoration: Clay.raised(color: QuestColors.surface, radius: 24),
            child: Column(
              children: [
                const Icon(
                  PhosphorIconsDuotone.bellSimpleZ,
                  size: 48,
                  color: QuestColors.muted,
                ),
                const SizedBox(height: 12),
                const Text(
                  'No posts yet',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: QuestColors.ink,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  filter == 'School'
                      ? 'School announcements will show up here.'
                      : 'When your teacher posts something, it will show up here.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: QuestColors.muted,
                  ),
                ),
              ],
            ),
          )
        else
          for (final post in shown) ...[
            _PostCard(post: post, isNew: widget.unseen.contains(post['id'])),
            const SizedBox(height: 12),
          ],
      ],
    );
  }
}

class _PostCard extends StatelessWidget {
  const _PostCard({required this.post, required this.isNew});
  final Map<String, dynamic> post;
  final bool isNew;

  @override
  Widget build(BuildContext context) {
    final fromTeacher = post['from'] == 'Your teacher';
    final accent = fromTeacher ? QuestColors.coral : const Color(0xFF6B5A8E);
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 14, 16, 16),
      decoration: Clay.raised(
        color: isNew ? const Color(0xFFFFF4EC) : QuestColors.surface,
        radius: 22,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: fromTeacher ? QuestColors.peach : QuestColors.lilac,
              shape: BoxShape.circle,
            ),
            child: Icon(
              fromTeacher
                  ? PhosphorIconsFill.chalkboardTeacher
                  : PhosphorIconsFill.megaphone,
              size: 20,
              color: accent,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      (post['from'] as String? ?? 'Your school').toUpperCase(),
                      style: TextStyle(
                        fontSize: 10.5,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1,
                        color: accent,
                      ),
                    ),
                    const Spacer(),
                    if (isNew)
                      Container(
                        margin: const EdgeInsets.only(right: 6),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 7,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: QuestColors.coral,
                          borderRadius: BorderRadius.circular(99),
                        ),
                        child: const Text(
                          'NEW',
                          style: TextStyle(
                            fontSize: 9.5,
                            fontWeight: FontWeight.w800,
                            letterSpacing: .8,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    Text(
                      post['date'] as String? ?? '',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: QuestColors.muted,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  post['title'] as String? ?? '',
                  style: const TextStyle(
                    fontSize: 15.5,
                    fontWeight: FontWeight.w800,
                    color: QuestColors.ink,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  post['message'] as String? ?? '',
                  style: const TextStyle(
                    fontSize: 13.5,
                    height: 1.45,
                    fontWeight: FontWeight.w600,
                    color: QuestColors.ink,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
