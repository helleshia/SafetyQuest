# safetyquest

React + Next.js + MongoDB Atlas + Tailwind CSS. Backend and frontend live in separate
top-level folders and are served by one Next.js server.

## Development Server

`npm run dev` starts **one** Next.js server on `$PORT` (default 8443). It serves the UI and
the `/api/*` routes together, so there is no second server and no proxy.

- Preview URL: the user reaches the running app through the preview panel
- Hot reload: changes to source files are reflected immediately
- **`backend/.env` holds every credential**: `MONGODB_URI`, `MONGODB_DB` and
  `ADMIN_SETUP_TOKEN`. It sits with the server code that reads it, and it is gitignored.
  `backend/.env.example` is the committed template and must never hold a real secret.
  Next.js only auto-loads a `.env` at the project root, so `next.config.ts` loads this one
  explicitly with `process.loadEnvFile` before the server starts. This project does not use
  `.env.local`. Without a `MONGODB_URI`, every `/api/*` route answers `503` with a message
  saying so. That is expected, not a bug.

## Project Structure

This is the canonical project structure. Start with task-relevant files below. Only follow
imports or inspect other files when required, when a documented path is missing, or when the
repository contradicts this guide.

### `frontend/` — everything that runs in the browser

- `frontend/App.tsx` - Primary application component and the usual starting point for UI work
- `frontend/index.css` - Global CSS entrypoint and Tailwind CSS v4 import
- `frontend/admin/`, `frontend/teacher/`, `frontend/parent/` - The three consoles, each with its own page components and stylesheets
- `frontend/shared/` - Icon, UI primitives, the data store, and `api.ts`, the fetch client every console calls
- `frontend/main.tsx` + `frontend/index.html` - Vite entry, kept only for running the UI on its own; the app normally boots through Next.js

### `backend/` — everything that runs on the server

The route tree mirrors the URL tree, so `/api/admin/state` is `backend/routes/admin/state.ts`.

- `backend/lib/db.ts` - MongoDB Atlas connection, cached across requests
- `backend/lib/auth.ts` - Password hashing, sessions, `requireUser`/`requireAdmin`/`requireTeacher`, attempt limiting
- `backend/lib/http.ts` - Request body reading, origin checks, JSON responses, and the `endpoint` error wrapper
- `backend/routes/health.ts` - Connection check
- `backend/routes/auth/` - `login`, `logout`, `me`, `status`, `setup`, `password` (the one-time-code password change)
- `backend/routes/admin/` - `state` (read and save the workspace), `reset`, `credentials` (set a teacher's password)
- `backend/routes/teacher/` - `state` (a teacher's own classes only), `reset`

### `shared/` — the contract both sides agree on

- `shared/admin-schema.ts` - Zod schemas, `AdminState` types, and `validateState`. Imported by the backend for validation and by the frontend for its types.

### `app/` — Next.js routing only, no logic

- `app/layout.tsx`, `app/page.tsx` - HTML shell and the page that mounts `frontend/App`
- `app/api/**/route.ts` - Thin files that name the HTTP verbs and defer to `backend/routes/`

### Root

- `package.json` - Dependencies and the dev, build, start, typecheck, and formatting scripts
- `next.config.ts` - Next.js configuration, and it loads `backend/.env` into the environment
- `postcss.config.mjs` - Tailwind CSS v4 through `@tailwindcss/postcss`
- `vite.config.ts` - Optional UI-only runner rooted at `frontend/`, with the `@` alias for it
- `.mise.toml` - Toolchain versions for Node.js and pnpm

## Dependencies

- Runtime: React 19, React DOM 19, Next.js 16
- Data: MongoDB Atlas via the `mongodb` driver; validation with Zod
- Styling: Tailwind CSS v4 through `@tailwindcss/postcss`
- Build tooling: TypeScript 5.7
- Formatting: oxfmt

## Styling

This project uses **Tailwind CSS v4** through `@tailwindcss/postcss`, configured in
`postcss.config.mjs`. `frontend/index.css` imports Tailwind with `@import 'tailwindcss';` and
then the shared console stylesheet. Put global CSS and Tailwind v4 theme customization there;
per-console styles belong beside their components, as `frontend/admin/overview.css` and
`frontend/teacher/teacher.css` do.

Global font wiring belongs in `frontend/index.css`. Keep CSS `@import` statements first, then
add any `@font-face` rules and font-family defaults.

Both consoles share one visual system: the clay recipe (`--clay-raise`, `--clay-emboss`,
`--clay-inset`) over the landing palette (coral, burgundy ink, cream paper, pastel accents).
A new page re-declares those three tokens on its own page wrapper, as every existing page
stylesheet does.

## Code quality

- Use double quotes for strings containing apostrophes (`"We're here to help"`), or escape them in single-quoted strings. An unescaped apostrophe in a single-quoted string breaks the build.
- Ensure JSX tags are closed and braces are balanced.
- Export components as default exports.
- Keep server-only code in `backend/`. Anything under `frontend/` ships to the browser, so it must never import from `backend/`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
