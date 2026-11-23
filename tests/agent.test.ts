import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { useWorkspaceContract, type WorkspaceSnapshot } from '../src/features/workspace/contract.ts';
import { useExplorerContract } from '../src/features/explorer/contract.ts';
import { agentApi, runAgentAction } from '../src/features/agent/api/agent.ts';

const primaryRoot = { id: 'primary-acme', type: 'primary', name: 'Storefront Core', parentId: null } as const;

const snapshot: WorkspaceSnapshot = {
  workspace: {
    id: 'acme',
    name: 'Acme',
    items: [
      primaryRoot,
      { id: 'src', type: 'folder', name: 'src', parentId: null },
      { id: 'utils', type: 'file', name: 'utils.ts', parentId: 'src', content: '' },
    ],
  },
  primaryItem: primaryRoot,
  openItems: [],
};

describe('agentApi & action runner', () => {
  it('returns generic item actions without hardcoding item types in agentApi', async () => {
    const openRes = await agentApi.ask('open utils.ts', snapshot, 0);
    assert.deepEqual(openRes.actions, [{ target: 'workspace', type: 'openItem', itemId: 'utils' }]);

    const folderRes = await agentApi.ask('open src', snapshot, 0);
    assert.deepEqual(folderRes.actions, [{ target: 'workspace', type: 'openItem', itemId: 'src' }]);

    const closeRes = await agentApi.ask('close utils.ts', snapshot, 0);
    assert.deepEqual(closeRes.actions, [{ target: 'workspace', type: 'closeItem', itemId: 'utils' }]);
  });

  it('routes openItem and closeItem through workspace/explorer contracts without leaking item-type rules', () => {
    const revealed: string[] = [];
    const opened: string[] = [];

    useWorkspaceContract.getState().setActions({
      isActiveWorkspace: (id) => id === 'acme',
      showPrimary: () => true,
      openItem: (id) => {
        if (id === 'utils') {
          opened.push(id);
          return true;
        }
        return false;
      },
      closeItem: () => false,
      setPrimaryItem: async () => true,
    });
    useExplorerContract.getState().setActions({
      revealItem: (id) => {
        if (id === 'src' || id === 'primary-acme' || id === 'utils') {
          revealed.push(id);
          return true;
        }
        return false;
      },
      collapseAll: () => {},
      expandAll: () => {},
    });

    try {
      // Folder: openItem returns false, falls back cleanly to Explorer revealItem('src')
      assert.equal(runAgentAction({ target: 'workspace', type: 'openItem', itemId: 'src' }), null);
      assert.deepEqual(revealed, ['src']);

      // Primary item when already on Primary tab (openItem -> showPrimary false, revealItem expands it)
      assert.equal(runAgentAction({ target: 'workspace', type: 'openItem', itemId: 'primary-acme' }), null);
      assert.deepEqual(revealed, ['src', 'primary-acme']);

      // File: opens tab AND reveals in Explorer
      assert.equal(runAgentAction({ target: 'workspace', type: 'openItem', itemId: 'utils' }), null);
      assert.deepEqual(opened, ['utils']);

      // Unknown item: both return false
      assert.equal(
        runAgentAction({ target: 'workspace', type: 'openItem', itemId: 'missing' }),
        'Could not open that item.',
      );
      assert.equal(
        runAgentAction({ target: 'workspace', type: 'closeItem', itemId: 'src' }),
        'That tab is not open.',
      );
    } finally {
      useWorkspaceContract.getState().clear();
      useExplorerContract.getState().clear();
    }
  });

  it('returns explorer actions for collapse all and expand all commands', async () => {
    const collapseRes = await agentApi.ask('collapse all', snapshot, 0);
    assert.deepEqual(collapseRes.actions, [{ target: 'explorer', type: 'collapseAll' }]);

    const expandRes = await agentApi.ask('expand all', snapshot, 0);
    assert.deepEqual(expandRes.actions, [{ target: 'explorer', type: 'expandAll' }]);
  });

  it('reads primaryItem from WorkspaceSnapshot without coupling to feature/primary', async () => {
    const configured = await agentApi.ask('what is the primary key?', snapshot, 0);
    assert.match(configured.text, /Storefront Core/);
    assert.match(configured.text, /id: primary-acme, type: primary/);
    assert.deepEqual(configured.actions, []);

    const unsetSnapshot: WorkspaceSnapshot = {
      workspace: { id: 'fresh', name: 'Fresh', items: [] },
      primaryItem: undefined,
      openItems: [],
    };
    const unset = await agentApi.ask('primary key', unsetSnapshot, 0);
    assert.match(unset.text, /no primary key selected yet/);
    assert.deepEqual(unset.actions, [{ target: 'workspace', type: 'showPrimary' }]);
  });
});
