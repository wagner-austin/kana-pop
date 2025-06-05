import { defineConfig, loadEnv } from 'vite'; // Added loadEnv
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => {
  // Changed to a function
  const env = loadEnv(mode, process.cwd(), ''); // Load .env files

  return {
    plugins: [tsconfigPaths()],
    base: process.env.BASE_PATH ?? '/', // Kept existing base
    build: { outDir: 'docs' }, // Kept existing build config
    define: {
      'import.meta.env.VITE_BUILD_HASH': JSON.stringify(
        env.VITE_BUILD_HASH ?? Date.now().toString(36),
      ),
    },
  };
});
