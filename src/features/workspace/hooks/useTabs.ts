// ─────────────────────────────────────────────────────────────
// Single source of truth for workspace tab mutations + URL sync.
//   • Compares against `router.state.location.search.item` (not `lastActive`)
//     so clicking after a stale/container URL always recovers cleanly,
//     without re-navigating when already on that URL.
//   • Aborts when `router.state.location.pathname` has already moved away
//     from `/workspaces/${workspace.id}` (fixes pending-navigation race).
//   • Zero dependency on Explorer: Explorer auto-reveals `activeItem` itself.
// ─────────────────────────────────────────────────────────────
import { useRouter, type AnyRouter } from '@tanstack/react-router';
import { EMPTY, itemKey, useRegistry, type Registry, type WorkspaceInfo } from '@/lib/plugin-system';
import { indexItems } from '../lib/search';
import { useWorkbench } from '../stores/workbench';

const goToTab = (router: AnyRouter, wsId: string, key: string | undefined, replace: boolean) =>
  router.navigate({
    to: '/workspaces/$wsId',
    params: { wsId },
    search: (prev) => ({ ...prev, item: key }),
    replace,
  });

const currentUrlItem = (router: AnyRouter): string | undefined =>
  (router.state.location.search as { item?: string }).item;

export interface TabController {
  showDetails(): boolean;
  activateKey(key: string): boolean;
  closeKey(key: string): boolean;
  openItemById(itemId: string): boolean;
  closeItemById(itemId: string): boolean;
}

export function createTabController(
  getWorkspace: () => WorkspaceInfo | null,
  registry: Registry,
  router: AnyRouter,
): TabController {
  const activeWorkspace = (): WorkspaceInfo | null => {
    const ws = getWorkspace();
    if (!ws || router.state.location.pathname !== `/workspaces/${ws.id}`) return null;
    return ws;
  };

  const showDetails = (): boolean => {
    const ws = activeWorkspace();
    if (!ws) return false;
    const state = useWorkbench.getState();
    const urlActive = currentUrlItem(router);
    if (state.lastActive[ws.id] === undefined && urlActive === undefined) return false;
    state.setLastActive(ws.id, undefined);
    if (urlActive !== undefined) void goToTab(router, ws.id, undefined, true);
    return true;
  };

  const activateKey = (key: string): boolean => {
    const ws = activeWorkspace();
    if (!ws) return false;
    useWorkbench.getState().openTab(ws.id, key);
    if (currentUrlItem(router) !== key) void goToTab(router, ws.id, key, true);
    return true;
  };

  const closeKey = (key: string): boolean => {
    const ws = activeWorkspace();
    if (!ws) return false;
    const state = useWorkbench.getState();
    const open = state.tabs[ws.id] ?? EMPTY;
    if (!open.includes(key)) return false;
    const wasOnScreen = currentUrlItem(router) === key;
    const next = state.closeTab(ws.id, key);
    if (wasOnScreen) void goToTab(router, ws.id, next ?? undefined, true);
    return true;
  };

  const openItemById = (itemId: string): boolean => {
    const ws = activeWorkspace();
    if (!ws) return false;
    const item = indexItems(ws).byId.get(itemId);
    if (!item) return false;
    if (registry.itemType.get(item.type)?.isContainer) return false;

    const key = itemKey(item.type, item.id);
    const state = useWorkbench.getState();
    const open = state.tabs[ws.id] ?? EMPTY;
    const isNew = !open.includes(key);
    state.openTab(ws.id, key);
    if (currentUrlItem(router) !== key) void goToTab(router, ws.id, key, !isNew);
    return true;
  };

  const closeItemById = (itemId: string): boolean => {
    const ws = activeWorkspace();
    if (!ws) return false;
    const item = indexItems(ws).byId.get(itemId);
    if (!item) return false;
    return closeKey(itemKey(item.type, item.id));
  };

  return { showDetails, activateKey, closeKey, openItemById, closeItemById };
}

export function useTabActions(workspace: WorkspaceInfo | null): TabController {
  const registry = useRegistry();
  const router = useRouter();
  return createTabController(() => workspace, registry, router);
}
