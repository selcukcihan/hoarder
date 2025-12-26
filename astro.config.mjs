// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  adapter: cloudflare({
    imageService: "cloudflare",
    routes: {
      strategy: 'include'
    }
  }),
  vite: {
    ssr: {
      external: [
        'node:path',
        'node:fs/promises',
        'node:url',
        'node:crypto'
      ]
    }
  }
});