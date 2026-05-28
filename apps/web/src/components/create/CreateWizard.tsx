"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  UploadCloud,
  Plus,
  Minus,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileCheck2,
  CalendarPlus,
  Mic,
  Sparkles,
} from "lucide-react";
import {
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  totalMarksOf,
  totalQuestionsOf,
  type CreateAssignmentInput,
} from "@vedaai/shared";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/form";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { FormSchema, DEFAULT_VALUES, type FormValues } from "./formSchema";

export function CreateWizard() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const [listening, setListening] = useState(false);

  const dateRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const baseTextRef = useRef(""); // text already in the box before dictation

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onBlur",
  });

  const { fields, append, remove } = useFieldArray({ control, name: "spec" });
  const spec = watch("spec");
  const fileName = watch("fileName");

  const safeSpec = (spec ?? []).filter(
    (r) => Number.isFinite(r.count) && Number.isFinite(r.marks)
  );
  const totalQ = totalQuestionsOf(safeSpec as never);
  const totalM = totalMarksOf(safeSpec as never);

  const dueDateReg = register("dueDate");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { sourceText } = await api.uploadFile(file);
      setValue("sourceText", sourceText);
      setValue("fileName", file.name);
    } catch {
      setValue("fileName", `${file.name} (couldn't extract text)`);
    } finally {
      setUploading(false);
    }
  }

  /** Write text to both the RHF field and the (uncontrolled) textarea DOM. */
  function writeInstructions(text: string) {
    setValue("additionalInstructions", text, { shouldDirty: true, shouldValidate: true });
    if (textareaRef.current) textareaRef.current.value = text;
  }

  function toggleMic() {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSubmitError("Speech-to-text isn't supported here. Use Chrome or Edge.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const rec = new SR();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    baseTextRef.current = (getValues("additionalInstructions") || "").trim();

    rec.onresult = (e: any) => {
      let finalText = "";
      let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += `${t} `;
        else interim += t;
      }
      const display = [baseTextRef.current, finalText.trim(), interim.trim()]
        .filter(Boolean)
        .join(" ")
        .trim();
      writeInstructions(display);
    };
    rec.onerror = (ev: any) => {
      setListening(false);
      if (ev?.error && ev.error !== "no-speech" && ev.error !== "aborted") {
        setSubmitError(`Microphone: ${ev.error}`);
      }
    };
    rec.onend = () => setListening(false);
    /* eslint-enable @typescript-eslint/no-explicit-any */

    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }

  async function onSubmit(v: FormValues) {
    setSubmitError(undefined);
    const input: CreateAssignmentInput = {
      title: v.assignmentName || undefined, // blank → AI names it
      dueDate: new Date(v.dueDate).toISOString(),
      spec: v.spec,
      additionalInstructions: v.additionalInstructions || undefined,
      sourceText: v.sourceText || undefined,
    };
    try {
      const { assignmentId } = await api.createAssignment(input);
      router.push(`/assignments/${assignmentId}`);
    } catch (e) {
      setSubmitError(
        e instanceof ApiError ? e.message : "Something went wrong. Is the API running?"
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-1 text-2xl font-extrabold leading-[1.2] tracking-tighter text-ink-strong">
        Create Assignment
      </div>
      <p className="mb-5 text-[16px] text-ink-soft/80">Set up a new assignment for your students.</p>

      {/* 2-segment progress (Figma): step 1 of 2 — details, then AI generation. */}
      <div className="mb-7 flex gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-pill bg-ink-strong" />
        <div className="h-1.5 flex-1 overflow-hidden rounded-pill bg-surface-fill" />
      </div>

      <div className="rounded-[28px] border border-surface-border bg-white p-6 shadow-card sm:p-8">
        <h2 className="text-[16px] font-bold text-ink-strong">Assignment Details</h2>
        <p className="mb-5 text-[14px] text-ink-soft/80">Basic information about your assignment</p>

        {/* Assignment name (optional → AI generates) */}
        <Field
          label="Assignment Name"
          hint="Leave blank and AI will name it for you."
          error={errors.assignmentName?.message}
          className="mb-5"
        >
          <Input placeholder="e.g. Quiz on Electricity (optional)" {...register("assignmentName")} />
        </Field>

        {/* Upload */}
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-surface-border bg-surface-page/60 px-4 py-9 text-center transition hover:border-brand/50">
          <input
            type="file"
            className="hidden"
            accept=".pdf,.txt,image/png,image/jpeg"
            onChange={handleFile}
          />
          {uploading ? (
            <Loader2 className="h-7 w-7 animate-spin text-brand" />
          ) : fileName ? (
            <FileCheck2 className="h-7 w-7 text-difficulty-easy" />
          ) : (
            <UploadCloud className="h-7 w-7 text-ink-muted" />
          )}
          <span className="text-[15px] text-ink">
            {fileName ?? "Choose a file or drag & drop it here"}
          </span>
          <span className="text-xs text-ink-muted">JPEG, PNG, PDF · upto 10MB</span>
          <span className="mt-1 rounded-pill bg-white px-4 py-1.5 text-sm font-medium text-ink shadow-sm ring-1 ring-surface-border">
            Browse Files
          </span>
        </label>
        <p className="mt-2 text-center text-xs text-ink-muted">
          Upload images of your preferred document/image
        </p>

        {/* Due date with working custom calendar icon */}
        <div className="mt-6">
          <Field label="Due Date" required error={errors.dueDate?.message}>
            <div className="relative">
              <input
                type="date"
                name={dueDateReg.name}
                onChange={dueDateReg.onChange}
                onBlur={dueDateReg.onBlur}
                ref={(el) => {
                  dueDateReg.ref(el);
                  dateRef.current = el;
                }}
                className="h-11 w-full rounded-xl border border-surface-border bg-white px-3.5 pr-11 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
              />
              <button
                type="button"
                onClick={() => dateRef.current?.showPicker?.()}
                className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-ink-muted hover:bg-surface-fill hover:text-ink"
                aria-label="Open calendar"
              >
                <CalendarPlus size={18} />
              </button>
            </div>
          </Field>
        </div>

        {/* Question types */}
        <div className="mt-6">
          <div className="mb-2 hidden grid-cols-[1fr_36px_120px_120px] items-center gap-3 sm:grid">
            <span className="text-[16px] font-bold text-ink-strong">Question Type</span>
            <span />
            <span className="text-center text-xs font-medium text-ink-muted">No. of Questions</span>
            <span className="text-center text-xs font-medium text-ink-muted">Marks</span>
          </div>

          <div className="flex flex-col gap-3">
            {fields.map((field, i) => (
              <div
                key={field.id}
                className="grid grid-cols-2 items-center gap-3 rounded-2xl bg-surface-page/50 p-3 sm:grid-cols-[1fr_36px_120px_120px] sm:bg-transparent sm:p-0"
              >
                <Select className="col-span-2 sm:col-span-1" {...register(`spec.${i}.type` as const)}>
                  {QUESTION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {QUESTION_TYPE_LABELS[t]}
                    </option>
                  ))}
                </Select>
                <button
                  type="button"
                  onClick={() => fields.length > 1 && remove(i)}
                  disabled={fields.length <= 1}
                  className="order-last hidden h-9 w-9 place-items-center rounded-card text-ink-muted hover:bg-surface-fill disabled:opacity-30 sm:grid sm:order-none"
                  aria-label="Remove row"
                >
                  <X size={16} />
                </button>
                <div>
                  <span className="mb-1 block text-[11px] font-medium text-ink-muted sm:hidden">
                    No. of Questions
                  </span>
                  <Stepper
                    error={errors.spec?.[i]?.count?.message}
                    value={spec?.[i]?.count}
                    onChange={(v) => setValue(`spec.${i}.count`, v, { shouldValidate: true })}
                    register={register(`spec.${i}.count` as const, { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <span className="mb-1 block text-[11px] font-medium text-ink-muted sm:hidden">
                    Marks
                  </span>
                  <Stepper
                    error={errors.spec?.[i]?.marks?.message}
                    value={spec?.[i]?.marks}
                    onChange={(v) => setValue(`spec.${i}.marks`, v, { shouldValidate: true })}
                    register={register(`spec.${i}.marks` as const, { valueAsNumber: true })}
                  />
                </div>
              </div>
            ))}
          </div>

          {typeof errors.spec?.message === "string" && (
            <span className="mt-2 block text-xs font-medium text-red-600">
              {errors.spec.message}
            </span>
          )}

          <button
            type="button"
            onClick={() => append({ type: "short", count: 5, marks: 2, difficulty: undefined })}
            className="mt-3 flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-ink"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-ink-strong text-white">
              <Plus size={15} />
            </span>
            Add Question Type
          </button>

          <div className="mt-4 flex flex-col items-end gap-0.5 text-sm">
            <span className="text-ink-soft">
              Total Questions : <strong className="text-ink-strong">{totalQ}</strong>
            </span>
            <span className="text-ink-soft">
              Total Marks : <strong className="text-ink-strong">{totalM}</strong>
            </span>
          </div>
        </div>

        {/* Additional info + mic */}
        <div className="mt-6">
          <label className="mb-1.5 block text-[16px] font-bold text-ink-strong">
            Additional Information{" "}
            <span className="font-normal text-ink-soft">(For better output)</span>
          </label>
          <div className="relative">
            {(() => {
              const reg = register("additionalInstructions");
              return (
                <textarea
                  name={reg.name}
                  onChange={reg.onChange}
                  onBlur={reg.onBlur}
                  ref={(el) => {
                    reg.ref(el);
                    textareaRef.current = el;
                  }}
                  placeholder="e.g Generate a question paper for CBSE Grade 8 Science, NCERT chapters…"
                  className="min-h-[96px] w-full resize-y rounded-2xl border border-surface-border bg-white px-3.5 py-2.5 pr-11 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                />
              );
            })()}
            <button
              type="button"
              onClick={toggleMic}
              className={cn(
                "absolute bottom-2.5 right-2.5 grid h-8 w-8 place-items-center rounded-full transition",
                listening
                  ? "animate-pulse bg-brand text-white"
                  : "text-ink-muted hover:bg-surface-fill hover:text-ink"
              )}
              aria-label="Dictate"
            >
              <Mic size={16} />
            </button>
          </div>
          {listening && <p className="mt-1 text-xs text-brand">Listening… speak now.</p>}
        </div>
      </div>

      {submitError && (
        <div className="mt-4 rounded-card border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <Button type="button" variant="white" onClick={() => router.push("/")}>
          <ChevronLeft size={18} /> Previous
        </Button>
        <Button type="submit" variant="dark" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles size={16} />}
          Generate with AI
        </Button>
      </div>
    </form>
  );
}

/** Numeric input with − / + steppers. */
function Stepper({
  value,
  onChange,
  error,
  register,
}: {
  value: number | undefined;
  onChange: (v: number) => void;
  error?: string;
  register: ReturnType<ReturnType<typeof useForm>["register"]>;
}) {
  const v = Number.isFinite(value) ? (value as number) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex h-11 items-center rounded-xl border border-surface-border bg-white">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, v - 1))}
          className="grid h-full w-9 place-items-center text-ink-soft hover:text-ink"
          aria-label="Decrease"
        >
          <Minus size={14} />
        </button>
        <input
          type="number"
          min={1}
          {...register}
          className="h-full w-full min-w-0 border-0 bg-transparent text-center text-sm outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => onChange(v + 1)}
          className="grid h-full w-9 place-items-center text-ink-soft hover:text-ink"
          aria-label="Increase"
        >
          <Plus size={14} />
        </button>
      </div>
      {error && <span className="text-[11px] font-medium text-red-600">{error}</span>}
    </div>
  );
}
