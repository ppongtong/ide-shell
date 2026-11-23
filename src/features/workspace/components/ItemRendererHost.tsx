// ─────────────────────────────────────────────────────────────
// Pinned Primary tab + every OPEN item tab stay mounted inside
// <Activity>; only the active one is visible. Both render through
// `registry.itemRenderer.get(type)?.component` — ItemRendererHost
// never knows what any plugin renders inside its tab.
// ─────────────────────────────────────────────────────────────
import { Suspense } from 'react';
import { LazyActivity } from '@/components/ui/LazyActivity';
import { parseItem, PRIMARY_TYPE, useRegistry, type Item, type WorkspaceInfo } from '@/lib/plugin-system';
import { indexItems } from '../lib/search';

interface Props {
  workspace: WorkspaceInfo;
  primaryItem: Item | undefined;
  openKeys: readonly string[];
  activeKey?: string;
}

export function ItemRendererHost({ workspace, primaryItem, openKeys, activeKey }: Props) {
  // If the URL holds an unopenable/unknown `?item=`, still render its inline error view cleanly.
  const keys = activeKey && !openKeys.includes(activeKey) ? [...openKeys, activeKey] : openKeys;

  return (
    <div className="editors">
      <LazyActivity key={`${workspace.id}:__primary__`} active={!activeKey}>
        <div
          id={`panel-${workspace.id}-__primary__`}
          className="editor"
          role="tabpanel"
          tabIndex={0}
          aria-labelledby={`tab-${workspace.id}-__primary__`}
        >
          <PrimarySlot workspace={workspace} item={primaryItem} />
        </div>
      </LazyActivity>

      {keys.map((key) => (
        <LazyActivity key={`${workspace.id}:${key}`} active={key === activeKey}>
          <div
            id={`panel-${workspace.id}-${key}`}
            className="editor"
            role="tabpanel"
            tabIndex={0}
            aria-labelledby={`tab-${workspace.id}-${key}`}
          >
            <ItemSlot workspace={workspace} itemKey={key} />
          </div>
        </LazyActivity>
      ))}
    </div>
  );
}

function PrimarySlot({ workspace, item }: { workspace: WorkspaceInfo; item: Item | undefined }) {
  const Component = useRegistry().itemRenderer.get(PRIMARY_TYPE)?.component;
  if (!Component) {
    return <div className="empty">No renderer registered for type “primary”.</div>;
  }
  return (
    <Suspense fallback={<div className="empty">Loading…</div>}>
      <Component workspace={workspace} item={item} />
    </Suspense>
  );
}

function ItemSlot({ workspace, itemKey }: { workspace: WorkspaceInfo; itemKey: string }) {
  const registry = useRegistry();
  const ref = parseItem(itemKey);
  if (!ref) return <div className="empty">Invalid item key “{itemKey}”.</div>;

  const item = indexItems(workspace).byKey.get(itemKey);
  if (!item) return <div className="empty">“{itemKey}” is not in this workspace.</div>;

  const Component = registry.itemRenderer.get(item.type)?.component;
  if (!Component) return <div className="empty">No renderer registered for type “{item.type}”.</div>;

  return (
    <Suspense fallback={<div className="empty">Loading…</div>}>
      <Component workspace={workspace} item={item} />
    </Suspense>
  );
}
