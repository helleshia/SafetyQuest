import 'dart:convert';

import 'package:safetyquest_mobile/features/lessons/answer_record.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_catalog.dart';

/// Every lesson's question bank as the JSON the server stores, one lesson per
/// app pack, in catalog order. Pretty-printed so changes read well in review.
String lessonContentJson() => '${const JsonEncoder.withIndent('  ').convert({
  'lessons': [for (final lesson in lessonCatalog) lessonQuestionBank(lesson)],
})}\n';
