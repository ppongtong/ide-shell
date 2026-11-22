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
    // React Compiler 1.0: automatic memoization; fail loudly if a component in src/ bails out.
    babel({
      presets: [
        reactCompilerPreset({
          logger: {
            logEvent(filename, event) {
              if (event.kind === 'CompileError' && filename?.includes('/src/')) {
                const reason = event.detail?.reason ?? 'Unknown React Compiler error';
                const line = event.fnLoc?.start?.line;
                throw new Error(`React Compiler bailout in ${filename}${line ? `:${line}` : ''}: ${reason}`);
              }
            },
          },
        }),
      ],
    }),
    // `npm run build:demo` → one self-contained HTML file with #/ URLs.
    ...(mode === 'demo' ? [viteSingleFile()] : []),
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: mode === 'demo' ? { outDir: 'dist-demo' } : {},
}));
