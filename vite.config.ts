import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import tailwindcss from '@tailwindcss/vite'
import manifest from './src/manifest.json';

export default defineConfig({
  plugins: [
    tailwindcss(),
    crx({ manifest }),
  ],
  server: {
    cors: true
  }
});
