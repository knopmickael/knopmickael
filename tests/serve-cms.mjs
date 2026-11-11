// Optional browser fixture. All edits and uploads stay in a temporary copy.
import { mkdtemp, mkdir, copyFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { createCmsServer } from '../scripts/cms.mjs';
import { projectRoot, filesForPortfolio, readPortfolio } from '../scripts/site.mjs';

await mkdir(resolve(tmpdir(), 'opencode'), { recursive: true });
const root = await mkdtemp(resolve(tmpdir(), 'opencode', 'portfolio-browser-'));
for (const file of filesForPortfolio(await readPortfolio())) {
  await mkdir(dirname(resolve(root, file)), { recursive: true });
  await copyFile(resolve(projectRoot, file), resolve(root, file));
}
const server = createCmsServer({ root });
server.listen(4175, '127.0.0.1', () => console.log('CMS de teste isolado: http://127.0.0.1:4175/cms/'));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(async () => {
  await rm(root, { recursive: true, force: true }); process.exit(0);
}));
