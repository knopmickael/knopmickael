import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { projectRoot, publicFiles, readPortfolio, compileHtml } from './site.mjs';

function argument(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

const port = Number(argument('--port', process.env.PORT || '4173'));
const host = argument('--host', process.env.HOST || '127.0.0.1');
const rawBase = argument('--base', '/');
const base = `/${rawBase.split('/').filter(Boolean).join('/')}${rawBase === '/' ? '' : '/'}`;
const production = process.argv.includes('--dist');
const directory = production ? resolve(projectRoot, 'dist') : projectRoot;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };
const allowed = new Set([...publicFiles, '.nojekyll']);

if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer between 1 and 65535.');
if (production) await readFile(resolve(directory, 'index.html'));
else await readPortfolio();

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    if (url.pathname === base.slice(0, -1) && base !== '/') {
      response.writeHead(308, { Location: `${base}${url.search}` }).end();
      return;
    }
    const pathname = decodeURIComponent(url.pathname);
    if (!pathname.startsWith(base)) {
      response.writeHead(404).end('Not found');
      return;
    }
    const file = pathname.slice(base.length) || 'index.html';
    if (!allowed.has(file)) {
      response.writeHead(404).end('Not found');
      return;
    }
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    let body = await readFile(resolve(directory, file));
    if (!production && file === 'index.html') body = Buffer.from(compileHtml(body.toString('utf8'), await readPortfolio()));
    response.writeHead(200, { 'Content-Type': types[extname(file)] || 'text/plain', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch (error) {
    console.error('[server]', error.message);
    response.writeHead(error.code === 'ENOENT' ? 404 : 500).end('Unable to serve this resource');
  }
});

server.listen(port, host, () => console.log(`${production ? 'Preview' : 'Desenvolvimento'}: http://${host}:${port}${base}`));
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.close(() => process.exit(0)));
