import 'dart:convert';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:safetyquest_mobile/features/lessons/lesson_models.dart';
import 'package:safetyquest_mobile/features/lessons/modules/bullying.dart';
import 'package:safetyquest_mobile/features/lessons/modules/cyber_safety.dart';
import 'package:safetyquest_mobile/features/lessons/modules/earthquake.dart';
import 'package:safetyquest_mobile/features/lessons/modules/emergency_basics.dart';
import 'package:safetyquest_mobile/features/lessons/modules/emergency_comm.dart';
import 'package:safetyquest_mobile/features/lessons/modules/evacuation_drills.dart';
import 'package:safetyquest_mobile/features/lessons/modules/fire_safety.dart';
import 'package:safetyquest_mobile/features/lessons/modules/first_aid.dart';
import 'package:safetyquest_mobile/features/lessons/modules/flood_safety.dart';
import 'package:safetyquest_mobile/features/lessons/modules/go_bag.dart';
import 'package:safetyquest_mobile/features/lessons/modules/household_electricity.dart';
import 'package:safetyquest_mobile/features/lessons/modules/road_safety.dart';
import 'package:safetyquest_mobile/features/lessons/modules/stranger_danger.dart';
import 'package:safetyquest_mobile/features/lessons/modules/typhoon_safety.dart';
import 'package:safetyquest_mobile/features/lessons/modules/water_safety.dart';

/// Lessons built into the app so far. The school's module list decides which
/// ones a student sees; this decides what plays when they open one.
final lessonCatalog = <LessonContent>[
  emergencyBasics,
  earthquake,
  fireSafety,
  floodSafety,
  typhoonSafety,
  evacuationDrills,
  goBagPreparedness,
  emergencyComm,
  strangerDanger,
  cyberSafety,
  roadSafety,
  firstAid,
  bullying,
  waterSafety,
  householdElectricity,
];

LessonContent? contentFor(String moduleName, {String? key}) {
  if (key != null && key.isNotEmpty) {
    for (final lesson in lessonCatalog) {
      if (lesson.key == key) return lesson;
    }
  }
  for (final lesson in lessonCatalog) {
    if (lesson.matches(moduleName)) return lesson;
  }
  return null;
}

bool lessonReady(String moduleName, {String? key}) =>
    contentFor(moduleName, key: key) != null;

/// What a student has done on this phone for one module. The school's record
/// is the published result; this only powers points, badges and "continue".
/// For school lessons `practicalBest` mirrors the server's official score, so
/// the app never shows a number the teacher and parent consoles do not.
class LessonProgress {
  const LessonProgress({
    this.learned = false,
    this.quizBest = 0,
    this.practicalBest = 0,
  });
  final bool learned;
  final int quizBest;
  final int practicalBest;

  Map<String, dynamic> toJson() => {
    'learned': learned,
    'quizBest': quizBest,
    'practicalBest': practicalBest,
  };
  factory LessonProgress.fromJson(Map<String, dynamic> json) => LessonProgress(
    learned: json['learned'] == true,
    quizBest: (json['quizBest'] as num?)?.toInt() ?? 0,
    practicalBest: (json['practicalBest'] as num?)?.toInt() ?? 0,
  );
}

abstract final class ProgressStore {
  static String _key(String studentId, int moduleId) =>
      'progress:$studentId:$moduleId';

  static Future<Map<int, LessonProgress>> load(
    String studentId,
    Iterable<int> moduleIds,
  ) async {
    final result = <int, LessonProgress>{};
    try {
      final prefs = await SharedPreferences.getInstance();
      for (final id in moduleIds) {
        final raw = prefs.getString(_key(studentId, id));
        if (raw != null) {
          result[id] = LessonProgress.fromJson(
            jsonDecode(raw) as Map<String, dynamic>,
          );
        }
      }
    } catch (_) {
      // Progress is a nicety; a storage failure just shows a fresh start.
    }
    return result;
  }

  /// Replaces this phone's copy with the school's record for a module, so a
  /// teacher's reset clears the lesson read, the Check and the score here too.
  static Future<void> replace(
    String studentId,
    int moduleId,
    LessonProgress progress,
  ) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(
        _key(studentId, moduleId),
        jsonEncode(progress.toJson()),
      );
    } catch (_) {}
  }

  static Future<void> record(
    String studentId,
    int moduleId, {
    bool? learned,
    int? quiz,
    int? practical,
    // Replace the stored practical instead of keeping the higher one. Used for
    // the school's official score, which can go down after a retake or a
    // teacher's grade, and back to zero after a reset.
    bool exactPractical = false,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final key = _key(studentId, moduleId);
      final raw = prefs.getString(key);
      final old = raw == null
          ? const LessonProgress()
          : LessonProgress.fromJson(jsonDecode(raw) as Map<String, dynamic>);
      final next = LessonProgress(
        learned: old.learned || (learned ?? false),
        quizBest: quiz != null && quiz > old.quizBest ? quiz : old.quizBest,
        practicalBest: practical == null
            ? old.practicalBest
            : exactPractical || practical > old.practicalBest
            ? practical
            : old.practicalBest,
      );
      await prefs.setString(key, jsonEncode(next.toJson()));
    } catch (_) {}
  }
}

/// A finished or abandoned simulation the server has not received yet, e.g.
/// the phone was offline. It is kept here and sent on the next refresh, so
/// going offline never turns a used try into a free retake.
abstract final class PendingAttempts {
  static const _key = 'pending_attempts';

  static Future<List<Map<String, dynamic>>> all() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_key);
      if (raw == null) return [];
      return [
        for (final row in jsonDecode(raw) as List)
          Map<String, dynamic>.from(row as Map),
      ];
    } catch (_) {
      return [];
    }
  }

  static Future<void> _write(List<Map<String, dynamic>> rows) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_key, jsonEncode(rows));
    } catch (_) {}
  }

  /// Keeps one unsent run per student and module.
  static Future<void> save(
    String studentId,
    Map<String, dynamic> attempt,
  ) async {
    final rows = await all();
    rows.removeWhere(
      (row) =>
          row['studentId'] == studentId &&
          row['moduleId'] == attempt['moduleId'],
    );
    rows.add({'studentId': studentId, ...attempt});
    await _write(rows);
  }

  static Future<void> remove(String studentId, int moduleId) async {
    final rows = await all();
    rows.removeWhere(
      (row) => row['studentId'] == studentId && row['moduleId'] == moduleId,
    );
    await _write(rows);
  }

  static Future<bool> has(String studentId, int moduleId) async =>
      (await all()).any(
        (row) => row['studentId'] == studentId && row['moduleId'] == moduleId,
      );
}

/// A lesson read and Check finished while offline. The school record is the
/// truth on every refresh, so this is sent first and is never lost.
abstract final class PendingProgress {
  static const _key = 'pending_progress';

  static Future<List<Map<String, dynamic>>> all() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_key);
      if (raw == null) return [];
      return [
        for (final row in jsonDecode(raw) as List)
          Map<String, dynamic>.from(row as Map),
      ];
    } catch (_) {
      return [];
    }
  }

  static Future<void> _write(List<Map<String, dynamic>> rows) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_key, jsonEncode(rows));
    } catch (_) {}
  }

  static Future<void> save(String studentId, Map<String, dynamic> row) async {
    final rows = await all();
    rows.removeWhere(
      (old) => old['studentId'] == studentId && old['moduleId'] == row['moduleId'],
    );
    rows.add({'studentId': studentId, ...row});
    await _write(rows);
  }

  static Future<void> remove(String studentId, int moduleId) async {
    final rows = await all();
    rows.removeWhere(
      (row) => row['studentId'] == studentId && row['moduleId'] == moduleId,
    );
    await _write(rows);
  }
}

/// Reads lesson text aloud, for students who learn better by listening.
abstract final class Narrator {
  static final FlutterTts _tts = FlutterTts();
  static bool _ready = false;

  static Future<void> speak(String text) async {
    try {
      if (!_ready) {
        await _tts.setLanguage('en-US');
        await _tts.setSpeechRate(.45);
        await _tts.setPitch(1.1);
        _ready = true;
      }
      await _tts.stop();
      await _tts.speak(text);
    } catch (_) {
      // No speech engine on this phone; the words stay on screen.
    }
  }

  static Future<void> stop() async {
    try {
      await _tts.stop();
    } catch (_) {}
  }
}
