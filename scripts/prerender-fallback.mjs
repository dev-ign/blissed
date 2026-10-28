import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Derive the no-JavaScript fallback from the real components, not a second copy
// of the site's content. This renderer is a build artifact, never a browser chunk.
const entry = 'virtual:blissed-static-fallback';
const result = await build({
  configFile: false,
  logLevel: 'warn',
  plugins: [react(), {
    name: 'blissed-static-fallback',
    resolveId(id) { if (id === entry || id === resolve(entry)) return '\0' + entry; },
    load(id) {
      if (id === '\0' + entry) return `import { createElement } from 'react';
        import { renderToStaticMarkup } from 'react-dom/server';
        import App from ${JSON.stringify(resolve('src/App.tsx'))};
        export const render = () => renderToStaticMarkup(createElement(App));`;
    },
  }],
  ssr: { noExternal: ['gsap', '@gsap/react'] },
  build: { ssr: entry, write: false, minify: false, rollupOptions: { output: { entryFileNames: 'renderer.mjs' } } },
});
const outputs = (Array.isArray(result) ? result : [result]).flatMap(bundle => bundle.output);
const renderer = outputs.find(output => output.type === 'chunk' && output.isEntry);
if (!renderer) throw new Error('Static fallback renderer was not built.');
const cache = resolve('node_modules/.cache/blissed-static-fallback');
await mkdir(cache, { recursive: true });
const modulePath = resolve(cache, 'renderer.mjs');
await writeFile(modulePath, renderer.code);
const { render } = await import(pathToFileURL(modulePath).href);
// Stateful controls require JavaScript. Native links and all editorial content work.
const markup = '<style>noscript .site-header{background:var(--color-surface-primary)}noscript .menu-toggle{display:none}</style>' + render().replace(/<button(?![^>]*\bdisabled(?:=|\s|>))/g, '<button disabled');
const index = resolve('dist/index.html');
const html = (await readFile(index, 'utf8')).replace(/\n?<noscript>[\s\S]*?<\/noscript>/g, '');
if (!html.includes('<div id="root"></div>')) throw new Error('Homepage root marker was not found.');
await writeFile(index, html.replace('<div id="root"></div>', `<div id="root"></div>\n<noscript>${markup}</noscript>`));
console.log(`Static no-JavaScript fallback generated from homepage components (${Buffer.byteLength(markup)} bytes).`);
