import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:safetyquest_mobile/features/onboarding/consent_screen.dart';
import 'package:safetyquest_mobile/features/onboarding/onboarding_screen.dart';
import 'package:safetyquest_mobile/main.dart';

void main() {
  testWidgets('consent requires an explicit agreement on a small screen', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 568);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    var accepted = false;
    await tester.pumpWidget(
      MaterialApp(
        builder: (context, child) => MediaQuery(
          data: MediaQuery.of(
            context,
          ).copyWith(textScaler: const TextScaler.linear(1.3)),
          child: child!,
        ),
        home: ConsentScreen(onAccepted: () => accepted = true),
      ),
    );
    final button = find.byType(FilledButton);
    expect(tester.widget<FilledButton>(button).onPressed, isNull);
    final checkbox = find.byType(CheckboxListTile);
    await tester.ensureVisible(checkbox);
    await tester.tap(checkbox);
    await tester.pump();
    expect(tester.widget<FilledButton>(button).onPressed, isNotNull);
    await tester.tap(checkbox);
    await tester.pump();
    expect(tester.widget<FilledButton>(button).onPressed, isNull);
    expect(accepted, isFalse);
    await tester.tap(checkbox);
    await tester.pump();
    await tester.ensureVisible(button);
    await tester.tap(button);
    await tester.pump();
    expect(accepted, isTrue);
    expect(tester.takeException(), isNull);
  });

  testWidgets('signed-out launch shows consent before onboarding', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(390, 932);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    FlutterSecureStorage.setMockInitialValues({});
    await tester.pumpWidget(const MaterialApp(home: AppGate()));
    await tester.pump(const Duration(seconds: 2));
    await tester.pump();
    expect(find.byType(ConsentScreen), findsOneWidget);
    expect(find.byType(OnboardingScreen), findsNothing);
    await tester.ensureVisible(find.byType(CheckboxListTile));
    await tester.tap(find.byType(CheckboxListTile));
    await tester.pump();
    await tester.ensureVisible(find.byType(FilledButton));
    await tester.tap(find.byType(FilledButton));
    await tester.pump();
    expect(find.byType(OnboardingScreen), findsOneWidget);
    expect(find.byType(ConsentScreen), findsNothing);
    await tester.pumpWidget(const SizedBox.shrink());
  });
}
