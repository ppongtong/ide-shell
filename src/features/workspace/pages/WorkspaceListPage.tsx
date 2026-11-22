import { getRouteApi, Link } from '@tanstack/react-router';
import { FolderKanban, Plus } from 'lucide-react';
import { useShell } from '@/stores/shell-store';
import { useWorkbench } from '../stores/workbench';

const workspacesRoute = getRouteApi('/workspaces');

export function WorkspaceListPage() {
  const workspaces = workspacesRoute.useLoaderData();
  const lastActive = useWorkbench((s) => s.lastActive);
  const showDialog = useShell((s) => s.showDialog);

  return (
    <div className="ws-list">
      <title>Workspaces · IDE</title>
      <div className="ws-list-head">
        <h1>Workspaces</h1>
        <button type="button" className="btn btn-inline" onClick={() => showDialog('new-workspace')}>
          <Plus size={14} aria-hidden="true" />
          New workspace
        </button>
      </div>
      <div className="cards">
        {workspaces.map((w) => (
          <Link
            key={w.id}
            className="card"
            to="/workspaces/$wsId"
            params={{ wsId: w.id }}
            search={{ item: lastActive[w.id] }}
          >
            <FolderKanban size={20} />
            <div>
              <strong>{w.name}</strong>
              <p>{w.description || 'No description'}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
