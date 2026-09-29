part of 'home_shell.dart';

/// Floating clay pill nav — sliding indicator when switching tabs.
class _FloatingClayNav extends StatelessWidget {
  const _FloatingClayNav({
    required this.index,
    required this.onSelect,
    this.unread = const {},
  });

  final int index;
  final ValueChanged<int> onSelect;

  /// A red count on a tab, by index.
  final Map<int, int> unread;

  static const _items = [
    (PhosphorIconsRegular.house, PhosphorIconsFill.house, 'Home'),
    (
      PhosphorIconsRegular.bookOpenText,
      PhosphorIconsFill.bookOpenText,
      'Lessons',
    ),
    (PhosphorIconsRegular.trophy, PhosphorIconsFill.trophy, 'Board'),
    (PhosphorIconsRegular.megaphone, PhosphorIconsFill.megaphone, 'News'),
    (PhosphorIconsRegular.userCircle, PhosphorIconsFill.userCircle, 'Profile'),
  ];

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.paddingOf(context).bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 0, 20, bottom > 0 ? bottom : 16),
      child: Container(
        padding: const EdgeInsets.all(6),
        decoration: Clay.pill(color: QuestColors.surface, radius: 28),
        child: LayoutBuilder(
          builder: (context, constraints) {
            final slot = constraints.maxWidth / _items.length;
            return Stack(
              children: [
                AnimatedPositioned(
                  duration: const Duration(milliseconds: 320),
                  curve: Curves.easeOutBack,
                  left: index * slot + 2,
                  top: 0,
                  bottom: 0,
                  width: slot - 4,
                  child: Container(
                    decoration: Clay.raised(
                      color: QuestColors.peach,
                      radius: 18,
                    ),
                  ),
                ),
                Row(
                  children: [
                    for (var i = 0; i < _items.length; i++)
                      Expanded(
                        child: _NavItem(
                          icon: _items[i].$1,
                          selectedIcon: _items[i].$2,
                          label: _items[i].$3,
                          selected: index == i,
                          count: unread[i] ?? 0,
                          onTap: () => onSelect(i),
                        ),
                      ),
                  ],
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.icon,
    required this.selectedIcon,
    required this.label,
    required this.selected,
    required this.onTap,
    this.count = 0,
  });

  final IconData icon;
  final IconData selectedIcon;
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final int count;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedScale(
              scale: selected ? 1.08 : 1,
              duration: const Duration(milliseconds: 280),
              curve: Curves.easeOutBack,
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  Icon(
                    selected ? selectedIcon : icon,
                    size: 22,
                    color: selected ? QuestColors.ink : QuestColors.muted,
                  ),
                  if (count > 0)
                    Positioned(
                      top: -5,
                      right: -9,
                      child: Container(
                        constraints: const BoxConstraints(minWidth: 17),
                        height: 17,
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: QuestColors.coral,
                          borderRadius: BorderRadius.circular(99),
                          border: Border.all(
                            color: QuestColors.surface,
                            width: 1.5,
                          ),
                        ),
                        child: Text(
                          count > 9 ? '9+' : '$count',
                          style: const TextStyle(
                            fontSize: 9.5,
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
            const SizedBox(height: 2),
            AnimatedDefaultTextStyle(
              duration: const Duration(milliseconds: 220),
              style: TextStyle(
                fontSize: 10,
                height: 1.1,
                fontWeight: FontWeight.w800,
                color: selected ? QuestColors.ink : QuestColors.muted,
              ),
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
