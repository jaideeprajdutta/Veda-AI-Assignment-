<div align="center">

# VedaAI — AI Assessment Creator by Jaideep Raj Dutta

**Teachers describe an assignment → AI generates a structured question paper → they review, regenerate, version, and export it — with real‑time generation status over WebSockets.**

Next.js · TypeScript · Express · MongoDB · Redis · BullMQ · WebSockets · Google Gemini

**Live:** https://vedaai-web-439420707140.asia-south1.run.app
&nbsp;·&nbsp; **API:** https://vedaai-api-439420707140.asia-south1.run.app
&nbsp;·&nbsp; deployed on Google Cloud Run (asia‑south1)

</div>

---

## Overview

VedaAI lets a teacher create an assignment (subject inferred by AI, due date, question types with counts & marks, optional source upload, extra instructions), then generates an exam‑ready question paper using an LLM. Generation runs **asynchronously** through a job queue and the UI updates **live** as the paper is produced. The result is rendered as a clean, printable exam paper with sections, difficulty tags, marks, an answer key, **version history**, and **PDF export**.

Built to the provided Figma design system (Bricolage Grotesque, brand gradient `#FF5623→#E56820`, the exact tokens and screens).

### Highlights
- **Async pipeline** — request → BullMQ job → worker → store → WebSocket push. The API never blocks on the LLM.
- **Structured, validated output** — the model returns JSON enforced by a schema and re‑validated with **Zod** (with one self‑repair retry). Raw LLM text is never rendered.
- **Version history** — every regenerate is kept as a new version; switch between or delete versions.
- **PDF export** — server‑generated (pdfkit, Bricolage‑embedded), with a choice of *paper only* or *with answer key*.
- **Voice input** — dictate instructions via the browser Speech API.
- **Fully responsive** — desktop sidebar shell + mobile top bar, floating tab bar, and FAB.

---

## Architecture

```
┌──────────────┐   POST /assignments   ┌───────────────────────┐
│  Next.js     │ ────────────────────▶ │  API (Express)        │  process 1: HTTP + WS
│  (web)       │ ◀──── { jobId } ───── │  socket.io            │
│  Zustand     │ ◀════ job:status ════ │  QueueEvents → WS     │
│  socket.io   │       (WebSocket)     └──────────┬────────────┘
└──────────────┘                                  │ enqueue
                                           ┌───────▼────────┐
                                           │  Redis         │  BullMQ queue + job‑state + cache
                                           └───────┬────────┘
                                                   │ process
                                           ┌───────▼────────┐   ┌────────────┐
                                           │  Worker        │──▶│  Gemini    │  process 2: BullMQ
                                           │  prompt→Zod    │◀──│            │
                                           └───────┬────────┘   └────────────┘
                                                   │ store
                                           ┌───────▼────────┐
                                           │  MongoDB       │  assignments + paper versions
                                           └────────────────┘
```

**One backend codebase, two processes:**
- **api** — Express + socket.io. Serves HTTP, holds WebSocket connections, and listens to BullMQ `QueueEvents` (reading job state from Redis) to fan progress out to the right room.
- **worker** — BullMQ consumer. Builds the prompt, calls the LLM, validates with Zod, post‑processes (numbering, sections, answer key, totals), and stores the version. It never touches sockets — clean separation, and multi‑instance‑safe via the socket.io Redis adapter.

### Generation pipeline (how raw LLM output is avoided)
1. Worker builds a structured prompt from the assignment spec.
2. Gemini is called with a strict `responseSchema` → JSON only.
3. Response parsed with **Zod**; on failure the validation error is fed back for **one retry**.
4. Post‑processing assigns question numbers + ids, groups sections, lifts answers into the answer key, sums marks, defaults the school, and formats the class as an ordinal (e.g. `9th`).
5. Only validated, structured data is stored and rendered.

---

## Tech stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 (App Router) · TypeScript · Tailwind · **Zustand** · socket.io‑client · React Hook Form + Zod |
| Backend | Node + **Express** (TypeScript) · socket.io |
| Data | **MongoDB** (Mongoose) · **Redis** |
| Jobs | **BullMQ** (generation queue + job state + QueueEvents bridge) |
| AI | **Google Gemini** (`gemini-3.1-flash-lite`) via `responseSchema`; swappable `LLMProvider` interface (Gemini + Mock) |
| PDF | pdfkit (server‑side, embeds the Bricolage font) |
| Tooling | npm workspaces monorepo · tsx · tsup · self‑hosted variable font |

Shared **Zod schemas** in `packages/shared` are the single source of truth for form validation (web) and LLM‑output validation (worker) — no FE/BE drift.

---

## Repository structure

```
vedaai/
├── packages/shared/        # Zod schemas + shared types (the FE/BE contract)
├── apps/
│   ├── api/                # Express API + BullMQ worker + AI providers + PDF
│   │   ├── Dockerfile
│   │   └── src/
│   │       ├── server.ts       # process 1: HTTP + socket.io + QueueEvents bridge
│   │       ├── worker/         # process 2: BullMQ generation worker (+ health server)
│   │       ├── ai/             # provider interface, Gemini, Mock, prompt, parse, post‑process
│   │       ├── pdf/            # pdfkit paper renderer
│   │       ├── routes/  models/  queue/  ws/  db/  config/
│   └── web/                # Next.js app
│       ├── Dockerfile
│       └── src/
│           ├── app/            # routes: dashboard, /create, /assignments/[id], nav pages
│           ├── components/     # shell, create wizard, output (paper/versions/download)
│           ├── store/          # Zustand (jobs, assignments)
│           ├── lib/            # api client, socket client
│           └── fonts/          # self‑hosted Bricolage Grotesque (variable)
├── docker-compose.yml      # local Redis
├── DEPLOY.md               # Cloud Run deployment guide
└── .env.example
```

---

## Getting started (local)

### Prerequisites
- Node 20+ and npm
- Docker (for local Redis) — or any Redis instance
- A MongoDB connection string (MongoDB Atlas works great)
- A Google Gemini API key ([free key](https://aistudio.google.com/app/apikey)) — or run with the mock provider

### 1. Install
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Fill in `MONGODB_URI` and `GEMINI_API_KEY` (see the table below).

### 3. Start Redis
```bash
npm run redis:up        # docker compose up -d redis
```

### 4. Run everything
```bash
npm run dev             # api :4000 · worker :4100 · web :3000
```
Open **http://localhost:3000**. Or run pieces individually: `npm run dev:api`, `npm run dev:worker`, `npm run dev:web`.

### Type‑check
```bash
npm run typecheck       # all workspaces
```

---

## Environment variables

| Var | Description |
|-----|-------------|
| `MONGODB_URI` | Mongo/Atlas connection string — **include a db name**, e.g. `…mongodb.net/vedaai` |
| `REDIS_URL` | `redis://localhost:6379` locally; `rediss://…` for managed Redis |
| `LLM_PROVIDER` | `gemini` or `mock` |
| `GEMINI_API_KEY` | required when `LLM_PROVIDER=gemini` |
| `GEMINI_MODEL` | defaults to `gemini-3.1-flash-lite` |
| `PORT` / `WORKER_PORT` | API port (4000) / worker health port (4100) |
| `WEB_ORIGIN` | allowed CORS origin for the API |
| `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_WS_URL` | API + WS base for the web app |

`.env` is git‑ignored; never commit real credentials.

---

## API reference

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/assignments` | Validate, store, enqueue generation → `{ assignmentId, jobId }` |
| `GET` | `/api/assignments` | List assignments |
| `GET` | `/api/assignments/:id` | Assignment + all paper versions + job state |
| `POST` | `/api/assignments/:id/regenerate` | Generate a new version |
| `DELETE` | `/api/assignments/:id` | Delete an assignment and its papers |
| `DELETE` | `/api/assignments/:id/versions/:version` | Delete one version |
| `GET` | `/api/assignments/:id/pdf?version=&answerKey=` | Stream the paper as a PDF |
| `POST` | `/api/upload` | Extract text from a PDF/txt upload |
| `GET` | `/api/jobs/:id` | Job state (WebSocket fallback) |

**WebSocket** (socket.io): client emits `job:subscribe` with a `jobId`; server emits `job:status`, `job:completed`, `job:failed`.

---

## Deployment

Three Cloud Run services (web, api, worker) + MongoDB Atlas + managed Redis.
See **[DEPLOY.md](./DEPLOY.md)** for the full step‑by‑step guide, Dockerfiles, secrets, and per‑service environment configuration.

---

## License

Bricolage Grotesque is licensed under the SIL Open Font License (see the font archive).
