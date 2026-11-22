import { useState } from 'react';
import type { EditorProps } from '@/contracts/workspace';

export default function FileEditor({ item }: EditorProps) {
  // Plain local state. EditorHost keeps this component mounted inside <Activity>,
  // so edits survive switching tabs. (Saving to the backend is up to you.)
  const [text, setText] = useState(item.content ?? '');
  const dirty = text !== (item.content ?? '');
  return (
    <div className="file-editor">
      <textarea
        className="code"
        spellCheck={false}
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label={item.name}
      />
      {dirty && <p className="status">Unsaved changes (kept while you switch tabs)</p>}
    </div>
  );
}
