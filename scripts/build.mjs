import { mkdir, readFile, rm, writeFile, copyFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { projectRoot, filesForPortfolio, compileHtml } from './site.mjs';
import { validatePortfolio } from '../lib/content.js';

export async function buildSite({ root = projectRoot, output = resolve(root, 'dist') } = {}) {
  const data = validatePortfolio(JSON.parse(await readFile(resolve(root, 'portfolio.json'), 'utf8')));
  const publicFiles = filesForPortfolio(data);
  const template = await readFile(resolve(root, 'index.html'), 'utf8');

  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });

  for (const file of publicFiles) {
    const target = resolve(output, file);
    await mkdir(dirname(target), { recursive: true });
    if (file === 'index.html') await writeFile(target, compileHtml(template, data));
    else await copyFile(resolve(root, file), target);
  }

  await writeFile(resolve(output, '.nojekyll'), '');
  return { files: publicFiles.length + 1, projects: data.projects.length, name: data.profile.name };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await buildSite();
  console.log(`Build concluído: ${result.files} arquivos em dist/.`);
  console.log(`${result.name} · ${result.projects} projetos · conteúdo validado.`);
}
