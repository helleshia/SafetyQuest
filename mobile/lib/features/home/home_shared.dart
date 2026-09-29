part of 'home_shell.dart';

extension on _HomeShellState {
  Widget sectionTitle(BuildContext context, String title, String label) =>
      Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Eyebrow(label),
          const SizedBox(height: 8),
          Text(title, style: Theme.of(context).textTheme.titleLarge),
        ],
      );
  Widget emptyCard(
    BuildContext context,
    IconData icon,
    String title,
    String body,
  ) => ClayCard(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: QuestColors.coral, size: 30),
        const SizedBox(height: 16),
        Text(title, style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        Text(body),
      ],
    ),
  );
  Widget detail(
    BuildContext context,
    String label,
    String value,
    IconData icon,
  ) => Row(
    children: [
      Icon(icon, color: QuestColors.muted),
      const SizedBox(width: 14),
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(fontSize: 12)),
            const SizedBox(height: 4),
            SelectableText(
              value,
              style: Theme.of(context).textTheme.titleMedium,
            ),
          ],
        ),
      ),
    ],
  );
}
