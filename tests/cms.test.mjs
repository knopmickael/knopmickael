import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, mkdir, rm, copyFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { once } from 'node:events';
import { request as httpRequest } from 'node:http';
import { createCmsServer } from '../scripts/cms.mjs';
import { buildSite } from '../scripts/build.mjs';
import { projectRoot, publicFiles, filesForPortfolio } from '../scripts/site.mjs';

const source = JSON.parse(await readFile(resolve(projectRoot, 'portfolio.json'), 'utf8'));
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1cAAAAASUVORK5CYII=', 'base64');

test('local CMS persists real files, protects writes, handles conflicts and publishes only content', async t => {
  // Isolated storage: these tests never change the working portfolio.
  await mkdir(resolve(tmpdir(), 'opencode'), { recursive: true });
  const root = await mkdtemp(resolve(tmpdir(), 'opencode', 'portfolio-cms-'));
  for (const file of filesForPortfolio(source).filter(file => !publicFiles.includes(file))) {
    await mkdir(dirname(resolve(root, file)), { recursive: true });
    await copyFile(resolve(projectRoot, file), resolve(root, file));
  }
  await writeFile(resolve(root, 'portfolio.json'), JSON.stringify(source));
  const server = createCmsServer({ root });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => { await new Promise(resolve => server.close(resolve)); await rm(root, { recursive: true, force: true }); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  const get = async () => (await fetch(`${origin}/api/content`)).json();
  const session = await get();
  const request = (path, method, body, headers = {}) => fetch(`${origin}${path}`, { method, headers: { Origin: origin, 'X-CMS-Token': session.token, ...headers }, body });
  const save = (content, revision) => request('/api/content', 'PUT', JSON.stringify(content), { 'Content-Type': 'application/json', 'If-Match': revision });

  await t.test('reads the actual content and rejects foreign origins, hosts and missing tokens', async () => {
    assert.deepEqual(session.content, source);
    assert.equal((await request('/api/content', 'PUT', '{}', { 'X-CMS-Token': '' })).status, 403);
    assert.equal((await request('/api/content', 'PUT', '{}', { Origin: 'https://untrusted.example' })).status, 403);
    const invalidHostStatus = await new Promise((resolve, reject) => {
      const request = httpRequest(`${origin}/api/content`, { headers: { Host: 'untrusted.example', Origin: origin } }, response => { response.resume(); resolve(response.statusCode); });
      request.on('error', reject); request.end();
    });
    assert.equal(invalidHostStatus, 403);
    assert.equal((await fetch(`${origin}/api/content`, { headers: { Origin: 'https://untrusted.example' } })).status, 403);
    assert.equal((await fetch(`${origin}/.cms/portfolio.backup.json`)).status, 404);
    assert.equal((await fetch(`${origin}/scripts/cms.mjs`)).status, 404);
  });

  await t.test('creates, edits, reorders and removes projects without categories, retaining a backup', async () => {
    const content = structuredClone(source);
    content.projects.push({ id: 'private-case', number: String(content.projects.length + 1).padStart(2, '0'), title: 'Case privado', type: 'CASE', description: 'Sem URL pública.', tags: [], details: [], repositoryVisibility: 'private', visual: { type: 'repository' } });
    let response = await save(content, session.revision);
    assert.equal(response.status, 200);
    let current = await get();
    assert.deepEqual(current.content, content);
    assert.deepEqual(JSON.parse(await readFile(resolve(root, '.cms/portfolio.backup.json'), 'utf8')), source);
    content.projects.at(-1).title = 'Case editado';
    assert.equal((await save(content, current.revision)).status, 200);
    current = await get();
    assert.equal(current.content.projects.at(-1).title, 'Case editado');
    content.projects.unshift(content.projects.pop());
    assert.equal((await save(content, current.revision)).status, 200);
    current = await get();
    assert.deepEqual(current.content.projects.map(project => project.id), content.projects.map(project => project.id));
    content.projects.shift();
    assert.equal((await save(content, current.revision)).status, 200);
    assert.deepEqual((await get()).content, source);
  });

  await t.test('rejects invalid data without modifying disk', async () => {
    const initial = await get();
    for (const mutate of [
      data => { data.projects[0].id = data.projects[1].id; },
      data => { data.projects[0].url = 'javascript:alert(1)'; },
      data => { data.projects[0].demoUrl = 'file:///secret'; },
      data => { data.projects[0].visual = { type: 'gallery', cover: 0, images: [{ src: '../private.png', label: 'Teste' }] }; },
      data => { data.projects[0].visual = { type: 'gallery', cover: 0, images: [{ src: 'assets/projects/missing.png', label: 'Teste' }] }; },
      data => { data.projects[0].visual = { type: 'gallery', cover: 0, images: [] }; },
      data => { data.expertise.groups = null; },
      data => { data.hero.title = 'Wrong shape'; }
    ]) {
      const invalid = structuredClone(source); mutate(invalid);
      assert.equal((await save(invalid, initial.revision)).status, 422);
    }
    assert.equal((await get()).revision, initial.revision);
  });

  await t.test('does not overwrite external edits or concurrent saves', async () => {
    const initial = await get();
    const external = structuredClone(source); external.meta.title = 'Edição externa';
    await writeFile(resolve(root, 'portfolio.json'), JSON.stringify(external));
    assert.equal((await save(source, initial.revision)).status, 409);
    assert.equal((await get()).content.meta.title, 'Edição externa');
    const latest = await get();
    const outcomes = await Promise.all([save(source, latest.revision), save(source, latest.revision)]);
    assert.deepEqual(outcomes.map(response => response.status).sort(), [200, 409]);
  });

  let imagePath, secondImagePath;
  await t.test('uploads raster images with generated paths and rejects executable or oversized uploads', async () => {
    const response = await request('/api/images', 'POST', png, { 'Content-Type': 'image/png' });
    assert.equal(response.status, 201);
    imagePath = (await response.json()).src;
    assert.match(imagePath, /^assets\/projects\/[a-f0-9-]+\.png$/);
    assert.deepEqual(await readFile(resolve(root, imagePath)), png);
    const imageResponse = await fetch(`${origin}/${imagePath}`);
    assert.equal(imageResponse.headers.get('content-type'), 'image/png');
    assert.equal((await request('/api/images', 'POST', '<svg onload="alert(1)"></svg>', { 'Content-Type': 'image/svg+xml' })).status, 415);
    assert.equal((await request('/api/images', 'POST', '<html>not an image</html>', { 'Content-Type': 'image/png' })).status, 415);
    assert.equal((await request('/api/images', 'POST', Buffer.alloc(8 * 1024 * 1024 + 1), { 'Content-Type': 'image/png' })).status, 413);
    const second = await request('/api/images', 'POST', png, { 'Content-Type': 'image/png' });
    assert.equal(second.status, 201);
    secondImagePath = (await second.json()).src;
    assert.notEqual(imagePath, secondImagePath);
    const current = await get();
    current.content.projects[0].visual = { type: 'gallery', cover: 1, images: [{ src: imagePath, label: 'Tela wide' }, { src: secondImagePath, label: 'Tela mobile' }] };
    assert.equal((await save(current.content, current.revision)).status, 200);
    assert.deepEqual((await get()).content.projects[0].visual, current.content.projects[0].visual);
    const latest = await get();
    const missing = structuredClone(latest.content);
    missing.projects[0].visual.images[0].src = 'assets/projects/missing.png';
    assert.equal((await save(missing, latest.revision)).status, 422, 'Every image is checked, including non-cover images');
    assert.equal((await get()).revision, latest.revision);
  });

  await t.test('build includes referenced images but excludes CMS, backups and unused uploads', async () => {
    for (const file of publicFiles.filter(file => file !== 'portfolio.json')) {
      await mkdir(dirname(resolve(root, file)), { recursive: true });
      await copyFile(resolve(projectRoot, file), resolve(root, file));
    }
    await writeFile(resolve(root, 'assets/projects/unused.png'), png);
    await buildSite({ root });
    assert.deepEqual(await readFile(resolve(root, 'dist', imagePath)), png);
    assert.deepEqual(await readFile(resolve(root, 'dist', secondImagePath)), png);
    const publishedRoot = await readdir(resolve(root, 'dist'));
    assert.ok(!publishedRoot.includes('cms') && !publishedRoot.includes('.cms') && !publishedRoot.includes('scripts'));
    const referenced = filesForPortfolio((await get()).content).filter(file => file.startsWith('assets/projects/'));
    assert.deepEqual((await readdir(resolve(root, 'dist/assets/projects'))).sort(), referenced.map(path => path.split('/').at(-1)).sort());
  });
});
