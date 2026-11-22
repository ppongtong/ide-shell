import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { AnyRouter } from '@tanstack/react-router';
import { createRegistry, type Plugin, type WorkspaceInfo } from '@/lib/plugin-system';
import { createTabController } from '../src/features/workspace/hooks/useTabs.ts';
import { useWorkbench } from '../src/features/workspace/stores/workbench.ts';
import { resetAllPersisted } from '../src/stores/persist.ts';

const Icon = () => null;

const testPlugin: Plugin = {
  id: 'test.ws',
  itemTypes: [
    { type: 'folder', label: 'Folder', icon: Icon, isContainer: true },
    { type: 'file', label: 'File', icon: Icon },
  ],
};

const workspace: WorkspaceInfo = {
  id: 'acme',
  name: 'Acme',
  items: [
    { id: 'src', type: 'folder', name: 'src', parentId: null },
    { id: 'utils', type: 'file', name: 'utils.ts', parentId: 'src' },
    { id: 'app', type: 'file', name: 'App.tsx', parentId: null },
  ],
};

function createFakeRouter(initialPathname: string, initialItem?: string) {
  const calls: Array<{ item: string | undefined; replace: boolean | undefined }> = [];
  const state = {
    location: {
      pathname: initialPathname,
      search: { item: initialItem } as { item?: string },
    },
    resolvedLocation: {
      pathname: '/workspaces/acme',
      search: { item: initialItem } as { item?: string },
    },
  };

  const router = {
    state,
    navigate(opts: { search: (prev: { item?: string }) => { item?: string }; replace?: boolean }) {
      const nextSearch = opts.search(state.location.search);
      state.location.search = nextSearch;
      calls.push({ item: nextSearch.item, replace: opts.replace });
      return Promise.resolve();
    },
  } as unknown as AnyRouter;

  return { router, state, calls };
}

describe('workspace tab controller', () => {
  it('navigates when URL differs from lastActive (stale/deleted/container ?item=), without re-navigating when already on URL', () => {
    resetAllPersisted();
    const registry = createRegistry([testPlugin]);

    // Simulate: user previously had file:utils open (lastActive = 'file:utils'),
    // then visited a stale or container deep-link (?item=folder:src) where syncTabs left lastActive untouched.
    useWorkbench.getState().openTab('acme', 'file:utils');
    assert.equal(useWorkbench.getState().lastActive['acme'], 'file:utils');

    const { router, calls } = createFakeRouter('/workspaces/acme', 'folder:src');
    const controller = createTabController(() => workspace, registry, router);

    // Clicking the tab in TabBar must navigate away from ?item=folder:src back to ?item=file:utils
    controller.activateKey('file:utils');
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0], { item: 'file:utils', replace: true });

    // Clicking again while already at ?item=file:utils must NOT re-navigate (avoids re-running loaders)
    controller.activateKey('file:utils');
    assert.equal(calls.length, 1);

    // Same for Explorer row click after another stale URL
    router.state.location.search = { item: 'file:deleted' };
    assert.equal(controller.openItemById('utils'), true);
    assert.equal(calls.length, 2);
    assert.deepEqual(calls[1], { item: 'file:utils', replace: true });
  });

  it('supports destructuring closeItemById without losing `this`', () => {
    resetAllPersisted();
    const registry = createRegistry([testPlugin]);
    useWorkbench.getState().openTab('acme', 'file:utils');

    const { router, calls } = createFakeRouter('/workspaces/acme', 'file:utils');
    const { closeItemById } = createTabController(() => workspace, registry, router);

    assert.equal(closeItemById('utils'), true);
    assert.deepEqual(calls, [{ item: undefined, replace: true }]);
  });

  it('aborts tab actions when a navigation away from the workspace is already in flight', () => {
    resetAllPersisted();
    const registry = createRegistry([testPlugin]);
    useWorkbench.getState().openTab('acme', 'file:utils');

    // Pending navigation: resolvedLocation is still /workspaces/acme, but location.pathname moved to /workspaces/globex
    const { router, calls } = createFakeRouter('/workspaces/globex', 'file:utils');
    const controller = createTabController(() => workspace, registry, router);

    assert.equal(controller.isActiveWorkspace('acme'), false);
    assert.equal(controller.openItemById('app'), false);
    assert.equal(controller.closeItemById('utils'), false);
    assert.equal(controller.showDetails(), false);
    assert.equal(calls.length, 0);
    // Tabs in acme were not mutated either
    assert.deepEqual(useWorkbench.getState().tabs['acme'], ['file:utils']);
  });

  it('accepts a trailing slash on the current workspace pathname (/workspaces/acme/)', () => {
    resetAllPersisted();
    const registry = createRegistry([testPlugin]);

    const { router, calls } = createFakeRouter('/workspaces/acme/', undefined);
    const controller = createTabController(() => workspace, registry, router);

    assert.equal(controller.isActiveWorkspace('acme'), true);
    assert.equal(controller.openItemById('app'), true);
    assert.deepEqual(calls, [{ item: 'file:app', replace: false }]);
  });
});
