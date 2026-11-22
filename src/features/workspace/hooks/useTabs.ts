// ─────────────────────────────────────────────────────────────
// Tabs: the URL owns the ACTIVE tab, the store owns the LIST.
//   no ?item=           → pinned Details tab is active
//   open a new item     → add to store + navigate (push: Back returns to the previous tab)
//   switch to open tab  → navigate (replace)
//   close a tab         → remove; if it was active, navigate to its neighbour (or Details)
// ─────────────────────────────────────────────────────────────
import { useNavigate } from '@tanstack/react-router';
import { itemKey, useRegistry, type Item } from '@/lib/plugin-system';
import { NONE, useWorkbench } from '../stores/workbench';

export function useTabs(wsId: string, activeKey: string | undefined) {
  const registry = useRegistry();
  const navigate = useNavigate();
  const open = useWorkbench((s) => s.tabs[wsId] ?? NONE);

  const goTo = (key: string | undefined, replace: boolean) =>
    navigate({
      to: '/workspaces/$wsId',
      params: { wsId },
      search: (prev) => ({ ...prev, item: key }),
      replace,
    });

  return {
    open,

    /** Switch to the pinned first Details tab (clears ?item=). */
    showDetails() {
      if (activeKey !== undefined) void goTo(undefined, true);
    },

    /** Explorer click: containers expand/collapse, everything else opens in a tab. */
    openItem(item: Item) {
      const state = useWorkbench.getState();
      if (registry.itemType.get(item.type)?.isContainer) return state.toggleFolder(wsId, item.id);
      const key = itemKey(item.type, item.id);
      if (key === activeKey) return;
      const currentOpen = state.tabs[wsId] ?? NONE;
      const isNew = !currentOpen.includes(key);
      state.openTab(wsId, key);
      void goTo(key, !isNew);
    },

    activate(key: string) {
      if (key !== activeKey) void goTo(key, true);
    },

    close(key: string) {
      const next = useWorkbench.getState().closeTab(wsId, key);
      if (key === activeKey) void goTo(next ?? undefined, true);
    },
  };
}
