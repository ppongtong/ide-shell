// Custom renderer registered for `item.type === 'notebook'` by `example.notebook`.
// Kept mounted inside `<Activity>` by `EditorHost`, so cell run outputs survive tab switches.
import { useState } from 'react';
import { Play } from 'lucide-react';
import type { EditorProps } from '@/lib/plugin-system';

export default function NotebookEditor({ workspace, item }: EditorProps) {
  const cells = (item.content ?? '')
    .trim()
    .split(/\n---\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  const [runs, setRuns] = useState<Record<number, number>>({});

  return (
    <div className="notebook">
      <header className="notebook-head">
        <strong>{item.name}</strong>
        <span className="hint">{`${workspace.name} · ${cells.length} cells`}</span>
      </header>

      <div className="notebook-cells">
        {cells.map((cell, index) => {
          const isMarkdown = cell.startsWith('#');
          const runCount = runs[index] ?? 0;

          if (isMarkdown) {
            return (
              <div key={index} className="nb-cell markdown">
                <p>{cell.replace(/^#+\s*/, '')}</p>
              </div>
            );
          }

          return (
            <div key={index} className="nb-cell">
              <div className="nb-cell-bar">
                <span className="hint">{runCount > 0 ? `In [${runCount}]` : 'In [ ]'}</span>
                <button
                  type="button"
                  className="btn ghost nb-run"
                  onClick={() => setRuns((prev) => ({ ...prev, [index]: (prev[index] ?? 0) + 1 }))}
                >
                  <Play size={11} aria-hidden="true" />
                  Run cell
                </button>
              </div>
              <pre className="nb-code">{cell}</pre>
              {runCount > 0 && (
                <output className="nb-out">{`✓ Executed (${runCount}x) — output kept alive across tab switches`}</output>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
