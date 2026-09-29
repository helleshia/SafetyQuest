import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:safetyquest_mobile/core/theme/magnifier_3d.dart';
import 'package:safetyquest_mobile/features/badges/badge_medal.dart';
import 'package:safetyquest_mobile/features/home/notifications.dart';
import 'package:safetyquest_mobile/features/badges/awards_screen.dart';
import 'package:safetyquest_mobile/core/api/quest_api.dart';
import 'package:safetyquest_mobile/core/theme/clay_icon.dart';
import 'package:safetyquest_mobile/core/theme/quest_theme.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_catalog.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_models.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_screen.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_widgets.dart';
import 'package:safetyquest_mobile/features/lessons/scene_view.dart';

part 'home_tab.dart';
part 'lessons_tab.dart';
part 'board_tab.dart';
part 'news_tab.dart';
part 'profile_tab.dart';
part 'home_shared.dart';
part 'home_nav.dart';

LessonContent? packFor(Map lesson) => contentFor(
  lesson['name'] as String? ?? '',
  key: lesson['key'] as String?,
);

class HomeShell extends StatefulWidget {
  const HomeShell({super.key, required this.api, required this.onSignedOut});
  final QuestApi api;
  final Future<void> Function() onSignedOut;
  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int tab = 0;
  Map<String, dynamic>? data;
  String? error;
  bool loading = true;
  bool actionBusy = false;
  String filter = 'All';
  Map<int, LessonProgress> progress = {};
  /// Posts this student has already opened on this phone.
  Set<String> seenPosts = {};

  /// Extensions on this State cannot call protected [setState]; use this.
  void rebuild(VoidCallback fn) => setState(fn);

  @override
  void initState() {
    super.initState();
    refresh();
  }

  /// Sends simulation runs that ended while the phone was offline. Returns
  /// whether any reached the server, so the school record can be re-read.
  Future<bool> _sendPending(String studentId) async {
    var sent = false;
    // Lessons read offline go first, so a run sent next finds them recorded.
    for (final row in await PendingProgress.all()) {
      if (row['studentId'] != studentId) continue;
      final moduleId = (row['moduleId'] as num).toInt();
      try {
        await widget.api.request(
          'progress',
          data: Map<String, dynamic>.from(row)..remove('studentId'),
        );
        await PendingProgress.remove(studentId, moduleId);
        sent = true;
      } on ApiException catch (e) {
        if (e.status >= 400 && e.status < 500) {
          await PendingProgress.remove(studentId, moduleId);
        } else {
          return sent;
        }
      }
    }
    for (final row in await PendingAttempts.all()) {
      if (row['studentId'] != studentId) continue;
      final moduleId = (row['moduleId'] as num).toInt();
      try {
        await widget.api.request(
          'attempt',
          data: Map<String, dynamic>.from(row)..remove('studentId'),
        );
        await PendingAttempts.remove(studentId, moduleId);
        sent = true;
      } on ApiException catch (e) {
        // Turned down by the server: nothing to resend. Otherwise try later.
        if (e.status >= 400 && e.status < 500) {
          await PendingAttempts.remove(studentId, moduleId);
        } else {
          break;
        }
      }
    }
    return sent;
  }

  Future<void> refresh() async {
    try {
      var next = await widget.api.request('state');
      var studentId = (next['student'] as Map)['studentId'] as String;
      if (await _sendPending(studentId)) {
        next = await widget.api.request('state');
        studentId = (next['student'] as Map)['studentId'] as String;
      }
      final ids = [
        for (final row in next['lessons'] as List)
          ((row as Map)['id'] as num).toInt(),
      ];
      // The school record is the truth for assigned lessons: lesson read,
      // Check score and practical score are taken as is. So the app shows
      // what the consoles show, and a teacher's reset clears them here too.
      for (final row in next['lessons'] as List) {
        final lesson = row as Map;
        await ProgressStore.replace(
          studentId,
          (lesson['id'] as num).toInt(),
          LessonProgress(
            learned: lesson['learned'] == true,
            quizBest: (lesson['quizBest'] as num?)?.toInt() ?? 0,
            practicalBest: (lesson['practicalBest'] as num?)?.toInt() ?? 0,
          ),
        );
      }
      final saved = await ProgressStore.load(studentId, ids);
      final seen = await SeenPosts.load(studentId);
      if (mounted) {
        setState(() {
          data = next;
          progress = saved;
          seenPosts = seen;
          error = null;
        });
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) _maybeRemindPendingLessons(next);
        });
      }
    } on ApiException catch (e) {
      if (e.status == 401 || e.status == 403) {
        await widget.onSignedOut();
        return;
      }
      if (mounted) {
        setState(() {
          error = e.message;
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          loading = false;
        });
      }
    }
  }

  /// Soft nudge when open lessons still need Learn or a practical. At most once
  /// per student per day on this phone.
  Future<void> _maybeRemindPendingLessons(Map<String, dynamic> snapshot) async {
    final student = snapshot['student'] as Map? ?? {};
    final studentId = student['studentId'] as String? ?? '';
    if (studentId.isEmpty) return;
    final pending = [
      for (final row in snapshot['lessons'] as List? ?? const [])
        if (row is Map && _lessonNeedsWork(row)) row,
    ];
    if (pending.isEmpty || !mounted) return;

    final day = DateTime.now().toIso8601String().substring(0, 10);
    final key = 'lesson_remind:$studentId:$day';
    try {
      final prefs = await SharedPreferences.getInstance();
      if (prefs.getBool(key) == true) return;
      await prefs.setBool(key, true);
    } catch (_) {}
    if (!mounted) return;

    final names = [
      for (final row in pending.take(4))
        (row['name'] as String?)?.trim().isNotEmpty == true
            ? row['name'] as String
            : 'A quest',
    ];
    final extra = pending.length - names.length;
    final body = extra > 0
        ? '${names.join(', ')}, and $extra more'
        : names.join(', ');

    await showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: QuestColors.paper,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: const Text(
          'Quest waiting for you',
          style: TextStyle(fontWeight: FontWeight.w800, color: QuestColors.ink),
        ),
        content: Text(
          pending.length == 1
              ? 'You still need to take $body. Open it from Quests when you are ready.'
              : 'You still have ${pending.length} open quests to take: $body.',
          style: const TextStyle(
            fontSize: 14,
            height: 1.45,
            fontWeight: FontWeight.w600,
            color: QuestColors.ink,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Later'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(context);
              selectTab(1);
            },
            style: FilledButton.styleFrom(
              backgroundColor: QuestColors.coral,
              foregroundColor: Colors.white,
            ),
            child: const Text('Open quests'),
          ),
        ],
      ),
    );
  }

  bool _lessonNeedsWork(Map lesson) {
    if (lesson['completed'] == true) return false;
    if (lesson['learned'] != true) return true;
    return lesson['practice'] == true;
  }

  Future<void> signOut() async {
    setState(() {
      actionBusy = true;
    });
    try {
      try {
        await widget.api.request('logout', data: {});
      } on ApiException catch (e) {
        if (e.status != 401 && e.status != 403) rethrow;
      }
      await widget.onSignedOut();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    } finally {
      if (mounted) {
        setState(() {
          actionBusy = false;
        });
      }
    }
  }

  Future<void> retryNotification() async {
    setState(() {
      actionBusy = true;
    });
    try {
      final result = await widget.api.request('notification', data: {});
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            result['notification'] == 'accepted'
                ? 'Account details have been accepted for delivery.'
                : 'Delivery is still unavailable. Please try again later.',
          ),
        ),
      );
      await refresh();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    } finally {
      if (mounted) {
        setState(() {
          actionBusy = false;
        });
      }
    }
  }

  Map<String, dynamic> get student => data!['student'] as Map<String, dynamic>;

  /// Teacher and school posts for this student, newest first.
  List<Map<String, dynamic>> get posts =>
      (data?['announcements'] as List? ?? []).cast<Map<String, dynamic>>();

  int get unreadPosts =>
      posts.where((post) => !seenPosts.contains(post['id'])).length;

  /// Posts that were new when the News tab opened; they stay marked there.
  Set<String> newOnOpen = {};

  /// Switches tab. Opening News marks every post read, so the count clears.
  void selectTab(int value) {
    if (value == 3 && data != null) {
      final unseen = {
        for (final post in posts)
          if (!seenPosts.contains(post['id'])) post['id'] as String,
      };
      if (unseen.isNotEmpty) {
        SeenPosts.markAll(student['studentId'] as String, unseen);
      }
      setState(() {
        newOnOpen = unseen;
        seenPosts = {...seenPosts, ...unseen};
        tab = value;
      });
      return;
    }
    setState(() => tab = value);
  }

  /// "Good morning" and friends, by the phone's clock.
  String get greeting {
    final hour = DateTime.now().hour;
    return hour < 12
        ? 'Good morning'
        : hour < 18
        ? 'Good afternoon'
        : 'Good evening';
  }
  List<Map<String, dynamic>> get lessons =>
      (data!['lessons'] as List).cast<Map<String, dynamic>>();
  int get completed => (student['completed'] as num).toInt();

  @override
  Widget build(BuildContext context) => Scaffold(
    extendBody: true,
    backgroundColor: QuestColors.paper,
    body: DecoratedBox(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Color(0xFFFFFBF7),
            QuestColors.paper,
            Color(0xFFF5EFE8),
          ],
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 620),
            child: loading
                ? const Center(
                    child: CircularProgressIndicator(color: QuestColors.coral),
                  )
                : data == null
                ? Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const QuestBuddy(size: 180),
                        Notice(
                          error ?? 'We could not load your account.',
                          error: true,
                        ),
                        const SizedBox(height: 20),
                        QuestButton('Try again', onPressed: refresh),
                        TextButton(
                          onPressed: actionBusy ? null : signOut,
                          child: const Text('Sign out'),
                        ),
                      ],
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: refresh,
                    color: QuestColors.coral,
                    child: ListView(
                      key: PageStorageKey(tab),
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.fromLTRB(24, 22, 24, 110),
                      children: [
                        if (error != null) ...[
                          Notice(error!, error: true),
                          const SizedBox(height: 20),
                        ],
                        AnimatedSwitcher(
                          duration: const Duration(milliseconds: 280),
                          switchInCurve: Curves.easeOutCubic,
                          switchOutCurve: Curves.easeInCubic,
                          transitionBuilder: (child, anim) {
                            final slide = Tween<Offset>(
                              begin: const Offset(0.04, 0),
                              end: Offset.zero,
                            ).animate(anim);
                            return FadeTransition(
                              opacity: anim,
                              child: SlideTransition(
                                position: slide,
                                child: child,
                              ),
                            );
                          },
                          child: Column(
                            key: ValueKey(tab),
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              ...switch (tab) {
                                0 => home(context),
                                1 => lessonPage(context),
                                2 => leaderboard(context),
                                3 => announcementsPage(context),
                                _ => profile(context),
                              },
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
          ),
        ),
      ),
    ),
    bottomNavigationBar: _FloatingClayNav(
      index: tab,
      unread: {3: unreadPosts},
      onSelect: selectTab,
    ),
  );


  Future<void> openLesson(Map<String, dynamic> lesson) async {
    final content = packFor(lesson);
    if (content == null) {
      await showModalBottomSheet<void>(
        context: context,
        showDragHandle: true,
        isScrollControlled: true,
        backgroundColor: QuestColors.paper,
        builder: (context) => SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(28),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Eyebrow('Coming soon'),
                const SizedBox(height: 12),
                Text(
                  lesson['name'] as String,
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 18),
                Text(
                  lesson['completed'] == true
                      ? 'Your teacher has published a completed result for this quest. Great work!'
                      : 'This quest is assigned to you. The animated lesson pack is coming soon in a future app update.',
                ),
                const SizedBox(height: 24),
                QuestButton(
                  'Got it',
                  onPressed: () => Navigator.pop(context),
                  icon: Icons.check_rounded,
                ),
              ],
            ),
          ),
        ),
      );
      return;
    }
    final id = (lesson['id'] as num).toInt();
    await Navigator.push(
      context,
      MaterialPageRoute<bool>(
        builder: (_) => LessonScreen(
          api: widget.api,
          content: content,
          lesson: lesson,
          studentId: student['studentId'] as String,
          passMark: passMark,
          progress: progress[id] ?? const LessonProgress(),
        ),
      ),
    );
    if (mounted) await refresh();
  }

  /// Only lessons the teacher opened for this class (Assessment details).
}
