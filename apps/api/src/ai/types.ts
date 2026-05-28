import type { CreateAssignmentInput } from "@vedaai/shared";

/** Minimal info the prompt builder needs from a stored assignment. */
export interface PaperRequest {
  subject?: string;
  grade?: string;
  schoolName?: string;
  timeAllowedMins?: number;
  spec: CreateAssignmentInput["spec"];
  additionalInstructions?: string;
  sourceText?: string;
}

export interface LLMProvider {
  readonly name: string;
  /**
   * Returns the model's structured JSON for the paper as a plain object.
   * It is NOT yet validated — generate.ts validates with Zod and may retry.
   * `repairNote` is appended when a previous attempt failed validation.
   */
  generatePaper(req: PaperRequest, repairNote?: string): Promise<unknown>;
}
