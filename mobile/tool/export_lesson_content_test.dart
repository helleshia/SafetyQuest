// Writes every lesson's Check questions and simulation steps, as the app plays
// them, to backend/data/lesson-content.json. The server loads that file into
// the `lesson_content` collection so the web consoles show the real questions.
//
// Run from mobile/ after changing any lesson content:
//   flutter test tool/export_lesson_content_test.dart
// test/lesson_content_sync_test.dart fails until the file is regenerated.
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_content_export.dart';

void main() {
  test('export lesson content for the server', () {
    final file = File('../backend/data/lesson-content.json');
    file.parent.createSync(recursive: true);
    file.writeAsStringSync(lessonContentJson());
    // ignore: avoid_print
    print('Wrote ${file.path}');
  });
}
