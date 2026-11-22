import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PRIMARY_TYPES, createSlug, workspacesApi } from '../src/features/workspace/api/workspaces.ts';

describe('workspaces api', () => {
  it('avoids collisions and reserves the "new" route segment', () => {
    assert.equal(createSlug('New', []), 'new-2');
    assert.equal(createSlug('Acme', ['acme']), 'acme-2');
    assert.equal(createSlug('Acme', ['acme', 'acme-2']), 'acme-3');
    assert.equal(createSlug('  My App!  ', []), 'my-app');
    assert.equal(createSlug('***', []), 'workspace');
  });

  it('creates a workspace seeded with its primary root node and children', async () => {
    const preset = PRIMARY_TYPES[0];
    assert.ok(preset, 'expected at least one primary type preset');

    const created = await workspacesApi.create({
      name: 'New',
      primaryType: preset.id,
      description: 'Test workspace',
    });

    assert.notEqual(created.id, 'new');
    assert.equal(created.name, 'New');
    assert.equal(created.primaryType, preset.id);
    assert.equal(created.description, 'Test workspace');

    const primaryRoot = created.items.find((i) => i.type === 'primary' && i.parentId === null);
    assert.ok(primaryRoot, 'expected a primary root item');
    assert.equal(primaryRoot.name, preset.rootName);

    const children = created.items.filter((i) => i.parentId === primaryRoot.id);
    assert.equal(children.length, preset.children.length);
  });

  it('updates name and description while keeping primaryType locked', async () => {
    const preset = PRIMARY_TYPES[1] ?? PRIMARY_TYPES[0]!;
    const created = await workspacesApi.create({
      name: 'Editable WS',
      primaryType: preset.id,
      description: 'Before',
    });

    const updated = await workspacesApi.update(created.id, {
      name: 'Renamed WS',
      description: 'After',
    });

    assert.equal(updated.name, 'Renamed WS');
    assert.equal(updated.description, 'After');
    assert.equal(updated.primaryType, preset.id);
  });
});
