// ─────────────────────────────────────────────────────────────
// Single source of truth for workspace tab mutations + URL sync.
// Used by both TabBar UI and `@/features/workspace/contract` actions,
// so UI clicks and cross-plugin calls behave identically.
// ─────────────────────────────────────────────────────────────
import { useRouter, type AnyRouter } from '@tanstack/react-router';
import { itemKey, useRegistry, type Item, type Registry, type WorkspaceInfo } from '@/lib/plugin-system';
import { useExplorerContract } from '@/features/explorer/contract';
import { pathTo } from '../api/workspaces';
import { NONE, useWorkbench } from '../stores/workbench';

const goToTab = (router: AnyRouter, wsId: string, key: string | undefined, replace: boolean) =>
  router.navigate({
    to: '/workspaces/$wsId',
    params: { wsId },
    search: (prev) => ({ ...prev, item: key }),
    replace,
  });

export interface TabController {
  showDetails(): boolean;
  activateKey(key: string): void;
  closeKey(key: string): boolean;
  openItemById(itemId: string): boolean;
  closeItemById(itemId: string): boolean;
}

export function createTabController(workspace: WorkspaceInfo, registry: Registry, router: AnyRouter): TabController {
  const byId = new Map<string, Item>(workspace.items.map((i) => [i.id, i]));

  return {
    showDetails() {
      const state = useWorkbench.getState();
      const urlActive = ((router.state.resolvedLocation ?? router.state.location).search as { item?: string }).item;
      if (state.lastActive[workspace.id] === undefined && urlActive === undefined) return false;
      state.setLastActive(workspace.id, undefined);
      void goToTab(router, workspace.id, undefined, true);
      return true;
    },

    activateKey(key) {
      const state = useWorkbench.getState();
      if (state.lastActive[workspace.id] === key) return;
      state.openTab(workspace.id, key);
      void goToTab(router, workspace.id, key, true);
    },

    closeKey(key) {
      const state = useWorkbench.getState();
      const open = state.tabs[workspace.id] ?? NONE;
      if (!open.includes(key)) return false;
      const wasActive = state.lastActive[workspace.id] === key;
      const next = state.closeTab(workspace.id, key);
      if (wasActive) void goToTab(router, workspace.id, next ?? undefined, true);
      return true;
    },

    openItemById(itemId) {
      const item = byId.get(itemId);
      if (!item) return false;
      const isContainer = !!registry.itemType.get(item.type)?.isContainer;
      const chainIds = pathTo(workspace.items, item.id).map((i) => i.id);
      const revealIds = isContainer ? chainIds : chainIds.slice(0, -1);
      if (revealIds.length > 0) {
        useExplorerContract.getState().actions?.revealItems(workspace.id, revealIds);
      }
      if (isContainer) return true;

      const key = itemKey(item.type, item.id);
      const state = useWorkbench.getState();
      const open = state.tabs[workspace.id] ?? NONE;
      const isNew = !open.includes(key);
      const wasActive = state.lastActive[workspace.id] === key;
      state.openTab(workspace.id, key);
      if (!wasActive) void goToTab(router, workspace.id, key, !isNew);
      return true;
    },

    closeItemById(itemId) {
      const item = byId.get(itemId);
      if (!item) return false;
      return this.closeKey(itemKey(item.type, item.id));
    },
  };
}

export function useTabActions(workspace: WorkspaceInfo | null): TabController | null {
  const registry = useRegistry();
  const router = useRouter();
  if (!workspace) return null;
  return createTabController(workspace, registry, router);
}
