# SafetyQuest — Interactive questionnaires & simulations

Each assessment item can be a **short interactive simulation** (tap, drag, sequence, etc.), not only a static multiple-choice form. Phase 2 practical exams use the same engine.

Correct / safe outcomes are marked with **✓** where choices apply. Every finished step stores actions, reaction time, points, and correctness for teacher review.

---

## How it works (Flutter)

| Layer | Role |
|---|---|
| `SimKind` | Interaction type (choice, hotspot, sequence, hold, dragDrop, match, hazard) |
| `SimStep` | Scenario alert, prompt, scene (image/video + props), feedback, scoring |
| `SimulationView` | Timed interactive game UI + consequence scene + feedback card |
| `QuizQuestion.interaction` | Optional mini-simulation instead of static MCQ |
| `SimResult` | Log: `safe`, `seconds`, `kind`, `actions[]`, `points`, selected ids |
| `shared/sim-schema.ts` | Teacher/admin config shape (Zod) for future CMS |

**Student loop:** see situation (image/video) → interact with touch → system evaluates → show consequence + feedback → next step.

**Label on stage:** `INTERACTIVE SITUATION` · Practice intro reminds students: *Simulation lang ito*.

---

## Interaction types

1. **choice** — Pick the safest action in the scenario  
2. **hotspot** — Tap/select one correct object in the scene  
3. **hazard** — Tap *every* hazard (identify hazards)  
4. **dragDrop** — Drag an object onto a target (e.g. extinguisher → fire)  
5. **match** — Match several objects to correct locations  
6. **sequence** — Follow a safety procedure in order  
7. **hold** — Press and hold until danger passes  

Media: clay still (`assets/modules/<module>_sim_<n>.png`) and optional looping video (`assets/media/<key>_sim_<n>.mp4`).

---

## Showcase — Fire Safety (interactive)

### Questionnaire (Phase 1) — mixed static + interactive

| # | Mode | What the student does |
|---|---|---|
| Q1 | **hazard** | Tap candle + paper hazards in the room |
| Q2 | static MCQ | Overloaded outlet |
| Q3 | **choice** | Fire alarm scene — follow teacher |
| Q4 | **sequence** | Stop → Drop → Roll → get help |
| Q5–Q7 | static MCQ | Smoke, stay out, alternate exit |

### Practical (Phase 2) — six situations

| Step | Kind | Situation |
|---|---|---|
| 1 | hazard | Spot candle + paper hazards |
| 2 | choice | Alarm — evacuate with teacher |
| 3 | hotspot | Tap clear exit (hallway blocked) |
| 4 | **dragDrop** | Drag extinguisher onto small fire (practice tool; real life = adults) |
| 5 | sequence | Stop, Drop, Roll, get help |
| 6 | choice | Stay at meeting place — do not go back |

Drag step shows a **consequence scene** when safe (smoke clear + checkmark).

---

## Teacher / admin configuration

Authoring target (see `shared/sim-schema.ts`):

- Scenario alert + prompt  
- Scene props (id, art, position, label)  
- Image / video assets  
- Correct actions (`answer`, `hazardIds`, `dragItemId`/`dropTargetId`, `matchPairs`, ordered `choices`)  
- Safe / unsafe feedback + optional consequence scenes  
- Seconds, points, passing score  

CMS UI can map to this schema later; mobile currently embeds configs in each `modules/*.dart` file.

---

## Stored attempt data

Each step reports:

```json
{
  "safe": true,
  "seconds": 3.2,
  "kind": "dragDrop",
  "actions": ["drop:extinguisher->fire"],
  "points": 20,
  "selectedId": "extinguisher->fire"
}
```

Use for score %, progress, and teacher review of decisions / reaction time.

---

## Table of contents (lesson content)

Built lessons still include **7 quiz items** and **6 practical steps** each. Fire Safety is the reference for full interactive questionnaire items; other modules use the same `SimStep` engine (expand `QuizQuestion.interaction` the same way).

Sources: `mobile/lib/features/lessons/modules/*.dart`

---

_Generated for SafetyQuest practical exam / interactive assessment design. Simulation lang ito — never presented as a real emergency alert._
