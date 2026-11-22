// ─────────────────────────────────────────────────────────────
// ShellLocation = "where am I", derived in a single structurally-shared
// router subscription from pathname, ?panels=, and route staticData.
// Zero hardcoded route paths, and tab switches (?item=) never trigger updates.
// ─────────────────────────────────────────────────────────────
import { useRouterState } from '@tanstack/react-router';
import { EMPTY, type ShellLocation } from './types';
import { parsePanels } from './search-params';

export function useShellLocation(): ShellLocation {
  return useRouterState({
    structuralSharing: true,
    select: (state): ShellLocation => {
      let container: string | undefined;
      for (const m of state.matches) {
        if (m.staticData?.container) container = m.staticData.container;
      }
      const rawPanels = (state.location.search as { panels?: unknown }).panels;
      const panels = typeof rawPanels === 'string' && rawPanels ? parsePanels(rawPanels) : EMPTY;
      return {
        path: state.location.pathname,
        container,
        panels,
      };
    },
  });
}
