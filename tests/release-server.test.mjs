import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { startLocalServer } from '../scripts/serve-release.mjs';

async function website(t) {
  const parent = await mkdtemp(join(tmpdir(), 'yinxu-release-'));
  const root = join(parent, 'web');
  await mkdir(root);
  await writeFile(join(root, 'index.html'), '<h1>音序</h1>');
  await writeFile(join(root, 'app.js'), 'export const ready = true;');
  await writeFile(join(root, 'sound.wav'), Buffer.from('RIFF-test-audio'));
  await writeFile(join(parent, 'private.txt'), 'outside website');
  t.after(async () => {
    assert.equal(dirname(resolve(parent)), resolve(tmpdir()));
    await rm(parent, { recursive: true, force: true });
  });
  return root;
}

async function start(t, root, options = {}) {
  const result = await startLocalServer({ root, port: 0, ...options });
  t.after(
    () =>
      new Promise(done => {
        result.server.closeAllConnections();
        result.server.close(done);
      }),
  );
  return result;
}

test('local release serves UTF-8 HTML and JavaScript, supports HEAD and binds only to loopback', async t => {
  const { server, url } = await start(t, await website(t));
  assert.equal(server.address().address, '127.0.0.1');
  const page = await fetch(url);
  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-type'), /text\/html; charset=utf-8/);
  assert.equal(await page.text(), '<h1>音序</h1>');
  const script = await fetch(url + 'app.js?version=1');
  assert.match(script.headers.get('content-type'), /javascript/);
  assert.equal(await script.text(), 'export const ready = true;');
  const audio = await fetch(url + 'sound.wav');
  assert.equal(audio.headers.get('content-type'), 'audio/wav');
  assert.equal(await audio.text(), 'RIFF-test-audio');
  const head = await fetch(url, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
});

test('local release rejects malformed paths, traversal, missing files and writes without stopping', async t => {
  const { url } = await start(t, await website(t));
  for (const [path, status] of [
    ['%ZZ', 400],
    ['..%2fprivate.txt', 403],
    ['missing.txt', 404],
    ['runtime/node.exe', 404],
  ]) {
    assert.equal((await fetch(url + path)).status, status, path);
  }
  const write = await fetch(url, { method: 'POST', body: 'test' });
  assert.equal(write.status, 405);
  assert.equal(write.headers.get('allow'), 'GET, HEAD');
  assert.equal((await fetch(url)).status, 200);
});

test('occupied ports fall back automatically and exhaustion reports a useful error', async t => {
  const root = await website(t);
  const first = await start(t, root);
  const port = first.server.address().port;
  await assert.rejects(startLocalServer({ root, port, attempts: 1 }), /No local port is available/);
  const second = await start(t, root, { port });
  assert.notEqual(second.server.address().port, port);
  assert.equal((await fetch(second.url)).status, 200);
});

test('missing website files and invalid port settings fail before listening', async t => {
  const root = await website(t);
  await assert.rejects(startLocalServer({ root, port: NaN }), /PORT must be/);
  await assert.rejects(startLocalServer({ root: join(root, 'missing') }), /Extract the entire ZIP/);
});
