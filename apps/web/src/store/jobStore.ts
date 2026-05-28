import { create } from "zustand";
import {
  WS_EVENTS,
  type JobState,
  type JobStatus,
  type JobCompletedEvent,
  type JobFailedEvent,
} from "@vedaai/shared";
import { getSocket } from "@/lib/socket";

interface JobCallbacks {
  onCompleted?: () => void;
  onFailed?: (error: string) => void;
}

interface JobStore {
  jobId: string | null;
  status: JobStatus | "idle";
  progress: number;
  step?: string;
  error?: string;
  /** Subscribe to live updates for a job via WebSocket. */
  track: (jobId: string, cb?: JobCallbacks) => void;
  reset: () => void;
}

// Holds the active listener teardown outside React render.
let detach: (() => void) | null = null;

export const useJobStore = create<JobStore>((set) => ({
  jobId: null,
  status: "idle",
  progress: 0,

  track: (jobId, cb) => {
    const socket = getSocket();
    detach?.();
    set({ jobId, status: "queued", progress: 0, step: "Queued", error: undefined });

    const onStatus = (e: JobState) => {
      if (e.jobId !== jobId) return;
      set({ status: e.status, progress: e.progress, step: e.step });
    };
    const onCompleted = (e: JobCompletedEvent) => {
      if (e.jobId !== jobId) return;
      set({ status: "completed", progress: 100 });
      cb?.onCompleted?.();
    };
    const onFailed = (e: JobFailedEvent) => {
      if (e.jobId !== jobId) return;
      set({ status: "failed", error: e.error });
      cb?.onFailed?.(e.error);
    };

    socket.on(WS_EVENTS.STATUS, onStatus);
    socket.on(WS_EVENTS.COMPLETED, onCompleted);
    socket.on(WS_EVENTS.FAILED, onFailed);
    socket.emit(WS_EVENTS.SUBSCRIBE, jobId);

    detach = () => {
      socket.off(WS_EVENTS.STATUS, onStatus);
      socket.off(WS_EVENTS.COMPLETED, onCompleted);
      socket.off(WS_EVENTS.FAILED, onFailed);
    };
  },

  reset: () => {
    detach?.();
    detach = null;
    set({ jobId: null, status: "idle", progress: 0, step: undefined, error: undefined });
  },
}));
