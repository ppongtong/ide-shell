import { getRouteApi, Link } from '@tanstack/react-router';
import { FolderKanban, Plus } from 'lucide-react';
import { useWorkbench } from '../stores/workbench';

const workspacesRoute = getRouteApi('/workspaces');

export function WorkspaceListPage() {
  const workspaces = workspacesRoute.useLoaderData();
  const lastActive = useWorkbench((s) => s.lastActive);

  return (
    <div className="ws-list">
      {/* React 19: <title> anywhere in the tree is hoisted into <head>. */}
      <title>Workspaces · IDE</title>
      <div className="ws-list-head">
        <h1>Workspaces</h1>
        <Link className="btn btn-inline" to="/workspaces/new">
          <Plus size={14} aria-hidden="true" />
          New workspace
        </Link>
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
