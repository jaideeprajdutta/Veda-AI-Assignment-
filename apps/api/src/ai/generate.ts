import { GeneratedPaperSchema, type QuestionPaper } from "@vedaai/shared";
import { getProvider } from "./index";
import { postProcess } from "./postprocess";
import type { PaperRequest } from "./types";

const MAX_ATTEMPTS = 2;

/**
 * Full generation pipeline: prompt → LLM → Zod validate → (retry once with
 * the validation error fed back) → post-process into a renderable paper.
 * Raw model text is never rendered; only validated, structured data leaves here.
 */
export async function generatePaper(
  req: PaperRequest
): Promise<{ paper: QuestionPaper; model: string; title: string }> {
  const provider = getProvider();
  let repairNote: string | undefined;
  let lastError = "unknown error";

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const raw = await provider.generatePaper(req, repairNote);
    const parsed = GeneratedPaperSchema.safeParse(raw);
    if (parsed.success) {
      return { paper: postProcess(parsed.data), model: provider.name, title: parsed.data.title };
    }
    lastError = parsed.error.issues
      .slice(0, 6)
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    repairNote = `Previous JSON failed validation: ${lastError}. Return corrected data via the tool.`;
  }

  throw new Error(`LLM output failed validation after ${MAX_ATTEMPTS} attempts: ${lastError}`);
}
