// ─────────────────────────────────────────────────────────────
// Workspace details = split panel:
//   [ stacked sidebar panels | tab bar + editors ]
// ─────────────────────────────────────────────────────────────
import { useEffectEvent, useLayoutEffect } from 'react';
import { getRouteApi } from '@tanstack/react-router';
import { EMPTY, itemKey, parsePanels, useRegistry } from '@/lib/plugin-system';
import { indexItems } from '../lib/search';
import { useWorkbench } from '../stores/workbench';
import { useSyncWorkspaceContract } from '../hooks/useSyncWorkspaceContract';
import { SidebarPanels } from '../components/SidebarPanels';
import { TabBar } from '../components/TabBar';
import { EditorHost } from '../components/EditorHost';

const route = getRouteApi('/workspaces/$wsId');

export function WorkspaceDetailPage() {
  const workspace = route.useLoaderData();
  const { item, panels } = route.useSearch();
  const registry = useRegistry();
  const storedTabs = useWorkbench((s) => s.tabs[workspace.id] ?? EMPTY);
  const openTab = useWorkbench((s) => s.openTab);
  const setLastActive = useWorkbench((s) => s.setLastActive);
  const pruneTabs = useWorkbench((s) => s.pruneTabs);

  const { byKey } = indexItems(workspace);
  const matchedItem = item ? byKey.get(item) : undefined;
  const isOpenable = !!matchedItem && !registry.itemType.get(matchedItem.type)?.isContainer;
  const activeItem = isOpenable ? matchedItem : undefined;

  // Compute one canonical open-tab list so TabBar and EditorHost always match on deep links,
  // while filtering out any stale persisted keys whose items were deleted.
  const validStored = storedTabs.filter((k) => {
    const it = byKey.get(k);
    return !!it && !registry.itemType.get(it.type)?.isContainer;
  });
  const openKeys = isOpenable && item && !validStored.includes(item) ? [...validStored, item] : validStored;

  // URL → store (before paint): prune vanished items and record valid deep-linked tabs.
  const syncTabs = useEffectEvent((wsId: string, key: string | undefined, valid: boolean) => {
    const validKeySet = new Set<string>();
    for (const it of workspace.items) {
      if (!registry.itemType.get(it.type)?.isContainer) {
        validKeySet.add(itemKey(it.type, it.id));
      }
    }
    pruneTabs(wsId, validKeySet);
    if (key && valid) {
      openTab(wsId, key);
    } else if (!key) {
      setLastActive(wsId, undefined);
    }
  });
  useLayoutEffect(() => {
    syncTabs(workspace.id, item, isOpenable);
  }, [workspace.id, workspace.items, item, isOpenable]);

  // Publishes live workspace state & actions to `@/features/workspace/contract`.
  useSyncWorkspaceContract(workspace, isOpenable ? item : undefined, activeItem);

  return (
    <div className="ws-detail">
      <title>{`${activeItem ? `${activeItem.name} · ` : ''}${workspace.name} · IDE`}</title>
      <SidebarPanels container="workspace.detail" panels={parsePanels(panels)} />
      <div className="editor-col">
        <TabBar workspace={workspace} openKeys={openKeys} activeKey={item} />
        <EditorHost workspace={workspace} openKeys={openKeys} activeKey={item} />
      </div>
    </div>
  );
}
