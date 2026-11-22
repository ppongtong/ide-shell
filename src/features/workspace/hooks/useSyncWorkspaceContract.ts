// ─────────────────────────────────────────────────────────────
// Publishes the active workspace (or draft state on `/workspaces/new`)
// and tab actions to `@/features/workspace/contract`.
//   • Uses `useLayoutEffect` so Explorer/Agent never lag the screen by 1 frame.
//   • Separates snapshot, actions, and unmount cleanup into independent effects
//     so updating one never clears the other.
// ─────────────────────────────────────────────────────────────
import { useLayoutEffect } from 'react';
import { useRouter } from '@tanstack/react-router';
import { EMPTY, useRegistry, type Item, type WorkspaceInfo } from '@/lib/plugin-system';
import { useWorkspaceContract } from '../contract';
import { indexItems } from '../lib/search';
import { createTabController } from './useTabs';
import { useWorkbench } from '../stores/workbench';

export function useSyncWorkspaceContract(
  workspace: WorkspaceInfo | null,
  activeKey?: string,
  activeItem?: Item,
) {
  const registry = useRegistry();
  const router = useRouter();
  const openKeys = useWorkbench((s) => (workspace ? (s.tabs[workspace.id] ?? EMPTY) : EMPTY));
  const setSnapshot = useWorkspaceContract((s) => s.setSnapshot);
  const setActions = useWorkspaceContract((s) => s.setActions);
  const clear = useWorkspaceContract((s) => s.clear);

  useLayoutEffect(() => {
    if (!workspace) {
      setSnapshot({ workspace: null, isDraft: true, openItems: EMPTY });
      return;
    }
    const { byKey } = indexItems(workspace);
    const openItems = openKeys.flatMap((k) => byKey.get(k) ?? EMPTY);
    setSnapshot({
      workspace,
      isDraft: false,
      activeKey,
      activeItem,
      openItems,
    });
  }, [workspace, activeKey, activeItem, openKeys, setSnapshot]);

  useLayoutEffect(() => {
    const controller = createTabController(
      () => useWorkspaceContract.getState().current?.workspace ?? null,
      registry,
      router,
    );
    setActions({
      isActiveWorkspace: controller.isActiveWorkspace,
      showDetails: controller.showDetails,
      openItem: controller.openItemById,
      closeItem: controller.closeItemById,
    });
  }, [registry, router, setActions]);

  useLayoutEffect(() => {
    return () => {
      clear();
    };
  }, [clear]);
}
