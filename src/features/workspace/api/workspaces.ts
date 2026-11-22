// Mock backend. Swap the bodies for real fetch calls.
import type { Item, WorkspaceInfo } from '@/lib/plugin-system';

export interface Workspace extends WorkspaceInfo {
  readonly description: string;
  readonly primaryType: string;
}
export type WorkspaceSummary = Omit<Workspace, 'items'>;

export interface PrimaryTypeOption {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly rootName: string;
  readonly children: readonly {
    readonly id: string;
    readonly type: 'file' | 'dataset';
    readonly name: string;
    readonly content: string;
  }[];
}

export const PRIMARY_TYPES: readonly PrimaryTypeOption[] = [
  {
    id: 'storefront',
    label: 'Storefront App',
    description: 'Customer-facing web app with checkout flow and product catalog.',
    rootName: 'Storefront Core',
    children: [
      {
        id: 'checkout',
        type: 'file',
        name: 'checkout.ts',
        content: 'export function calculateTotal(prices: number[]) {\n  return prices.reduce((a, b) => a + b, 0);\n}\n',
      },
      {
        id: 'catalog',
        type: 'dataset',
        name: 'catalog.csv',
        content: 'sku,name,price\nSKU-1,Keyboard,120\nSKU-2,Monitor,380\n',
      },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics Pipeline',
    description: 'Data ingestion jobs and KPI metric definitions.',
    rootName: 'Pipeline Root',
    children: [
      {
        id: 'ingest',
        type: 'file',
        name: 'ingest.ts',
        content: 'export async function ingestEvents(source: string) {\n  return `Synced ${source}`;\n}\n',
      },
      {
        id: 'metrics',
        type: 'dataset',
        name: 'metrics.csv',
        content: 'metric,target\nconversion,4.5%\nretention,82%\n',
      },
    ],
  },
  {
    id: 'internal-tools',
    label: 'Internal Tools',
    description: 'Operations console and access-control rules.',
    rootName: 'Ops Console',
    children: [
      {
        id: 'admin',
        type: 'file',
        name: 'admin.ts',
        content: 'export const roles = ["admin", "editor", "viewer"] as const;\n',
      },
      {
        id: 'permissions',
        type: 'dataset',
        name: 'permissions.csv',
        content: 'role,canDeploy\nadmin,true\neditor,false\n',
      },
    ],
  },
];

function seedPrimaryItems(preset: PrimaryTypeOption): Item[] {
  const rootId = `primary-${preset.id}`;
  return [
    { id: rootId, type: 'primary', name: preset.rootName, parentId: null },
    ...preset.children.map((c) => ({
      id: `${rootId}-${c.id}`,
      type: c.type,
      name: c.name,
      parentId: rootId,
      content: c.content,
    })),
  ];
}

const RESERVED_IDS = new Set(['new']);

export function createSlug(name: string, existingIds: Iterable<string>): string {
  const taken = new Set(existingIds);
  const base =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'workspace';
  let id = base;
  for (let n = 2; RESERVED_IDS.has(id) || taken.has(id); n++) id = `${base}-${n}`;
  return id;
}

const db: Workspace[] = [
  {
    id: 'acme',
    name: 'Acme',
    description: 'Storefront app and sales data',
    primaryType: 'storefront',
    items: [
      ...seedPrimaryItems(PRIMARY_TYPES[0]!),
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
    ],
  },
  {
    id: 'globex',
    name: 'Globex',
    description: 'Internal tools',
    primaryType: 'internal-tools',
    items: [
      ...seedPrimaryItems(PRIMARY_TYPES[2]!),
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
  readonly primaryType: string;
  readonly description?: string;
}

export const workspacesApi = {
  list: (): Promise<WorkspaceSummary[]> => delay(db.map(({ items: _items, ...w }) => w)),

  get: async (id: string) => {
    const ws = db.find((w) => w.id === id);
    if (!ws) throw new Error(`Workspace "${id}" not found`);
    return delay(ws);
  },

  create: async ({ name, primaryType, description = '' }: CreateWorkspaceInput) => {
    const preset = PRIMARY_TYPES.find((p) => p.id === primaryType);
    if (!preset) throw new Error(`Unknown primary type "${primaryType}"`);

    const id = createSlug(
      name,
      db.map((w) => w.id),
    );
    const ws: Workspace = {
      id,
      name: name.trim(),
      description: description.trim(),
      primaryType: preset.id,
      items: seedPrimaryItems(preset),
    };
    db.push(ws); // in-memory only: gone after a refresh
    return delay(ws, 180);
  },

  update: async (id: string, patch: { readonly name: string; readonly description: string }) => {
    const index = db.findIndex((w) => w.id === id);
    const existing = index >= 0 ? db[index] : undefined;
    if (!existing) throw new Error(`Workspace "${id}" not found`);
    const updated: Workspace = {
      ...existing,
      name: patch.name.trim(),
      description: patch.description.trim(),
    };
    db[index] = updated;
    return delay(updated, 120);
  },
};

/** Walk parentId up to the root: [Storefront Core, checkout.ts] */
export function pathTo(items: readonly Item[], id: string): Item[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  const chain: Item[] = [];
  for (let cur = byId.get(id); cur; cur = cur.parentId ? byId.get(cur.parentId) : undefined) chain.unshift(cur);
  return chain;
}
