import { cacheRedis } from "../db/redis";
import type { JobState } from "@vedaai/shared";

const TTL_SECONDS = 60 * 60 * 24; // 1 day
const key = (jobId: string) => `job:${jobId}`;

export async function setJobState(state: JobState): Promise<JobState> {
  await cacheRedis.set(key(state.jobId), JSON.stringify(state), "EX", TTL_SECONDS);
  return state;
}

export async function getJobState(jobId: string): Promise<JobState | null> {
  const raw = await cacheRedis.get(key(jobId));
  return raw ? (JSON.parse(raw) as JobState) : null;
}

export async function patchJobState(
  jobId: string,
  patch: Partial<JobState>
): Promise<JobState> {
  const current =
    (await getJobState(jobId)) ??
    ({ jobId, assignmentId: "", status: "queued", progress: 0 } as JobState);
  const next: JobState = { ...current, ...patch, jobId };
  return setJobState(next);
}
