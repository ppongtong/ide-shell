import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRegistry, type Plugin } from '@/lib/plugin-system';
import { useWorkspaceContract, type WorkspaceSnapshot } from '../src/features/workspace/contract.ts';
import { useExplorerContract } from '../src/features/explorer/contract.ts';
import { agentApi, runAgentAction } from '../src/features/agent/api/agent.ts';

const Icon = () => null;

const testPlugin: Plugin = {
  id: 'test.types',
  itemTypes: [
    { type: 'primary', label: 'Primary', icon: Icon, isContainer: true, pinnedRoot: true },
    { type: 'folder', label: 'Folder', icon: Icon, isContainer: true },
    { type: 'file', label: 'File', icon: Icon },
  ],
};

const snapshot: WorkspaceSnapshot = {
  workspace: {
    id: 'acme',
    name: 'Acme',
    items: [
      { id: 'primary-storefront', type: 'primary', name: 'Storefront Core', parentId: null },
      { id: 'src', type: 'folder', name: 'src', parentId: null },
      { id: 'utils', type: 'file', name: 'utils.ts', parentId: 'src', content: '' },
    ],
  },
  isDraft: false,
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

  it('routes container openItem actions to Explorer revealItems (plus showDetails for pinnedRoot)', () => {
    const registry = createRegistry([testPlugin]);
    const revealed: Array<{ wsId: string; ids: readonly string[] }> = [];
    let detailsShown = 0;

    useWorkspaceContract.getState().setActions({
      isActiveWorkspace: (id) => id === 'acme',
      showDetails: () => {
        detailsShown += 1;
        return true;
      },
      openItem: () => false,
      closeItem: () => false,
    });
    useExplorerContract.getState().setActions({
      revealItems: (wsId, ids) => {
        revealed.push({ wsId, ids });
      },
      collapseAll: () => true,
      expandAll: () => true,
    });

    try {
      const folderNote = runAgentAction(
        { target: 'workspace', type: 'openItem', itemId: 'src' },
        snapshot.workspace!,
        registry.itemType,
      );
      assert.equal(folderNote, null);
      assert.equal(detailsShown, 0);
      assert.deepEqual(revealed, [{ wsId: 'acme', ids: ['src'] }]);

      const rootNote = runAgentAction(
        { target: 'workspace', type: 'openItem', itemId: 'primary-storefront' },
        snapshot.workspace!,
        registry.itemType,
      );
      assert.equal(rootNote, null);
      assert.equal(detailsShown, 1);
      assert.deepEqual(revealed[1], { wsId: 'acme', ids: ['primary-storefront'] });
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
});
