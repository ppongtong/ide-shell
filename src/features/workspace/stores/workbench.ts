// ─────────────────────────────────────────────────────────────
// "What's open" in workspaces — state that does NOT belong in the URL.
// Persisted, so tabs come back after a refresh.
// ─────────────────────────────────────────────────────────────
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistName, persistStorage, registerResetter } from '@/stores/persist';

interface WorkbenchData {
  /** Open tab keys per workspace, in tab order: { acme: ['file:utils', 'dataset:sales'] } */
  tabs: Record<string, string[]>;
  /** Last active tab per workspace, so switching workspaces lands on it. */
  lastActive: Record<string, string>;
  /** Expanded folder ids per workspace. */
  expanded: Record<string, string[]>;
  /** Relative heights of stacked sidebar panels: { explorer: 1, agent: 1 } */
  panelSizes: Record<string, number>;
}

interface WorkbenchState extends WorkbenchData {
  openTab(ws: string, key: string): void;
  /** Removes the tab; returns the neighbour that should become active (or null). */
  closeTab(ws: string, key: string): string | null;
  setLastActive(ws: string, key: string | undefined): void;
  toggleFolder(ws: string, id: string): void;
  expandAll(ws: string, ids: string[]): void;
  setPanelSizes(sizes: Record<string, number>): void;
}

const initialData: WorkbenchData = {
  tabs: {},
  lastActive: {},
  expanded: {},
  panelSizes: {},
};

export const useWorkbench = create<WorkbenchState>()(
  persist(
    (set, get) => ({
      ...initialData,

      openTab: (ws, key) =>
        set((s) => {
          const list = s.tabs[ws] ?? [];
          return list.includes(key) ? s : { tabs: { ...s.tabs, [ws]: [...list, key] } };
        }),

      closeTab: (ws, key) => {
        const list = get().tabs[ws] ?? [];
        const i = list.indexOf(key);
        const rest = list.filter((k) => k !== key);
        set((s) => ({ tabs: { ...s.tabs, [ws]: rest } }));
        return rest[i] ?? rest[i - 1] ?? null; // right neighbour, else left, else none
      },

      setLastActive: (ws, key) =>
        set((s) => {
          if (s.lastActive[ws] === key) return s;
          const next = { ...s.lastActive };
          if (key) next[ws] = key;
          else delete next[ws];
          return { lastActive: next };
        }),

      toggleFolder: (ws, id) =>
        set((s) => {
          const list = s.expanded[ws] ?? [];
          const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
          return { expanded: { ...s.expanded, [ws]: next } };
        }),

      expandAll: (ws, ids) =>
        set((s) => ({ expanded: { ...s.expanded, [ws]: [...new Set([...(s.expanded[ws] ?? []), ...ids])] } })),

      setPanelSizes: (sizes) => set((s) => ({ panelSizes: { ...s.panelSizes, ...sizes } })),
    }),
    { name: persistName('workspace'), version: 1, storage: persistStorage },
  ),
);

registerResetter(() => useWorkbench.setState(initialData));

/** Zustand selectors must return a stable value; a new [] every render loops forever. */
export const NONE: string[] = [];
