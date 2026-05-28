import { Download, RefreshCw, Sparkles, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function AiBanner({
  intro,
  onDownload,
  onRegenerate,
  regenerating,
}: {
  intro: string;
  onDownload: () => void;
  onRegenerate: () => void;
  regenerating?: boolean;
}) {
  return (
    <div className="no-print anim-fade-up mx-auto mb-5 flex max-w-3xl flex-col gap-4 rounded-card bg-ink-strong p-5 text-white sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10">
          <Sparkles size={16} className="text-brand-light" />
        </span>
        <p className="text-sm leading-relaxed text-white/90">{intro}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button variant="white" size="sm" onClick={onRegenerate} disabled={regenerating}>
          {regenerating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          Regenerate
        </Button>
        <Button variant="brand" size="sm" onClick={onDownload}>
          <Download size={16} /> Download as PDF
        </Button>
      </div>
    </div>
  );
}

export function GeneratingState({
  progress,
  step,
}: {
  progress: number;
  step?: string;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center rounded-card border border-surface-border bg-white px-8 py-16 text-center shadow-card">
      <span className="mb-5 grid h-16 w-16 place-items-center rounded-full bg-brand/10">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </span>
      <h2 className="text-lg font-semibold text-ink-strong">Generating your paper…</h2>
      <p className="mt-1 text-sm text-ink-soft">{step ?? "Working on it"}</p>
      <div className="mt-6 h-2 w-full overflow-hidden rounded-pill bg-surface-fill">
        <div
          className="h-full rounded-pill bg-brand-gradient transition-all duration-500"
          style={{ width: `${Math.max(8, progress)}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-ink-muted">{progress}%</p>
    </div>
  );
}

export function FailedState({
  error,
  onRegenerate,
  regenerating,
}: {
  error: string;
  onRegenerate: () => void;
  regenerating?: boolean;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center rounded-card border border-red-200 bg-white px-8 py-16 text-center shadow-card">
      <span className="mb-5 grid h-16 w-16 place-items-center rounded-full bg-red-50">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </span>
      <h2 className="text-lg font-semibold text-ink-strong">Generation failed</h2>
      <p className="mt-1 max-w-sm text-sm text-ink-soft">{error}</p>
      <Button variant="dark" className="mt-6" onClick={onRegenerate} disabled={regenerating}>
        {regenerating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
        Try Again
      </Button>
    </div>
  );
}
