// ─────────────────────────────────────────────────────────────
// ShellLocation = "where am I", derived in a single structurally-shared
// router subscription from pathname, ?panels=, and route staticData.
// Zero hardcoded route paths, and tab switches (?item=) never trigger updates.
// ─────────────────────────────────────────────────────────────
import { useRouterState } from '@tanstack/react-router';
import type { ShellLocation } from './types';
import { parsePanels } from './search-params';

const NO_PANELS: readonly string[] = Object.freeze([]);

export function useShellLocation(): ShellLocation {
  return useRouterState({
    structuralSharing: true,
    select: (state): ShellLocation => {
      let container: string | undefined;
      let view: string | undefined;
      for (const m of state.matches) {
        if (m.staticData?.container) container = m.staticData.container;
        if (m.staticData?.view) view = m.staticData.view;
      }
      const rawPanels = (state.location.search as { panels?: unknown }).panels;
      const panels = typeof rawPanels === 'string' && rawPanels ? parsePanels(rawPanels) : NO_PANELS;
      return {
        path: state.location.pathname,
        container,
        view,
        panels,
      };
    },
  });
}
