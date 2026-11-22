import type { EditorProps } from '@/contracts/workspace';

export default function DatasetEditor({ item }: EditorProps) {
  const [header = [], ...rows] = (item.content ?? '')
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split(','));

  return (
    <div className="dataset">
      <table>
        <thead>
          <tr>
            {header.map((h, i) => (
              <th key={`${i}-${h}`} scope="col">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
