# Workspace Creation Flow, Pinned Details Tab & Grouped Explorer Design

**Date:** 2026-11-21
**Status:** Approved

## Goals
1. Clicking **New workspace** skips the modal dialog and navigates directly to `/workspaces/new` — a workspace workbench in draft mode with a non-closable, always-first **Details** tab for required fields.
2. Submitting the required fields (Name + Primary Type) creates the workspace, seeds its primary root node (`type: 'primary'`) with child items, locks the Primary Type, refreshes `/workspaces`, and replaces the URL with `/workspaces/$wsId`.
3. Every saved workspace keeps the **Details** tab permanently pinned as the first, non-closable tab (`?item` omitted = Details active).
4. Explorer renders the primary root node pinned first (with its children), followed by collapsible root sections for every non-container `ItemType` registered in `registry.itemType`.

## Architecture

### 1. Routing & Activity Bar
- **Route `src/routes/workspaces/new.tsx` (`/workspaces/new`):** Static route matching before `/workspaces/$wsId`. Declares `staticData: { crumb: () => 'New workspace' }` and renders `NewWorkspacePage`.
- **Activity `new-workspace`:** Changes from `{ kind: 'dialog', dialog: ... }` to `{ kind: 'route', to: '/workspaces/new' }`. Removes `NewWorkspaceDialog.tsx` (`DialogHost` + `Modal` remain in the shell for future dialog plugins).
- **Longest-prefix activity matching:** Add `activeRouteActivity(path, activities)` in `src/lib/plugin-system/shell-location.ts` so `/workspaces/new` activates only `new-workspace` (longest `action.to` match) rather than also matching `/workspaces` or overwriting `lastHref['workspaces']`.
- **Slug collision guard:** `workspacesApi.create` reserves `'new'` so naming a workspace `"New"` generates id `'new-2'`.

### 2. Data Model
- `WorkspaceInfo` adds `readonly description?: string` and `readonly primaryType?: string`.
- `workspacePlugin.itemTypes` adds `{ type: 'primary', label: 'Primary', icon: KeyRound, isContainer: true }`.
- `PRIMARY_TYPES` in `src/features/workspace/api/workspaces.ts` defines selectable primary templates (`storefront`, `analytics`, `internal-tool`), each seeding 1 `type: 'primary'` root item + 2 child `file`/`dataset` items (`parentId: primaryRoot.id`). Existing mock workspaces (`acme`, `globex`) also include a primary root node and `primaryType`.
- `workspacesApi.create(input)` creates the seeded workspace; `workspacesApi.update(id, { name, description })` updates editable metadata on saved workspaces.

### 3. Shared Workbench & Components
- **Draft vs Saved pages:** Both `NewWorkspacePage` (`/workspaces/new`) and `WorkspaceDetailPage` (`/workspaces/$wsId`) render the same workbench frame (`Sidebar | TabBar + EditorHost`).
  - Draft mode (`/workspaces/new`): sidebar shows Explorer with a setup prompt (*"Complete the required fields in Details and click Create to initialize this workspace."*), TabBar shows only the pinned **Details** tab, and EditorHost renders `<WorkspaceDetailsTab workspace={null} />`.
  - Saved mode (`/workspaces/$wsId`): TabBar always renders pinned **Details** at index `0` (no close button, active when `!activeKey`, included in ArrowLeft/ArrowRight/Home/End keyboard navigation), followed by closable `tabs.open`. EditorHost renders `<WorkspaceDetailsTab workspace={workspace} />` inside `<Activity mode={!activeKey ? 'visible' : 'hidden'}>` ahead of regular tabs. Closing the last closable tab navigates to `item: undefined`, returning cleanly to Details.
- **`WorkspaceDetailsTab`:**
  - Draft mode: required **Name**, required **Primary Type** selector (previewing the root node + child items it creates), optional **Description**, **Create workspace** + **Cancel** buttons. On create: auto-expands the new primary root in `useWorkbench`, invalidates `/workspaces`, and navigates with `replace: true` to `/workspaces/$wsId`.
  - Saved mode: **Primary Type** displayed read-only/locked; **Name** and **Description** editable with **Save changes** + feedback status.
- **Grouped `ExplorerPanel`:**
  - Draft mode (`workspace === null`): setup prompt.
  - Saved mode: renders `type === 'primary'` root items pinned first (with their nested children), followed by collapsible root sections for each non-container `ItemType` from `registry.itemType` (e.g. `Files`, `Datasets`, plus any plugin-registered item types) containing items of that type not already under a primary root.

### 4. Testing & Verification
- Unit tests for `activeRouteActivity` (longest-prefix matching for `/workspaces/new` vs `/workspaces/acme`) and `workspacesApi.create` (primary root + child seeding and reserved `'new'` slug).
- Full `npm test`, `npm run build`, `npm run build:demo`, and live dev server check.
