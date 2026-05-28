import type {
  AssignmentDTO,
  AssignmentDetailResponse,
  CreateAssignmentInput,
  CreateAssignmentResponse,
  JobState,
} from "@vedaai/shared";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

class ApiError extends Error {
  constructor(message: string, public status: number, public issues?: unknown) {
    super(message);
  }
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error ?? `Request failed (${res.status})`, res.status, body.issues);
  }
  return res.json() as Promise<T>;
}

export const api = {
  listAssignments: () => http<AssignmentDTO[]>("/api/assignments"),

  getAssignment: (id: string) =>
    http<AssignmentDetailResponse>(`/api/assignments/${id}`),

  createAssignment: (input: CreateAssignmentInput) =>
    http<CreateAssignmentResponse>("/api/assignments", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  regenerate: (id: string) =>
    http<{ jobId: string }>(`/api/assignments/${id}/regenerate`, { method: "POST" }),

  deleteAssignment: (id: string) =>
    http<{ ok: boolean }>(`/api/assignments/${id}`, { method: "DELETE" }),

  deleteVersion: (id: string, version: number) =>
    http<{ ok: boolean }>(`/api/assignments/${id}/versions/${version}`, { method: "DELETE" }),

  getJob: (id: string) => http<JobState>(`/api/jobs/${id}`),

  uploadFile: async (file: File): Promise<{ sourceText: string }> => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API}/api/upload`, { method: "POST", body: form });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(body.error ?? "Upload failed", res.status);
    }
    return res.json();
  },
};

export { ApiError };

export function PDF_URL(
  id: string,
  opts?: { version?: number | null; answerKey?: boolean }
): string {
  const p = new URLSearchParams();
  if (opts?.version) p.set("version", String(opts.version));
  if (opts?.answerKey) p.set("answerKey", "true");
  // cache-buster — guarantees a fresh PDF (no browser/CDN reuse)
  p.set("t", String(Date.now()));
  return `${API}/api/assignments/${id}/pdf?${p.toString()}`;
}
