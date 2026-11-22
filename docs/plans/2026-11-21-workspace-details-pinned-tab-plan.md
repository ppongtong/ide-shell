# Workspace Creation Flow, Pinned Details Tab & Grouped Explorer Implementation Plan

**Goal:** Replace the New Workspace modal with a `/workspaces/new` draft workbench featuring an always-first, non-closable **Details** tab that seeds a primary root node (+ children) and renders a grouped Explorer tree.

**Architecture:** Both `/workspaces/new` (draft mode) and `/workspaces/$wsId` (saved mode) share the same workbench UI (`SidebarPanels` + `TabBar` + `EditorHost`). `Registry.activeRouteActivity(path)` uses longest-prefix matching so `/workspaces/new` highlights only the New Workspace activity without clobbering `lastHref['workspaces']`. Pinned Details maps cleanly to `item === undefined` in the URL and stays mounted in `<Activity>`.

**Tech Stack:** React 19.3, TanStack Router (file-based), Zustand 5, TypeScript 6, Node 24 built-in `node:test`.

---

### Task 1: Longest-prefix route matching on `Registry`
- Add `inArea` and `activeRouteActivity(path)` to `src/lib/plugin-system/registry.ts`.
- Add unit tests in `tests/registry.test.ts` verifying `/workspaces/new` selects `new-workspace` rather than `workspaces`.

### Task 2: Workspace primary types, seeding, update API & reserved slug
- Extend `WorkspaceInfo` (`description?`, `primaryType?`) and `PanelProps` (`workspace: WorkspaceInfo | null`) in `src/lib/plugin-system/types.ts`.
- Add `PRIMARY_TYPES`, reserved `'new'` slug guard, seeded primary root + children in `workspacesApi.create`, and `workspacesApi.update` in `src/features/workspace/api/workspaces.ts`.
- Add unit tests in `tests/workspaces.test.ts`.

### Task 3: `/workspaces/new` route & Activity Bar / Shell wiring
- Create `src/routes/workspaces/new.tsx` and update `src/lib/plugin-system/shell-location.ts` with `'workspace.new'`.
- Update `src/app/shell/ActivityBar.tsx` and `src/app/shell/Shell.tsx` to use `registry.activeRouteActivity(path)`.
- Switch `new-workspace` activity in `src/features/workspace/plugin.ts` to `{ kind: 'route', to: '/workspaces/new' }`, register `primary` `ItemType`, and remove `NewWorkspaceDialog.tsx`.

### Task 4: Pinned Details tab, `WorkspaceDetailsTab`, Grouped `ExplorerPanel` & `collapsed` store state
- Switch `expanded` → `collapsed` (persist `version: 2`) in `src/features/workspace/stores/workbench.ts` so primary roots and type groups default open.
- Create `src/features/workspace/components/WorkspaceDetailsTab.tsx` and `src/features/workspace/pages/NewWorkspacePage.tsx`.
- Update `TabBar.tsx`, `EditorHost.tsx`, `SidebarPanels.tsx`, `ExplorerPanel.tsx`, `WorkspaceBreadcrumbs.tsx`, `WorkspaceListPage.tsx`, `WorkspaceDetailPage.tsx`, `useTabs.ts`, and `src/styles/index.css`.

### Task 5: Regenerate route tree, verify & test
- Run `npx vite build` to update `src/routeTree.gen.ts`.
- Run `npm test && npm run build && npm run build:demo`.
