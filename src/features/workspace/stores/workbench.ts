// ─────────────────────────────────────────────────────────────
// "What's open" in workspaces — state that does NOT belong in the URL.
// Persisted, so tabs and sidebar split ratios come back after a refresh.
// Explorer folder/group expansion lives in features/explorer.
// ─────────────────────────────────────────────────────────────
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistName, persistStorage, registerResetter } from '@/stores/persist';

interface WorkbenchData {
  /** Open tab keys per workspace, in tab order: { acme: ['file:utils', 'dataset:sales'] } */
  readonly tabs: Readonly<Record<string, readonly string[]>>;
  /** Last active tab per workspace, so switching workspaces lands on it. */
  readonly lastActive: Readonly<Record<string, string>>;
  /** Relative heights of stacked sidebar panels: { explorer: 1, agent: 1 } */
  readonly panelSizes: Readonly<Record<string, number>>;
}

interface WorkbenchState extends WorkbenchData {
  /** Ensures `key` is in `tabs[ws]` and marks it as `lastActive[ws]` in one atomic write. */
  openTab(ws: string, key: string): void;
  /** Removes the tab; updates `lastActive[ws]` if it was active, and returns the fallback neighbour (or null). */
  closeTab(ws: string, key: string): string | null;
  setLastActive(ws: string, key: string | undefined): void;
  setPanelSizes(sizes: Record<string, number>): void;
}

const initialData: WorkbenchData = {
  tabs: {},
  lastActive: {},
  panelSizes: {},
};

export const useWorkbench = create<WorkbenchState>()(
  persist(
    (set, get) => ({
      ...initialData,

      openTab: (ws, key) =>
        set((s) => {
          const list = s.tabs[ws] ?? [];
          const hasTab = list.includes(key);
          const sameActive = s.lastActive[ws] === key;
          if (hasTab && sameActive) return s;
          return {
            tabs: hasTab ? s.tabs : { ...s.tabs, [ws]: [...list, key] },
            lastActive: sameActive ? s.lastActive : { ...s.lastActive, [ws]: key },
          };
        }),

      closeTab: (ws, key) => {
        const cur = get();
        const list = cur.tabs[ws] ?? [];
        const i = list.indexOf(key);
        const rest = list.filter((k) => k !== key);
        const fallback = rest[i] ?? rest[i - 1] ?? null; // right neighbour, else left, else Details tab
        set((s) => {
          const nextActive = { ...s.lastActive };
          if (s.lastActive[ws] === key) {
            if (fallback) nextActive[ws] = fallback;
            else delete nextActive[ws];
          }
          return {
            tabs: { ...s.tabs, [ws]: rest },
            lastActive: nextActive,
          };
        });
        return fallback;
      },

      setLastActive: (ws, key) =>
        set((s) => {
          if (s.lastActive[ws] === key) return s;
          const next = { ...s.lastActive };
          if (key) next[ws] = key;
          else delete next[ws];
          return { lastActive: next };
        }),

      setPanelSizes: (sizes) => set((s) => ({ panelSizes: { ...s.panelSizes, ...sizes } })),
    }),
    {
      name: persistName('workspace'),
      version: 3,
      storage: persistStorage,
      migrate: () => initialData,
    },
  ),
);

registerResetter(() => useWorkbench.setState(initialData));

/** Zustand selectors must return a stable value; a new [] every render loops forever. */
export const NONE: readonly string[] = Object.freeze([]);
