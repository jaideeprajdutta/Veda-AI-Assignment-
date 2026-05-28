"use client";

import { FileText, KeyRound, X } from "lucide-react";

export function DownloadDialog({
  open,
  onClose,
  onChoose,
}: {
  open: boolean;
  onClose: () => void;
  onChoose: (withKey: boolean) => void;
}) {
  if (!open) return null;
  return (
    <div className="no-print fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="anim-fade-up relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-pop">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-ink-muted hover:text-ink"
          aria-label="Close"
        >
          <X size={18} />
        </button>
        <h3 className="text-lg font-bold tracking-tight text-ink-strong">Download as PDF</h3>
        <p className="mt-1 text-sm text-ink-soft">Choose what to include in the PDF.</p>

        <div className="mt-5 flex flex-col gap-2.5">
          <button
            onClick={() => onChoose(false)}
            className="flex items-center gap-3 rounded-2xl border border-surface-border p-3 text-left transition hover:border-brand/50 hover:bg-surface-fill/50"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-fill text-ink">
              <FileText size={18} />
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink-strong">
                Question paper only
              </span>
              <span className="block text-xs text-ink-soft">Without the answer key</span>
            </span>
          </button>

          <button
            onClick={() => onChoose(true)}
            className="flex items-center gap-3 rounded-2xl border border-surface-border p-3 text-left transition hover:border-brand/50 hover:bg-surface-fill/50"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/10 text-brand-dark">
              <KeyRound size={18} />
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink-strong">
                Question paper + Answer key
              </span>
              <span className="block text-xs text-ink-soft">Full paper with answers</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
