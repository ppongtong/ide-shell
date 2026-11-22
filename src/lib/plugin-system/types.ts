// ─────────────────────────────────────────────────────────────
// The IDE plugin SDK contract. Every feature talks to the shell
// through these types — built-in features included.
// ─────────────────────────────────────────────────────────────
import type { ComponentType, LazyExoticComponent } from 'react';

export type Icon = ComponentType<{ size?: number | string }>;
export type Lazy<P = Record<string, never>> = LazyExoticComponent<ComponentType<P>> | ComponentType<P>;

/** "Where am I", derived from the active route's URL + staticData (zero feature route strings). */
export interface ShellLocation {
  readonly path: string;
  /** Container ID declared by the active route's staticData (e.g. 'workspace.detail'). */
  readonly container?: string;
  /** Optional view tag declared by the active route's staticData (e.g. 'workspace.new'). */
  readonly view?: string;
  /** Extra sidebar panels switched on via ?panels=, e.g. ['agent']. Always-on panels are not listed. */
  readonly panels: readonly string[];
}

// ── Core workspace item model & editor contribution point ──

export interface Item {
  readonly id: string;
  readonly type: string;
  readonly name: string;
  readonly parentId: string | null;
  readonly content?: string;
}

export interface WorkspaceInfo {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly primaryType?: string;
  readonly items: readonly Item[];
}

// ── Activities (activity-bar buttons) ───────────────────────

/** Go to: selects an area. Highlight "selected" (accent bar). Only one at a time. */
export interface RouteAction {
  readonly kind: 'route';
  /** Home of this area, e.g. '/workspaces'. Plugin pages must use `/${activity.id}`. */
  readonly to: string;
  /** Plugin-hosted page rendered under /$activityId/$ */
  readonly page?: Lazy<{ subPath: string }>;
  /** From another area, return to the last URL inside this one. */
  readonly rememberLastLocation?: boolean;
}

/** Show/hide: a sidebar panel. Highlight "on" (filled). Can be on next to a selected route. */
export interface TogglePanelAction {
  readonly kind: 'togglePanel';
  readonly panelId: string;
}

export interface DialogProps {
  /** Close the dialog (same as Escape or a backdrop click). */
  close: () => void;
}

/** Action: opens a dialog. No highlight; focus returns to the button on close. */
export interface DialogAction {
  readonly kind: 'dialog';
  readonly dialog: Lazy<DialogProps>;
}

export interface Activity {
  readonly id: string;
  readonly title: string;
  readonly icon: Icon;
  /** Sort order inside its group (top or bottom). */
  readonly order: number;
  readonly position?: 'top' | 'bottom';
  /** false → shown but disabled */
  readonly enabledWhen?: (location: ShellLocation) => boolean;
  /** Tooltip suffix shown when `enabledWhen` returns false. */
  readonly disabledReason?: string;
  readonly action: RouteAction | TogglePanelAction | DialogAction;
}

// ── Sidebar panels (stacked in a container's sidebar) ──────

export interface SidebarPanel {
  readonly id: string;
  readonly title: string;
  /** Which container hosts it (matches route staticData.container, e.g. 'workspace.detail'). */
  readonly container: string;
  /** Top-to-bottom order in the stack. */
  readonly order: number;
  /** Always shown (Explorer). Others appear when toggled on via ?panels= */
  readonly alwaysOn?: boolean;
  /** Panels read shared state via feature contracts rather than shell-hardcoded props. */
  readonly component: Lazy;
}

// ── Explorer item types ─────────────────────────────────────

export interface EditorProps {
  readonly workspace: WorkspaceInfo;
  readonly item: Item;
}

export interface ItemType {
  readonly type: string;
  readonly label: string;
  /** Plural section heading in the Explorer (defaults to `${label}s`). */
  readonly pluralLabel?: string;
  readonly icon: Icon;
  /** Containers expand/collapse instead of opening a tab. */
  readonly isContainer?: boolean;
  /** Rendered inside the tab. Omit for containers. */
  readonly editor?: Lazy<EditorProps>;
}

// ── Plugin ──────────────────────────────────────────────────

export interface Plugin {
  readonly id: string;
  readonly activities?: readonly Activity[];
  readonly panels?: readonly SidebarPanel[];
  readonly itemTypes?: readonly ItemType[];
}

/** Identity helper for autocomplete and type checks. */
export const definePlugin = (p: Plugin): Plugin => p;
