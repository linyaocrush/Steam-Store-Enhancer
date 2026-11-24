import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const metadata = readFileSync(new URL('../src/metadata.txt', import.meta.url), 'utf8');
const version = metadata.match(/^\/\/\s+@version\s+([\d.]+)\s*$/m)?.[1];

if (!version) throw new Error('Missing userscript version in src/metadata.txt');

function thirdPartyNotices() {
  const licenses = [
    ['Anime.js', 'animejs/LICENSE.md'],
    ['Three.js', 'three/LICENSE'],
    ['TopoJSON Client', 'topojson-client/LICENSE'],
    ['World Atlas (Natural Earth data)', 'world-atlas/LICENSE'],
  ];
  const notices = licenses.map(([name, file]) => {
    const license = readFileSync(new URL(`./node_modules/${file}`, import.meta.url), 'utf8');
    return `${name}\n${license.trim()}`;
  });
  return `${notices.join('\n\n')}\n`;
}

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, 'index.html'),
        prices: resolve(import.meta.dirname, 'prices.html'),
        cart: resolve(import.meta.dirname, 'cart.html'),
        social: resolve(import.meta.dirname, 'social.html'),
        family: resolve(import.meta.dirname, 'family.html'),
        install: resolve(import.meta.dirname, 'install.html'),
      },
    },
  },
  plugins: [
    {
      name: 'userscript-version',
      transformIndexHtml: html => html.replaceAll('%USERSCRIPT_VERSION%', version),
    },
    {
      name: 'site-licenses',
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'third-party-licenses.txt', source: thirdPartyNotices() });
      },
      configureServer(server) {
        server.middlewares.use('/third-party-licenses.txt', (_request, response) => {
          response.setHeader('Content-Type', 'text/plain; charset=utf-8');
          response.end(thirdPartyNotices());
        });
      },
    },
  ],
});
