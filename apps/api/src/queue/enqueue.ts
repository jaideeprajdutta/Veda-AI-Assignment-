import { generationQueue } from "./queues";
import { setJobState } from "./jobState";
import { Assignment } from "../models/Assignment";

/** Add a generation job, mark the assignment queued, and seed job state. */
export async function enqueueGeneration(
  assignmentId: string,
  regenerate = false
): Promise<string> {
  const job = await generationQueue.add("generate", { assignmentId, regenerate });
  const jobId = job.id as string;
  await Assignment.findByIdAndUpdate(assignmentId, { status: "queued", jobId });
  await setJobState({
    jobId,
    assignmentId,
    status: "queued",
    progress: 0,
    step: "Queued",
  });
  return jobId;
}
