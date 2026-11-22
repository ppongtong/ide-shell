// Mock backend. Swap the bodies for real fetch calls.
import type { Item, WorkspaceInfo } from '@/contracts/workspace';

export interface Workspace extends WorkspaceInfo {
  readonly description: string;
}
export type WorkspaceSummary = Omit<Workspace, 'items'>;

const db: Workspace[] = [
  {
    id: 'acme',
    name: 'Acme',
    description: 'Storefront app and sales data',
    items: [
      { id: 'src', type: 'folder', name: 'src', parentId: null },
      {
        id: 'utils',
        type: 'file',
        name: 'utils.ts',
        parentId: 'src',
        content: 'export const sum = (a: number, b: number) => a + b;\n',
      },
      {
        id: 'app',
        type: 'file',
        name: 'App.tsx',
        parentId: 'src',
        content: 'export function App() {\n  return <h1>Hello Acme</h1>;\n}\n',
      },
      { id: 'data', type: 'folder', name: 'data', parentId: null },
      {
        id: 'sales',
        type: 'dataset',
        name: 'sales.csv',
        parentId: 'data',
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
    items: [
      { id: 'scripts', type: 'folder', name: 'scripts', parentId: null },
      {
        id: 'deploy',
        type: 'file',
        name: 'deploy.sh',
        parentId: 'scripts',
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

export const workspacesApi = {
  list: (): Promise<WorkspaceSummary[]> => delay(db.map(({ items: _items, ...w }) => w)),

  get: async (id: string) => {
    const ws = db.find((w) => w.id === id);
    if (!ws) throw new Error(`Workspace "${id}" not found`);
    return delay(ws);
  },

  create: async (name: string, description: string) => {
    const base =
      name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'workspace';
    let id = base;
    for (let n = 2; db.some((w) => w.id === id); n++) id = `${base}-${n}`;
    const ws: Workspace = { id, name: name.trim(), description: description.trim(), items: [] };
    db.push(ws); // in-memory only: gone after a refresh
    return delay(ws, 300);
  },
};

/** Walk parentId up to the root: [src, utils] for utils.ts */
export function pathTo(items: readonly Item[], id: string): Item[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  const chain: Item[] = [];
  for (let cur = byId.get(id); cur; cur = cur.parentId ? byId.get(cur.parentId) : undefined) chain.unshift(cur);
  return chain;
}
