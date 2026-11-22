import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Item, ItemType } from '../src/lib/plugin-system/types.ts';
import { buildExplorerTree } from '../src/features/explorer/lib/tree.ts';
import { useExplorerStore } from '../src/features/explorer/stores/explorer-store.ts';
import { resetAllPersisted } from '../src/stores/persist.ts';

const Icon = () => null;

const itemTypes = new Map<string, ItemType>([
  ['root-bundle', { type: 'root-bundle', label: 'Bundle', icon: Icon, isContainer: true, pinnedRoot: true }],
  ['folder', { type: 'folder', label: 'Folder', icon: Icon, isContainer: true }],
  ['file', { type: 'file', label: 'File', pluralLabel: 'Files', icon: Icon }],
  ['dataset', { type: 'dataset', label: 'Dataset', pluralLabel: 'Datasets', icon: Icon }],
]);

describe('explorer tree & store', () => {
  it('pins pinnedRoot item types with nested children and groups remaining leaf items by type', () => {
    const items: Item[] = [
      { id: 'primary-1', type: 'root-bundle', name: 'Core', parentId: null },
      { id: 'child-b', type: 'file', name: 'b.ts', parentId: 'primary-1' },
      { id: 'child-a', type: 'file', name: 'a.ts', parentId: 'primary-1' },
      { id: 'z-file', type: 'file', name: 'zeta.ts', parentId: null },
      { id: 'a-file', type: 'file', name: 'alpha.ts', parentId: null },
    ];

    const tree = buildExplorerTree(items, itemTypes);
    assert.deepEqual(
      tree.primaryRoots.map((i) => i.id),
      ['primary-1'],
    );
    assert.deepEqual(
      (tree.byParent.get('primary-1') ?? []).map((i) => i.name),
      ['a.ts', 'b.ts'],
    );
    // Primary subtree items are not duplicated in the Files group below
    assert.deepEqual(
      (tree.byItemType.get('file') ?? []).map((i) => i.name),
      ['alpha.ts', 'zeta.ts'],
    );
    assert.deepEqual(
      tree.leafTypes.map((t) => t.type),
      ['file', 'dataset'],
    );
  });

  it('toggles, collapses all, reveals paths, and resets with resetAllPersisted', () => {
    resetAllPersisted();
    const store = useExplorerStore.getState();

    store.toggleNode('acme', 'group:file');
    assert.deepEqual(useExplorerStore.getState().collapsed['acme'], ['group:file']);

    store.collapseAll('acme', ['primary-1', 'group:file', 'group:dataset']);
    assert.deepEqual(useExplorerStore.getState().collapsed['acme'], ['primary-1', 'group:file', 'group:dataset']);

    store.revealItems('acme', ['primary-1', 'group:file']);
    assert.deepEqual(useExplorerStore.getState().collapsed['acme'], ['group:dataset']);

    resetAllPersisted();
    assert.deepEqual(useExplorerStore.getState().collapsed, {});
  });
});
