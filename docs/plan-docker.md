# SafetyQuest — Docker plan

Goal: run the web console + API in containers so we can deploy the same build everywhere, scale when many teachers/admins/parents are online, and keep secrets out of the image.

**Out of scope for v1:** packaging the Flutter mobile app in Docker (Android APKs are built with Flutter tooling, not this container). Mobile keeps calling `API_BASE_URL` against the public HTTPS URL of the Dockerized Next.js server.

---

## 1. What we containerize

| Piece | In Docker? | Notes |
|---|---|---|
| Next.js app (`frontend` + `backend` + `app/`) | Yes | One image, one process: `next start` on port 8443 (or 3000 inside the container) |
| MongoDB | No (keep Atlas) | Atlas already gives HA, backups, encryption at rest. Running Mongo in Docker on one VPS is worse for thesis/production risk |
| SMTP / Twilio | External | Same env vars as today |
| Flutter `mobile/` | No | Build APK separately; point it at the container’s public URL |

**Why one Next container (not separate frontend/API):** this repo already serves UI and `/api/*` from one Next server. Splitting them would add reverse-proxy complexity without a real win.

---

## 2. Target layout

```
Internet
   │
   ▼
[ Reverse proxy / TLS ]  ← Caddy, nginx, or cloud load balancer
   │
   ▼
[ Next.js container × N ]  ← scale horizontally when load grows
   │
   ▼
[ MongoDB Atlas ]
```

Local / demo can skip the proxy and expose the container port directly.

Suggested repo files (to add later, when implementing):

```
Dockerfile                 # multi-stage production build
.dockerignore
docker-compose.yml         # local: app (+ optional tools)
docker-compose.prod.yml    # optional: replicas, resource limits
docs/ or this plan.md
```

---

## 3. Image design (multi-stage)

**Stage 1 — deps:** install production + build deps with a lockfile-friendly install (`npm ci`).

**Stage 2 — build:** `npm run build` (`next build`). Copy only what Next needs.

**Stage 3 — run:** slim Node image (e.g. `node:22-alpine` or distroless), non-root user, `NODE_ENV=production`, `next start -H 0.0.0.0 -p 3000`.

Rules:

- Never bake `backend/.env` into the image.
- Pass secrets at runtime: Compose `env_file`, Kubernetes secrets, or host env.
- Prefer Next **standalone** output (`output: "standalone"` in `next.config.ts`) so the runtime image is smaller and does not need `node_modules` wholesale.
- Healthcheck: `GET /api/health` (or existing health route) every 30s.

---

## 4. Environment & config

Map today’s `backend/.env` into container env:

| Variable | Required | Purpose |
|---|---|---|
| `MONGODB_URI` / `MONGODB_DB` | Yes | Atlas |
| `JWT_SECRET` | Yes | Sessions |
| `ADMIN_SETUP_TOKEN` | First boot | Setup |
| `APP_PUBLIC_URL` / `APP_ORIGIN` | Yes in prod | Invite + password links |
| `API_BASE_URL` | Mobile builds | Public URL (set in mobile build, not only Docker) |
| `SMTP_*` | For invites / OTP | Mail |
| `TWILIO_*` | Optional | SMS |
| `PORT` | Optional | Default 3000 in container; proxy maps 443 → 3000 |

Compose example shape (illustrative):

```yaml
services:
  web:
    build: .
    ports: ["8443:3000"]
    env_file: [backend/.env]
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:3000/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3
```

---

## 5. Scaling for “marami nang gagamit”

Docker alone does not magically scale — it makes **identical instances** easy to run.

### Phase A — single VPS (thesis / school pilot)

1. One `web` container behind HTTPS.
2. Atlas free/shared or dedicated cluster.
3. Resource limits in Compose (`mem_limit` / `cpus`) so the host does not OOM.
4. Log rotation; restart on crash.

Enough for a few sections and demo day.

### Phase B — more concurrent web users

1. Run **2+ replicas** of the same image behind a load balancer.
2. Keep sessions/JWT as they are today (stateless cookie/JWT → any replica can serve).
3. Atlas connection limits: use a connection-friendly URI; avoid opening a new Mongo client per request (we already cache in `backend/lib/db.ts` — keep that).
4. Rate limits on auth already exist — keep them; consider reverse-proxy rate limits for `/api/auth/*`.

### Phase C — if load keeps growing (post-thesis)

| Concern | Approach |
|---|---|
| CPU from Next | More replicas or a larger machine |
| Atlas bottlenecks | Bigger Atlas tier; indexes on hot queries |
| Static assets | CDN in front of Next (or object storage for media later) |
| Orchestration | Move from Compose to a small k8s / Nomad / cloud App Service only if needed |

**Do not** put Mongo in Docker “for scale” unless you also plan replica sets, backups, and ops — Atlas is the scale path for data.

---

## 6. Implementation phases

### Phase 0 — prep (½ day)

- [ ] Confirm `/api/health` (or add a tiny one) returns 200 when Atlas is reachable.
- [ ] Enable Next `output: "standalone"` and verify `npm run build` locally.
- [ ] List every env var used in production; update `backend/.env.example`.

### Phase 1 — Dockerfile + local Compose (1–2 days)

- [ ] Add `Dockerfile`, `.dockerignore`, `docker-compose.yml`.
- [ ] Build and run: `docker compose up --build`.
- [ ] Smoke test: sign-in, admin state load, teacher roster, invite email link host = `APP_PUBLIC_URL`.
- [ ] Document: “copy `.env.example` → `backend/.env`, then `docker compose up`”.

### Phase 2 — deploy one server (1 day)

- [ ] Pick host (school VPS, Render Docker, Fly.io, etc.).
- [ ] TLS via Caddy/nginx or platform HTTPS.
- [ ] Set `APP_PUBLIC_URL` to the real HTTPS origin.
- [ ] Rebuild mobile APK with that `API_BASE_URL` when ready for field test.

### Phase 3 — harden for many users (ongoing)

- [ ] Compose/prod: 2 replicas + load balancer **or** platform autoscaling.
- [ ] Resource limits + healthchecks + restart policy.
- [ ] Monitor: container CPU/RAM, Atlas metrics, 5xx rate.
- [ ] Optional: Redis later only if we add shared rate-limit / cache needs (not required for current JWT design).

---

## 7. What Docker optimizes (and what it doesn’t)

**Helps**

- Same build on laptop, demo laptop, and school server.
- Fast restart / rollback (retag previous image).
- Horizontal scale of the Next process.
- Clear separation: code in image, secrets in env.

**Does not replace**

- Good indexes and lean API queries.
- Atlas tier sized for concurrency.
- Efficient UI (avoid huge polling storms — teacher poll every 30s is fine; don’t drop to 1s).
- Mobile offline-first sync (already designed; keep it).

---

## 8. Security checklist for containers

- [ ] Non-root user in the image.
- [ ] No secrets in layers or git.
- [ ] Read-only root filesystem where possible.
- [ ] Only publish 443 (or 8443) publicly; Mongo stays private (Atlas IP allowlist / VPC if available).
- [ ] Keep `NODE_ENV=production`.
- [ ] Pin base image digests for thesis reproducibility if required.

---

## 9. Suggested “done” criteria

1. `docker compose up --build` boots the console without host Node install.
2. Admin, teacher, parent flows work against Atlas from the container.
3. Invite / OTP emails use the public URL.
4. Documented one-command deploy for the thesis demo machine.
5. (Stretch) Two replicas behind a proxy, both healthy, same Atlas.

---

## 10. Order of work when we implement

1. Next standalone + health route  
2. Dockerfile + `.dockerignore`  
3. `docker-compose.yml` for local  
4. Deploy one HTTPS host  
5. Replicas only after measuring real load  

When you want to start coding this, say which target first: **local Compose only** or **Compose + one VPS deploy**.
