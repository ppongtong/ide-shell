// ─────────────────────────────────────────────────────────────
// Activity bar. Three kinds of button:
//   route        → "go to"    : selected (accent bar) while inside its area. One at a time.
//   togglePanel  → "show/hide": on (filled) while its panel shows. Independent of selection.
//   dialog       → "action"   : opens a dialog. No highlight.
// ─────────────────────────────────────────────────────────────
import { useNavigate } from '@tanstack/react-router';
import {
  togglePanel,
  useRegistry,
  useShellLocation,
  type Activity,
  type ShellLocation,
} from '@/lib/plugin-system';
import { ActivityBarButton, type ActivityButtonState } from '@/components/ui/ActivityBarButton';
import { useShell } from '@/stores/shell-store';

function activityState(a: Activity, loc: ShellLocation, activeRouteId: string | undefined): ActivityButtonState {
  switch (a.action.kind) {
    case 'route':
      return a.id === activeRouteId ? 'selected' : 'off';
    case 'togglePanel':
      return loc.panels.includes(a.action.panelId) ? 'on' : 'off';
    case 'dialog':
      return 'off'; // the dialog itself shows something happened
  }
}

export function ActivityBar() {
  const registry = useRegistry();
  const location = useShellLocation();
  const activeRouteId = registry.activeRouteActivity(location.path)?.id;

  return (
    <nav className="activity-bar" aria-label="Activities">
      <div className="group">
        {registry.topActivities.map((a) => (
          <ActivityItem key={a.id} activity={a} location={location} activeRouteId={activeRouteId} />
        ))}
      </div>
      <div className="group">
        {registry.bottomActivities.map((a) => (
          <ActivityItem key={a.id} activity={a} location={location} activeRouteId={activeRouteId} />
        ))}
      </div>
    </nav>
  );
}

function ActivityItem({
  activity: a,
  location,
  activeRouteId,
}: {
  activity: Activity;
  location: ShellLocation;
  activeRouteId: string | undefined;
}) {
  const navigate = useNavigate();
  const last = useShell((s) => s.lastHref[a.id]);
  const showDialog = useShell((s) => s.showDialog);

  function onClick() {
    const action = a.action;
    switch (action.kind) {
      case 'dialog':
        showDialog(a.id);
        return;

      case 'togglePanel':
        if (!location.wsId) return;
        void navigate({
          to: '/workspaces/$wsId',
          params: { wsId: location.wsId },
          search: (prev) => ({ ...prev, panels: togglePanel(prev.panels, action.panelId) }),
          replace: true, // panel on/off is not worth a Back step
        });
        return;

      case 'route':
        if (activeRouteId !== a.id) {
          // From another area: back to where you were, or to the area's home.
          if (action.rememberLastLocation && last) void navigate({ href: last });
          else void navigate({ to: action.to });
        } else if (location.path !== action.to) {
          // Inside but deeper (e.g. a workspace): go up to the area's home.
          void navigate({ to: action.to });
        }
    }
  }

  return (
    <ActivityBarButton
      title={a.title}
      icon={a.icon}
      state={activityState(a, location, activeRouteId)}
      disabled={!(a.enabledWhen?.(location) ?? true)}
      disabledReason={a.disabledReason}
      role={a.action.kind === 'togglePanel' ? 'toggle' : a.action.kind === 'dialog' ? 'dialog' : 'link'}
      onClick={onClick}
    />
  );
}
