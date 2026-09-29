import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_content_export.dart';

/// The server shows teachers the questions in backend/data/lesson-content.json.
/// If a lesson changes in the app, that file must change with it.
void main() {
  test('the server has the app\'s current lesson questions', () {
    final file = File('../backend/data/lesson-content.json');
    expect(file.existsSync(), isTrue, reason: 'Run: flutter test tool/export_lesson_content_test.dart');
    expect(
      file.readAsStringSync().replaceAll('\r\n', '\n'),
      lessonContentJson(),
      reason: 'Lesson content changed. Run: flutter test tool/export_lesson_content_test.dart',
    );
  });
}
