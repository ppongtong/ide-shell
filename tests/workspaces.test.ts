import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createSlug, workspacesApi } from '../src/features/workspace/api/workspaces.ts';

describe('workspaces api', () => {
  it('creates collision-free URL slugs', () => {
    assert.equal(createSlug('Acme', ['acme']), 'acme-2');
    assert.equal(createSlug('Acme', ['acme', 'acme-2']), 'acme-3');
    assert.equal(createSlug('  My App!  ', []), 'my-app');
    assert.equal(createSlug('***', []), 'workspace');
  });

  it('creates an unconfigured workspace first, then sets its primary item and child items on selection', async () => {
    const created = await workspacesApi.create({
      name: 'Fresh WS',
      description: 'Before primary selection',
    });

    assert.equal(created.name, 'Fresh WS');
    assert.equal(created.description, 'Before primary selection');
    assert.deepEqual(created.items, []);

    const updated = await workspacesApi.setPrimary(created.id, {
      name: 'Storefront Core',
      content: JSON.stringify({ key: 'storefront-us', region: 'US-East' }),
      children: [
        { id: 'checkout', type: 'file', name: 'checkout.ts', content: 'export const ok = true;\n' },
      ],
    });

    const primaryRoot = updated.items.find((i) => i.type === 'primary' && i.parentId === null);
    assert.ok(primaryRoot, 'expected a primary root item after setPrimary');
    assert.equal(primaryRoot.name, 'Storefront Core');

    const children = updated.items.filter((i) => i.parentId === primaryRoot.id);
    assert.equal(children.length, 1);
    assert.equal(children[0]?.name, 'checkout.ts');
  });
});
