"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Eye, Trash2 } from "lucide-react";
import type { AssignmentDTO } from "@vedaai/shared";
import { cn, formatDate } from "@/lib/utils";
import { useAssignmentsStore } from "@/store/assignmentsStore";

const STATUS_STYLES: Record<AssignmentDTO["status"], string> = {
  queued: "bg-amber-50 text-amber-700",
  processing: "bg-blue-50 text-blue-700",
  completed: "",
  failed: "bg-red-50 text-red-700",
};

const STATUS_LABEL: Record<AssignmentDTO["status"], string> = {
  queued: "Queued",
  processing: "Generating",
  completed: "",
  failed: "Failed",
};

export function AssignmentCard({ a, index = 0 }: { a: AssignmentDTO; index?: number }) {
  const router = useRouter();
  const remove = useAssignmentsStore((s) => s.remove);
  const [menuOpen, setMenuOpen] = useState(false);

  const open = () => router.push(`/assignments/${a.id}`);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => e.key === "Enter" && open()}
      style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
      className="anim-fade-up group relative flex min-h-[150px] cursor-pointer flex-col justify-between gap-6 rounded-3xl border border-surface-border bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-pop"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-2 text-[18px] font-bold uppercase tracking-tight text-ink-strong underline decoration-1 underline-offset-[3px]">
          {a.title || a.subject || "Untitled Assignment"}
        </h3>

        <div className="flex shrink-0 items-center gap-1.5">
          {a.status !== "completed" && STATUS_LABEL[a.status] && (
            <span
              className={cn(
                "rounded-pill px-2.5 py-0.5 text-[11px] font-medium",
                STATUS_STYLES[a.status]
              )}
            >
              {STATUS_LABEL[a.status]}
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            className="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-surface-fill"
            aria-label="Options"
          >
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 text-[13px] text-ink-soft">
        <span>
          <span className="font-bold text-ink">Assigned on</span> : {formatDate(a.createdAt)}
        </span>
        <span>
          <span className="font-bold text-ink">Due</span> : {formatDate(a.dueDate)}
        </span>
      </div>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(false);
            }}
          />
          <div
            className="anim-fade-up absolute right-5 top-14 z-20 w-44 overflow-hidden rounded-2xl border border-surface-border bg-white py-1 shadow-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setMenuOpen(false);
                open();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-surface-fill"
            >
              <Eye size={15} /> View assignment
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                remove(a.id);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 size={15} /> Delete assignment
            </button>
          </div>
        </>
      )}
    </div>
  );
}
