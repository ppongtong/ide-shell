// ─────────────────────────────────────────────────────────────
// Publishes the active workspace, primary item, open tabs, and workspace actions
// (including `setPrimaryItem` for the pluggable `type: 'primary'` renderer)
// to `@/features/workspace/contract`.
// ─────────────────────────────────────────────────────────────
import { useRouter } from '@tanstack/react-router';
import { EMPTY, useRegistry, type Item, type WorkspaceInfo } from '@/lib/plugin-system';
import { workspacesApi } from '../api/workspaces';
import { usePublishWorkspaceContract, useWorkspaceContract } from '../contract';
import { indexItems } from '../lib/search';
import { createTabController } from './useTabs';

export function useSyncWorkspaceContract(
  workspace: WorkspaceInfo,
  primaryItem: Item | undefined,
  openKeys: readonly string[],
  activeKey?: string,
  activeItem?: Item,
) {
  const registry = useRegistry();
  const router = useRouter();

  // Computed in render body so React Compiler memoizes `openItems` strictly on `(workspace, openKeys)`,
  // keeping `current.openItems` referentially stable (`===`) across switches between already-open tabs.
  const { byKey } = indexItems(workspace);
  const openItems = openKeys.length === 0 ? EMPTY : openKeys.flatMap((k) => byKey.get(k) ?? EMPTY);

  const getCurrent = () => useWorkspaceContract.getState().current?.workspace ?? null;
  const controller = createTabController(getCurrent, registry, router);

  usePublishWorkspaceContract(
    { workspace, primaryItem, activeKey, activeItem, openItems },
    {
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
    },
  );
}
