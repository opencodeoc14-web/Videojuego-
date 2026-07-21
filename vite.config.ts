import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      external: ['three'],
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
        manualChunks(id) {
          const marker = '/src/game/';
          if (!id.includes(marker)) return undefined;
          const file = id.slice(id.lastIndexOf('/') + 1).replace(/\.[^.]+$/, '');
          return `game-${file}`;
        },
      },
    },
  },
});
