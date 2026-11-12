import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { instrumentImages as lightImages } from '../src/instrument-images.ts';
import { instrumentCredits } from '../src/instrument-credits.ts';
import { traditionalCatalog } from '../src/traditional-catalog.ts';
import { worldCatalog } from '../src/world-catalog.ts';
import { courses } from '../src/data.ts';

// The UI data is split into a light first-screen part and lazily loaded credits; together they match the ledger.
const instrumentImages = Object.fromEntries(
  Object.entries(lightImages).map(([id, image]) => [id, { ...image, ...instrumentCredits[id] }]),
);

test('every instrument course has a bundled, attributed image with matching UI metadata', () => {
  const root = new URL('../public/instruments/', import.meta.url);
  const ledger = JSON.parse(readFileSync(new URL('credits.json', root), 'utf8'));
  const credits = readFileSync(new URL('../public/image-credits.html', import.meta.url), 'utf8');
  const uiLedger = Object.fromEntries(
    Object.entries(ledger).map(([id, { download: _download, ...item }]: [string, Record<string, unknown>]) => [
      id,
      item,
    ]),
  );
  assert.deepEqual(instrumentImages, uiLedger, 'Regenerate the image data with scripts/sync-instrument-images.mjs');
  assert.deepEqual(Object.keys(instrumentCredits).sort(), Object.keys(lightImages).sort());
  assert.ok(Object.values(lightImages).every(image => !('caption' in image) && !('author' in image)));
  const catalog = [...traditionalCatalog, ...worldCatalog];
  const instrumentCourses = courses.filter(course => course.family !== 'foundation');
  assert.deepEqual(Object.keys(ledger).sort(), instrumentCourses.map(course => course.id).sort());
  const names = new Map<string, string>(catalog.map(item => [item.id, item.name]));
  for (const course of instrumentCourses) {
    const item = { id: course.id, name: names.get(course.id) ?? instrumentImages[course.id].name };
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
    else {
      assert.match(image.license, /^(CC0|Public domain|CC BY(?:-SA)? \d+\.\d+(?: [a-z]+)?)$/, item.id);
      if (image.license.startsWith('CC BY')) {
        const [, variant, version] = image.license.match(/^CC (BY(?:-SA)?) (\d+\.\d+)/)!;
        const licenseUrl = new URL(image.licenseUrl);
        const licensePath = `/licenses/${variant.toLowerCase()}/${version}`;
        assert.ok(
          licenseUrl.origin === 'https://creativecommons.org' &&
            (licenseUrl.pathname === licensePath || licenseUrl.pathname.startsWith(`${licensePath}/`)),
          `${item.id}: link the specific image license, not a general licensing page`,
        );
      }
    }
  }
});
