// Example `kind: 'dialog'` activity content rendered inside `DialogHost` -> `Modal`.
import type { DialogProps } from '@/lib/plugin-system';

const shortcuts = [
  { keys: '← / →', action: 'Switch open tabs (when TabBar is focused)' },
  { keys: 'Home / End', action: 'Jump to pinned Primary tab or last open tab' },
  { keys: '↑ / ↓', action: 'Resize stacked sidebar panels (when divider is focused)' },
  { keys: 'Esc', action: 'Dismiss modal dialog' },
];

export default function ShortcutsDialog({ close }: DialogProps) {
  return (
    <div className="form">
      <h2>Keyboard shortcuts</h2>
      <dl className="shortcuts-list">
        {shortcuts.map((s) => (
          <div key={s.keys} className="shortcut-row">
            <dt>
              <kbd>{s.keys}</kbd>
            </dt>
            <dd>{s.action}</dd>
          </div>
        ))}
      </dl>
      <div className="form-actions">
        <button type="button" className="btn" onClick={close}>
          Done
        </button>
      </div>
    </div>
  );
}
