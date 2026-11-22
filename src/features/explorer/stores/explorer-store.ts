// Persisted folder/group collapse state owned privately by `core.explorer`.
// Guards `get()` before `set()` so Zustand `persist` skips no-op storage writes.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { EMPTY } from '@/lib/plugin-system';
import { persistName, persistStorage, registerResetter } from '@/stores/persist';

interface ExplorerData {
  /** Collapsed folder/group IDs per workspace (everything starts expanded by default). */
  readonly collapsed: Readonly<Record<string, readonly string[]>>;
}

interface ExplorerState extends ExplorerData {
  toggleNode(ws: string, id: string): void;
  revealItems(ws: string, ids: readonly string[]): void;
  collapseAll(ws: string, allCollapsibleIds: readonly string[]): void;
  expandWorkspace(ws: string): void;
}

const initialData: ExplorerData = {
  collapsed: {},
};

export const useExplorerStore = create<ExplorerState>()(
  persist(
    (set, get) => ({
      ...initialData,

      toggleNode: (ws, id) =>
        set((s) => {
          const list = s.collapsed[ws] ?? EMPTY;
          const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
          return { collapsed: { ...s.collapsed, [ws]: next } };
        }),

      revealItems: (ws, ids) => {
        const list = get().collapsed[ws];
        if (!list?.length || !ids.length) return;
        const toExpand = new Set(ids);
        const next = list.filter((id) => !toExpand.has(id));
        if (next.length === list.length) return;
        set((s) => ({ collapsed: { ...s.collapsed, [ws]: next } }));
      },

      collapseAll: (ws, allCollapsibleIds) => {
        const unique = [...new Set(allCollapsibleIds)];
        const cur = get().collapsed[ws] ?? EMPTY;
        if (cur.length === unique.length && unique.every((id, i) => cur[i] === id)) return;
        set((s) => ({ collapsed: { ...s.collapsed, [ws]: unique } }));
      },

      expandWorkspace: (ws) => {
        if (!get().collapsed[ws]?.length) return;
        set((s) => {
          const next = { ...s.collapsed };
          delete next[ws];
          return { collapsed: next };
        });
      },
    }),
    {
      name: persistName('explorer'),
      version: 1,
      storage: persistStorage,
      migrate: () => initialData,
    },
  ),
);

registerResetter(() => useExplorerStore.setState(initialData));
