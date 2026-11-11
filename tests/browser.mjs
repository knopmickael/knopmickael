/*
 * Regressões de navegador sem dependências no projeto.
 * Execute este arquivo como `filename` no Playwright MCP browser_run_code_unsafe,
 * com uma aba aberta no servidor local. O MCP fornece a instância `page`.
 */
async (page) => {
  const base = new URL('./', page.url()).href;
  const response = await page.request.get(new URL('portfolio.json', base).href);
  const content = await response.json();
  const results = [];
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
    results.push(message);
  };

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base);
  await page.getByRole('heading', { level: 1 }).waitFor();

  // Regression: replacing the clicked SVG must not look like an outside click.
  await page.getByRole('button', { name: content.ui.openMenu, exact: true }).locator('svg').click();
  assert(await page.getByRole('navigation', { name: content.ui.navigationLabel }).isVisible(), 'Clique diretamente no ícone abre e mantém o menu mobile');
  assert(await page.getByRole('link', { name: content.navigation[0].label, exact: true }).evaluate(element => element === document.activeElement), 'Menu transfere o foco ao primeiro link');
  await page.keyboard.press('Escape');
  assert(await page.getByRole('button', { name: content.ui.openMenu }).evaluate(element => element === document.activeElement), 'Escape fecha o menu e devolve o foco');
  await page.keyboard.press('Enter');
  assert(await page.getByRole('button', { name: content.ui.closeMenu }).getAttribute('aria-expanded') === 'true', 'Menu pode ser reaberto por teclado');

  const projectNavigation = content.navigation.find(item => item.href === `#${content.projectsSection.id}`);
  await page.getByRole('link', { name: projectNavigation.label, exact: true }).click();
  assert(await page.getByRole('button', { name: content.ui.openMenu }).getAttribute('aria-expanded') === 'false', 'Navegação por âncora recolhe o menu');

  const category = content.projectsSection.categories.find(item => item.id !== 'all' && content.projects.some(project => project.category === item.id));
  if (category) {
    await page.getByRole('button', { name: category.label, exact: true }).click();
    const selected = content.projects.filter(project => project.category === category.id);
    assert(await page.locator('.project-card').count() === selected.length, 'Filtro mobile reflete os projetos do JSON');
    const project = selected[0];
    const trigger = page.getByRole('button', { name: `${content.ui.projectDetails}: ${project.title}`, exact: true });
    await trigger.click();
    assert(await page.getByRole('dialog').isVisible(), 'Projeto abre em diálogo no mobile');
    assert(await page.getByRole('dialog').evaluate(element => element.scrollWidth <= element.clientWidth), 'Diálogo não tem overflow horizontal em 390 px');
    await page.keyboard.press('Shift+Tab');
    assert(await page.getByRole('dialog').evaluate(element => element.contains(document.activeElement)), 'Foco permanece dentro do diálogo');
    await page.keyboard.press('Escape');
    assert(await trigger.evaluate(element => element === document.activeElement), 'Fechar diálogo restaura o foco ao projeto');
  }

  await page.getByRole('button', { name: content.projectsSection.categories.find(item => item.id === 'all').label, exact: true }).click();
  const layout = [];
  for (const width of [320, 390, 720, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const dimensions = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
    assert(dimensions.viewport === dimensions.content, `Sem overflow horizontal em ${width} px`);
    const artworkFits = await page.locator('.project-card').evaluateAll(cards => cards.every(card => card.querySelector('.project-art').getBoundingClientRect().width <= card.clientWidth + 1));
    assert(artworkFits, `Ilustrações não são cortadas pelo card em ${width} px`);
    layout.push(dimensions);
  }

  const emptyData = structuredClone(content);
  emptyData.projectsSection.categories.push({ id: 'empty-regression', label: 'Categoria vazia de teste' });
  emptyData.projects[0].title = 'Um título extenso para verificar a acomodação do conteúdo sem cortes ou perda de informações na interface';
  emptyData.projects[0].tags.push('TecnologiaComUmNomeMuitoExtensoParaValidarQuebraDeLinha');
  await page.route('**/portfolio.json', route => route.fulfill({ json: emptyData }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base);
  await page.getByRole('heading', { name: emptyData.projects[0].title, exact: true }).waitFor();
  assert(await page.evaluate(() => document.documentElement.scrollWidth === innerWidth), 'Conteúdo longo mantém o reflow em 390 px');
  await page.getByRole('button', { name: 'Categoria vazia de teste', exact: true }).click();
  assert(await page.getByRole('heading', { name: content.ui.emptyTitle, exact: true }).isVisible(), 'Categoria vazia apresenta estado explicativo');
  await page.unroute('**/portfolio.json');

  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/portfolio.json', async route => {
    await gate;
    await route.fulfill({ status: 503, body: 'Temporary test failure' });
  });
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  assert(await page.getByText(content.ui.loading, { exact: true }).isVisible(), 'Carregamento é anunciado enquanto o JSON está pendente');
  release();
  await page.getByRole('heading', { name: content.ui.loadErrorTitle, exact: true }).waitFor();
  assert(await page.getByRole('button', { name: content.ui.retry, exact: true }).isVisible(), 'Falha de carregamento oferece nova tentativa');
  await page.unroute('**/portfolio.json');
  await page.getByRole('button', { name: content.ui.retry, exact: true }).click();
  await page.getByRole('heading', { level: 1 }).filter({ hasText: content.hero.title[0] }).waitFor();
  assert(await page.locator('.project-card').count() === content.projects.length, 'Nova tentativa recupera o portfólio completo');

  await page.evaluate(() => {
    Object.defineProperty(navigator.clipboard, 'writeText', { configurable: true, value: async () => { throw new Error('Clipboard unavailable in regression test'); } });
  });
  await page.getByRole('button', { name: content.contact.copyLabel, exact: true }).click();
  await page.getByRole('status').filter({ hasText: content.ui.copyError }).waitFor({ state: 'visible' });
  assert(await page.getByRole('status').filter({ hasText: content.ui.copyError }).isVisible(), 'Falha da área de transferência apresenta feedback e mantém o contato disponível');

  await page.goto(base);
  await page.getByRole('heading', { level: 1 }).waitFor();
  return { checks: results, responsiveLayout: layout };
}
