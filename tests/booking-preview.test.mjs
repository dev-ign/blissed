import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { build } from 'vite';

// Exercise Vite's production replacement of import.meta.env, not a copied predicate.
for (const [flag, enabled] of [[undefined, true], ['true', true], ['false', false], ['', true]]) {
  test(`production booking preview: ${flag === undefined ? 'unset flag' : JSON.stringify(flag)} → ${enabled}`, async () => {
    const result = await build({
      configFile: false,
      envDir: false,
      mode: 'production',
      logLevel: 'silent',
      define: { 'import.meta.env.VITE_BOOKING_PREVIEW': flag === undefined ? 'undefined' : JSON.stringify(flag) },
      build: {
        write: false,
        minify: false,
        lib: { entry: resolve('src/features/booking/preview.ts'), formats: ['es'] },
      },
    });
    const outputs = (Array.isArray(result) ? result : [result]).flatMap(bundle => bundle.output);
    const chunk = outputs.find(item => item.type === 'chunk' && item.isEntry);
    assert.ok(chunk, 'Production flag module was built');
    const module = await import(`data:text/javascript;base64,${Buffer.from(chunk.code).toString('base64')}`);
    assert.equal(module.bookingPreviewEnabled, enabled);
  });
}
