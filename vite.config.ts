import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  base: mode === 'development' ? '/' : '/kana-pop/',
  build: { outDir: 'docs' }
}));
