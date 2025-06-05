import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  base: process.env.BASE_PATH ?? '/',
  build: { outDir: 'docs' },
});
