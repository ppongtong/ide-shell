// Public surface of the workspace feature. app/ and routes/ import from here only.
export { workspacePlugin } from './plugin';
export { workspacesApi } from './api/workspaces';
export { WorkspaceListPage } from './pages/WorkspaceListPage';
export { NewWorkspacePage } from './pages/NewWorkspacePage';
export { WorkspaceDetailPage } from './pages/WorkspaceDetailPage';
export { WorkspaceBreadcrumbs } from './components/WorkspaceBreadcrumbs';
