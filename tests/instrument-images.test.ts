import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { instrumentImages } from '../src/instrument-images.ts';
import { traditionalCatalog } from '../src/traditional-catalog.ts';
import { worldCatalog } from '../src/world-catalog.ts';

test('every catalog instrument has a bundled, attributed image with matching UI metadata', () => {
  const root = new URL('../public/instruments/', import.meta.url);
  const ledger = JSON.parse(readFileSync(new URL('credits.json', root), 'utf8'));
  const credits = readFileSync(new URL('../public/image-credits.html', import.meta.url), 'utf8');
  assert.deepEqual(instrumentImages, ledger, 'Regenerate the image data with scripts/sync-instrument-images.mjs');
  const catalog = [...traditionalCatalog, ...worldCatalog];
  assert.deepEqual(Object.keys(ledger).sort(), catalog.map(item => item.id).sort());
  for (const item of catalog) {
    const image = instrumentImages[item.id];
    assert.equal(image.name, item.name);
    assert.match(image.file, new RegExp(`^${item.id}\\.(png|jpg|jpeg|webp|svg)$`));
    assert.ok(statSync(new URL(image.file, root)).size > 100, item.id);
    assert.ok(image.width > 0 && image.height > 0, item.id);
    assert.ok(image.alt.includes(item.name) && image.caption.length > 12, item.id);
    assert.ok(image.author.trim() && image.license.trim(), item.id);
    assert.equal(new URL(image.source).protocol, 'https:');
    assert.equal(new URL(image.licenseUrl).protocol, 'https:');
    assert.ok(credits.includes(`id="${item.id}"`) && credits.includes(image.file), item.id);
    if (image.kind === 'diagram') assert.match(image.note, /不作为.*指法/);
  }
});
