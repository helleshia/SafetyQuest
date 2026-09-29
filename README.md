# SafetyQuest

Thesis learning system for personal safety and disaster preparedness (Grade 4–6, Philippines).

| Part | Stack | Who uses it |
| --- | --- | --- |
| Web dashboard + API | React, Next.js, MongoDB Atlas, Tailwind CSS | Teachers & admins |
| Mobile app | Flutter (Android only) | Students & parents |

Students and parents are **PII-free**: login uses randomized tokens and codes — no names, photos, emails, or phone numbers stored for them.

---

## Requirements

- **Node.js** 22+ (see `.mise.toml`)
- **MongoDB Atlas** connection string
- **Flutter** stable (for the mobile app)
- Android device or emulator

---

## Quick start — web dashboard & API

One Next.js server serves the UI and `/api/*` routes (default port **8443**).

```bash
# 1. Install
npm install

# 2. Configure secrets (gitignored)
cp backend/.env.example backend/.env
# Edit backend/.env — at minimum set:
#   MONGODB_URI, MONGODB_DB, ADMIN_SETUP_TOKEN, JWT_SECRET, API_BASE_URL

# 3. Run
npm run dev
```

Open [http://localhost:8443](http://localhost:8443).

Without `MONGODB_URI`, every `/api/*` route returns `503`. That is expected.

### Useful scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server (hot reload) on port 8443 |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run typecheck` | TypeScript check |
| `npm run test:backend` | Backend tests |
| `npm run format` | Format with oxfmt |

---

## Quick start — mobile app

```bash
cd mobile
flutter pub get
flutter run
```

`API_BASE_URL` in `backend/.env` is the school server the app calls. The Android build copies **only that value** into the APK.

| Target | Typical `API_BASE_URL` |
| --- | --- |
| Physical phone (same Wi‑Fi) | `http://<your-PC-LAN-IP>:8443` |
| Android emulator | `http://10.0.2.2:8443` |
| Release | `https://…` |

After changing `API_BASE_URL`, do a full restart (hot reload will not pick it up).

More detail: [`mobile/README.md`](mobile/README.md).

---

## Project layout

```
safetyquest/
├── app/           # Next.js routes (thin); mounts UI + /api/*
├── frontend/      # Admin, teacher, parent consoles (browser)
├── backend/       # API logic, MongoDB, auth; .env lives here
├── shared/        # Shared Zod schemas / types
├── mobile/        # Flutter student + parent app (Android)
└── docs/          # Extra notes
```

Canonical agent/dev notes: [`AGENTS.md`](AGENTS.md).

---

## Roles (short)

| Role | Surface | Access |
| --- | --- | --- |
| **Admin** | Web | Teachers, sections, curriculum CMS, settings, export |
| **Teacher** | Web | Own sections: roster, tokens, progress, simulations, feedback |
| **Student** | Mobile | Lessons, quizzes, simulations, rewards (token + PIN) |
| **Parent** | Mobile | Read-only child progress (token + parent code) |

---

## Environment

All server credentials live in **`backend/.env`** (gitignored). Commit only `backend/.env.example`.

Key variables:

- `MONGODB_URI` / `MONGODB_DB` — Atlas database
- `ADMIN_SETUP_TOKEN` — one-time admin bootstrap
- `JWT_SECRET` — session signing
- `API_BASE_URL` — public base URL for the Flutter app
- SMTP / Twilio — optional email and SMS helpers

Never put secrets in the repo or under `frontend/` / `mobile/` source that ships to clients.

---

## License / thesis note

Academic thesis project. Prefer simple, working solutions over clever ones. Final delivery target: **October 2026**.
