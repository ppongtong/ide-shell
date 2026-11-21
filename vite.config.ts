import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(({ mode }) => ({
  plugins: [
    // File-based routes: src/routes/** → src/routeTree.gen.ts. Must run before react().
    tanstackRouter({ target: 'react', routesDirectory: 'src/routes', generatedRouteTree: 'src/routeTree.gen.ts' }),
    react(),
    // React Compiler 1.0: automatic memoization, so no useMemo/useCallback/memo by hand.
    babel({ presets: [reactCompilerPreset()] }),
    // `npm run build:demo` → one self-contained HTML file with #/ URLs.
    ...(mode === 'demo' ? [viteSingleFile()] : []),
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: mode === 'demo' ? { outDir: 'dist-demo' } : {},
}));
