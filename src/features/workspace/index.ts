// Public surface of the workspace feature. app/ and routes/ import from here only.
export { workspacePlugin } from './plugin';
export { workspacesApi } from './api/workspaces';
export { validateDetailSearch, type DetailSearch } from './lib/search';
export { WorkspaceListPage } from './pages/WorkspaceListPage';
export { NewWorkspacePage } from './pages/NewWorkspacePage';
export { WorkspaceDetailPage } from './pages/WorkspaceDetailPage';
export { WorkspaceBreadcrumbs } from './components/WorkspaceBreadcrumbs';
