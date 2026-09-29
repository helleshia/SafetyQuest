import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:safetyquest_mobile/core/api/quest_api.dart';
import 'package:safetyquest_mobile/core/theme/quest_theme.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key, required this.api, required this.onSignedIn});
  final QuestApi api;
  final VoidCallback onSignedIn;
  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final form = GlobalKey<FormState>();
  final studentId = TextEditingController();
  final password = TextEditingController();
  final confirm = TextEditingController();
  final contact = TextEditingController();
  String step = 'id';
  String? error;
  bool busy = false;
  bool hidden = true;
  bool parentAgreed = false;

  @override
  void dispose() {
    for (final controller in [studentId, password, confirm, contact]) {
      controller.dispose();
    }
    super.dispose();
  }

  void go(String next) {
    FocusScope.of(context).unfocus();
    setState(() {
      step = next;
      error = null;
    });
  }

  Future<void> submit() async {
    if (!form.currentState!.validate()) return;
    if (step == 'password') {
      go('contact');
      return;
    }
    if (step == 'contact' && !parentAgreed) {
      setState(() {
        error =
            'Please confirm this contact together with your parent or guardian.';
      });
      return;
    }
    FocusScope.of(context).unfocus();
    setState(() {
      busy = true;
      error = null;
    });
    try {
      switch (step) {
        case 'id':
          final result = await widget.api.request(
            'lookup',
            data: {'studentId': studentId.text.trim()},
          );
          if (!mounted) return;
          go(result['registered'] == true ? 'login' : 'password');
        case 'login':
          final result = await widget.api.request(
            'login',
            data: {
              'studentId': studentId.text.trim(),
              'password': password.text,
            },
          );
          await widget.api.saveToken(result['token'] as String);
          password.clear();
          if (mounted) widget.onSignedIn();
        case 'contact':
          // No code to enter: naming the parent email finishes setup and
          // activates the account. The parent is notified by email.
          final result = await widget.api.request(
            'register',
            data: {
              'studentId': studentId.text.trim(),
              'password': password.text,
              'confirmPassword': confirm.text,
              'parentContact': {'kind': 'email', 'value': contact.text.trim()},
            },
          );
          await widget.api.saveToken(result['token'] as String);
          password.clear();
          confirm.clear();
          if (!mounted) return;
          go('done');
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          error = e is ApiException
              ? e.message
              : 'Your device could not save the session. Please sign in again.';
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          busy = false;
        });
      }
    }
  }

  String? passwordValidator(String? value) {
    if (value == null || value.length < 8) return 'Use at least 8 characters.';
    if (utf8.encode(value).length > 72) {
      return 'Please use a shorter password (at most 72 bytes).';
    }
    return null;
  }

  Widget passwordField(
    TextEditingController controller,
    String label, {
    bool confirmation = false,
  }) => ClayInputField(
    controller: controller,
    labelText: label,
    prefixIcon: Icons.lock_outline_rounded,
    obscureText: hidden,
    autofillHints: [
      step == 'login' ? AutofillHints.password : AutofillHints.newPassword,
    ],
    suffixIcon: IconButton(
      tooltip: hidden ? 'Show password' : 'Hide password',
      onPressed: () => setState(() {
        hidden = !hidden;
      }),
      icon: Icon(
        hidden ? Icons.visibility_off_outlined : Icons.visibility_outlined,
        color: QuestColors.muted,
      ),
    ),
    validator: (value) => confirmation
        ? value != password.text
              ? 'Passwords do not match.'
              : null
        : step == 'login'
        ? value == null || value.isEmpty
              ? 'Enter your password.'
              : null
        : passwordValidator(value),
    onFieldSubmitted: (_) {
      if (!busy && (confirmation || step == 'login')) submit();
    },
  );

  @override
  Widget build(BuildContext context) {
    final titles = {
      'id': 'Your next quest\nstarts here.',
      'login': 'Welcome back,\nexplorer.',
      'password': 'A little lock for\nyour big journey.',
      'contact': 'Bring your\nparent along.',
      'done': 'You’re officially\nan explorer!',
    };
    final descriptions = {
      'login':
          'Your adventure is waiting. Enter your password to pick up where you left off.',
      'password':
          'Create a password you can remember. Keep it between you and your parent.',
      'contact':
          'Add your parent’s email. We’ll let them know you made an account, and they can follow your progress on the SafetyQuest website.',
      'done':
          'Your account is ready. Let’s start building a little more confidence, every day.',
    };
    return PopScope(
      canPop: step == 'id',
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop && !busy && step != 'done') {
          go(step == 'contact' ? 'password' : 'id');
        }
      },
      child: Scaffold(
        backgroundColor: QuestColors.paper,
        body: SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 520),
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(
                  horizontal: 28,
                  vertical: 24,
                ),
                child: AutofillGroup(
                  child: Form(
                    key: form,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // The hero lockup already carries the brand on these
                        // steps, so it takes the top of the screen itself.
                        if (step == 'id' || step == 'done') ...[
                          const SizedBox(height: 4),
                          const Center(child: BrandHero()),
                          const SizedBox(height: 28),
                        ] else ...[
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Brand(),
                              IconButton(
                                tooltip: 'Go back',
                                onPressed: busy
                                    ? null
                                    : () => go(
                                        step == 'contact' ? 'password' : 'id',
                                      ),
                                icon: const Icon(
                                  Icons.arrow_back_rounded,
                                  color: QuestColors.ink,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 36),
                          ClayCard(
                            color: step == 'contact'
                                ? QuestColors.lilac
                                : QuestColors.peach,
                            padding: const EdgeInsets.all(18),
                            child: Icon(
                              step == 'contact'
                                  ? Icons.favorite_border_rounded
                                  : Icons.lock_outline_rounded,
                              color: QuestColors.ink,
                              size: 30,
                            ),
                          ),
                          const SizedBox(height: 30),
                        ],
                        const SizedBox(height: 12),
                        Eyebrow(
                          step == 'id' || step == 'login'
                              ? 'Student login'
                              : step == 'done'
                              ? 'Welcome to SafetyQuest'
                              : 'Account setup • ${step == 'password' ? '1' : '2'} of 2',
                        ),
                        const SizedBox(height: 12),
                        Text(
                          titles[step]!,
                          style: Theme.of(context).textTheme.headlineLarge,
                        ),
                        // The Student ID field explains itself; the other
                        // steps still need their guidance line.
                        if (step == 'id')
                          const SizedBox(height: 28)
                        else ...[
                          const SizedBox(height: 14),
                          Text(
                            descriptions[step]!,
                            style: Theme.of(context).textTheme.bodyLarge,
                          ),
                          const SizedBox(height: 32),
                        ],
                        if (step == 'id') ...[
                          ClayInputField(
                            controller: studentId,
                            labelText: 'Student ID',
                            hintText: 'Enter your school-issued ID',
                            prefixIcon: Icons.badge_outlined,
                            textCapitalization: TextCapitalization.characters,
                            autofillHints: const [AutofillHints.username],
                            maxLength: 100,
                            validator: (value) =>
                                value == null || value.trim().isEmpty
                                ? 'Enter your student ID.'
                                : null,
                            onFieldSubmitted: (_) {
                              if (!busy) submit();
                            },
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            'No student ID yet? Your teacher can help you get one.',
                            style: TextStyle(fontSize: 13),
                          ),
                        ],
                        if (step == 'password' || step == 'login') ...[
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 10,
                            ),
                            decoration: BoxDecoration(
                              color: QuestColors.ink.withOpacity(0.05),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              'Student ID: ${studentId.text.trim()}',
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                                color: QuestColors.ink,
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),
                          passwordField(
                            password,
                            step == 'login' ? 'Password' : 'Create password',
                          ),
                          if (step == 'password') ...[
                            const SizedBox(height: 16),
                            passwordField(
                              confirm,
                              'Confirm password',
                              confirmation: true,
                            ),
                            const SizedBox(height: 12),
                            const Text(
                              'At least 8 characters. A few memorable words work well.',
                              style: TextStyle(fontSize: 13),
                            ),
                          ],
                          if (step == 'login') ...[
                            const SizedBox(height: 8),
                            Align(
                              alignment: Alignment.centerRight,
                              child: TextButton(
                                onPressed: () => showDialog<void>(
                                  context: context,
                                  builder: (context) => AlertDialog(
                                    backgroundColor: QuestColors.paper,
                                    title: const Text('Need a fresh start?'),
                                    content: const Text(
                                      'Ask your teacher or school administrator to help recover your student account. Have your student ID ready.',
                                    ),
                                    actions: [
                                      TextButton(
                                        onPressed: () => Navigator.pop(context),
                                        child: const Text(
                                          'Got it',
                                          style: TextStyle(
                                            color: QuestColors.ink,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                child: const Text(
                                  'Forgot your password?',
                                  style: TextStyle(
                                    color: QuestColors.coral,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ],
                        if (step == 'contact') ...[
                          ClayInputField(
                            controller: contact,
                            labelText: 'Parent’s email address',
                            hintText: 'parent@example.com',
                            prefixIcon: Icons.email_outlined,
                            keyboardType: TextInputType.emailAddress,
                            autofillHints: const [AutofillHints.email],
                            validator: (value) =>
                                RegExp(
                                  r'^[^\s@]+@[^\s@]+\.[^\s@]+$',
                                ).hasMatch(value?.trim() ?? '')
                                ? null
                                : 'Enter a valid email address.',
                            onFieldSubmitted: (_) {
                              if (!busy) submit();
                            },
                          ),
                          const SizedBox(height: 18),
                          CheckboxListTile(
                            value: parentAgreed,
                            contentPadding: EdgeInsets.zero,
                            controlAffinity: ListTileControlAffinity.leading,
                            activeColor: QuestColors.ink,
                            title: const Text(
                              'My parent or guardian agrees to get emails about my account here.',
                              style: TextStyle(
                                fontSize: 13,
                                height: 1.5,
                                color: QuestColors.muted,
                              ),
                            ),
                            onChanged: busy
                                ? null
                                : (value) => setState(() {
                                    parentAgreed = value ?? false;
                                  }),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Your password is never sent. Your parent signs in on the SafetyQuest website with this email to see your progress.',
                            style: TextStyle(fontSize: 12),
                          ),
                        ],
                        if (error != null) ...[
                          const SizedBox(height: 20),
                          Notice(error!, error: true),
                        ],
                        const SizedBox(height: 36),
                        ClayActionBtn(
                          switch (step) {
                            'id' => 'Find my account',
                            'login' => 'Let’s go',
                            'password' => 'Continue',
                            'contact' => 'Finish setup',
                            _ => 'Explore my home',
                          },
                          busy: busy,
                          onPressed: step == 'done'
                              ? widget.onSignedIn
                              : submit,
                        ),
                        const SizedBox(height: 32),
                        const Center(
                          child: Eyebrow('One small step. A safer tomorrow.'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// Minimalist Claymorphism Input Field
class ClayInputField extends StatelessWidget {
  final TextEditingController controller;
  final String labelText;
  final String? hintText;
  final IconData prefixIcon;
  final bool obscureText;
  final Widget? suffixIcon;
  final TextInputType? keyboardType;
  final List<String>? autofillHints;
  final String? Function(String?)? validator;
  final void Function(String)? onFieldSubmitted;
  final TextCapitalization textCapitalization;
  final int? maxLength;
  final List<TextInputFormatter>? inputFormatters;
  final TextAlign textAlign;
  final TextStyle? style;

  const ClayInputField({
    super.key,
    required this.controller,
    required this.labelText,
    this.hintText,
    required this.prefixIcon,
    this.obscureText = false,
    this.suffixIcon,
    this.keyboardType,
    this.autofillHints,
    this.validator,
    this.onFieldSubmitted,
    this.textCapitalization = TextCapitalization.none,
    this.maxLength,
    this.inputFormatters,
    this.textAlign = TextAlign.start,
    this.style,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: QuestColors.paper, // Blends perfectly with background
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          // Soft outer shadows simulating an inset/embossed clay look
          BoxShadow(
            color: Colors.white.withOpacity(0.9),
            offset: const Offset(-4, -4),
            blurRadius: 10,
          ),
          BoxShadow(
            color: QuestColors.ink.withOpacity(0.06),
            offset: const Offset(4, 4),
            blurRadius: 10,
          ),
        ],
      ),
      child: TextFormField(
        controller: controller,
        obscureText: obscureText,
        keyboardType: keyboardType,
        autofillHints: autofillHints,
        validator: validator,
        onFieldSubmitted: onFieldSubmitted,
        textCapitalization: textCapitalization,
        maxLength: maxLength,
        inputFormatters: inputFormatters,
        textAlign: textAlign,
        style:
            style ??
            const TextStyle(
              fontWeight: FontWeight.w700,
              color: QuestColors.ink,
            ),
        decoration: InputDecoration(
          labelText: labelText,
          hintText: hintText,
          counterText: '',
          labelStyle: TextStyle(
            color: QuestColors.muted.withOpacity(0.8),
            fontWeight: FontWeight.w600,
          ),
          prefixIcon: Icon(prefixIcon, color: QuestColors.muted),
          suffixIcon: suffixIcon,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(18),
            borderSide: BorderSide.none, // Removed harsh borders
          ),
          filled: true,
          fillColor: Colors.transparent,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 20,
            vertical: 16,
          ), // Softer padding
        ),
      ),
    );
  }
}

// Minimalist Claymorphism Button
class ClayActionBtn extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool busy;

  const ClayActionBtn(
    this.label, {
    super.key,
    this.onPressed,
    this.busy = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: busy ? null : onPressed,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 18),
        decoration: BoxDecoration(
          color: QuestColors.coral,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: Colors.white.withOpacity(0.4), width: 1.5),
          boxShadow: [
            BoxShadow(
              color: QuestColors.coral.withOpacity(0.35),
              offset: const Offset(0, 8),
              blurRadius: 16,
            ),
            const BoxShadow(
              color: Colors.white,
              offset: Offset(-3, -3),
              blurRadius: 8,
            ),
          ],
        ),
        child: Center(
          child: busy
              ? const SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.5,
                    color: Colors.white,
                  ),
                )
              : Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      label,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 16,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Icon(
                      Icons.arrow_forward_rounded,
                      color: Colors.white,
                      size: 20,
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}
