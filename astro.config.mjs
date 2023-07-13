import { defineConfig } from 'astro/config';

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  site: 'https://big-family-tree.github.io',
  base: '/astro-al7mood.net',

  integrations: [tailwind()]
});