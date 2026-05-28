import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";
import {
  QUESTION_TYPES,
  DIFFICULTIES,
  JOB_STATUSES,
  type AssignmentDTO,
} from "@vedaai/shared";

const SpecRowSchema = new Schema(
  {
    type: { type: String, enum: QUESTION_TYPES, required: true },
    count: { type: Number, required: true, min: 1 },
    marks: { type: Number, required: true, min: 1 },
    difficulty: { type: String, enum: DIFFICULTIES, required: false },
  },
  { _id: false }
);

const AssignmentSchema = new Schema(
  {
    title: { type: String },
    subject: { type: String },
    grade: { type: String },
    schoolName: { type: String },
    timeAllowedMins: { type: Number },
    sourceText: { type: String },
    dueDate: { type: Date, required: true },
    spec: { type: [SpecRowSchema], required: true },
    additionalInstructions: { type: String },
    status: { type: String, enum: JOB_STATUSES, default: "queued" },
    jobId: { type: String },
  },
  { timestamps: true }
);

export type AssignmentDoc = HydratedDocument<InferSchemaType<typeof AssignmentSchema>>;

export const Assignment = model("Assignment", AssignmentSchema);

export function assignmentToDTO(doc: AssignmentDoc): AssignmentDTO {
  return {
    id: doc.id,
    title: doc.title ?? undefined,
    subject: doc.subject ?? undefined,
    grade: doc.grade ?? undefined,
    schoolName: doc.schoolName ?? undefined,
    timeAllowedMins: doc.timeAllowedMins ?? undefined,
    dueDate: doc.dueDate.toISOString(),
    spec: doc.spec.map((s) => ({
      type: s.type as AssignmentDTO["spec"][number]["type"],
      count: s.count,
      marks: s.marks,
      difficulty: s.difficulty as AssignmentDTO["spec"][number]["difficulty"],
    })),
    additionalInstructions: doc.additionalInstructions ?? undefined,
    status: doc.status as AssignmentDTO["status"],
    jobId: doc.jobId ?? undefined,
    createdAt: (doc.createdAt as Date).toISOString(),
  };
}
