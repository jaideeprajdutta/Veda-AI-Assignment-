import { QUESTION_TYPE_LABELS, type QuestionType } from "@vedaai/shared";
import type { LLMProvider, PaperRequest } from "./types";

const LETTERS = "ABCDEFGH";
const DIFF_CYCLE = ["easy", "medium", "hard"] as const;

function sampleQuestion(type: QuestionType, subject: string, n: number) {
  switch (type) {
    case "mcq":
      return {
        text: `Which of the following best relates to ${subject} concept #${n}?`,
        options: [`Option A${n}`, `Option B${n}`, `Option C${n}`, `Option D${n}`],
        answer: `Option B${n}`,
      };
    case "numerical":
      return {
        text: `Calculate the value for ${subject} problem #${n} given the standard parameters.`,
        answer: `${n * 6} (worked solution applies the relevant formula).`,
      };
    case "diagram":
      return {
        text: `Draw and label a clear diagram illustrating ${subject} concept #${n}.`,
        answer: `A correctly labelled diagram of ${subject} concept #${n}.`,
      };
    case "short":
    default:
      return {
        text: `Explain in two or three sentences the key idea behind ${subject} topic #${n}.`,
        answer: `A concise explanation covering the main points of topic #${n}.`,
      };
  }
}

/** Offline provider — returns a valid, correctly-shaped paper with no API key. */
export class MockProvider implements LLMProvider {
  readonly name = "mock";

  async generatePaper(req: PaperRequest): Promise<unknown> {
    const subject = req.subject || "the subject";
    let counter = 0;

    const sections = req.spec.map((row, i) => {
      const questions = Array.from({ length: row.count }).map(() => {
        counter += 1;
        const q = sampleQuestion(row.type, subject, counter);
        return {
          ...q,
          type: row.type,
          difficulty: row.difficulty ?? DIFF_CYCLE[counter % DIFF_CYCLE.length],
          marks: row.marks,
        };
      });
      return {
        title: `Section ${LETTERS[i] ?? i + 1} — ${QUESTION_TYPE_LABELS[row.type]}`,
        instruction: `Attempt all questions. Each question carries ${row.marks} mark(s).`,
        questions,
      };
    });

    return {
      title: `${subject[0]?.toUpperCase()}${subject.slice(1)} Assessment`,
      intro: `Here is your customized ${subject} question paper${
        req.grade ? ` for ${req.grade}` : ""
      }.`,
      header: {
        schoolName: req.schoolName ?? "",
        subject,
        grade: req.grade ?? "",
        timeAllowedMins: req.timeAllowedMins ?? 45,
        instructions: "All questions are compulsory unless stated otherwise.",
      },
      sections,
    };
  }
}
