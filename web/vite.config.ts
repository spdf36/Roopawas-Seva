import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// Types, the catalogue and the business rules are shared with the server in ../shared.
const shared = fileURLToPath(new URL('../shared', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@shared': shared } },
  server: {
    port: 5173,
    // Let the dev server read ../shared, which is outside this project's folder.
    fs: { allow: ['.', shared] },
  },
});
