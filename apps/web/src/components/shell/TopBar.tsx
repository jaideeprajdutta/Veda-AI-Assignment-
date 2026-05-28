"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, ChevronDown, ChevronRight, FileText } from "lucide-react";

export function TopBar({ crumbs }: { crumbs: string[] }) {
  const router = useRouter();

  return (
    <header className="flex h-14 items-center gap-2.5 rounded-2xl bg-white/75 pl-3 pr-3 backdrop-blur-md">
      <button
        onClick={() => router.back()}
        className="grid h-10 w-10 place-items-center rounded-full bg-white text-ink-soft transition hover:text-ink"
        aria-label="Back"
      >
        <ArrowLeft size={22} strokeWidth={1.8} />
      </button>

      <nav className="flex flex-1 items-center gap-1.5 text-[16px] font-semibold text-ink-muted">
        <Link href="/" className="transition hover:text-ink" aria-label="Assignments">
          <FileText size={18} strokeWidth={1.8} />
        </Link>
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <span key={c} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight size={14} />}
              {last ? (
                <span>{c}</span>
              ) : (
                <Link href="/" className="opacity-70 transition hover:text-ink hover:opacity-100">
                  {c}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      <button
        className="relative grid h-9 w-9 place-items-center rounded-full bg-surface-page text-ink-soft transition hover:text-ink"
        aria-label="Notifications"
      >
        <Bell size={20} strokeWidth={1.8} />
        <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-brand ring-2 ring-white" />
      </button>

      <div className="flex items-center gap-2 rounded-xl px-3 py-1.5 shadow-[0px_16px_24px_rgba(0,0,0,0.06),0px_8px_16px_rgba(0,0,0,0.04)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/figma/user-avatar.jpg"
          alt="John Doe"
          className="h-8 w-8 rounded-full object-cover"
        />
        <span className="hidden text-[16px] font-semibold text-ink-strong sm:block">Jagadeesh Potupureddy</span>
        <ChevronDown size={20} strokeWidth={1.8} className="text-ink-soft" />
      </div>
    </header>
  );
}
