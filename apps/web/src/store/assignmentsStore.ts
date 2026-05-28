import { create } from "zustand";
import type { AssignmentDTO } from "@vedaai/shared";
import { api } from "@/lib/api";

interface AssignmentsStore {
  items: AssignmentDTO[];
  loading: boolean;
  error?: string;
  load: () => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useAssignmentsStore = create<AssignmentsStore>((set, get) => ({
  items: [],
  loading: false,
  load: async () => {
    set({ loading: true, error: undefined });
    try {
      const items = await api.listAssignments();
      set({ items, loading: false });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : "Failed to load" });
    }
  },
  remove: async (id) => {
    // optimistic
    const prev = get().items;
    set({ items: prev.filter((a) => a.id !== id) });
    try {
      await api.deleteAssignment(id);
    } catch {
      set({ items: prev }); // rollback on failure
    }
  },
}));
