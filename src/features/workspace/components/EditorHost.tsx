// ─────────────────────────────────────────────────────────────
// Pinned Details tab + every OPEN item tab stay mounted inside
// <Activity>; only the active one is visible. Keyed by workspace
// so switching workspaces never leaks state across colliding IDs.
// ─────────────────────────────────────────────────────────────
import { Activity, Suspense } from 'react';
import { parseItem, useRegistry, type WorkspaceInfo } from '@/lib/plugin-system';
import type { Workspace } from '../api/workspaces';
import { NONE, useWorkbench } from '../stores/workbench';
import { WorkspaceDetailsTab } from './WorkspaceDetailsTab';

interface Props {
  workspace: Workspace | null;
  activeKey?: string;
}

export function EditorHost({ workspace, activeKey }: Props) {
  const wsKey = workspace?.id ?? '__new__';
  const open = useWorkbench((s) => (workspace ? (s.tabs[workspace.id] ?? NONE) : NONE));
  // Render a newly visited deep-link item immediately on the first pass before syncTabs commits.
  const keys = workspace && activeKey && !open.includes(activeKey) ? [...open, activeKey] : open;

  return (
    <div className="editors">
      <Activity key={`${wsKey}:__details__`} mode={!activeKey ? 'visible' : 'hidden'}>
        <div
          id={`panel-${wsKey}-__details__`}
          className="editor"
          role="tabpanel"
          tabIndex={0}
          aria-labelledby={`tab-${wsKey}-__details__`}
        >
          <WorkspaceDetailsTab workspace={workspace} />
        </div>
      </Activity>

      {workspace &&
        keys.map((key) => (
          <Activity key={`${workspace.id}:${key}`} mode={key === activeKey ? 'visible' : 'hidden'}>
            <div
              id={`panel-${workspace.id}-${key}`}
              className="editor"
              role="tabpanel"
              tabIndex={0}
              aria-labelledby={`tab-${workspace.id}-${key}`}
            >
              <EditorFor workspace={workspace} itemKey={key} />
            </div>
          </Activity>
        ))}
    </div>
  );
}

function EditorFor({ workspace, itemKey }: { workspace: WorkspaceInfo; itemKey: string }) {
  const registry = useRegistry();
  const ref = parseItem(itemKey);
  if (!ref) return <div className="empty">Invalid item key “{itemKey}”.</div>;

  const item = workspace.items.find((i) => i.id === ref.id && i.type === ref.type);
  if (!item) return <div className="empty">“{itemKey}” is not in this workspace.</div>;

  const Editor = registry.itemType.get(item.type)?.editor;
  if (!Editor) return <div className="empty">No editor registered for type “{item.type}”.</div>;

  return (
    <Suspense fallback={<div className="empty">Loading editor…</div>}>
      <Editor workspace={workspace} item={item} />
    </Suspense>
  );
}
