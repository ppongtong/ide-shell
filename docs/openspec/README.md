# OpenSpec Reference Blueprints (For Bootstrapping a New Project)

> [!NOTE]
> **Not a change plan for this repository.**
> `ide-shell` is the working reference prototype (using lightweight custom CSS/UI primitives, documented in [../DESIGN.md](../DESIGN.md)).
> The two design documents in this folder distill the lessons and architecture from `ide-shell` so they can be fed into **OpenSpec** to scaffold a **brand-new production project** incrementally using **shadcn/ui**:

1. **[01-shell-and-layout-design.md](./01-shell-and-layout-design.md) — Phase 1: IDE Shell, Resizable Layout & Plugin Foundation**
   - Outer shell frame (`ActivityBar`, `Breadcrumbs`, `DialogHost`, `PluginPageHost`), horizontal & vertical **shadcn `ResizablePanelGroup`** container splits, `LazyActivity`, boot-time plugin `Registry`, `createPluginBridge`, shell-level URLs (`pathname` + `?panels=`), and ESLint folder boundaries.
2. **[02-explorer-and-item-renderers-design.md](./02-explorer-and-item-renderers-design.md) — Phase 2: Workspace, Explorer & Type-Based Item Renderers**
   - Layers `/workspaces/$wsId` and `?item=type:id` onto Phase 1 with zero edits to `app/shell`: uniform `ItemRenderer` (`type -> component`, not code-editor-centric), pluggable `type: 'primary'`, `ItemTabBar` + `ItemRendererHost`, cycle-safe `ExplorerPanel` tree, and `workspace` / `explorer` contracts.
