// ─────────────────────────────────────────────────────────────
// Demo of the workspace bridge: shows what the agent can read and
// lets you call the actions by hand. Remove once the real agent
// drives the actions from its replies.
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useWorkspaceBridge, type WorkspaceActions } from '@/stores/workspace-bridge';

export function BridgeDemo() {
  const current = useWorkspaceBridge((s) => s.current);
  const [picked, setPicked] = useState('');
  const [result, setResult] = useState({ wsId: '', text: '' });

  if (!current) return null;
  const { workspace, activeItem, openItems } = current;
  // The pick may belong to another workspace (after switching): fall back to the first item.
  const itemId = workspace.items.some((i) => i.id === picked) ? picked : (workspace.items[0]?.id ?? '');

  const run = (action: keyof WorkspaceActions) => {
    const actions = useWorkspaceBridge.getState().actions;
    if (!actions) return;
    const ok = actions[action](itemId);
    setResult({ wsId: workspace.id, text: `${action}("${itemId}") → ${ok}` });
  };

  return (
    <details className="agent-demo">
      <summary>Workspace bridge (demo)</summary>
      <dl>
        <dt>Workspace</dt>
        <dd>{workspace.name}</dd>
        <dt>Active</dt>
        <dd>{activeItem?.name ?? '–'}</dd>
        <dt>Tabs</dt>
        <dd>{openItems.map((i) => i.name).join(', ') || '–'}</dd>
      </dl>
      <div className="agent-demo-row">
        <select aria-label="Item" value={itemId} onChange={(e) => setPicked(e.target.value)}>
          {workspace.items.map((i) => (
            <option key={i.id} value={i.id}>{i.name}</option>
          ))}
        </select>
        <button type="button" className="btn ghost" onClick={() => run('openItem')}>Open</button>
        <button type="button" className="btn ghost" onClick={() => run('closeItem')}>Close</button>
      </div>
      {/* Only show the last result for the workspace it ran in. */}
      {result.wsId === workspace.id && <p className="hint agent-demo-result">{result.text}</p>}
    </details>
  );
}
