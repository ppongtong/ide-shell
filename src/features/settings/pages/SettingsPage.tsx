// Settings also shows what the registry loaded — handy while building plugins.
import { useRegistry } from '@/lib/plugin-system';
import { resetAllPersisted } from '@/stores/persist';

export function SettingsPage() {
  const registry = useRegistry();

  return (
    <div className="plugin-page">
      <title>Settings · IDE</title>
      <h1>Settings</h1>

      <h2>Workbench</h2>
      <button
        type="button"
        className="btn"
        onClick={() => {
          resetAllPersisted();
        }}
      >
        Close all tabs and reset panel sizes
      </button>

      <h2>Loaded plugins</h2>
      <div className="scroll">
        <table className="registry">
          <thead>
            <tr>
              <th scope="col">Plugin</th>
              <th scope="col">Activities</th>
              <th scope="col">Panels</th>
              <th scope="col">Item types</th>
            </tr>
          </thead>
          <tbody>
            {registry.plugins.map((p) => (
              <tr key={p.id}>
                <td><code>{p.id}</code></td>
                <td>{p.activities?.map((a) => `${a.id} (${a.action.kind})`).join(', ') || '—'}</td>
                <td>{p.panels?.map((x) => x.id).join(', ') || '—'}</td>
                <td>{p.itemTypes?.map((t) => t.type).join(', ') || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
