# Pluggable Primary Renderer & Uniform `ItemRenderer` Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Simplify item rendering to one uniform `ItemRenderer` (`{ type, label, pluralLabel?, icon, component? }`), replace `/workspaces/new` with `NewWorkspaceDialog`, and extract `type: 'primary'` into a pluggable `src/features/primary/` feature.

**Architecture:** `NewWorkspaceDialog` creates an empty workspace (`items: []`) and navigates straight to `/workspaces/$wsId`. `EditorHost` renders the `type: 'primary'` plugin's `component` in the pinned first tab (`item === undefined` -> selector UI; `item !== undefined` -> detail UI), and `PrimaryKeyComponent` commits selection via `useWorkspaceContract.getState().actions.setPrimaryItem(...)`.

**Tech Stack:** React 19.3, React Compiler 1.0, TanStack Router, Zustand 5, TypeScript 6, Node 24 `node:test`.

---

### Task 1: Refactor `lib/plugin-system` to `ItemRenderer`
- **Files:** Modify `src/lib/plugin-system/types.ts`, `src/lib/plugin-system/registry.ts`, `tests/registry.test.ts`
- **Steps:**
  1. Update `tests/registry.test.ts` to assert `itemRenderers` / `reg.itemRenderer` (RED).
  2. Replace `EditorProps` + `ItemType` (`isContainer`, `pinnedRoot`, `editor`) with `ItemRendererProps` (`{ workspace, item? }`) + `ItemRenderer` (`{ type, label, pluralLabel?, icon, component? }`), and rename `Plugin.itemTypes` -> `itemRenderers` and `Registry.itemType` -> `itemRenderer`.

### Task 2: Workspace API (`setPrimary`), `NewWorkspaceDialog` & `workspace/contract`
- **Files:** Modify `src/features/workspace/api/workspaces.ts`, `src/features/workspace/contract.ts`, `src/features/workspace/lib/search.ts`, `src/features/workspace/hooks/useTabs.ts`, `src/features/workspace/hooks/useSyncWorkspaceContract.ts`, `src/features/workspace/plugin.ts`, `src/features/workspace/index.ts`, `src/features/workspace/pages/WorkspaceListPage.tsx`, `src/features/workspace/pages/WorkspaceDetailPage.tsx`, `src/features/workspace/components/TabBar.tsx`, `src/features/workspace/components/EditorHost.tsx`, `src/features/workspace/editors/FileEditor.tsx`, `src/features/workspace/editors/DatasetEditor.tsx`; Create `src/features/workspace/components/NewWorkspaceDialog.tsx`; Delete `src/routes/workspaces/new.tsx`, `src/features/workspace/pages/NewWorkspacePage.tsx`, `src/features/workspace/components/WorkspaceDetailsTab.tsx`; Test `tests/workspaces.test.ts`, `tests/tabs.test.ts`.
- **Steps:**
  1. Write failing tests in `tests/workspaces.test.ts` for creating an empty workspace (`items: []`) and setting its primary item + seeded children via `workspacesApi.setPrimary` (RED).
  2. Implement `workspacesApi.create({ name, description })` and `workspacesApi.setPrimary(wsId, input)`, expose `setPrimaryItem` on `WorkspaceActions`, remove `isDraft` / `null` workspace branches, and add `NewWorkspaceDialog`.

### Task 3: Create `src/features/primary/` & Update `explorer`, `notebook`, and `agent`
- **Files:** Create `src/features/primary/{index.ts, plugin.ts, components/PrimaryKeyComponent.tsx}`; Modify `src/features/explorer/lib/tree.ts`, `src/features/explorer/components/ExplorerPanel.tsx`, `src/features/notebook/plugin.ts`, `src/features/notebook/editors/NotebookEditor.tsx`, `src/features/agent/api/agent.ts`, `src/features/agent/components/AgentPanel.tsx`, `src/app/plugins.ts`; Test `tests/explorer.test.ts`, `tests/agent.test.ts`.
- **Steps:**
  1. Update `tests/explorer.test.ts` and `tests/agent.test.ts` for `ItemRenderer` (`!renderer?.component` for folders, `type === 'primary'` pinned first even before selection) (RED).
  2. Implement `primaryPlugin` (`PrimaryKeyComponent` rendering selector when `!item` and `PrimaryKeyDetail` when `item` exists), update `ExplorerPanel`, `NotebookEditor`, and `AgentPanel`, and register `primaryPlugin` in `src/app/plugins.ts`.

### Task 4: Update `SettingsPage`, CSS, Docs & Run Full Verification
- **Files:** Modify `src/features/settings/pages/SettingsPage.tsx`, `src/styles/index.css`, `README.md`, `docs/DESIGN.md`.
- **Steps:**
  1. Update `SettingsPage` column (`Item renderers`), update styles for `PrimaryKeyComponent`, and sync `README.md` + `docs/DESIGN.md`.
  2. Run `npm run typecheck && npm run lint && npm test && npm run build && npm run build:demo` and verify 0 React Compiler bailouts.
