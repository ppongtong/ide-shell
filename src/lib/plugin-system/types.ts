// ─────────────────────────────────────────────────────────────
// Generic plugin contract. Zero app- or domain-specific types.
// Domain contracts (e.g. src/contracts/workspace.ts) augment
// `PluginContributions` to add typed domain extension points.
// ─────────────────────────────────────────────────────────────
import type { ComponentType, LazyExoticComponent } from 'react';

export type Icon = ComponentType<{ size?: number | string }>;
export type Lazy<P = Record<string, never>> = LazyExoticComponent<ComponentType<P>> | ComponentType<P>;

/** "Where am I", derived generically from the matched route and ?panels= param. */
export interface ShellLocation {
  readonly path: string;
  /** Matched leaf route id, e.g. '/workspaces/$wsId', '/settings', '/$activityId/$'. */
  readonly routeId?: string;
  /** Extra sidebar panels switched on via ?panels=, e.g. ['agent']. */
  readonly panels: readonly string[];
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

// ── Sidebar panels (generic container slots) ───────────────

export interface SidebarPanel {
  readonly id: string;
  readonly title: string;
  /** Identifier of the host container (typically a route id, e.g. '/workspaces/$wsId'). */
  readonly container: string;
  /** Top-to-bottom order in the stack. */
  readonly order: number;
  /** Always shown. Others appear when toggled on via ?panels= */
  readonly alwaysOn?: boolean;
  /** Panels read their host context from route loaders or shared bridge stores. */
  readonly component: Lazy;
}

// ── Plugin ──────────────────────────────────────────────────

/**
 * Augmentation point for domain-specific plugin contributions
 * (see src/contracts/workspace.ts for an example).
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PluginContributions {}

export interface Plugin extends Readonly<Partial<PluginContributions>> {
  readonly id: string;
  readonly activities?: readonly Activity[];
  readonly panels?: readonly SidebarPanel[];
}

/** Identity helper for autocomplete and type checks. */
export const definePlugin = (p: Plugin): Plugin => p;
