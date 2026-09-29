part of 'home_shell.dart';

extension on _HomeShellState {
  /// The News tab: every post from the teacher and the school.
  List<Widget> announcementsPage(BuildContext context) => [
    const Eyebrow('From your teacher and school'),
    const SizedBox(height: 10),
    FittedBox(
      fit: BoxFit.scaleDown,
      alignment: Alignment.centerLeft,
      child: Text(
        'Announcements',
        maxLines: 1,
        style: Theme.of(context).textTheme.headlineLarge?.copyWith(
              height: 1.05,
              fontWeight: FontWeight.w800,
            ),
      ),
    ),
    const SizedBox(height: 10),
    Text(
      posts.isEmpty
          ? 'Nothing posted yet.'
          : '${posts.length} ${posts.length == 1 ? 'post' : 'posts'}'
                '${newOnOpen.isEmpty ? '' : ' · ${newOnOpen.length} new'}',
      style: const TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w700,
        color: QuestColors.muted,
      ),
    ),
    const SizedBox(height: 18),
    AnnouncementsFeed(posts: posts, unseen: newOnOpen),
  ];
}
