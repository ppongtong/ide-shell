// ─────────────────────────────────────────────────────────────
// Workspace details = split panel:
//   [ stacked sidebar panels | tab bar + editors ]
// ─────────────────────────────────────────────────────────────
import { useEffect, useEffectEvent } from 'react';
import { getRouteApi } from '@tanstack/react-router';
import { parseItem, parsePanels, useRegistry } from '@/lib/plugin-system';
import { useWorkbench } from '../stores/workbench';
import { useSyncWorkspaceBridge } from '../hooks/useSyncWorkspaceBridge';
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
  // Guarded so invalid/container ?item= params never pollute persisted tabs.
  const syncTabs = useEffectEvent((wsId: string, key: string | undefined, valid: boolean) => {
    if (key && valid) {
      openTab(wsId, key);
      setLastActive(wsId, key);
    } else if (!key) {
      setLastActive(wsId, undefined);
    }
  });
  useEffect(() => {
    syncTabs(workspace.id, item, isOpenable);
  }, [workspace.id, item, isOpenable]);

  // Publishes live workspace state & actions to src/stores/workspace-bridge.ts.
  useSyncWorkspaceBridge(workspace, activeItem);

  return (
    <div className="ws-detail">
      <title>{`${activeItem ? `${activeItem.name} · ` : ''}${workspace.name} · IDE`}</title>
      <SidebarPanels workspace={workspace} panels={parsePanels(panels)} />
      <div className="editor-col">
        <TabBar workspace={workspace} activeKey={item} />
        <EditorHost workspace={workspace} activeKey={item} />
      </div>
    </div>
  );
}
