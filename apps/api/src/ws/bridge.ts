import { QueueEvents } from "bullmq";
import { WS_EVENTS } from "@vedaai/shared";
import { QUEUE_GENERATION } from "../queue/queues";
import { getJobState } from "../queue/jobState";
import { createRedis } from "../db/redis";
import { getIo } from "./io";

/**
 * Bridges BullMQ job lifecycle (read from Redis by the API process) to
 * socket.io rooms. The worker is the single writer of job state in Redis;
 * here we just read it and fan out to the right room. The worker never
 * touches sockets — clean process separation.
 */
export function startGenerationBridge(): QueueEvents {
  const qe = new QueueEvents(QUEUE_GENERATION, { connection: createRedis() });

  qe.on("progress", async ({ jobId }) => {
    const st = await getJobState(jobId);
    if (st) getIo().to(jobId).emit(WS_EVENTS.STATUS, st);
  });

  qe.on("completed", async ({ jobId }) => {
    const st = await getJobState(jobId);
    if (st) {
      getIo().to(jobId).emit(WS_EVENTS.STATUS, st);
      getIo()
        .to(jobId)
        .emit(WS_EVENTS.COMPLETED, { jobId, assignmentId: st.assignmentId });
    }
  });

  qe.on("failed", async ({ jobId }) => {
    const st = await getJobState(jobId);
    getIo()
      .to(jobId)
      .emit(WS_EVENTS.FAILED, {
        jobId,
        assignmentId: st?.assignmentId ?? "",
        error: st?.error ?? "Generation failed",
      });
  });

  console.log("[ws] generation bridge started");
  return qe;
}
