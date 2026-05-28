# VedaAI API + Worker image. Build context = repo root.
#   docker build -f apps/api/Dockerfile -t vedaai-api .
# The same image runs both processes; the worker service overrides the command:
#   API    → node dist/server.js   (default)
#   Worker → node dist/worker.js

# ---------- build ----------
FROM node:20-slim AS build
WORKDIR /app

# Install deps (cached on manifest changes)
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN npm install --workspaces --include-workspace-root

# Build (tsup bundles @vedaai/shared into dist/)
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build --workspace @vedaai/api

# ---------- runtime ----------
FROM node:20-slim AS runner
ENV NODE_ENV=production
WORKDIR /app/apps/api

# Bundled output + runtime assets (Bricolage fonts used by the PDF generator)
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/src/assets ./src/assets
# Hoisted workspace node_modules (express, mongoose, bullmq, pdfkit, …)
COPY --from=build /app/node_modules /app/node_modules

# Cloud Run injects PORT (8080). The server reads process.env.PORT.
EXPOSE 8080
CMD ["node", "dist/server.js"]
