import { z } from "zod";
import { QUESTION_TYPES, DIFFICULTIES } from "@vedaai/shared";

/**
 * UI form schema — mirrors the Figma "Assignment Details" screen exactly:
 * upload, due date, question-type rows, additional instructions.
 * Subject/class are inferred by the AI from the instructions/material.
 */
export const FormSchema = z.object({
  assignmentName: z.string().trim().max(120).optional(),
  dueDate: z
    .string()
    .min(1, "Pick a due date")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date")
    .refine((v) => Date.parse(v) > Date.now(), "Due date must be in the future"),
  additionalInstructions: z.string().trim().max(1000).optional(),
  sourceText: z.string().optional(),
  fileName: z.string().optional(),
  spec: z
    .array(
      z.object({
        type: z.enum(QUESTION_TYPES),
        count: z
          .number({ invalid_type_error: "Required" })
          .int("Whole number")
          .min(1, "≥ 1")
          .max(50, "Max 50"),
        marks: z
          .number({ invalid_type_error: "Required" })
          .int("Whole number")
          .min(1, "≥ 1")
          .max(100, "Max 100"),
        difficulty: z.enum(DIFFICULTIES).optional(),
      })
    )
    .min(1, "Add at least one question type"),
});

export type FormValues = z.infer<typeof FormSchema>;

export const DEFAULT_VALUES: FormValues = {
  assignmentName: "",
  dueDate: "",
  additionalInstructions: "",
  sourceText: undefined,
  fileName: undefined,
  spec: [
    { type: "mcq", count: 5, marks: 1, difficulty: undefined },
    { type: "short", count: 3, marks: 2, difficulty: undefined },
  ],
};
