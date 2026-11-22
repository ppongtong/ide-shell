// ─────────────────────────────────────────────────────────────
// Workspace details = split panel:
//   [ stacked sidebar panels | tab bar + editors ]
// ─────────────────────────────────────────────────────────────
import { useEffect, useEffectEvent } from 'react';
import { getRouteApi } from '@tanstack/react-router';
import { parseItem, parsePanels, useRegistry } from '@/lib/plugin-system';
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
  const openTab = useWorkbench((s) => s.openTab);
  const setLastActive = useWorkbench((s) => s.setLastActive);

  const ref = parseItem(item);
  const matchedItem = ref ? workspace.items.find((i) => i.id === ref.id && i.type === ref.type) : undefined;
  const isOpenable = !!matchedItem && !registry.itemType.get(matchedItem.type)?.isContainer;
  const activeItem = isOpenable ? matchedItem : undefined;

  // URL → store: a shared link or refresh lands on an item that may not be open yet.
  // `openTab` and `setLastActive` short-circuit when already synced (zero extra writes on UI tab clicks).
  const syncTabs = useEffectEvent((wsId: string, key: string | undefined, valid: boolean) => {
    if (key && valid) {
      openTab(wsId, key);
    } else if (!key) {
      setLastActive(wsId, undefined);
    }
  });
  useEffect(() => {
    syncTabs(workspace.id, item, isOpenable);
  }, [workspace.id, item, isOpenable]);

  // Publishes live workspace state & actions to `@/features/workspace/contract`.
  useSyncWorkspaceContract(workspace, isOpenable ? item : undefined, activeItem);

  return (
    <div className="ws-detail">
      <title>{`${activeItem ? `${activeItem.name} · ` : ''}${workspace.name} · IDE`}</title>
      <SidebarPanels container="workspace.detail" panels={parsePanels(panels)} />
      <div className="editor-col">
        <TabBar workspace={workspace} activeKey={item} />
        <EditorHost workspace={workspace} activeKey={item} />
      </div>
    </div>
  );
}
