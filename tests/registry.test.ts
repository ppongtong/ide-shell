import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRegistry, type Activity, type Plugin, type SidebarPanel } from '@/lib/plugin-system';
import { workspacePlugin } from '../src/features/workspace/plugin.ts';
import { agentPlugin } from '../src/features/agent/plugin.ts';
import { notebookPlugin } from '../src/features/notebook/plugin.ts';
import { reportsPlugin } from '../src/features/reports/plugin.ts';
import { settingsPlugin } from '../src/features/settings/plugin.ts';
import { useShell } from '../src/stores/shell-store.ts';

const Icon = () => null;
const View = () => null;

const activity = (id: string, order: number, extra: Partial<Activity> = {}): Activity => ({
  id,
  title: id,
  icon: Icon,
  order,
  action: { kind: 'route', to: `/${id}` },
  ...extra,
});

const panel = (id: string, order: number): SidebarPanel => ({
  id,
  title: id,
  container: 'workspace.detail',
  order,
  component: View,
});

describe('createRegistry', () => {
  it('sorts top and bottom activities and container panels by order', () => {
    const plugins: Plugin[] = [
      {
        id: 'p1',
        activities: [
          activity('reports', 30),
          activity('settings', 100, { position: 'bottom' }),
          activity('workspaces', 10),
          activity('new-ws', 90, { position: 'bottom' }),
        ],
        panels: [panel('agent', 20), panel('explorer', 10)],
      },
    ];

    const reg = createRegistry(plugins);
    assert.deepEqual(
      reg.topActivities.map((a) => a.id),
      ['workspaces', 'reports'],
    );
    assert.deepEqual(
      reg.bottomActivities.map((a) => a.id),
      ['new-ws', 'settings'],
    );
    assert.deepEqual(
      reg.panelsFor('workspace.detail').map((p) => p.id),
      ['explorer', 'agent'],
    );
  });

  it('picks the longest matching route activity for nested paths like /workspaces/new', () => {
    const reg = createRegistry([
      {
        id: 'p1',
        activities: [
          activity('workspaces', 10, { action: { kind: 'route', to: '/workspaces', rememberLastLocation: true } }),
          activity('new-workspace', 90, {
            position: 'bottom',
            action: { kind: 'route', to: '/workspaces/new' },
          }),
          activity('settings', 100, { position: 'bottom', action: { kind: 'route', to: '/settings' } }),
        ],
      },
    ]);

    assert.equal(reg.activeRouteActivity('/workspaces')?.id, 'workspaces');
    assert.equal(reg.activeRouteActivity('/workspaces/acme')?.id, 'workspaces');
    assert.equal(reg.activeRouteActivity('/workspaces/new')?.id, 'new-workspace');
    assert.equal(reg.activeRouteActivity('/settings')?.id, 'settings');
    assert.equal(reg.activeRouteActivity('/unknown'), undefined);
  });

  it('allows the same order in different activity positions (top vs bottom)', () => {
    const reg = createRegistry([
      {
        id: 'p1',
        activities: [activity('top-a', 10), activity('bottom-a', 10, { position: 'bottom' })],
      },
    ]);
    assert.equal(reg.topActivities.length, 1);
    assert.equal(reg.bottomActivities.length, 1);
  });

  it('throws on duplicate activity order within the same position', () => {
    assert.throws(
      () =>
        createRegistry([
          { id: 'p1', activities: [activity('workspaces', 10)] },
          { id: 'p2', activities: [activity('git', 10)] },
        ]),
      /Duplicate activity order 10 in "top" \("workspaces" and "git"\)/,
    );
  });

  it('throws on duplicate panel order within the same container', () => {
    assert.throws(
      () =>
        createRegistry([
          { id: 'p1', panels: [panel('explorer', 10)] },
          { id: 'p2', panels: [panel('outline', 10)] },
        ]),
      /Duplicate panel order 10 in "workspace\.detail" \("explorer" and "outline"\)/,
    );
  });

  it('throws on duplicate IDs, unknown panel toggles, and mismatched plugin page routes', () => {
    assert.throws(
      () => createRegistry([{ id: 'p1', activities: [activity('dup', 10)] }, { id: 'p2', activities: [activity('dup', 20)] }]),
      /Duplicate activity "dup"/,
    );

    assert.throws(
      () =>
        createRegistry([
          { id: 'p1', itemTypes: [{ type: 'file', label: 'File', icon: Icon }] },
          { id: 'p2', itemTypes: [{ type: 'file', label: 'Duplicate', icon: Icon }] },
        ]),
      /Duplicate item type "file"/,
    );

    assert.throws(
      () =>
        createRegistry([
          {
            id: 'p1',
            activities: [activity('agent', 20, { action: { kind: 'togglePanel', panelId: 'missing' } })],
          },
        ]),
      /toggles unknown panel "missing"/,
    );

    assert.throws(
      () =>
        createRegistry([
          {
            id: 'p1',
            activities: [activity('reports', 30, { action: { kind: 'route', to: '/wrong', page: View } })],
          },
        ]),
      /must use to: "\/reports"/,
    );
  });

  it('validates built-in plugins including route, togglePanel, dialog, and external itemType renderer plugins', () => {
    const explorerStub: Plugin = {
      id: 'core.explorer',
      panels: [{ id: 'explorer', title: 'Explorer', container: 'workspace.detail', order: 10, alwaysOn: true, component: View }],
    };
    const reg = createRegistry([
      workspacePlugin,
      explorerStub,
      agentPlugin,
      notebookPlugin,
      reportsPlugin,
      settingsPlugin,
    ]);
    const shortcuts = reg.activity.get('shortcuts');
    assert.equal(shortcuts?.action.kind, 'dialog');

    const notebookType = reg.itemType.get('notebook');
    assert.equal(notebookType?.pluralLabel, 'Notebooks');
    assert.ok(notebookType?.editor, 'expected notebookPlugin to register a lazy editor renderer');

    useShell.getState().showDialog('shortcuts');
    assert.equal(useShell.getState().openDialog, 'shortcuts');
    useShell.getState().hideDialog();
    assert.equal(useShell.getState().openDialog, null);
  });
});
