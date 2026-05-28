import { DIFFICULTY_LABELS, type Difficulty } from "@vedaai/shared";
import { cn } from "@/lib/utils";

const styles: Record<Difficulty, string> = {
  easy: "bg-difficulty-easy/10 text-difficulty-easy ring-difficulty-easy/20",
  medium: "bg-difficulty-moderate/10 text-difficulty-moderate ring-difficulty-moderate/20",
  hard: "bg-difficulty-hard/10 text-difficulty-hard ring-difficulty-hard/20",
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        styles[difficulty]
      )}
    >
      {DIFFICULTY_LABELS[difficulty]}
    </span>
  );
}
