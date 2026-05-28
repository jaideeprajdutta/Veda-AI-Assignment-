import { z } from "zod";

/* ============================================================
 * Enums + labels
 * ========================================================== */

export const QUESTION_TYPES = ["mcq", "short", "diagram", "numerical"] as const;
export const QuestionTypeSchema = z.enum(QUESTION_TYPES);
export type QuestionType = z.infer<typeof QuestionTypeSchema>;

/** Figma-facing labels for each question type. */
export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  mcq: "Multiple Choice Questions",
  short: "Short Questions",
  diagram: "Diagram/Graph-Based Questions",
  numerical: "Numerical Problems",
};

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export const DifficultySchema = z.enum(DIFFICULTIES);
export type Difficulty = z.infer<typeof DifficultySchema>;

/** Display label for difficulty (Figma: Easy / Moderate / Challenging). */
export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Moderate",
  hard: "Challenging",
};

/* ============================================================
 * 1) Create form input  (validated on FE + BE)
 * ========================================================== */

export const SpecRowSchema = z.object({
  type: QuestionTypeSchema,
  count: z
    .number({ invalid_type_error: "Required" })
    .int("Whole number")
    .min(1, "At least 1")
    .max(50, "Max 50"),
  marks: z
    .number({ invalid_type_error: "Required" })
    .int("Whole number")
    .min(1, "Marks must be ≥ 1")
    .max(100, "Max 100"),
  difficulty: DifficultySchema.optional(),
});
export type SpecRow = z.infer<typeof SpecRowSchema>;

export const CreateAssignmentSchema = z.object({
  title: z.string().trim().min(1, "Required").max(120).optional(),
  subject: z.string().trim().max(80).optional(),
  grade: z.string().trim().max(40).optional(),
  schoolName: z.string().trim().max(120).optional(),
  timeAllowedMins: z.number().int().min(1).max(600).optional(),
  /** ISO date string; must parse and be in the future. */
  dueDate: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date")
    .refine((v) => Date.parse(v) > Date.now(), "Due date must be in the future"),
  spec: z.array(SpecRowSchema).min(1, "Add at least one question type"),
  additionalInstructions: z.string().trim().max(1000).optional(),
  /** Text extracted from an uploaded PDF/txt (optional). */
  sourceText: z.string().max(20000).optional(),
});
export type CreateAssignmentInput = z.infer<typeof CreateAssignmentSchema>;

/** Sum of count*marks across spec rows — used for the live "Total Marks". */
export function totalMarksOf(spec: SpecRow[]): number {
  return spec.reduce((sum, r) => sum + r.count * r.marks, 0);
}
export function totalQuestionsOf(spec: SpecRow[]): number {
  return spec.reduce((sum, r) => sum + r.count, 0);
}

/* ============================================================
 * 2) LLM output contract  (what the model must return)
 *    Kept loose-but-typed; post-processed into QuestionPaper.
 * ========================================================== */

export const GeneratedQuestionSchema = z.object({
  text: z.string().min(1),
  type: QuestionTypeSchema,
  difficulty: DifficultySchema,
  marks: z.number().int().min(1),
  /** Only for mcq. */
  options: z.array(z.string()).optional(),
  /** Correct answer / model solution — moved into the Answer Key on post-process. */
  answer: z.string().min(1),
});
export type GeneratedQuestion = z.infer<typeof GeneratedQuestionSchema>;

export const GeneratedSectionSchema = z.object({
  title: z.string().min(1),
  instruction: z.string().default(""),
  questions: z.array(GeneratedQuestionSchema).min(1),
});

export const GeneratedPaperSchema = z.object({
  /** Concise assignment title for organization, e.g. "Quiz on Electricity". */
  title: z.string().min(1),
  /** Short, friendly banner line shown above the paper. */
  intro: z.string().min(1),
  header: z.object({
    schoolName: z.string().default(""),
    subject: z.string().default(""),
    grade: z.string().default(""),
    timeAllowedMins: z.number().int().min(1).default(45),
    instructions: z
      .string()
      .default("All questions are compulsory unless stated otherwise."),
  }),
  sections: z.array(GeneratedSectionSchema).min(1),
});
export type GeneratedPaper = z.infer<typeof GeneratedPaperSchema>;

/* ============================================================
 * 3) Stored / rendered Question Paper  (post-processed)
 * ========================================================== */

export const PaperQuestionSchema = z.object({
  id: z.string(),
  number: z.number().int(),
  text: z.string(),
  type: QuestionTypeSchema,
  difficulty: DifficultySchema,
  marks: z.number().int(),
  options: z.array(z.string()).optional(),
});
export type PaperQuestion = z.infer<typeof PaperQuestionSchema>;

export const PaperSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  instruction: z.string(),
  questions: z.array(PaperQuestionSchema),
});
export type PaperSection = z.infer<typeof PaperSectionSchema>;

export const AnswerKeyItemSchema = z.object({
  questionId: z.string(),
  number: z.number().int(),
  answer: z.string(),
});
export type AnswerKeyItem = z.infer<typeof AnswerKeyItemSchema>;

export const QuestionPaperSchema = z.object({
  intro: z.string(),
  header: z.object({
    schoolName: z.string(),
    subject: z.string(),
    grade: z.string(),
    timeAllowedMins: z.number().int(),
    totalMarks: z.number().int(),
    instructions: z.string(),
  }),
  sections: z.array(PaperSectionSchema),
  answerKey: z.array(AnswerKeyItemSchema),
  totalMarks: z.number().int(),
});
export type QuestionPaper = z.infer<typeof QuestionPaperSchema>;

/* ============================================================
 * 4) Jobs + WebSocket contract
 * ========================================================== */

export const JOB_STATUSES = ["queued", "processing", "completed", "failed"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export interface JobState {
  jobId: string;
  assignmentId: string;
  status: JobStatus;
  progress: number; // 0..100
  step?: string;
  error?: string;
}

/** socket.io event names — shared so FE/BE never drift. */
export const WS_EVENTS = {
  /** client -> server: join the room for a job */
  SUBSCRIBE: "job:subscribe",
  /** server -> client: progress tick */
  STATUS: "job:status",
  /** server -> client: paper ready */
  COMPLETED: "job:completed",
  /** server -> client: generation failed */
  FAILED: "job:failed",
} as const;

export interface JobStatusEvent {
  jobId: string;
  assignmentId: string;
  status: JobStatus;
  progress: number;
  step?: string;
}
export interface JobCompletedEvent {
  jobId: string;
  assignmentId: string;
}
export interface JobFailedEvent {
  jobId: string;
  assignmentId: string;
  error: string;
}

/* ============================================================
 * 5) API response shapes
 * ========================================================== */

export interface AssignmentDTO {
  id: string;
  title?: string;
  subject?: string;
  grade?: string;
  schoolName?: string;
  timeAllowedMins?: number;
  dueDate: string;
  spec: SpecRow[];
  additionalInstructions?: string;
  status: JobStatus;
  jobId?: string;
  createdAt: string;
}

export interface CreateAssignmentResponse {
  assignmentId: string;
  jobId: string;
}

export interface PaperVersion {
  version: number;
  createdAt: string;
  model?: string;
  paper: QuestionPaper;
}

export interface AssignmentDetailResponse {
  assignment: AssignmentDTO;
  /** Latest version's paper (null until first generation completes). */
  paper: QuestionPaper | null;
  /** All generated versions, newest first. */
  versions: PaperVersion[];
  job: JobState | null;
}
