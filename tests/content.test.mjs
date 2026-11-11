import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validatePortfolio, safeUrl, filterProjects, projectCountLabel, createResume } from '../lib/content.js';
import { compileHtml, publicFiles } from '../scripts/site.mjs';

const source = JSON.parse(await readFile(new URL('../portfolio.json', import.meta.url), 'utf8'));
const template = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('the actual portfolio has valid content and resolvable navigation targets', () => {
  assert.equal(validatePortfolio(source), source);
});

test('content rejects broken categories, duplicate project identifiers and unsafe links', () => {
  const duplicate = structuredClone(source);
  duplicate.projects[1].id = duplicate.projects[0].id;
  assert.throws(() => validatePortfolio(duplicate), /duplicate project ID/);
  const category = structuredClone(source);
  category.projects[0].category = 'missing-category';
  assert.throws(() => validatePortfolio(category), /Unknown category/);
  const link = structuredClone(source);
  link.projects[0].url = 'javascript:alert(1)';
  assert.throws(() => validatePortfolio(link), /Invalid repository URL/);
  const anchor = structuredClone(source);
  anchor.navigation[0].href = '#missing';
  assert.throws(() => validatePortfolio(anchor), /Unknown anchor/);
});

test('links permit HTTPS and local anchors but reject executable and credential-bearing URLs', () => {
  assert.ok(safeUrl('https://github.com/knopmickael'));
  assert.ok(safeUrl('#projetos'));
  for (const url of ['javascript:alert(1)', 'data:text/html,hello', '//example.com', 'https://user:password@example.com', '#', '']) assert.equal(safeUrl(url), false);
});

test('private projects support no links and every project visual mode validates', () => {
  const content = structuredClone(source);
  const project = content.projects[0];
  delete project.url;
  project.repositoryVisibility = 'private';
  for (const visual of [{ type: 'repository' }, { type: 'pending', prompt: 'Gerar depois com referência real.' }, { type: 'image', src: 'assets/projects/case.png', label: 'Tela inicial do case' }]) {
    project.visual = visual;
    assert.equal(validatePortfolio(content), content);
  }
  const resume = createResume(content);
  assert.ok(resume.includes(project.title));
  assert.ok(!resume.includes('(undefined)'));
  assert.ok(!resume.includes('](undefined)'));
});

test('project filters handle all, a single category and an empty selection', () => {
  const originalProjects = structuredClone(source.projects);
  assert.equal(filterProjects(source.projects, 'all').length, source.projects.length);
  const backend = filterProjects(source.projects, 'backend');
  assert.ok(backend.length > 0);
  assert.ok(backend.every(project => project.category === 'backend'));
  assert.deepEqual(filterProjects(source.projects, 'missing'), []);
  assert.deepEqual(source.projects, originalProjects);
  assert.match(projectCountLabel(source.ui, 1), /^1 projeto nesta seleção$/);
  assert.match(projectCountLabel(source.ui, 0), /^0 projetos nesta seleção$/);
});

test('resume reflects JSON edits, including work history, projects and education', () => {
  const data = structuredClone(source);
  data.profile.name = 'Nome atualizado';
  data.experience.entries[0].company = 'Empresa atualizada';
  const resume = createResume(data);
  assert.ok(resume.startsWith('# Nome atualizado'));
  assert.ok(resume.includes('Empresa atualizada'));
  assert.ok(resume.includes(data.profile.education.degree));
  data.projects.forEach(project => assert.ok(resume.includes(project.url)));
});

test('build embeds metadata and bootstrap messages from JSON, escaping HTML and script closers', () => {
  const data = structuredClone(source);
  data.meta.title = 'Nome <teste> & "título"';
  data.ui.loadErrorTitle = '</script><script>alert(1)</script>';
  const html = compileHtml(template, data);
  assert.ok(html.includes('<title>Nome &lt;teste&gt; &amp; &quot;título&quot;</title>'));
  assert.ok(!html.includes(data.ui.loadErrorTitle));
  const boot = JSON.parse(html.match(/<script id="boot-content" type="application\/json">(.*?)<\/script>/s)[1]);
  assert.equal(boot.loadErrorTitle, data.ui.loadErrorTitle);
  assert.ok(html.includes(data.ui.noscript));
});

test('publication uses an explicit public file list that excludes source knowledge and tooling', () => {
  assert.ok(publicFiles.includes('portfolio.json'));
  assert.ok(publicFiles.includes('lib/content.js'));
  assert.ok(!publicFiles.some(file => file.startsWith('kb/') || file.startsWith('scripts/') || file.startsWith('tests/')));
  assert.ok(!publicFiles.includes('package.json'));
});
