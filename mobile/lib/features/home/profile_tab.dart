part of 'home_shell.dart';

extension on _HomeShellState {
  List<Widget> profile(BuildContext context) {
    final contact = data!['parentContact'] as Map<String, dynamic>;
    final awards = awardItems();
    final collected = awards.where((item) => item.earned).toList();
    return [
      const Eyebrow('Uniquely you'),
      const SizedBox(height: 12),
      Text(
        'Hello, explorer.',
        style: Theme.of(context).textTheme.headlineLarge,
      ),
      const SizedBox(height: 24),
      ClayCard(
        color: QuestColors.lilac,
        child: SizedBox(
          width: double.infinity,
          child: Column(
            children: [
              const QuestBuddy(
                size: 180,
                color: Color(0xFFAB91C1),
                symbol: Icons.star_rounded,
              ),
              Text(
                student['name'] as String,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 8),
              Text(student['section'] as String),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 7,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: .65),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'SAFETY EXPLORER',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.5,
                    color: QuestColors.ink,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      const SizedBox(height: 26),
      awardsButton(awards, collected.length),
      const SizedBox(height: 26),
      sectionTitle(context, 'Your explorer card', 'ACCOUNT DETAILS'),
      const SizedBox(height: 16),
      ClayCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            detail(
              context,
              'Student ID',
              student['studentId'] as String,
              Icons.badge_outlined,
            ),
            const Divider(height: 30),
            _PasswordRow(api: widget.api),
            const Divider(height: 30),
            detail(
              context,
              contact['kind'] == 'email' ? 'Parent’s email' : 'Parent’s mobile',
              contact['value'] as String,
              Icons.favorite_border_rounded,
            ),
            const SizedBox(height: 12),
            const Text(
              'Your parent sees your progress on the website with this email',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12),
            ),
          ],
        ),
      ),
      const SizedBox(height: 18),
      Notice(
        data!['notification'] == 'accepted'
            ? 'Your account details were accepted for delivery to your parent’s contact.'
            : 'Your account is ready, but the parent notification hasn’t been sent yet.',
      ),
      if (data!['notification'] != 'accepted') ...[
        const SizedBox(height: 12),
        QuestButton(
          'Retry parent notification',
          onPressed: retryNotification,
          busy: actionBusy,
          icon: Icons.send_outlined,
        ),
      ],
      const SizedBox(height: 30),
      OutlinedButton.icon(
        onPressed: actionBusy ? null : signOut,
        icon: const Icon(Icons.logout_rounded),
        label: const Padding(
          padding: EdgeInsets.all(14),
          child: Text('Sign out'),
        ),
      ),
      const SizedBox(height: 20),
      const Center(child: Eyebrow('SafetyQuest • Made for little heroes')),
    ];
  }

  /// A lesson's state as a coloured pill, so it reads at a glance.
  Widget _statusPill(String status) {
    final (icon, background, foreground) = switch (status) {
      'Complete' => (
          PhosphorIconsFill.checkCircle,
          QuestColors.mint,
          const Color(0xFF2F6B4C),
        ),
      'Phase 1 done' => (
          PhosphorIconsFill.circleHalf,
          QuestColors.blue,
          const Color(0xFF2D5F7A),
        ),
      'Coming soon' => (
          PhosphorIconsFill.hourglassMedium,
          const Color(0xFFEDE7E1),
          QuestColors.muted,
        ),
      _ => (
          PhosphorIconsFill.playCircle,
          QuestColors.peach,
          QuestColors.coral,
        ),
    };
    return _metaPill(icon, status, background: background, foreground: foreground);
  }

  Widget _metaPill(
    IconData icon,
    String text, {
    required Color background,
    required Color foreground,
    bool border = false,
  }) =>
      Container(
        padding: const EdgeInsets.fromLTRB(7, 4, 9, 4),
        decoration: BoxDecoration(
          color: background,
          borderRadius: BorderRadius.circular(99),
          border: border ? Border.all(color: QuestColors.line) : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 13, color: foreground),
            const SizedBox(width: 4),
            Text(
              text,
              style: TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w800,
                color: foreground,
              ),
            ),
          ],
        ),
      );

  /// "Sep 29, 2026" → "Sep 29"; anything else is shown as given.
  String _shortDate(String value) {
    final text = value.trim();
    final match = RegExp(r'^([A-Za-z]{3}) (\d{1,2}), \d{4}$').firstMatch(text);
    if (match != null) return '${match[1]} ${match[2]}';
    final iso = DateTime.tryParse(text);
    if (iso == null) return text;
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${months[iso.month - 1]} ${iso.day}';
  }

  /// A module's 3D art, the same everywhere a lesson is shown. Until a
  /// module has its art, its clay icon stands in.
}


/// The learner's own password, hidden until they tap the eye. It is only available on
/// the device that signed in; after a sign-out the app no longer holds it.
class _PasswordRow extends StatefulWidget {
  const _PasswordRow({required this.api});
  final QuestApi api;
  @override
  State<_PasswordRow> createState() => _PasswordRowState();
}

class _PasswordRowState extends State<_PasswordRow> {
  String? saved;
  bool loaded = false;
  bool shown = false;

  @override
  void initState() {
    super.initState();
    widget.api.readPassword().then((value) {
      if (mounted) {
        setState(() {
          saved = value;
          loaded = true;
        });
      }
    }).catchError((_) {
      if (mounted) {
        setState(() {
          loaded = true;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final known = saved != null && saved!.isNotEmpty;
    final text = !loaded
        ? '…'
        : !known
            ? 'Sign out and sign in again to see it here'
            : shown
                ? saved!
                : '•' * saved!.length.clamp(6, 16);
    return Row(
      children: [
        const Icon(Icons.lock_outline_rounded, color: QuestColors.muted),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Your password', style: TextStyle(fontSize: 12)),
              const SizedBox(height: 4),
              Text(text, style: Theme.of(context).textTheme.titleMedium),
            ],
          ),
        ),
        if (known)
          IconButton(
            tooltip: shown ? 'Hide password' : 'Show password',
            onPressed: () => setState(() {
              shown = !shown;
            }),
            icon: Icon(
              shown
                  ? Icons.visibility_outlined
                  : Icons.visibility_off_outlined,
              color: QuestColors.muted,
            ),
          ),
      ],
    );
  }
}
