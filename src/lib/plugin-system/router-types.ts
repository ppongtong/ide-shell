// Route metadata hooks every route can declare in `staticData`.
//   crumb:       a plain label ("Workspaces", "Settings")
//   Breadcrumbs: a component that renders its own crumbs (workspace switcher + item path).
//   container:   sidebar panel container ID hosted on this route (e.g. 'workspace.detail').
import type { ComponentType } from 'react';
import type { Registry } from './registry';

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    crumb?: (params: Readonly<Record<string, string>>, registry: Registry) => string;
    Breadcrumbs?: ComponentType;
    container?: string;
  }
}
