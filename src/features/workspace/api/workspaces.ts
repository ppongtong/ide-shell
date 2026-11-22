// Mock backend. Swap the bodies for real fetch calls.
import { EMPTY, type Item, type WorkspaceInfo } from '@/lib/plugin-system';
import type { PrimarySelectionInput } from '../contract';

export interface Workspace extends WorkspaceInfo {
  readonly description: string;
}
export type WorkspaceSummary = Omit<Workspace, 'items'>;

export function createSlug(name: string, existingIds: Iterable<string>): string {
  const taken = new Set(existingIds);
  const base =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'workspace';
  let id = base;
  for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
  return id;
}

const db: Workspace[] = [
  {
    id: 'acme',
    name: 'Acme',
    description: 'Storefront app and sales data',
    items: [
      {
        id: 'primary-acme',
        type: 'primary',
        name: 'Storefront Core',
        parentId: null,
        content: JSON.stringify({
          key: 'storefront-core',
          source: 'commerce.orders_v2',
          description: 'Customer-facing web storefront, checkout flow, and product catalog.',
        }),
      },
      {
        id: 'primary-acme-checkout',
        type: 'file',
        name: 'checkout.ts',
        parentId: 'primary-acme',
        content: 'export function calculateTotal(prices: number[]) {\n  return prices.reduce((a, b) => a + b, 0);\n}\n',
      },
      {
        id: 'primary-acme-catalog',
        type: 'dataset',
        name: 'catalog.csv',
        parentId: 'primary-acme',
        content: 'sku,name,price\nSKU-1,Keyboard,120\nSKU-2,Monitor,380\n',
      },
      {
        id: 'utils',
        type: 'file',
        name: 'utils.ts',
        parentId: null,
        content: 'export const sum = (a: number, b: number) => a + b;\n',
      },
      {
        id: 'app',
        type: 'file',
        name: 'App.tsx',
        parentId: null,
        content: 'export function App() {\n  return <h1>Hello Acme</h1>;\n}\n',
      },
      {
        id: 'sales',
        type: 'dataset',
        name: 'sales.csv',
        parentId: null,
        content: 'month,revenue\nJan,120\nFeb,135\nMar,160\n',
      },
      {
        id: 'readme',
        type: 'file',
        name: 'README.md',
        parentId: null,
        content: '# Acme\n\nDemo workspace.\n',
      },
      {
        id: 'revenue-analysis',
        type: 'notebook',
        name: 'revenue.nb',
        parentId: null,
        content: JSON.stringify([
          { id: 'intro', kind: 'markdown', source: 'Quarterly Revenue Forecast' },
          {
            id: 'avg-calc',
            kind: 'code',
            source: '# Compute Q1 monthly average\nconst months = [120, 135, 160];\nconst avg = months.reduce((a, b) => a + b, 0) / months.length;',
          },
          {
            id: 'q2-proj',
            kind: 'code',
            source: 'const projectedQ2 = Math.round(avg * 3 * 1.12);',
          },
        ]),
      },
    ],
  },
  {
    id: 'globex',
    name: 'Globex',
    description: 'Internal tools',
    items: [
      {
        id: 'primary-globex',
        type: 'primary',
        name: 'Ops Console',
        parentId: null,
        content: JSON.stringify({
          key: 'ops-console',
          source: 'iam.role_bindings',
          description: 'Internal operations console and access-control rules.',
        }),
      },
      {
        id: 'primary-globex-admin',
        type: 'file',
        name: 'admin.ts',
        parentId: 'primary-globex',
        content: 'export const roles = ["admin", "editor", "viewer"] as const;\n',
      },
      {
        id: 'primary-globex-permissions',
        type: 'dataset',
        name: 'permissions.csv',
        parentId: 'primary-globex',
        content: 'role,canDeploy\nadmin,true\neditor,false\n',
      },
      {
        id: 'deploy',
        type: 'file',
        name: 'deploy.sh',
        parentId: null,
        content: '#!/bin/sh\necho deploying\n',
      },
      {
        id: 'users',
        type: 'dataset',
        name: 'users.csv',
        parentId: null,
        content: 'name,role\nAda,admin\nLin,editor\n',
      },
    ],
  },
];

const delay = <T,>(v: T, ms = 80) => new Promise<T>((r) => setTimeout(() => r(v), ms));

export interface CreateWorkspaceInput {
  readonly name: string;
  readonly description?: string;
}

export const workspacesApi = {
  list: (): Promise<WorkspaceSummary[]> => delay(db.map(({ items: _items, ...w }) => w)),

  get: async (id: string) => {
    const ws = db.find((w) => w.id === id);
    if (!ws) throw new Error(`Workspace "${id}" not found`);
    return delay(ws);
  },

  create: async ({ name, description = '' }: CreateWorkspaceInput) => {
    const id = createSlug(
      name,
      db.map((w) => w.id),
    );
    const ws: Workspace = {
      id,
      name: name.trim(),
      description: description.trim(),
      items: EMPTY,
    };
    db.push(ws); // in-memory only: gone after a refresh
    return delay(ws, 120);
  },

  setPrimary: async (wsId: string, { name, content, children = EMPTY }: PrimarySelectionInput) => {
    const index = db.findIndex((w) => w.id === wsId);
    const existing = index >= 0 ? db[index] : undefined;
    if (!existing) throw new Error(`Workspace "${wsId}" not found`);

    const rootId = `primary-${wsId}`;
    const prevPrimaryIds = new Set(
      existing.items.filter((i) => i.type === 'primary' || i.parentId === rootId).map((i) => i.id),
    );
    const keptItems = existing.items.filter((i) => !prevPrimaryIds.has(i.id));

    const seeded: Item[] = [
      { id: rootId, type: 'primary', name: name.trim(), parentId: null, content },
      ...children.map((c) => ({
        id: `${rootId}-${c.id}`,
        type: c.type,
        name: c.name,
        parentId: rootId,
        content: c.content,
      })),
      ...keptItems,
    ];

    const updated: Workspace = { ...existing, items: seeded };
    db[index] = updated;
    return delay(updated, 120);
  },
};

/** Walk parentId up to the root (cycle-safe): [Storefront Core, checkout.ts] */
export function pathTo(items: readonly Item[], id: string): Item[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  const chain: Item[] = [];
  const seen = new Set<string>();
  for (let cur = byId.get(id); cur && !seen.has(cur.id); cur = cur.parentId ? byId.get(cur.parentId) : undefined) {
    seen.add(cur.id);
    chain.unshift(cur);
  }
  return chain;
}
