// ─────────────────────────────────────────────────────────────
// Every OPEN tab's editor stays mounted inside <Activity>; only
// the active one is visible. Keyed by `${workspace.id}:${key}` so
// switching workspaces never leaks state across colliding item IDs.
// ─────────────────────────────────────────────────────────────
import { Activity, Suspense } from 'react';
import { useRegistry } from '@/lib/plugin-system';
import { getItemTypes, parseItem, type WorkspaceInfo } from '@/contracts/workspace';
import { NONE, useWorkbench } from '../stores/workbench';

interface Props {
  workspace: WorkspaceInfo;
  activeKey?: string;
}

export function EditorHost({ workspace, activeKey }: Props) {
  const open = useWorkbench((s) => s.tabs[workspace.id] ?? NONE);
  // Render a newly visited deep-link item immediately on the first pass before syncTabs commits.
  const keys = activeKey && !open.includes(activeKey) ? [...open, activeKey] : open;

  return (
    <div className="editors">
      {!activeKey && <div className="empty">Open an item from the Explorer.</div>}
      {keys.map((key) => (
        <Activity key={`${workspace.id}:${key}`} mode={key === activeKey ? 'visible' : 'hidden'}>
          <div
            id={`panel-${workspace.id}-${key}`}
            className="editor"
            role="tabpanel"
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
  const itemTypes = getItemTypes(useRegistry());
  const ref = parseItem(itemKey);
  if (!ref) return <div className="empty">Invalid item key “{itemKey}”.</div>;

  const item = workspace.items.find((i) => i.id === ref.id && i.type === ref.type);
  if (!item) return <div className="empty">“{itemKey}” is not in this workspace.</div>;

  const Editor = itemTypes.get(item.type)?.editor;
  if (!Editor) return <div className="empty">No editor registered for type “{item.type}”.</div>;

  return (
    <Suspense fallback={<div className="empty">Loading editor…</div>}>
      <Editor workspace={workspace} item={item} />
    </Suspense>
  );
}
