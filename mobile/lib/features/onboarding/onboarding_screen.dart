import 'package:flutter/material.dart';
import 'package:safetyquest_mobile/core/theme/quest_theme.dart';
import 'package:animate_do/animate_do.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({
    super.key,
    required this.onDone,
    this.animate = true,
  });
  final VoidCallback onDone;
  final bool animate;
  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen>
    with SingleTickerProviderStateMixin {
  final PageController _controller = PageController();
  late final AnimationController _floatController;
  int _currentIndex = 0;

  // Content grounded in SYSTEM-BRIEF.pdf
  static const pages = [
    (
      // Slide 1: What is SafetyQuest?
      label: 'SAFETY STARTS HERE',
      title: 'Your Safety,\nYour Quest.',
      body:
          'SafetyQuest teaches Grade 4–6 students personal safety and disaster preparedness through interactive lessons aligned with NDRRMC and Philippine Red Cross guidelines.',
      color: QuestColors.peach,
      image: 'assets/cool_student.png',
    ),
    (
      // Slide 2: Dual-Phase Learning Structure
      label: 'LEARN THEN PRACTICE',
      title: 'Stories, Quizzes\n& Real Scenarios.',
      body:
          'Every module has two phases: interactive story-driven lessons to build your knowledge, then scenario simulations where you make real emergency decisions under time pressure.',
      color: QuestColors.mint,
      image: 'assets/cool_book.png',
    ),
    (
      // Slide 3: Gamification
      label: 'EARN YOUR BADGES',
      title: 'Points, Badges\n& Level Up!',
      body:
          'Master 15 safety modules — from Earthquake Drills and Fire Safety to Cyberbullying and First Aid. Earn points, collect badges, and level up as you grow safer every day.',
      color: QuestColors.lilac,
      image: 'assets/cool_trophy.png',
    ),
  ];

  @override
  void initState() {
    super.initState();
    // Gentle floating animation
    _floatController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    );
    if (widget.animate) _floatController.repeat(reverse: true);
  }

  @override
  void dispose() {
    _floatController.dispose();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final bottomPadding = MediaQuery.of(context).padding.bottom;

    return Scaffold(
      backgroundColor: QuestColors.paper,
      body: Stack(
        children: [
          Column(
            children: [
              // ── Top Bar ──────────────────────────────────────────
              SafeArea(
                bottom: false,
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 16,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      FadeInDown(
                        duration: const Duration(milliseconds: 500),
                        child: const Brand(),
                      ),
                      FadeInDown(
                        duration: const Duration(milliseconds: 500),
                        delay: const Duration(milliseconds: 100),
                        child: TextButton(
                          onPressed: widget.onDone,
                          style: TextButton.styleFrom(
                            foregroundColor: QuestColors.muted,
                          ),
                          child: const Text(
                            'Skip',
                            style: TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // ── Page View ────────────────────────────────────────
              Expanded(
                child: PageView.builder(
                  controller: _controller,
                  itemCount: pages.length,
                  onPageChanged: (i) => setState(() => _currentIndex = i),
                  itemBuilder: (context, index) {
                    final item = pages[index];
                    return Column(
                      children: [
                        // Illustration area — 44% of screen height
                        SizedBox(
                          height: size.height * 0.44,
                          child: Stack(
                            alignment: Alignment.center,
                            children: [
                              // Soft pastel blob backdrop
                              AnimatedContainer(
                                duration: const Duration(milliseconds: 400),
                                width: size.width * 0.72,
                                height: size.width * 0.72,
                                decoration: BoxDecoration(
                                  color: item.color.withOpacity(0.45),
                                  shape: BoxShape.circle,
                                ),
                              ),

                              // Premium glowing Icon — gently floating
                              AnimatedBuilder(
                                animation: _floatController,
                                builder: (context, child) {
                                  final dy =
                                      -10.0 *
                                      (_floatController.value * 2 - 1).abs();
                                  return Transform.translate(
                                    offset: Offset(0, dy),
                                    child: child,
                                  );
                                },
                                child: ZoomIn(
                                  duration: const Duration(milliseconds: 600),
                                  child: Image.asset(
                                    item.image,
                                    width: size.width * 0.62,
                                    height: size.width * 0.62,
                                    fit: BoxFit.contain,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                        // ── Text Content ─────────────────────────
                        Expanded(
                          child: Padding(
                            padding: const EdgeInsets.fromLTRB(30, 20, 30, 16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                FadeInLeft(
                                  duration: const Duration(milliseconds: 400),
                                  child: Text(
                                    item.label,
                                    style: TextStyle(
                                      color: QuestColors.coral,
                                      fontWeight: FontWeight.w900,
                                      fontSize: size.width * 0.031,
                                      letterSpacing: 1.8,
                                    ),
                                  ),
                                ),
                                SizedBox(height: size.height * 0.015),
                                FadeInLeft(
                                  duration: const Duration(milliseconds: 500),
                                  delay: const Duration(milliseconds: 80),
                                  child: Text(
                                    item.title,
                                    style: Theme.of(context)
                                        .textTheme
                                        .headlineLarge
                                        ?.copyWith(
                                          fontSize: size.width * 0.078,
                                          fontWeight: FontWeight.w900,
                                          height: 1.15,
                                        ),
                                  ),
                                ),
                                SizedBox(height: size.height * 0.018),
                                FadeInLeft(
                                  duration: const Duration(milliseconds: 600),
                                  delay: const Duration(milliseconds: 150),
                                  child: Text(
                                    item.body,
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodyMedium
                                        ?.copyWith(
                                          fontSize: size.width * 0.038,
                                          height: 1.55,
                                          color: QuestColors.muted,
                                        ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ),
            ],
          ),

          // ── Floating Bottom Controls ──────────────────────────────
          Positioned(
            left: 30,
            right: 30,
            bottom: bottomPadding > 0 ? bottomPadding + 12 : 28,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Page dots
                SmoothPageIndicator(
                  controller: _controller,
                  count: pages.length,
                  effect: ExpandingDotsEffect(
                    activeDotColor: QuestColors.coral,
                    dotColor: QuestColors.ink.withOpacity(0.12),
                    dotHeight: 8,
                    dotWidth: 8,
                    expansionFactor: 3.5,
                  ),
                ),

                // Next / Start button
                GestureDetector(
                  onTap: () {
                    if (_currentIndex == pages.length - 1) {
                      widget.onDone();
                    } else {
                      _controller.nextPage(
                        duration: const Duration(milliseconds: 400),
                        curve: Curves.easeOutCubic,
                      );
                    }
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: EdgeInsets.symmetric(
                      horizontal: size.width * 0.065,
                      vertical: size.height * 0.017,
                    ),
                    decoration: BoxDecoration(
                      color: QuestColors.ink,
                      borderRadius: BorderRadius.circular(40),
                      boxShadow: [
                        BoxShadow(
                          color: QuestColors.ink.withOpacity(0.25),
                          blurRadius: 14,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          _currentIndex == pages.length - 1
                              ? 'Start Quest'
                              : 'Next',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                            fontSize: size.width * 0.038,
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Icon(
                          Icons.arrow_forward_rounded,
                          color: Colors.white,
                          size: 18,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
