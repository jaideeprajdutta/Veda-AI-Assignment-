import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";
import {
  QUESTION_TYPES,
  DIFFICULTIES,
  type QuestionPaper as QuestionPaperShape,
} from "@vedaai/shared";

const PaperQuestionSchema = new Schema(
  {
    id: { type: String, required: true },
    number: { type: Number, required: true },
    text: { type: String, required: true },
    type: { type: String, enum: QUESTION_TYPES, required: true },
    difficulty: { type: String, enum: DIFFICULTIES, required: true },
    marks: { type: Number, required: true },
    options: { type: [String], default: undefined },
  },
  { _id: false }
);

const PaperSectionSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    instruction: { type: String, default: "" },
    questions: { type: [PaperQuestionSchema], required: true },
  },
  { _id: false }
);

const AnswerKeyItemSchema = new Schema(
  {
    questionId: { type: String, required: true },
    number: { type: Number, required: true },
    answer: { type: String, required: true },
  },
  { _id: false }
);

const QuestionPaperSchema = new Schema(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: "Assignment", required: true, index: true },
    version: { type: Number, default: 1, index: true },
    intro: { type: String, default: "" },
    header: {
      schoolName: { type: String, default: "" },
      subject: { type: String, default: "" },
      grade: { type: String, default: "" },
      timeAllowedMins: { type: Number, default: 45 },
      totalMarks: { type: Number, default: 0 },
      instructions: { type: String, default: "" },
    },
    sections: { type: [PaperSectionSchema], required: true },
    answerKey: { type: [AnswerKeyItemSchema], default: [] },
    totalMarks: { type: Number, default: 0 },
    model: { type: String },
    promptVersion: { type: String },
    /** sha256 of the generation inputs — enables reuse on identical requests. */
    inputHash: { type: String, index: true },
  },
  { timestamps: true }
);

export type QuestionPaperDoc = HydratedDocument<InferSchemaType<typeof QuestionPaperSchema>>;

export const QuestionPaper = model("QuestionPaper", QuestionPaperSchema);

/** Map a stored paper doc to the shared render-shape (drops db internals). */
export function paperToShape(doc: QuestionPaperDoc): QuestionPaperShape {
  const h = doc.header ?? ({} as NonNullable<QuestionPaperDoc["header"]>);
  return {
    intro: doc.intro,
    header: {
      schoolName: h.schoolName ?? "",
      subject: h.subject ?? "",
      grade: h.grade ?? "",
      timeAllowedMins: h.timeAllowedMins ?? 45,
      totalMarks: h.totalMarks ?? doc.totalMarks,
      instructions: h.instructions ?? "",
    },
    sections: doc.sections.map((s) => ({
      id: s.id,
      title: s.title,
      instruction: s.instruction ?? "",
      questions: s.questions.map((q) => ({
        id: q.id,
        number: q.number,
        text: q.text,
        type: q.type as QuestionPaperShape["sections"][number]["questions"][number]["type"],
        difficulty: q.difficulty as QuestionPaperShape["sections"][number]["questions"][number]["difficulty"],
        marks: q.marks,
        options: q.options && q.options.length ? q.options : undefined,
      })),
    })),
    answerKey: doc.answerKey.map((a) => ({
      questionId: a.questionId,
      number: a.number,
      answer: a.answer,
    })),
    totalMarks: doc.totalMarks,
  };
}
