# Deploying VedaAI to Google Cloud Run

This guide deploys the three services — **web**, **api**, **worker** — to Cloud Run,
backed by **MongoDB Atlas** and **Redis**. Everything here is copy‑pasteable; replace the
`<PLACEHOLDERS>`.

```
┌── Cloud Run ───────────────────────────────────────────────┐
│  web (Next.js)  ──HTTP──▶  api (Express + socket.io)        │
│        ▲ WS ──────────────────────┘   │ enqueue / QueueEvents│
│                                       ▼                      │
│                                   Redis (BullMQ + cache + WS)│
│                                       ▲ process              │
│                                   worker (BullMQ + PDF)      │
└───────────────────────────────────────────────────────────┘
            MongoDB Atlas  ◀── api + worker
```

> **Why a worker service?** Generation is async. The worker is a long‑running BullMQ
> consumer; it ships with a tiny health server so Cloud Run (which requires an HTTP
> listener) keeps it warm. Run it with `min-instances=1` and CPU always allocated.

---

## 0. Prerequisites

- A GCP project with billing enabled.
- `gcloud` CLI installed and authenticated: `gcloud auth login`.
- MongoDB Atlas cluster (you already have one).
- A Redis instance reachable over the network (see step 2).

```bash
export PROJECT_ID=<your-gcp-project-id>
export REGION=asia-south1            # or your preferred region
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com
```

---

## 1. MongoDB Atlas

- **Network access:** add `0.0.0.0/0` (Cloud Run has dynamic egress IPs) *or* set up
  Private Service Connect. For a demo, `0.0.0.0/0` + a strong DB password is fine.
- Copy your SRV string and **include the database name** `…mongodb.net/vedaai?...`.

---

## 2. Redis

Pick one:

**Option A — Upstash (simplest, public TLS).** Create a database at upstash.com and copy the
`rediss://default:<password>@<host>:<port>` URL. No VPC needed.

**Option B — Memorystore (GCP‑native).** Needs a Serverless VPC connector:
```bash
gcloud redis instances create vedaai-redis --size=1 --region=$REGION --redis-version=redis_7_0
gcloud compute networks vpc-access connectors create vedaai-conn \
  --region=$REGION --range=10.8.0.0/28
# Use the connector's REDIS host:6379 as REDIS_URL and add --vpc-connector vedaai-conn
# (and --vpc-egress private-ranges-only) to the api + worker deploy commands.
```

---

## 3. Artifact Registry (image repo)

```bash
gcloud artifacts repositories create vedaai \
  --repository-format=docker --location=$REGION
export REPO=$REGION-docker.pkg.dev/$PROJECT_ID/vedaai
```

---

## 4. Secrets (Secret Manager)

```bash
printf '%s' 'mongodb+srv://USER:PASS@cluster1.xxxx.mongodb.net/vedaai?retryWrites=true&w=majority' \
  | gcloud secrets create MONGODB_URI --data-file=-
printf '%s' 'rediss://default:PASS@host:port' | gcloud secrets create REDIS_URL --data-file=-
printf '%s' 'YOUR_GEMINI_API_KEY' | gcloud secrets create GEMINI_API_KEY --data-file=-

# Let Cloud Run's runtime service account read them
export SA="$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')-compute@developer.gserviceaccount.com"
for S in MONGODB_URI REDIS_URL GEMINI_API_KEY; do
  gcloud secrets add-iam-policy-binding $S \
    --member="serviceAccount:$SA" --role="roles/secretmanager.secretAccessor"
done
```

---

## 5. Build & push images (Cloud Build)

```bash
# API + Worker share one image
gcloud builds submit --tag $REPO/api:latest -f apps/api/Dockerfile .

# Web — NEXT_PUBLIC_* are baked at build time, so the API URL must be known first.
# Deploy the api once (step 6) to get its URL, then build web with it.
```

---

## 6. Deploy the API

```bash
gcloud run deploy vedaai-api \
  --image $REPO/api:latest \
  --region $REGION --platform managed --allow-unauthenticated \
  --min-instances 1 --session-affinity \
  --set-env-vars LLM_PROVIDER=gemini,GEMINI_MODEL=gemini-3.1-flash-lite \
  --set-secrets MONGODB_URI=MONGODB_URI:latest,REDIS_URL=REDIS_URL:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest
# (Memorystore: add --vpc-connector vedaai-conn --vpc-egress private-ranges-only)

export API_URL=$(gcloud run services describe vedaai-api --region $REGION --format='value(status.url)')
echo "API: $API_URL"
```

`--session-affinity` keeps WebSocket clients pinned; `--min-instances 1` keeps the
`QueueEvents` → WS bridge warm.

---

## 7. Deploy the Worker

Same image, but run the worker entrypoint and stay always‑on:

```bash
gcloud run deploy vedaai-worker \
  --image $REPO/api:latest \
  --region $REGION --platform managed --no-allow-unauthenticated \
  --min-instances 1 --no-cpu-throttling --memory 1Gi \
  --command node --args dist/worker.js \
  --set-env-vars LLM_PROVIDER=gemini,GEMINI_MODEL=gemini-3.1-flash-lite \
  --set-secrets MONGODB_URI=MONGODB_URI:latest,REDIS_URL=REDIS_URL:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest
# (Memorystore: add --vpc-connector vedaai-conn --vpc-egress private-ranges-only)
```

`--no-cpu-throttling` keeps the queue consumer processing between requests; `--memory 1Gi`
gives pdfkit headroom.

---

## 8. Build & deploy the Web

```bash
gcloud builds submit \
  --substitutions=_API_URL=$API_URL \
  --config - . <<'YAML'
steps:
  - name: gcr.io/cloud-builders/docker
    args: ['build','-f','apps/web/Dockerfile',
           '--build-arg','NEXT_PUBLIC_API_URL=${_API_URL}',
           '--build-arg','NEXT_PUBLIC_WS_URL=${_API_URL}',
           '-t','${_REPO}/web:latest','.']
images: ['${_REPO}/web:latest']
substitutions:
  _REPO: REPLACE_WITH_$REPO
YAML
# Simpler: build locally and push, then:
gcloud run deploy vedaai-web \
  --image $REPO/web:latest \
  --region $REGION --platform managed --allow-unauthenticated --min-instances 0

export WEB_URL=$(gcloud run services describe vedaai-web --region $REGION --format='value(status.url)')
```

> Tip: the simplest reliable path for web is to build the image with Docker locally
> (`docker build -f apps/web/Dockerfile --build-arg NEXT_PUBLIC_API_URL=$API_URL --build-arg NEXT_PUBLIC_WS_URL=$API_URL -t $REPO/web:latest .`),
> `docker push $REPO/web:latest`, then `gcloud run deploy`.

---

## 9. Wire CORS

Point the API's allowed origin at the web URL and redeploy env only:

```bash
gcloud run services update vedaai-api --region $REGION \
  --update-env-vars WEB_ORIGIN=$WEB_URL
```

---

## 10. Environment variables per service

| Var | web | api | worker | Source |
|-----|:--:|:--:|:--:|--------|
| `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_WS_URL` | ✅ (build arg) | – | – | the api URL |
| `MONGODB_URI` | – | ✅ | ✅ | Secret |
| `REDIS_URL` | – | ✅ | ✅ | Secret |
| `GEMINI_API_KEY` | – | ✅ | ✅ | Secret |
| `LLM_PROVIDER` (`gemini`) | – | ✅ | ✅ | env |
| `GEMINI_MODEL` | – | ✅ | ✅ | env |
| `WEB_ORIGIN` | – | ✅ | – | the web URL |
| `PORT` | auto | auto | auto | Cloud Run injects |

---

## 11. Verify

```bash
curl $API_URL/health          # {"ok":true}
open $WEB_URL                 # create an assignment end-to-end
```

If generation never completes, check the worker logs:
```bash
gcloud run services logs read vedaai-worker --region $REGION --limit 50
```

---

## Local development (for reference)

```bash
cp .env.example .env      # fill MONGODB_URI + GEMINI_API_KEY
npm install
npm run redis:up          # docker compose up -d redis
npm run dev               # api :4000 · worker :4100 · web :3000
```
