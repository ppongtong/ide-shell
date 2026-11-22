// ─────────────────────────────────────────────────────────────
// Publishes the active workspace (or draft state on `/workspaces/new`)
// and tab actions to `@/features/workspace/contract` so Explorer,
// Agent, and any future plugin can consume them cleanly.
// ─────────────────────────────────────────────────────────────
import { useEffect } from 'react';
import { useRouter } from '@tanstack/react-router';
import { itemKey, useRegistry, type Item, type WorkspaceInfo } from '@/lib/plugin-system';
import { useWorkspaceContract } from '../contract';
import { createTabController } from './useTabs';
import { NONE, useWorkbench } from '../stores/workbench';

const NO_ITEMS: readonly Item[] = Object.freeze([]);

export function useSyncWorkspaceContract(
  workspace: WorkspaceInfo | null,
  activeKey?: string,
  activeItem?: Item,
) {
  const registry = useRegistry();
  const router = useRouter();
  const openKeys = useWorkbench((s) => (workspace ? (s.tabs[workspace.id] ?? NONE) : NONE));
  const setSnapshot = useWorkspaceContract((s) => s.setSnapshot);
  const setActions = useWorkspaceContract((s) => s.setActions);
  const clear = useWorkspaceContract((s) => s.clear);

  useEffect(() => {
    if (!workspace) {
      setSnapshot({ workspace: null, isDraft: true, openItems: NO_ITEMS });
      return;
    }
    const byKey = new Map(workspace.items.map((i) => [itemKey(i.type, i.id), i]));
    const openItems = openKeys.flatMap((k) => byKey.get(k) ?? []);
    setSnapshot({
      workspace,
      isDraft: false,
      activeKey,
      activeItem,
      openItems,
    });
  }, [workspace, activeKey, activeItem, openKeys, setSnapshot]);

  useEffect(() => {
    if (!workspace) {
      setActions({
        showDetails: () => false,
        openItem: () => false,
        closeItem: () => false,
      });
      return;
    }
    const controller = createTabController(workspace, registry, router);
    setActions({
      showDetails: () => controller.showDetails(),
      openItem: (itemId) => controller.openItemById(itemId),
      closeItem: (itemId) => controller.closeItemById(itemId),
    });
  }, [workspace, registry, router, setActions]);

  useEffect(() => {
    return () => {
      clear();
    };
  }, [clear]);
}
