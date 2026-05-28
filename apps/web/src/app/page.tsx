"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
/**
 * VedaAI Web Frontend
 * Root page component for the Next.js application.
 * Authored and Maintained by Jaideep Raj Dutta.
 */
import { AppShell } from "@/components/shell/AppShell";
import { Spinner } from "@/components/ui/Spinner";
import { AssignmentCard } from "@/components/AssignmentCard";
import { EmptyAssignments } from "@/components/EmptyAssignments";
import { MobileFab } from "@/components/shell/MobileFab";
import { useAssignmentsStore } from "@/store/assignmentsStore";

export default function DashboardPage() {
  const router = useRouter();
  const { items, loading, error, load } = useAssignmentsStore();
  const [query, setQuery] = useState("");

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((a) =>
      `${a.title ?? ""} ${a.subject ?? ""}`.toLowerCase().includes(q)
    );
  }, [items, query]);

  const hasAssignments = items.length > 0;

  return (
    <AppShell crumbs={["Assignments"]}>
      <div className="relative mx-auto flex h-full max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold leading-[1.2] tracking-tighter text-ink-strong">
            Assignments
          </h1>
          <p className="text-[15px] text-ink-soft/80">
            Manage and create assignments for your classes.
          </p>
        </div>

        {loading && (
          <div className="flex flex-1 items-center justify-center text-ink-muted">
            <Spinner className="h-6 w-6" />
          </div>
        )}

        {error && !loading && (
          <div className="rounded-card border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}. Is the API running?
          </div>
        )}

        {!loading && !error && !hasAssignments && <EmptyAssignments />}

        {!loading && !error && hasAssignments && (
          <>
            {/* Filter + search */}
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button className="flex h-11 items-center gap-2 rounded-pill border border-surface-border bg-white px-4 text-sm font-medium text-ink-soft transition hover:bg-surface-fill">
                <SlidersHorizontal size={16} /> Filter By
              </button>
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search Assignment"
                  className="h-11 w-full rounded-pill border border-surface-border bg-white pl-10 pr-4 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                />
              </div>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 gap-4 pb-24 sm:grid-cols-2">
              {filtered.map((a, i) => (
                <AssignmentCard key={a.id} a={a} index={i} />
              ))}
              {filtered.length === 0 && (
                <p className="col-span-full py-12 text-center text-sm text-ink-muted">
                  No assignments match “{query}”.
                </p>
              )}
            </div>

            {/* Desktop: floating bottom-center Create button (Figma) */}
            <div className="pointer-events-none sticky bottom-5 hidden justify-center lg:flex">
              <button
                onClick={() => router.push("/create")}
                className="pointer-events-auto flex items-center gap-2 rounded-pill bg-ink-strong px-5 py-3 text-sm font-medium text-white shadow-pop transition hover:bg-black"
              >
                <Plus size={18} /> Create Assignment
              </button>
            </div>
          </>
        )}
      </div>

      {/* Mobile: floating + FAB */}
      <MobileFab />
    </AppShell>
  );
}
