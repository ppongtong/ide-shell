// ─────────────────────────────────────────────────────────────
// The plugin contract. Every feature talks to the shell only
// through these types — built-in features included.
// ─────────────────────────────────────────────────────────────
import type { ComponentType, LazyExoticComponent } from 'react';

export type Icon = ComponentType<{ size?: number | string }>;
export type Lazy<P> = LazyExoticComponent<ComponentType<P>> | ComponentType<P>;

/** "Where am I", derived from the URL only (see shell-location.ts). */
export interface ShellLocation {
  path: string;
  view: 'workspace.list' | 'workspace.detail' | 'settings' | 'plugin' | 'other';
  wsId?: string;
  /** Extra sidebar panels switched on, e.g. ['agent']. Always-on panels are not listed. */
  panels: string[];
  /** Active tab, e.g. { type: 'file', id: 'utils' } */
  item?: { type: string; id: string };
}

// ── Workspace data shared with panels and editors ──────────

export interface Item {
  id: string;
  type: string;
  name: string;
  parentId: string | null;
  content?: string;
}

export interface WorkspaceInfo {
  id: string;
  name: string;
  items: Item[];
}

// ── Activities (activity-bar buttons) ───────────────────────

/** Go to: selects an area. Highlight "selected" (accent bar). Only one at a time. */
export interface RouteAction {
  kind: 'route';
  /** Home of this area, e.g. '/workspaces'. Plugin pages must use `/${activity.id}`. */
  to: string;
  /** Plugin-hosted page rendered under /$activityId/$ */
  page?: Lazy<{ subPath: string }>;
  /** From another area, return to the last URL inside this one. */
  rememberLastLocation?: boolean;
}

/** Show/hide: a sidebar panel. Highlight "on" (filled). Can be on next to a selected route. */
export interface TogglePanelAction {
  kind: 'togglePanel';
  panelId: string;
}

export interface DialogProps {
  /** Close the dialog (same as Escape or a backdrop click). */
  close: () => void;
}

/** Action: opens a dialog. No highlight; focus returns to the button on close. */
export interface DialogAction {
  kind: 'dialog';
  dialog: Lazy<DialogProps>;
}

export interface Activity {
  id: string;
  title: string;
  icon: Icon;
  /** Sort order inside its group (top or bottom). */
  order: number;
  position?: 'top' | 'bottom';
  /** false → shown but disabled */
  enabledWhen?: (location: ShellLocation) => boolean;
  /** Tooltip suffix shown when `enabledWhen` returns false. */
  disabledReason?: string;
  action: RouteAction | TogglePanelAction | DialogAction;
}

// ── Sidebar panels (stacked in the workspace sidebar) ──────

/** Panels receive the host workspace; cross-feature tab state & actions live in workspace-bridge. */
export interface PanelProps {
  workspace: WorkspaceInfo;
}

export interface SidebarPanel {
  id: string;
  title: string;
  /** Which screen hosts it. Only workspace details has a sidebar today. */
  container: 'workspace.detail';
  /** Top-to-bottom order in the stack. */
  order: number;
  /** Always shown (Explorer). Others appear when toggled on via ?panels= */
  alwaysOn?: boolean;
  component: Lazy<PanelProps>;
}

// ── Explorer item types ─────────────────────────────────────

export interface EditorProps {
  workspace: WorkspaceInfo;
  item: Item;
}

export interface ItemType {
  type: string;
  label: string;
  icon: Icon;
  /** Folders expand/collapse instead of opening a tab. */
  isContainer?: boolean;
  /** Rendered inside the tab. Omit for containers. */
  editor?: Lazy<EditorProps>;
}

// ── Plugin ──────────────────────────────────────────────────

export interface Plugin {
  id: string;
  activities?: Activity[];
  panels?: SidebarPanel[];
  itemTypes?: ItemType[];
}

/** Identity helper for autocomplete and type checks. */
export const definePlugin = (p: Plugin): Plugin => p;
