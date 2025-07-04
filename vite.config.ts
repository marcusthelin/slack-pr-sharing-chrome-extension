import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import tailwindcss from '@tailwindcss/vite'
import zip from 'vite-plugin-zip-pack'
import manifest from './src/manifest.json';

export default defineConfig({
  plugins: [
    tailwindcss(),
    crx({ manifest }),
    zip({
      outDir: "release",
      outFileName: "slack-pr-sharing.zip"
    })
  ],
  server: {
    cors: {
      origin: [
        /chrome-extension:\/\//,
      ],
    },
  },
});
