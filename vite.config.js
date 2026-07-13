import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const pages = ['index', 'events', 'event-details', 'login', 'register', 'profile', 'my-registrations', 'admin'];

export default defineConfig({
  build: {
    target: 'es2022',
    rollupOptions: {
      input: Object.fromEntries(pages.map((page) => [page, resolve(import.meta.dirname, `${page}.html`)])),
    },
  },
});
