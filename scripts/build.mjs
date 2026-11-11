import { mkdir, readFile, rm, writeFile, copyFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { projectRoot, publicFiles, readPortfolio, compileHtml } from './site.mjs';

const data = await readPortfolio();
const output = resolve(projectRoot, 'dist');
const template = await readFile(resolve(projectRoot, 'index.html'), 'utf8');

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const file of publicFiles) {
  const target = resolve(output, file);
  await mkdir(dirname(target), { recursive: true });
  if (file === 'index.html') await writeFile(target, compileHtml(template, data));
  else await copyFile(resolve(projectRoot, file), target);
}

await writeFile(resolve(output, '.nojekyll'), '');
console.log(`Build concluído: ${publicFiles.length + 1} arquivos em dist/.`);
console.log(`${data.profile.name} · ${data.projects.length} projetos · conteúdo validado.`);
