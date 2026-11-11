import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, rename, rm, access } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { projectRoot, publicFiles, compileHtml } from './site.mjs';
import { validatePortfolio, imagePathPattern } from '../lib/content.js';

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
const revisionOf = source => createHash('sha256').update(source).digest('hex');
const fail = (status, message) => Object.assign(new Error(message), { status });
const toolRoot = projectRoot;

async function bodyOf(request, limit) {
  if (Number(request.headers['content-length']) > limit) throw fail(413, 'Arquivo maior que o limite permitido.');
  let length = 0;
  const chunks = [];
  for await (const chunk of request) {
    length += chunk.length;
    if (length > limit) throw fail(413, 'Arquivo maior que o limite permitido.');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function imageExtension(body, type) {
  if (type === 'image/png' && body.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'png';
  if (type === 'image/jpeg' && body[0] === 255 && body[1] === 216 && body[2] === 255) return 'jpg';
  if (type === 'image/webp' && body.toString('ascii', 0, 4) === 'RIFF' && body.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  throw fail(415, 'Envie uma imagem PNG, JPEG ou WebP válida (até 8 MB).');
}

export function createCmsServer({ root = projectRoot } = {}) {
  const token = randomUUID();
  const contentFile = resolve(root, 'portfolio.json');
  let writeQueue = Promise.resolve();
  const json = (response, status, value) => response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }).end(JSON.stringify(value));
  const server = createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'same-origin');
    response.setHeader('X-Frame-Options', 'DENY');
    try {
      const origin = `http://127.0.0.1:${server.address().port}`;
      if (request.headers.host !== new URL(origin).host) throw fail(403, 'Use o endereço local exibido no terminal.');
      if (request.headers.origin && request.headers.origin !== origin) throw fail(403, 'Origem não permitida.');
      if (request.headers['sec-fetch-site'] === 'cross-site') throw fail(403, 'Origem não permitida.');
      const url = new URL(request.url, origin);
      const pathname = decodeURIComponent(url.pathname);
      if (pathname === '/cms' || pathname.startsWith('/cms/') || pathname.startsWith('/api/')) response.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' blob:; style-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");

      if (pathname === '/api/content' && request.method === 'GET') {
        const source = await readFile(contentFile, 'utf8');
        json(response, 200, { content: validatePortfolio(JSON.parse(source)), revision: revisionOf(source), token });
        return;
      }
      if (pathname.startsWith('/api/') && ['PUT', 'POST'].includes(request.method)) {
        if (request.headers.origin !== origin || request.headers['x-cms-token'] !== token) throw fail(403, 'Sessão inválida. Recarregue o CMS.');
        if (pathname === '/api/content' && request.method === 'PUT') {
          if (request.headers['content-type'] !== 'application/json') throw fail(415, 'O conteúdo deve ser JSON.');
          let content;
          try { content = validatePortfolio(JSON.parse((await bodyOf(request, 2 * 1024 * 1024)).toString('utf8'))); }
          catch (error) { throw error.status ? error : fail(422, error.message); }
          const save = async () => {
            const previous = await readFile(contentFile, 'utf8');
            if (request.headers['if-match'] !== revisionOf(previous)) throw fail(409, 'O JSON mudou no disco ou em outra aba. Exporte seu rascunho e recarregue antes de salvar.');
            for (const project of content.projects) {
              if (project.visual.type === 'image') {
                try { await access(resolve(root, project.visual.src)); }
                catch { throw fail(422, `Imagem não encontrada: ${project.visual.src}`); }
              }
            }
            const source = `${JSON.stringify(content, null, 2)}\n`;
            const backupDirectory = resolve(root, '.cms');
            await mkdir(backupDirectory, { recursive: true });
            await writeFile(resolve(backupDirectory, 'portfolio.backup.json'), previous, { flush: true });
            const temporary = resolve(root, `.portfolio-${randomUUID()}.tmp`);
            try {
              await writeFile(temporary, source, { flag: 'wx', flush: true });
              await rename(temporary, contentFile);
            } finally { await rm(temporary, { force: true }); }
            return { revision: revisionOf(source) };
          };
          const operation = writeQueue.then(save);
          writeQueue = operation.catch(() => {});
          json(response, 200, await operation);
          return;
        }
        if (pathname === '/api/images' && request.method === 'POST') {
          const body = await bodyOf(request, 8 * 1024 * 1024);
          const extension = imageExtension(body, request.headers['content-type']);
          const src = `assets/projects/${randomUUID()}.${extension}`;
          await mkdir(resolve(root, 'assets/projects'), { recursive: true });
          await writeFile(resolve(root, src), body, { flag: 'wx' });
          json(response, 201, { src });
          return;
        }
      }
      if (pathname.startsWith('/api/')) throw fail(405, 'Operação não disponível.');
      if (!['GET', 'HEAD'].includes(request.method)) throw fail(405, 'Método não permitido.');
      if (pathname === '/cms' || pathname === '/cms/') {
        response.writeHead(200, { 'Content-Type': types['.html'] }).end(request.method === 'HEAD' ? undefined : await readFile(resolve(toolRoot, 'cms/index.html')));
        return;
      }
      const file = pathname.slice(1) || 'index.html';
      const cmsFiles = ['cms/cms.js', 'cms/cms.css'];
      if (!publicFiles.includes(file) && !cmsFiles.includes(file) && !imagePathPattern.test(file)) throw fail(404, 'Arquivo não encontrado.');
      let body = await readFile(resolve(cmsFiles.includes(file) || file === 'lib/content.js' ? toolRoot : root, file));
      if (file === 'index.html') body = Buffer.from(compileHtml(body.toString('utf8'), validatePortfolio(JSON.parse(await readFile(contentFile, 'utf8')))));
      response.writeHead(200, { 'Content-Type': types[extname(file)] }).end(request.method === 'HEAD' ? undefined : body);
    } catch (error) {
      const status = error.status || (error.code === 'ENOENT' ? 404 : 500);
      if (status === 500) console.error('[cms]', error);
      if (!response.headersSent) json(response, status, { error: status === 500 ? 'Não foi possível concluir a operação. Consulte o terminal.' : error.message });
      else response.end();
    }
  });
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const index = process.argv.indexOf('--port');
  const port = Number(index === -1 ? '4180' : process.argv[index + 1]);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('A porta deve ser um inteiro entre 1 e 65535.');
  const server = createCmsServer();
  server.listen(port, '127.0.0.1', () => console.log(`CMS local: http://127.0.0.1:${port}/cms/\nSite: http://127.0.0.1:${port}/`));
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
}
