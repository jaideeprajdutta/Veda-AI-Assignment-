import { nanoid } from "nanoid";
import {
  QuestionPaperSchema,
  type GeneratedPaper,
  type QuestionPaper,
  type AnswerKeyItem,
} from "@vedaai/shared";

/**
 * Turn the validated LLM output into the stored/rendered paper:
 *  - assign sequential question numbers + stable ids
 *  - lift each question's answer into a separate Answer Key
 *  - compute total marks
 * Re-validated against QuestionPaperSchema before returning (defensive).
 */
export function postProcess(gen: GeneratedPaper): QuestionPaper {
  let number = 0;
  const answerKey: AnswerKeyItem[] = [];

  const sections = gen.sections.map((s) => {
    const questions = s.questions.map((q) => {
      number += 1;
      const id = nanoid(8);
      answerKey.push({ questionId: id, number, answer: q.answer });
      return {
        id,
        number,
        text: q.text,
        type: q.type,
        difficulty: q.difficulty,
        marks: q.marks,
        options: q.options && q.options.length ? q.options : undefined,
      };
    });
    return {
      id: nanoid(6),
      title: s.title,
      instruction: s.instruction,
      questions,
    };
  });

  const totalMarks = sections.reduce(
    (sum, s) => sum + s.questions.reduce((a, q) => a + q.marks, 0),
    0
  );

  const paper: QuestionPaper = {
    intro: gen.intro,
    header: {
      ...gen.header,
      schoolName: gen.header.schoolName || "Delhi Public School, Sector-4, Bokaro",
      totalMarks,
    },
    sections,
    answerKey,
    totalMarks,
  };

  return QuestionPaperSchema.parse(paper);
}
