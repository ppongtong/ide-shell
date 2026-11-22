# Pluggable Primary Item & Uniform `ItemRenderer` Design

**Date:** 2026-11-22
**Status:** Approved

## Goals
1. Replace `ItemType` (and its overlapping `isPrimary`, `isContainer`, `editor`, `details` flags) with one uniform **`ItemRenderer`** contract: `{ type, label, pluralLabel?, icon, component? }`.
2. Make `type: 'primary'` a pluggable feature (`src/features/primary/`): its single `component` (`PrimaryKeyComponent`) renders the **Primary Key Selector** when a workspace has no primary item yet (`item === undefined`), and renders **`PrimaryKeyDetail`** once selected (`item !== undefined`).
3. Replace `/workspaces/new` (and all `workspace === null` / `isDraft` branching) with a lightweight **`NewWorkspaceDialog`** (`Name` + optional `Description`) that creates the workspace and navigates directly to `/workspaces/$wsId`, landing on the pinned `type: 'primary'` tab.
4. Signal primary key selection through `useWorkspaceContract` (`actions.setPrimaryItem(...)`), keeping `ItemRendererProps` (`{ workspace, item }`) identical across `primary`, `notebook`, `file`, and `dataset`.

## Architecture

### 1. Plugin SDK (`src/lib/plugin-system/`)
- **`ItemRendererProps`:** `{ readonly workspace: WorkspaceInfo; readonly item?: Item }` (`item` is `undefined` only for `type: 'primary'` before a primary key is selected).
- **`ItemRenderer`:** `{ readonly type: string; readonly label: string; readonly pluralLabel?: string; readonly icon: Icon; readonly component?: Lazy<ItemRendererProps> }`.
- **`Plugin.itemRenderers` & `Registry.itemRenderer`:** Replaces `itemTypes` / `itemType`.
- **Folders & nested children without `isContainer`:** Any item with children (`parentId === item.id`) gets an expand/collapse chevron in Explorer. Items whose `type` has no `component` (e.g. `type: 'folder'`) toggle expand/collapse on click; `type: 'primary'` activates the pinned first tab (`?item=` omitted); all other types with a `component` open `?item=type:id`.

### 2. Workspace Creation & Primary Signal (`src/features/workspace/`)
- **`NewWorkspaceDialog` (`kind: 'dialog'`):** Collects `Name` + optional `Description`, calls `workspacesApi.create({ name, description })` (which creates a workspace with `items: []`), invalidates `/workspaces`, closes the modal, and navigates to `/workspaces/$wsId`.
- **Removes:** `src/routes/workspaces/new.tsx`, `NewWorkspacePage.tsx`, `WorkspaceDetailsTab.tsx`, `PRIMARY_TYPES`, and `isDraft` / `workspace: Workspace | null` checks.
- **`WorkspaceActions.setPrimaryItem` (`src/features/workspace/contract.ts`):** Accepts `{ name, content?, children? }`, saves the root `{ id, type: 'primary', name, parentId: null, content }` item (plus optional child items) via `workspacesApi.setPrimary`, and runs `await router.invalidate()`.

### 3. Pluggable Primary Feature (`src/features/primary/`)
- Registers `{ type: 'primary', label: 'Primary Key', icon: KeyRound, component: lazy(() => import('./components/PrimaryKeyComponent')) }`.
- **`PrimaryKeyComponent`:**
  - When `item === undefined`: renders selectable primary domain keys/entities with preview; clicking **Select primary key** calls `useWorkspaceContract.getState().actions?.setPrimaryItem(...)`.
  - When `item !== undefined`: renders `PrimaryKeyDetail` displaying the selected primary key metadata, workspace summary, and child items.

### 4. Explorer, TabBar & EditorHost
- **`TabBar`:** Pinned index `0` tab displays `primaryItem?.name ?? primaryRenderer?.label ?? 'Primary'`.
- **`EditorHost`:** Pinned index `0` `<Activity>` renders `registry.itemRenderer.get('primary')?.component` with `{ workspace, item: primaryItem }` (or an inline fallback if no `'primary'` plugin is loaded). Regular tabs render `registry.itemRenderer.get(item.type)?.component`.
- **`ExplorerPanel`:** Pins the `type === 'primary'` root item (and its nested children) at the top, or a pinned `Select primary key…` row when no primary item has been chosen yet, followed by collapsible sections for each non-`'primary'` renderer with a `component`.
