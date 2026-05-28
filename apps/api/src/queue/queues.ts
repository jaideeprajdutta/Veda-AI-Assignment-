import { Queue } from "bullmq";
import { createRedis } from "../db/redis";

export const QUEUE_GENERATION = "generation";

export interface GenerationJobData {
  assignmentId: string;
  regenerate?: boolean;
}

/** Producer-side queue handle (used by the API to enqueue jobs). */
export const generationQueue = new Queue<GenerationJobData>(QUEUE_GENERATION, {
  connection: createRedis(),
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

/** Progress checkpoints emitted during a generation job. */
export const PROGRESS = {
  queued: 0,
  processing: 10,
  generating: 40,
  parsing: 80,
  storing: 90,
  completed: 100,
} as const;
