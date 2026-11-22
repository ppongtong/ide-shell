// Persisted folder/group collapse state owned privately by `core.explorer`.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
    (set) => ({
      ...initialData,

      toggleNode: (ws, id) =>
        set((s) => {
          const list = s.collapsed[ws] ?? [];
          const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
          return { collapsed: { ...s.collapsed, [ws]: next } };
        }),

      revealItems: (ws, ids) =>
        set((s) => {
          const list = s.collapsed[ws];
          if (!list?.length || !ids.length) return s;
          const toExpand = new Set(ids);
          const next = list.filter((id) => !toExpand.has(id));
          return next.length === list.length ? s : { collapsed: { ...s.collapsed, [ws]: next } };
        }),

      collapseAll: (ws, allCollapsibleIds) =>
        set((s) => {
          const unique = [...new Set(allCollapsibleIds)];
          return { collapsed: { ...s.collapsed, [ws]: unique } };
        }),

      expandWorkspace: (ws) =>
        set((s) => {
          if (!s.collapsed[ws]?.length) return s;
          const next = { ...s.collapsed };
          delete next[ws];
          return { collapsed: next };
        }),
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

export const NONE_IDS: readonly string[] = Object.freeze([]);
