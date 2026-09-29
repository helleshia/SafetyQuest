import { z } from "zod";

/**
 * Teacher/admin-configurable interactive simulation step.
 * Mirrors mobile `SimStep` so CMS / API can author scenarios later.
 */
export const simKindSchema = z.enum([
  "findHazards",
  "findObject",
  "chooseAction",
  "sceneDecision",
  "safetySequence",
  "tapSafeArea",
  "hold",
]);

export const simChoiceSchema = z.object({
  emoji: z.string().default(""),
  label: z.string().min(1),
  correct: z.boolean().optional().default(false),
});

export const sceneHotspotSchema = z.object({
  id: z.string().min(1),
  /** Normalized 0–1, top-left of the hit rect relative to the image. */
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().positive().max(1).default(0.14),
  height: z.number().positive().max(1).default(0.16),
  correct: z.boolean().default(false),
  /** Accessibility only — never drawn on the scene. */
  label: z.string().optional(),
  /** Clay glyph in the scene (hidden-object style). Null = image-only hit. */
  art: z.string().optional(),
});

export const simPropSchema = z.object({
  id: z.string().min(1).optional(),
  art: z.string().min(1),
  label: z.string().optional(),
  x: z.number().min(-1).max(1).default(0),
  y: z.number().min(-1).max(1).default(0),
  size: z.number().positive().optional(),
});

export const simSceneSchema = z.object({
  imageAsset: z.string().optional(),
  videoAsset: z.string().optional(),
  props: z.array(simPropSchema).default([]),
});

export const simStepConfigSchema = z.object({
  id: z.string().min(1),
  kind: simKindSchema,
  alert: z.string().min(1),
  prompt: z.string().min(1),
  debrief: z.string().min(1),
  unsafeDebrief: z.string().optional(),
  seconds: z.number().int().positive().default(10),
  holdSeconds: z.number().int().positive().optional(),
  points: z.number().int().nonnegative().default(10),
  scene: simSceneSchema,
  consequenceSafe: simSceneSchema.optional(),
  consequenceUnsafe: simSceneSchema.optional(),
  choices: z.array(simChoiceSchema).default([]),
  /** Invisible hit regions over the scene image */
  hotspots: z.array(sceneHotspotSchema).default([]),
  /** findObject / tapSafeArea target id */
  answer: z.string().optional(),
  hazardIds: z.array(z.string()).default([]),
});

export const interactiveQuestionConfigSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  explain: z.string().min(1),
  /** Static fallback choices when interaction is omitted */
  choices: z.array(simChoiceSchema).default([]),
  interaction: simStepConfigSchema.optional(),
});

export const moduleAssessmentConfigSchema = z.object({
  moduleId: z.string().min(1),
  questionnaire: z.array(interactiveQuestionConfigSchema),
  practical: z.array(simStepConfigSchema),
  passingScore: z.number().int().min(0).max(100).default(70),
});

export type SimStepConfig = z.infer<typeof simStepConfigSchema>;
export type InteractiveQuestionConfig = z.infer<typeof interactiveQuestionConfigSchema>;
export type ModuleAssessmentConfig = z.infer<typeof moduleAssessmentConfigSchema>;

/** Student action log posted after a practical / interactive quiz run */
export const simAttemptLogSchema = z.object({
  clientId: z.string().uuid(),
  moduleId: z.string(),
  phase: z.enum(["quiz", "practical"]),
  steps: z.array(
    z.object({
      stepId: z.string().optional(),
      kind: simKindSchema,
      safe: z.boolean(),
      seconds: z.number().nonnegative(),
      points: z.number().int().nonnegative(),
      actions: z.array(z.string()),
      choiceIndex: z.number().int().optional(),
      selectedId: z.string().optional(),
    }),
  ),
  totalPoints: z.number().int().nonnegative(),
  scorePercent: z.number().int().min(0).max(100),
});

export type SimAttemptLog = z.infer<typeof simAttemptLogSchema>;
