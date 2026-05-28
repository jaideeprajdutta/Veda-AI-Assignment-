import {
  DIFFICULTY_LABELS,
  type Difficulty,
  type QuestionPaper,
  type PaperQuestion,
  type PaperSection,
} from "@vedaai/shared";
import { cn } from "@/lib/utils";

const DIFF_COLOR: Record<Difficulty, string> = {
  easy: "text-difficulty-easy",
  medium: "text-difficulty-moderate",
  hard: "text-difficulty-hard",
};

function DottedLine({ className }: { className?: string }) {
  return <span className={cn("inline-block border-b border-dotted border-ink-muted align-middle", className)} />;
}

function PaperHeader({ header }: { header: QuestionPaper["header"] }) {
  return (
    <header className="text-center">
      <h1 className="text-[20px] font-bold tracking-tighter text-ink-strong">
        {header.schoolName || "Question Paper"}
      </h1>
      {header.subject && <p className="mt-1 text-[15px] text-ink">Subject: {header.subject}</p>}
      {header.grade && <p className="text-[15px] text-ink">Class: {header.grade}</p>}

      <div className="mt-4 flex items-center justify-between text-[14px] text-ink">
        <span>Time Allowed: {header.timeAllowedMins} minutes</span>
        <span>Maximum Marks: {header.totalMarks}</span>
      </div>
      {header.instructions && (
        <p className="mt-2 text-left text-[14px] text-ink-soft">{header.instructions}</p>
      )}
    </header>
  );
}

function StudentInfo({ grade }: { grade: string }) {
  return (
    <div className="mt-4 flex flex-col gap-3 text-[14px] text-ink">
      <div className="flex items-end gap-2">
        <span className="whitespace-nowrap">Name:</span>
        <DottedLine className="w-72 max-w-full" />
      </div>
      <div className="flex items-end gap-2">
        <span className="whitespace-nowrap">Roll Number:</span>
        <DottedLine className="w-60 max-w-full" />
      </div>
      <div className="flex items-end gap-2">
        <span className="whitespace-nowrap">{grade ? `Class: ${grade}` : "Class:"} Section:</span>
        <DottedLine className="w-40 max-w-full" />
      </div>
    </div>
  );
}

function QuestionItem({ q }: { q: PaperQuestion }) {
  return (
    <li className="flex gap-2 text-[14px] leading-relaxed text-ink">
      <span className="shrink-0 font-medium">{q.number}.</span>
      <div>
        <p>
          <span className={cn("font-semibold", DIFF_COLOR[q.difficulty])}>
            [{DIFFICULTY_LABELS[q.difficulty]}]
          </span>{" "}
          {q.text}{" "}
          <span className="whitespace-nowrap text-ink-soft">
            [{q.marks} {q.marks === 1 ? "Mark" : "Marks"}]
          </span>
        </p>
        {q.options && q.options.length > 0 && (
          <ol className="mt-1 grid grid-cols-1 gap-x-6 gap-y-0.5 pl-1 sm:grid-cols-2">
            {q.options.map((opt, i) => (
              <li key={i} className="text-ink-soft">
                <span className="font-medium text-ink">{String.fromCharCode(65 + i)}.</span> {opt}
              </li>
            ))}
          </ol>
        )}
      </div>
    </li>
  );
}

function SectionBlock({ section }: { section: PaperSection }) {
  // Title may be "Section A — Short Answer Questions"; split for the two-line look.
  const [letter, ...rest] = section.title.split(/\s*[—–-]\s*/);
  const groupName = rest.join(" — ");
  return (
    <section className="mt-7">
      <h2 className="text-center text-[15px] font-bold uppercase tracking-wide text-ink-strong">
        {letter.trim()}
      </h2>
      {groupName && <p className="mt-3 text-[14px] font-bold text-ink-strong">{groupName}</p>}
      {section.instruction && (
        <p className="mb-3 text-[13px] italic text-ink-soft">{section.instruction}</p>
      )}
      <ol className="flex flex-col gap-2.5">
        {section.questions.map((q) => (
          <QuestionItem key={q.id} q={q} />
        ))}
      </ol>
    </section>
  );
}

function AnswerKey({ paper }: { paper: QuestionPaper }) {
  if (!paper.answerKey.length) return null;
  return (
    <section className="answer-key-section mt-8 border-t border-surface-border pt-5">
      <h2 className="mb-3 text-[15px] font-bold text-ink-strong">Answer Key:</h2>
      <ol className="flex flex-col gap-2">
        {paper.answerKey.map((a) => (
          <li key={a.questionId} className="flex gap-2 text-[14px]">
            <span className="shrink-0 font-medium text-ink-strong">{a.number}.</span>
            <span className="whitespace-pre-line text-ink-soft">{a.answer}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function PaperView({ paper }: { paper: QuestionPaper }) {
  return (
    <article className="print-area paper-sheet anim-fade-up mx-auto max-w-3xl rounded-card border border-surface-border bg-white p-8 shadow-card sm:p-10">
      <PaperHeader header={paper.header} />
      <StudentInfo grade={paper.header.grade} />

      {paper.sections.map((s) => (
        <SectionBlock key={s.id} section={s} />
      ))}

      <p className="mt-7 text-[14px] font-bold text-ink-strong">End of Question Paper</p>

      <AnswerKey paper={paper} />
    </article>
  );
}
