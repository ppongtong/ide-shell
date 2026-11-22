// ─────────────────────────────────────────────────────────────
// Publishes the active workspace, open tabs, and workspace actions
// (including `setPrimaryItem` for the pluggable `type: 'primary'` renderer)
// to `@/features/workspace/contract`.
// ─────────────────────────────────────────────────────────────
import { useLayoutEffect } from 'react';
import { useRouter } from '@tanstack/react-router';
import { EMPTY, useRegistry, type Item, type WorkspaceInfo } from '@/lib/plugin-system';
import { workspacesApi } from '../api/workspaces';
import { useWorkspaceContract } from '../contract';
import { indexItems } from '../lib/search';
import { createTabController } from './useTabs';
import { useWorkbench } from '../stores/workbench';

export function useSyncWorkspaceContract(
  workspace: WorkspaceInfo,
  activeKey?: string,
  activeItem?: Item,
) {
  const registry = useRegistry();
  const router = useRouter();
  const openKeys = useWorkbench((s) => s.tabs[workspace.id] ?? EMPTY);
  const setSnapshot = useWorkspaceContract((s) => s.setSnapshot);
  const setActions = useWorkspaceContract((s) => s.setActions);
  const clear = useWorkspaceContract((s) => s.clear);

  useLayoutEffect(() => {
    const { byKey } = indexItems(workspace);
    const openItems = openKeys.flatMap((k) => byKey.get(k) ?? EMPTY);
    setSnapshot({
      workspace,
      activeKey,
      activeItem,
      openItems,
    });
  }, [workspace, activeKey, activeItem, openKeys, setSnapshot]);

  useLayoutEffect(() => {
    const getCurrent = () => useWorkspaceContract.getState().current?.workspace ?? null;
    const controller = createTabController(getCurrent, registry, router);

    setActions({
      isActiveWorkspace: controller.isActiveWorkspace,
      showPrimary: controller.showPrimary,
      openItem: controller.openItemById,
      closeItem: controller.closeItemById,
      async setPrimaryItem(input) {
        const ws = getCurrent();
        if (!ws || !controller.isActiveWorkspace(ws.id)) return false;
        await workspacesApi.setPrimary(ws.id, input);
        await router.invalidate();
        return true;
      },
    });
  }, [registry, router, setActions]);

  useLayoutEffect(() => {
    return () => {
      clear();
    };
  }, [clear]);
}
