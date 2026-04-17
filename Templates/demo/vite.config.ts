import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      // allow serving assets from the PaperworkGeneration repo root (3D_model_shot*.jpg etc.)
      allow: [path.resolve(__dirname, '../..')],
    },
  },
});
