// ─────────────────────────────────────────────────────────────
// ShellLocation = "where am I", derived generically from the
// current TanStack Router match (no hardcoded route paths).
// ─────────────────────────────────────────────────────────────
import { useLocation, useMatches } from '@tanstack/react-router';
import type { ShellLocation } from './types';
import { parsePanels } from './search-params';

export function useShellLocation(): ShellLocation {
  const path = useLocation({ select: (l) => l.pathname });
  const leaf = useMatches({ select: (ms) => ms.at(-1) });
  const rawPanels = (leaf?.search as { panels?: unknown } | undefined)?.panels;
  const panels = parsePanels(typeof rawPanels === 'string' ? rawPanels : undefined);
  return { path, routeId: leaf?.routeId, panels };
}

/** Is `path` inside the area whose home is `to`? '/workspaces/acme' is inside '/workspaces'. */
export const inArea = (path: string, to: string) => path === to || path.startsWith(to + '/');
