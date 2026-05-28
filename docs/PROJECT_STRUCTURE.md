# VedaAI Project Structure

This repository is a small monorepo with a clear separation between **frontend**, **backend**, and shared contracts.

## Top level

- `apps/`
  - `api/`: Express + socket.io + BullMQ worker (generation + PDF)
  - `web/`: Next.js frontend (assignment creation + paper viewer)
- `packages/shared/`: Zod schemas + shared types used by both web and api
- `docker-compose.yml`: local Redis for development
- `DEPLOY.md`: deployment guide (Cloud Run / Google Cloud)
- `cloudbuild-*.yaml`: Cloud Build configs for api/worker and web
- `README.md`: user-facing overview

## Backend (`apps/api/src`)

- `server.ts`: HTTP API + socket.io server + QueueEvents bridge starter
- `worker/`: BullMQ worker entrypoint + health server
- `routes/`: Express routes (assignments, upload, PDF streaming)
- `ai/`: prompt building + LLM provider + JSON parsing + post-processing
- `queue/`: BullMQ queue + job state helpers
- `ws/`: websocket helpers + BullMQ lifecycle bridge logic
- `db/`: MongoDB + Redis clients
- `models/`: Mongo models and DTO mapping
- `pdf/`: pdfkit paper rendering

## Frontend (`apps/web/src`)

- `app/`: Next.js routes (create, assignments, library, settings, etc.)
- `components/`: UI components (shell, create wizard, paper view, versions)
- `store/`: Zustand stores (assignments + job state)
- `lib/`: API + websocket client helpers

## Why this matters

The UI never renders raw LLM text. The worker validates structured output via shared Zod schemas, stores the result in MongoDB, and only then the frontend displays it.

