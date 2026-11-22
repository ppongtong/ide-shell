import { useState } from 'react';
import type { EditorProps } from '@/lib/plugin-system';

export default function FileEditor({ item }: EditorProps) {
  const baseContent = item.content ?? '';
  // `draft === null` means clean (reflects latest `item.content` if refreshed from backend);
  // a string holds unsaved local edits preserved while hidden inside `<Activity>`.
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? baseContent;
  const dirty = draft !== null && draft !== baseContent;

  return (
    <div className="file-editor">
      <textarea
        className="code"
        spellCheck={false}
        value={text}
        onChange={(e) => {
          const next = e.target.value;
          setDraft(next === baseContent ? null : next);
        }}
        aria-label={item.name}
      />
      {dirty && <p className="status">Unsaved changes (kept while you switch tabs)</p>}
    </div>
  );
}
