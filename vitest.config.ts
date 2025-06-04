import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'jsdom', // lightweight DOM & canvas
    setupFiles: './test/setup.ts',
    coverage: { reporter: ['text', 'html'] }, // see % in terminal + ./coverage
  },
});
