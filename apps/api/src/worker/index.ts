import { Worker } from "bullmq";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { connectMongo } from "../db/mongo";
import { createRedis } from "../db/redis";
import { QUEUE_GENERATION, PROGRESS, type GenerationJobData } from "../queue/queues";
import { patchJobState } from "../queue/jobState";
import { Assignment } from "../models/Assignment";
import { QuestionPaper, paperToShape } from "../models/QuestionPaper";
import { generatePaper } from "../ai/generate";
import type { PaperRequest } from "../ai/types";

async function processJob(jobId: string, data: GenerationJobData) {
  const { assignmentId } = data;

  await patchJobState(jobId, {
    assignmentId,
    status: "processing",
    progress: PROGRESS.processing,
    step: "Preparing assignment",
  });

  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw new Error(`Assignment ${assignmentId} not found`);
  await Assignment.findByIdAndUpdate(assignmentId, { status: "processing" });

  await patchJobState(jobId, {
    progress: PROGRESS.generating,
    step: "Generating questions with AI",
  });

  const req: PaperRequest = {
    subject: assignment.subject ?? undefined,
    grade: assignment.grade ?? undefined,
    schoolName: assignment.schoolName ?? undefined,
    timeAllowedMins: assignment.timeAllowedMins ?? undefined,
    spec: assignment.spec.map((s) => ({
      type: s.type as PaperRequest["spec"][number]["type"],
      count: s.count,
      marks: s.marks,
      difficulty: s.difficulty as PaperRequest["spec"][number]["difficulty"],
    })),
    additionalInstructions: assignment.additionalInstructions ?? undefined,
    sourceText: assignment.sourceText ?? undefined,
  };

  // Cache key over the inputs that affect generation.
  const inputHash = createHash("sha256")
    .update(JSON.stringify({ s: req.spec, i: req.additionalInstructions, t: req.sourceText, sub: req.subject, g: req.grade }))
    .digest("hex");

  let paper;
  let model: string;
  let genTitle: string | undefined;

  // Reuse an identical previously-generated paper (unless this is a regenerate).
  const cached = !data.regenerate
    ? await QuestionPaper.findOne({ inputHash }).sort({ createdAt: -1 })
    : null;

  if (cached) {
    paper = paperToShape(cached);
    model = `${cached.model ?? "unknown"} (cached)`;
  } else {
    const result = await generatePaper(req);
    paper = result.paper;
    model = result.model;
    genTitle = result.title;
  }

  await patchJobState(jobId, {
    progress: PROGRESS.storing,
    step: cached ? "Reusing cached paper" : "Formatting paper",
  });

  // Keep every generation as a new version (regenerate appends, never overwrites).
  const latest = await QuestionPaper.findOne({ assignmentId }).sort({ version: -1 });
  const version = (latest?.version ?? 0) + 1;
  await QuestionPaper.create({
    assignmentId,
    version,
    ...paper,
    model,
    promptVersion: "v1",
    inputHash,
  });
  // Set an AI-generated title if the teacher didn't name the assignment.
  const titleUpdate =
    !assignment.title && genTitle ? { title: genTitle } : {};
  await Assignment.findByIdAndUpdate(assignmentId, {
    status: "completed",
    ...titleUpdate,
  });

  await patchJobState(jobId, {
    status: "completed",
    progress: PROGRESS.completed,
    step: "Done",
  });

  return { assignmentId, jobId };
}

async function main() {
  await connectMongo();

  // Minimal health server so this can run as a Cloud Run service (it requires
  // an HTTP listener on $PORT). The worker itself is queue-driven.
  // Locally use WORKER_PORT to avoid clashing with the API's PORT; on Cloud Run
  // each service gets its own injected PORT.
  const port = Number(process.env.WORKER_PORT || process.env.PORT || 4100);
  createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, role: "worker" }));
  }).listen(port, () => console.log(`[worker] health server on :${port}`));

  const worker = new Worker<GenerationJobData>(
    QUEUE_GENERATION,
    async (job) => {
      const jobId = job.id as string;
      try {
        return await processJob(jobId, job.data);
      } catch (err) {
        // Write failed state BEFORE the job is marked failed, so the
        // QueueEvents bridge reads an accurate error (avoids a race).
        const message = err instanceof Error ? err.message : "Generation failed";
        await patchJobState(jobId, { status: "failed", error: message });
        await Assignment.findByIdAndUpdate(job.data.assignmentId, {
          status: "failed",
        }).catch(() => undefined);
        throw err;
      }
    },
    { connection: createRedis(), concurrency: 2 }
  );

  worker.on("ready", () => console.log("[worker] ready, waiting for jobs"));
  worker.on("completed", (job) => console.log(`[worker] completed ${job.id}`));
  worker.on("failed", (job, err) =>
    console.error(`[worker] failed ${job?.id}: ${err?.message}`)
  );

  const shutdown = async () => {
    console.log("[worker] shutting down");
    await worker.close();
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  console.error("[worker] fatal:", err);
  process.exit(1);
});
