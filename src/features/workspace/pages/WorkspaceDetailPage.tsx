// ─────────────────────────────────────────────────────────────
// Workspace details = split panel:
//   [ stacked sidebar panels | tab bar + editors ]
// ─────────────────────────────────────────────────────────────
import { useEffectEvent, useLayoutEffect } from 'react';
import { getRouteApi } from '@tanstack/react-router';
import { EMPTY, parsePanels, useRegistry } from '@/lib/plugin-system';
import { indexItems, openableKeys } from '../lib/search';
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
  const validKeySet = openableKeys(workspace, registry.itemType);
  const isOpenable = !!item && validKeySet.has(item);
  const activeItem = isOpenable ? byKey.get(item) : undefined;

  // Compute one canonical open-tab list so TabBar and EditorHost always match on deep links.
  const validStored = storedTabs.filter((k) => validKeySet.has(k));
  const openKeys = isOpenable && !validStored.includes(item) ? [...validStored, item] : validStored;

  // 1. Prune vanished/deleted items only when the workspace or its items change (not on tab clicks).
  useLayoutEffect(() => {
    pruneTabs(workspace.id, validKeySet);
  }, [workspace.id, validKeySet, pruneTabs]);

  // 2. Sync valid deep-linked or switched `?item=` into the persisted workbench store.
  const syncActiveTab = useEffectEvent((wsId: string, key: string | undefined, valid: boolean) => {
    if (key && valid) {
      openTab(wsId, key);
    } else if (!key) {
      setLastActive(wsId, undefined);
    }
  });
  useLayoutEffect(() => {
    syncActiveTab(workspace.id, item, isOpenable);
  }, [workspace.id, item, isOpenable]);

  // Pass raw `item` as `activeKey` so Explorer and TabBar stay consistent on unopenable `?item=` URLs.
  useSyncWorkspaceContract(workspace, item, activeItem);

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
