import { registerHooks } from 'node:module';
import { existsSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const srcDir = fileURLToPath(new URL('../src', import.meta.url));
const isFile = (p: string) => existsSync(p) && statSync(p).isFile();

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) {
      const rel = specifier.slice(2);
      const base = path.join(srcDir, rel);
      for (const candidate of [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')]) {
        if (isFile(candidate)) {
          return nextResolve(pathToFileURL(candidate).href, context);
        }
      }
    }
    if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL?.startsWith('file:')) {
      const parentDir = path.dirname(fileURLToPath(context.parentURL));
      const base = path.resolve(parentDir, specifier);
      if (!isFile(base)) {
        for (const candidate of [`${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')]) {
          if (isFile(candidate)) {
            return nextResolve(pathToFileURL(candidate).href, context);
          }
        }
      }
    }
    return nextResolve(specifier, context);
  },
});
