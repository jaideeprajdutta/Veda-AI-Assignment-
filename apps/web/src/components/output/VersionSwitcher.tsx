"use client";

import { History, Trash2 } from "lucide-react";
import type { PaperVersion } from "@vedaai/shared";
import { cn } from "@/lib/utils";

export function VersionSwitcher({
  versions,
  selected,
  onSelect,
  onDelete,
  className,
}: {
  versions: PaperVersion[];
  selected: number | null;
  onSelect: (v: number) => void;
  onDelete: (v: number) => void;
  className?: string;
}) {
  if (versions.length <= 1) return null;
  const latest = versions[0]?.version;

  return (
    <div
      className={cn(
        "no-print rounded-card border border-surface-border bg-white p-3 shadow-card",
        className
      )}
    >
      <p className="mb-2 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        <History size={13} /> Versions
      </p>
      <div className="flex gap-2 overflow-x-auto lg:flex-col">
        {versions.map((v) => {
          const active = v.version === selected;
          return (
            <div
              key={v.version}
              className={cn(
                "group flex shrink-0 items-center gap-1 rounded-lg pr-1 transition",
                active ? "bg-ink-strong text-white" : "text-ink-soft hover:bg-surface-fill"
              )}
            >
              <button
                onClick={() => onSelect(v.version)}
                className="flex flex-1 items-center justify-between gap-3 px-3 py-2 text-sm"
              >
                <span className={active ? "font-medium" : ""}>Version {v.version}</span>
                {v.version === latest && (
                  <span
                    className={cn(
                      "rounded-pill px-1.5 py-0.5 text-[10px] font-medium",
                      active ? "bg-white/20 text-white" : "bg-difficulty-easy/10 text-difficulty-easy"
                    )}
                  >
                    Latest
                  </span>
                )}
              </button>
              <button
                onClick={() => onDelete(v.version)}
                aria-label={`Delete version ${v.version}`}
                className={cn(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-md transition",
                  active
                    ? "text-white/60 hover:bg-white/15 hover:text-white"
                    : "text-ink-muted hover:bg-red-50 hover:text-red-600"
                )}
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
