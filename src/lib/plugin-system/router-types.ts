// Breadcrumb hooks every route can declare in `staticData`.
//   crumb:       a plain label ("Workspaces", "Settings")
//   Breadcrumbs: a component that renders its own crumbs (workspace switcher + item path).
//                Lets a feature own its crumbs without the shell knowing about it.
import type { ComponentType } from 'react';
import type { AnyRouteMatch } from '@tanstack/react-router';
import type { Registry } from './registry';

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    crumb?: (match: AnyRouteMatch, registry: Registry) => string;
    Breadcrumbs?: ComponentType<{ match: AnyRouteMatch }>;
  }
}

export interface RouterContext {
  registry: Registry;
}
