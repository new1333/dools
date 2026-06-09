import { defineConfig } from 'tsup';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));

export default defineConfig({
  entry: ['src/lib.ts', 'src/cli.ts'],
  format: ['esm'],
  dts: {
    entry: 'src/lib.ts',
  },
  define: {
    PKG_VERSION: JSON.stringify(pkg.version),
  },
  clean: true,
});
