// ─────────────────────────────────────────────────────────────
// "What's open" in workspaces — state that does NOT belong in the URL.
// Persisted, so tabs and sidebar split ratios come back after a refresh.
// All actions guard `get()` BEFORE calling `set()` so Zustand `persist`
// never serializes/writes to `localStorage` on no-op calls.
// ─────────────────────────────────────────────────────────────
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { EMPTY } from '@/lib/plugin-system';
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
  /** Removes any persisted tab keys whose items no longer exist in `validKeys`. */
  pruneTabs(ws: string, validKeys: ReadonlySet<string>): void;
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

      openTab: (ws, key) => {
        const cur = get();
        const list = cur.tabs[ws] ?? EMPTY;
        const hasTab = list.includes(key);
        const sameActive = cur.lastActive[ws] === key;
        if (hasTab && sameActive) return;
        set((s) => ({
          tabs: hasTab ? s.tabs : { ...s.tabs, [ws]: [...list, key] },
          lastActive: sameActive ? s.lastActive : { ...s.lastActive, [ws]: key },
        }));
      },

      closeTab: (ws, key) => {
        const cur = get();
        const list = cur.tabs[ws] ?? EMPTY;
        const i = list.indexOf(key);
        if (i === -1) return cur.lastActive[ws] ?? null;
        const rest = list.filter((k) => k !== key);
        const fallback = rest[i] ?? rest[i - 1] ?? null; // right neighbour, else left, else Primary tab
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

      setLastActive: (ws, key) => {
        if (get().lastActive[ws] === key) return;
        set((s) => {
          const next = { ...s.lastActive };
          if (key) next[ws] = key;
          else delete next[ws];
          return { lastActive: next };
        });
      },

      pruneTabs: (ws, validKeys) => {
        const cur = get();
        const list = cur.tabs[ws];
        const active = cur.lastActive[ws];
        const nextList = list ? list.filter((k) => validKeys.has(k)) : undefined;
        const listChanged = !!list && nextList!.length !== list.length;
        const activeInvalid = active !== undefined && !validKeys.has(active);
        if (!listChanged && !activeInvalid) return;
        set((s) => {
          const nextActive = { ...s.lastActive };
          if (activeInvalid) {
            const fallback = nextList?.at(-1);
            if (fallback) nextActive[ws] = fallback;
            else delete nextActive[ws];
          }
          return {
            tabs: listChanged ? { ...s.tabs, [ws]: nextList! } : s.tabs,
            lastActive: activeInvalid ? nextActive : s.lastActive,
          };
        });
      },

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
