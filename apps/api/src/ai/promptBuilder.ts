import { QUESTION_TYPE_LABELS, totalMarksOf, totalQuestionsOf } from "@vedaai/shared";
import type { PaperRequest } from "./types";

export const SYSTEM_PROMPT = `You are an expert school examination paper setter.
You create clean, well-structured question papers for school teachers.

Rules:
- Produce EXACTLY the number of questions requested for each question type — no more, no fewer.
- Create one section per question type, in the order given. Title sections "Section A", "Section B", ... and append the question-type name (e.g. "Section A — Multiple Choice Questions").
- Every question's "marks" must equal the marks-per-question requested for that type.
- Spread difficulty sensibly across the requested level(s).
- For "mcq" questions, provide exactly 4 plausible "options" and set "answer" to the correct option text.
- For "diagram" questions, describe clearly what the student must draw/label (you cannot draw images).
- For "numerical" questions, ensure problems are solvable; "answer" should show the final result.
- Keep question wording age-appropriate for the given grade and subject.
- If the subject or class/grade are not explicitly provided, INFER them from the teacher's additional instructions or the source material. Always fill header.subject and header.grade — never leave them blank.
- header.grade MUST be ONLY the class as an ordinal number — e.g. "5th", "8th", "10th", "12th". Never include words like "Grade", "Class", "CBSE", or "Standard". (So "Grade 9" → "9th".)
- Set header.timeAllowedMins to a sensible exam duration for the total marks if not specified.
- Write a concise, specific assignment "title" (3-6 words) for organisation, e.g. "Quiz on Electricity" or "Photosynthesis Assessment" — derived from the actual topic. Never use generic names like "Untitled".
- Write "intro" as one friendly sentence addressed to the teacher (e.g. "Certainly! Here is your customized Science question paper for Class 8.").
- Always include a concise "answer" for every question (used to build an answer key).
- Return ONLY via the provided tool. Do not include markdown or commentary.`;

/** School shown on the paper header when none is provided (matches Figma). */
const DEFAULT_SCHOOL = "Delhi Public School, Sector-4, Bokaro";

export function buildUserPrompt(req: PaperRequest): string {
  const lines: string[] = [];
  lines.push("Create a question paper with the following specification.");
  lines.push("");
  lines.push(`School: ${req.schoolName || DEFAULT_SCHOOL}`);
  if (req.subject) lines.push(`Subject: ${req.subject}`);
  else lines.push("Subject: (infer from instructions / source material)");
  if (req.grade) lines.push(`Class/Grade: ${req.grade}`);
  else lines.push("Class/Grade: (infer from instructions / source material)");
  if (req.timeAllowedMins) lines.push(`Time allowed (minutes): ${req.timeAllowedMins}`);
  lines.push("");
  lines.push("Question breakdown (each row = one section):");
  req.spec.forEach((row, i) => {
    const diff = row.difficulty ? `, difficulty: ${row.difficulty}` : ", mixed difficulty";
    lines.push(
      `  ${i + 1}. ${QUESTION_TYPE_LABELS[row.type]} — ${row.count} question(s), ${row.marks} mark(s) each${diff}`
    );
  });
  lines.push("");
  lines.push(
    `Totals to match: ${totalQuestionsOf(req.spec)} questions, ${totalMarksOf(req.spec)} marks.`
  );
  if (req.additionalInstructions) {
    lines.push("");
    lines.push(`Additional instructions from the teacher: ${req.additionalInstructions}`);
  }
  if (req.sourceText && req.sourceText.trim()) {
    lines.push("");
    lines.push("Base the questions on this source material:");
    lines.push('"""');
    lines.push(req.sourceText.slice(0, 8000));
    lines.push('"""');
  }
  return lines.join("\n");
}
