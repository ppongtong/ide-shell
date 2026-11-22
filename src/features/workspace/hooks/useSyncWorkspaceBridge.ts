// ─────────────────────────────────────────────────────────────
// Syncs the open workspace with other features through the bridge
// store (src/stores/workspace-bridge.ts):
//   1. Updates `current` whenever workspace, active tab or open tabs change.
//   2. Registers `actions` once per workspace (reading live store + router
//      state on each call so sequential actions never see stale closures).
//   3. Clears the bridge only when leaving the workspace page.
// ─────────────────────────────────────────────────────────────
import { useEffect } from 'react';
import { useRouter } from '@tanstack/react-router';
import { useRegistry } from '@/lib/plugin-system';
import { getItemTypes, itemKey, type Item, type WorkspaceInfo } from '@/contracts/workspace';
import { useWorkspaceBridge } from '@/stores/workspace-bridge';
import { pathTo } from '../api/workspaces';
import { NONE, useWorkbench } from '../stores/workbench';

export function useSyncWorkspaceBridge(workspace: WorkspaceInfo, activeItem: Item | undefined) {
  const itemTypes = getItemTypes(useRegistry());
  const router = useRouter();
  const openKeys = useWorkbench((s) => s.tabs[workspace.id] ?? NONE);
  const setSnapshot = useWorkspaceBridge((s) => s.setSnapshot);
  const setActions = useWorkspaceBridge((s) => s.setActions);
  const clearBridge = useWorkspaceBridge((s) => s.clearBridge);

  useEffect(() => {
    const byKey = new Map(workspace.items.map((i) => [itemKey(i.type, i.id), i]));
    const openItems = openKeys.flatMap((k) => byKey.get(k) ?? []);
    setSnapshot({ workspace, activeItem, openItems });
  }, [workspace, activeItem, openKeys, setSnapshot]);

  useEffect(() => {
    const byId = new Map(workspace.items.map((i) => [i.id, i]));
    const getActiveKey = () => ((router.state.resolvedLocation ?? router.state.location).search as { item?: string }).item;
    let activeOverride: string | null | undefined;

    const currentActiveKey = () => (activeOverride === undefined ? getActiveKey() : (activeOverride ?? undefined));

    const goToItem = (key: string | undefined, replace: boolean) => {
      activeOverride = key ?? null;
      queueMicrotask(() => {
        activeOverride = undefined;
      });
      return router.navigate({
        to: '/workspaces/$wsId',
        params: { wsId: workspace.id },
        search: (prev) => ({ ...prev, item: key }),
        replace,
      });
    };

    setActions({
      openItem(itemId) {
        const item = byId.get(itemId);
        if (!item) return false;
        const isFolder = !!itemTypes.get(item.type)?.isContainer;
        const chain = pathTo(workspace.items, item.id).map((i) => i.id);
        const state = useWorkbench.getState();
        state.expandAll(workspace.id, isFolder ? chain : chain.slice(0, -1));
        if (!isFolder) {
          const key = itemKey(item.type, item.id);
          const open = state.tabs[workspace.id] ?? NONE;
          const isNew = !open.includes(key);
          state.openTab(workspace.id, key);
          if (key !== currentActiveKey()) void goToItem(key, !isNew);
        }
        return true;
      },
      closeItem(itemId) {
        const item = byId.get(itemId);
        if (!item) return false;
        const key = itemKey(item.type, item.id);
        const state = useWorkbench.getState();
        const open = state.tabs[workspace.id] ?? NONE;
        if (!open.includes(key)) return false;
        const next = state.closeTab(workspace.id, key);
        if (key === currentActiveKey()) void goToItem(next ?? undefined, true);
        return true;
      },
    });
  }, [workspace, itemTypes, router, setActions]);

  useEffect(() => {
    return () => {
      clearBridge();
    };
  }, [clearBridge]);
}
