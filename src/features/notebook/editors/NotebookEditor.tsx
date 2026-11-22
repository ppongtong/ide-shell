// Custom renderer registered for `item.type === 'notebook'` by `example.notebook`.
import { useState } from 'react';
import { Play } from 'lucide-react';
import type { ItemRendererProps } from '@/lib/plugin-system';

interface NotebookCell {
  readonly id: string;
  readonly kind: 'markdown' | 'code';
  readonly source: string;
}

function parseCells(raw: string | undefined): NotebookCell[] {
  if (!raw?.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (c): c is NotebookCell =>
          typeof c === 'object' &&
          c !== null &&
          typeof (c as NotebookCell).id === 'string' &&
          ((c as NotebookCell).kind === 'markdown' || (c as NotebookCell).kind === 'code') &&
          typeof (c as NotebookCell).source === 'string',
      );
    }
  } catch {
    /* Fall back to single code cell when content is plain text */
  }
  return [{ id: 'cell-1', kind: 'code', source: raw }];
}

export default function NotebookEditor({ workspace, item }: ItemRendererProps) {
  const cells = parseCells(item?.content);
  const [runs, setRuns] = useState<Record<string, number>>({});

  return (
    <div className="notebook">
      <header className="notebook-head">
        <strong>{item?.name ?? 'Notebook'}</strong>
        <span className="hint">{`${workspace.name} · ${cells.length} cells`}</span>
      </header>

      <div className="notebook-cells">
        {cells.map((cell) => {
          if (cell.kind === 'markdown') {
            return (
              <div key={cell.id} className="nb-cell markdown">
                <p>{cell.source}</p>
              </div>
            );
          }

          const runCount = runs[cell.id] ?? 0;
          return (
            <div key={cell.id} className="nb-cell">
              <div className="nb-cell-bar">
                <span className="hint">{runCount > 0 ? `In [${runCount}]` : 'In [ ]'}</span>
                <button
                  type="button"
                  className="btn ghost nb-run"
                  onClick={() => setRuns((prev) => ({ ...prev, [cell.id]: (prev[cell.id] ?? 0) + 1 }))}
                >
                  <Play size={11} aria-hidden="true" />
                  Run cell
                </button>
              </div>
              <pre className="nb-code">{cell.source}</pre>
              {runCount > 0 && (
                <output className="nb-out">{`(demo) Simulated run #${runCount} — state kept alive across tab switches`}</output>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
