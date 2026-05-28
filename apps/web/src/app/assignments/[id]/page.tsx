"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import type { AssignmentDetailResponse } from "@vedaai/shared";
import { AppShell } from "@/components/shell/AppShell";
import { Spinner } from "@/components/ui/Spinner";
import { PaperView } from "@/components/output/PaperView";
import { VersionSwitcher } from "@/components/output/VersionSwitcher";
import { DownloadDialog } from "@/components/output/DownloadDialog";
import { AiBanner, GeneratingState, FailedState } from "@/components/output/OutputStates";
import { useJobStore } from "@/store/jobStore";
import { api, PDF_URL } from "@/lib/api";

export default function AssignmentPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [detail, setDetail] = useState<AssignmentDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [showDownload, setShowDownload] = useState(false);

  const job = useJobStore();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDetail = useCallback(async () => {
    try {
      const d = await api.getAssignment(id);
      setDetail(d);
      const newest = d.versions[0]?.version ?? null;
      // Auto-select newest version (and jump to it after a regenerate).
      setSelected((prev) => (prev === null || (newest && newest > prev) ? newest : prev));
      return d;
    } catch {
      setNotFound(true);
      return null;
    } finally {
      setLoading(false);
    }
  }, [id]);

  const stopPoll = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
  }, []);

  const watch = useCallback(
    (jobId: string) => {
      job.track(jobId, { onCompleted: () => fetchDetail() });
      stopPoll();
      pollRef.current = setInterval(async () => {
        const dd = await fetchDetail();
        if (dd?.paper || dd?.job?.status === "failed") stopPoll();
      }, 2500);
    },
    [job, fetchDetail, stopPoll]
  );

  useEffect(() => {
    let active = true;
    (async () => {
      const d = await fetchDetail();
      if (!active || !d || d.paper || d.job?.status === "failed") return;
      if (d.assignment.jobId) watch(d.assignment.jobId);
    })();
    return () => {
      active = false;
      stopPoll();
      job.reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Reset the answer-key print class after printing.
  useEffect(() => {
    const after = () => document.body.classList.remove("print-paper-only");
    window.addEventListener("afterprint", after);
    return () => window.removeEventListener("afterprint", after);
  }, []);

  async function handleRegenerate() {
    setRegenerating(true);
    try {
      const { jobId } = await api.regenerate(id);
      // Keep showing the current version while the new one generates.
      watch(jobId);
    } finally {
      setRegenerating(false);
    }
  }

  async function handleDeleteVersion(version: number) {
    try {
      await api.deleteVersion(id, version);
      const d = await fetchDetail();
      if (d && !d.versions.some((v) => v.version === selected)) {
        setSelected(d.versions[0]?.version ?? null);
      }
    } catch {
      /* keep current view on failure */
    }
  }

  function handleDownloadChoice(withKey: boolean) {
    setShowDownload(false);
    // Backend-generated, properly formatted PDF (pdfkit + Bricolage) for the
    // selected version, with or without the answer key.
    window.open(PDF_URL(id, { version: selected, answerKey: withKey }), "_blank");
  }

  const versions = detail?.versions ?? [];
  const currentPaper =
    versions.find((v) => v.version === selected)?.paper ?? detail?.paper ?? null;

  const subject = currentPaper?.header.subject || detail?.assignment.subject;
  const failedError =
    job.status === "failed"
      ? job.error
      : detail?.job?.status === "failed"
        ? detail.job.error
        : undefined;

  return (
    <AppShell crumbs={["Assignments", subject || "Assignment"]}>
      <div className="px-4 py-6 sm:px-6 sm:py-8">
        {loading && (
          <div className="flex items-center justify-center py-24 text-ink-muted">
            <Spinner className="h-6 w-6" />
          </div>
        )}

        {!loading && notFound && (
          <div className="mx-auto max-w-md rounded-card border border-surface-border bg-white p-8 text-center text-ink-soft shadow-card">
            Assignment not found.
          </div>
        )}

        {!loading && currentPaper && (
          <div className="mx-auto flex max-w-5xl flex-col gap-4 lg:flex-row lg:items-start lg:justify-center">
            <div className="order-2 w-full max-w-3xl lg:order-1">
              <AiBanner
                intro={currentPaper.intro}
                onDownload={() => setShowDownload(true)}
                onRegenerate={handleRegenerate}
                regenerating={regenerating || (job.status !== "idle" && job.status !== "completed" && job.status !== "failed")}
              />
              <PaperView paper={currentPaper} />
            </div>
            <VersionSwitcher
              className="order-1 lg:order-2 lg:sticky lg:top-2 lg:w-52"
              versions={versions}
              selected={selected}
              onSelect={setSelected}
              onDelete={handleDeleteVersion}
            />
          </div>
        )}

        {!loading && !currentPaper && failedError && (
          <FailedState error={failedError} onRegenerate={handleRegenerate} regenerating={regenerating} />
        )}

        {!loading && !currentPaper && !failedError && (
          <GeneratingState progress={job.status === "idle" ? 5 : job.progress} step={job.step} />
        )}
      </div>

      <DownloadDialog
        open={showDownload}
        onClose={() => setShowDownload(false)}
        onChoose={handleDownloadChoice}
      />
    </AppShell>
  );
}
