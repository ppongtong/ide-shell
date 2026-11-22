// Generic URL search-param helpers for shell sidebar panels (?panels=agent,outline).

export const parsePanels = (s?: string): string[] => (s ? s.split(',').filter(Boolean) : []);

/** Toggle one panel id; returns undefined (no param) when nothing is on. */
export function togglePanel(s: string | undefined, id: string): string | undefined {
  const list = parsePanels(s);
  const next = list.includes(id) ? list.filter((p) => p !== id) : [...list, id];
  return next.length ? next.join(',') : undefined;
}
