// ─────────────────────────────────────────────────────────────
// Workspace details = split panel:
//   [ stacked sidebar panels | tab bar + item renderers ]
// ─────────────────────────────────────────────────────────────
import { useEffectEvent, useLayoutEffect } from 'react';
import { getRouteApi } from '@tanstack/react-router';
import { EMPTY, parsePanels, useRegistry } from '@/lib/plugin-system';
import { indexItems, openableKeys } from '../lib/search';
import { useWorkbench } from '../stores/workbench';
import { useSyncWorkspaceContract } from '../hooks/useSyncWorkspaceContract';
import { SidebarPanels } from '../components/SidebarPanels';
import { TabBar } from '../components/TabBar';
import { ItemRendererHost } from '../components/ItemRendererHost';

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
  const validKeySet = openableKeys(workspace, registry.itemRenderer);
  const isOpenable = !!item && validKeySet.has(item);
  const activeItem = isOpenable ? byKey.get(item) : undefined;
  const primaryItem = workspace.items.find((i) => i.type === 'primary' && i.parentId === null);

  // Compute one canonical open-tab list so TabBar and ItemRendererHost always match on deep links.
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

  useSyncWorkspaceContract(workspace, item, activeItem);

  return (
    <div className="ws-detail">
      <title>{`${activeItem ? `${activeItem.name} · ` : ''}${workspace.name} · IDE`}</title>
      <SidebarPanels container="workspace.detail" panels={parsePanels(panels)} />
      <div className="editor-col">
        <TabBar workspace={workspace} primaryItem={primaryItem} openKeys={openKeys} activeKey={item} />
        <ItemRendererHost workspace={workspace} primaryItem={primaryItem} openKeys={openKeys} activeKey={item} />
      </div>
    </div>
  );
}
