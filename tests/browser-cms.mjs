/* Execute through Playwright MCP against: node tests/serve-cms.mjs.
 * The fixture uses temporary storage, never the working portfolio.json.
 */
async (page) => {
  const origin = new URL(page.url()).origin;
  if (new URL(origin).port !== '4175') throw new Error('Use o CMS de teste isolado na porta 4175.');
  const checks = [];
  const assert = (condition, message) => { if (!condition) throw new Error(message); checks.push(message); };
  const read = async () => (await (await page.request.get(`${origin}/api/content`)).json()).content;
  const save = async () => {
    await page.getByRole('button', { name: 'Salvar no JSON', exact: true }).click();
    await page.getByText('JSON sincronizado · tudo salvo no disco', { exact: true }).waitFor();
  };
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${origin}/cms/`);
  await page.getByRole('heading', { name: 'Projetos', exact: true }).waitFor();
  const initial = await read();
  assert(await page.locator('.project-row').count() === initial.projects.length, 'CMS lê o acervo completo do disco');
  assert(await page.locator('[data-view="categories"]').count() === 0 && await page.getByLabel('Categoria', { exact: true }).count() === 0, 'CMS não oferece categorias nem filtro por categoria');
  assert(JSON.stringify(await page.locator('.project-row h3').allTextContents()) === JSON.stringify(initial.projects.map(project => project.title)), 'CMS apresenta os projetos na ordem salva');
  await page.getByRole('button', { name: '+ Novo projeto', exact: true }).click();
  assert(await page.getByLabel('Categoria', { exact: true }).count() === 0, 'Editor cria projetos sem exigir categoria');
  await page.getByLabel('Título', { exact: true }).fill('Case privado · CMS');
  await page.getByLabel('Identificador único', { exact: true }).fill('cms-test-project');
  await page.getByLabel('Tipo / chamada', { exact: true }).fill('CASE PRIVADO');
  await page.getByLabel('Descrição', { exact: true }).fill('Projeto privado criado na regressão de navegador.');
  await page.getByLabel('Tecnologias', { exact: true }).fill('Node.js, JavaScript');
  await page.getByLabel('Visibilidade do código', { exact: true }).selectOption('private');
  assert(await page.getByLabel('Como apresentar este projeto?', { exact: true }).locator('option').allTextContents().then(options => options.join('|') === 'Visual técnico — sem screenshot|Galeria'), 'Apresentação oferece somente visual técnico e galeria');
  await page.getByRole('button', { name: '+ Adicionar bloco', exact: true }).click();
  await page.getByLabel('Bloco 1 · título', { exact: true }).fill('O desafio');
  await page.getByLabel('Texto', { exact: true }).fill('Um case sem links públicos.');
  await page.getByRole('button', { name: 'Aplicar projeto', exact: true }).click();
  await save();
  let content = await read();
  let project = content.projects.find(item => item.id === 'cms-test-project');
  assert(project?.visual.type === 'repository' && !project.url && project.repositoryVisibility === 'private', 'Cria e persiste projeto privado sem URL, com visual técnico');
  assert(!Object.hasOwn(project, 'category') && !Object.hasOwn(content.projectsSection, 'categories'), 'JSON persiste projetos sem campos de categoria');

  await page.getByRole('button', { name: 'Editar projeto: Case privado · CMS', exact: true }).click();
  await page.getByLabel('Identificador único', { exact: true }).fill(initial.projects[0].id);
  await page.getByRole('button', { name: 'Aplicar projeto', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'duplicate project ID' }).waitFor();
  assert(await page.getByRole('dialog').isVisible(), 'ID duplicado mantém o formulário aberto com erro');
  await page.getByLabel('Identificador único', { exact: true }).fill('cms-test-project');
  await page.getByLabel('Como apresentar este projeto?', { exact: true }).selectOption('gallery');
  await page.getByRole('button', { name: 'Aplicar projeto', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Adicione pelo menos uma imagem' }).waitFor();
  const screenshot = async (width, height) => Buffer.from(await page.evaluate(({ width, height }) => {
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#18221e'; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#c7f36b'; ctx.font = `${width > height ? 42 : 25}px sans-serif`; ctx.fillText('CMS / GALERIA DE TESTE', 24, 60);
    ctx.fillStyle = '#36473e'; ctx.fillRect(24, 100, width - 48, height - 124);
    ctx.fillStyle = '#eef3ec'; ctx.font = '24px sans-serif'; ctx.fillText(`${width} × ${height}`, 44, 150);
    return canvas.toDataURL('image/png').split(',')[1];
  }, { width, height }), 'base64');
  const upload = page.getByLabel('Adicionar imagens à galeria', { exact: true });
  await upload.setInputFiles({ name: 'invalid.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') });
  await page.getByRole('alert').filter({ hasText: 'Selecione apenas PNG' }).waitFor();
  assert(await page.locator('.gallery-entry').count() === 0, 'Arquivo incompatível não é adicionado à galeria');
  await upload.setInputFiles([
    { name: 'wide.png', mimeType: 'image/png', buffer: await screenshot(1280, 720) },
    { name: 'mobile.png', mimeType: 'image/png', buffer: await screenshot(390, 844) },
    { name: 'extra.png', mimeType: 'image/png', buffer: await screenshot(800, 600) }
  ]);
  await page.getByLabel('Descrição da imagem 1 (texto alternativo)', { exact: true }).fill('Tela wide do projeto privado');
  await page.getByLabel('Descrição da imagem 2 (texto alternativo)', { exact: true }).fill('Tela mobile do projeto privado');
  await page.getByLabel('Descrição da imagem 3 (texto alternativo)', { exact: true }).fill('Imagem extra a remover');
  await page.getByRole('radio', { name: 'Usar imagem 2 como capa', exact: true }).check();
  await page.getByRole('button', { name: 'Mover imagem 2 para antes', exact: true }).click();
  assert(await page.getByRole('radio', { name: 'Usar imagem 1 como capa', exact: true }).isChecked(), 'Reordenar acompanha a imagem escolhida como capa');
  await page.getByRole('button', { name: 'Mover imagem 1 para depois', exact: true }).click();
  await page.getByRole('button', { name: 'Remover imagem 3', exact: true }).click();
  assert(await page.locator('.gallery-entry').count() === 2, 'Seleção múltipla permite remover imagens antes do upload');
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await page.getByRole('dialog').evaluate(dialog => dialog.scrollWidth === dialog.clientWidth), 'Editor da galeria não tem overflow em 390 px');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('button', { name: 'Aplicar projeto', exact: true }).click();
  await save();
  project = (await read()).projects.find(item => item.id === 'cms-test-project');
  assert(project.visual.type === 'gallery' && project.visual.images.length === 2 && project.visual.cover === 1 && project.visual.images.every(image => image.src.startsWith('assets/projects/')), 'Upload real persiste todas as imagens e a capa escolhida no JSON');
  await page.getByRole('button', { name: 'Editar projeto: Case privado · CMS', exact: true }).click();
  assert(await page.getByRole('radio', { name: 'Usar imagem 2 como capa', exact: true }).isChecked(), 'Reabrir o editor mantém a capa salva');
  await page.getByLabel('Descrição da imagem 1 (texto alternativo)', { exact: true }).fill('Tela wide do projeto privado · atualizada');
  await page.getByRole('button', { name: 'Aplicar projeto', exact: true }).click();
  await save();
  assert((await read()).projects.find(item => item.id === project.id).visual.images[0].src === project.visual.images[0].src, 'Editar legenda preserva o arquivo existente');
  await page.goto(`${origin}/#projetos`);
  const cardGallery = page.locator('.project-card').filter({ has: page.getByRole('heading', { name: project.title, exact: true }) }).locator('.art-gallery');
  await cardGallery.scrollIntoViewIfNeeded();
  await cardGallery.getByRole('img', { name: 'Tela mobile do projeto privado', exact: true }).waitFor();
  assert(await cardGallery.getByRole('img').getAttribute('src') === project.visual.images[1].src, 'Card inicia pela capa selecionada, mesmo sendo a segunda imagem');
  const trackPosition = await page.locator('#project-grid').evaluate(track => track.scrollLeft);
  await cardGallery.getByRole('button', { name: 'Próxima imagem', exact: true }).click();
  assert(await cardGallery.getByRole('img').getAttribute('src') === project.visual.images[0].src, 'Card permite navegar entre as imagens sem abrir os detalhes');
  await cardGallery.focus(); await page.keyboard.press('End');
  assert(await cardGallery.getByRole('img').getAttribute('src') === project.visual.images[1].src && await page.locator('#project-grid').evaluate(track => track.scrollLeft) === trackPosition, 'Teclado da galeria não move o carrossel de projetos');
  if (page.context().browser()?.browserType().name() === 'chromium') {
    await page.setViewportSize({ width: 390, height: 844 });
    await cardGallery.locator('.gallery-stage').scrollIntoViewIfNeeded();
    const box = await cardGallery.locator('.gallery-stage').boundingBox();
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true });
    const y = box.y + box.height * 0.75;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width * 0.8, y }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: box.x + box.width * 0.2, y }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    assert(await cardGallery.getByRole('img').getAttribute('src') === project.visual.images[0].src, 'Deslize na imagem navega pela galeria mobile');
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await cdp.detach();
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  await page.getByRole('button', { name: 'Explorar projeto: Case privado · CMS', exact: true }).click();
  const detail = page.getByRole('dialog');
  assert(await page.locator('.gallery-toolbar, .gallery-caption, .gallery-description').count() === 0 && await detail.locator('.art-gallery > button').count() === 2, 'Galerias exibem somente os botões anterior e próxima sobre as imagens');
  assert(await detail.getByRole('link').count() === 0, 'Projeto privado sem URLs não ganha links inválidos no site');
  assert(await detail.getByText('Código privado', { exact: true }).isVisible(), 'Site informa código privado');
  await page.waitForFunction(() => { const image = document.querySelector('dialog .gallery-stage img'); return image?.complete && image.naturalWidth > 0; });
  assert(await detail.getByRole('img').evaluate(image => image.naturalWidth === 390 && image.naturalHeight === 844 && getComputedStyle(image).objectFit === 'contain'), 'Galeria carrega a imagem mobile sem recorte');
  await detail.getByRole('button', { name: 'Imagem anterior', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('dialog .gallery-stage img')?.naturalWidth === 1280);
  assert(await detail.getByRole('img').evaluate(image => image.naturalHeight === 720), 'Galeria também carrega a imagem wide na proporção correta');
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert(await detail.evaluate(dialog => dialog.scrollWidth === dialog.clientWidth), `Galeria e controles dos detalhes sem overflow em ${width} px`);
    assert(await detail.locator('.art-gallery').evaluate(gallery => {
      const image = gallery.querySelector('.gallery-stage').getBoundingClientRect();
      return [...gallery.querySelectorAll(':scope > button')].every(button => {
        const box = button.getBoundingClientRect();
        return box.left >= image.left && box.right <= image.right && box.top >= image.top && box.bottom <= image.bottom;
      });
    }), `Botões da galeria ficam dentro da imagem em ${width} px`);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await detail.locator('.art-gallery').focus(); await page.keyboard.press('End');
  assert(await detail.getByRole('img').getAttribute('src') === project.visual.images[1].src, 'Detalhes aceitam navegação da galeria por teclado');
  const failedImage = `**/${project.visual.images[0].src}`;
  await page.route(failedImage, route => route.fulfill({ status: 404, body: 'Imagem ausente na regressão' }));
  await detail.getByRole('button', { name: 'Imagem anterior', exact: true }).click();
  await detail.getByText('Imagem indisponível. Explore as outras imagens da galeria.', { exact: true }).waitFor();
  await detail.getByRole('button', { name: 'Próxima imagem', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('dialog .gallery-stage img')?.naturalWidth === 390);
  assert(await detail.getByRole('img').getAttribute('src') === project.visual.images[1].src, 'Uma imagem indisponível mantém os controles e permite recuperar a galeria');
  await page.unroute(failedImage);
  await page.keyboard.press('Escape');

  await page.goto(`${origin}/cms/`);
  await page.getByRole('button', { name: 'Conteúdo do site ↗', exact: true }).click();
  await page.getByLabel('Qual seção deseja editar?', { exact: true }).selectOption('meta');
  await page.getByLabel('Título · title', { exact: true }).fill('Portfólio editado pelo CMS');
  await save();
  assert((await read()).meta.title === 'Portfólio editado pelo CMS', 'Editor dinâmico altera e persiste outros conteúdos do site');
  await page.getByLabel('Título · title', { exact: true }).fill('Alteração a descartar');
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Recarregar', exact: true }).click();
  await page.getByText('JSON sincronizado · tudo salvo no disco', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Conteúdo do site ↗', exact: true }).click();
  assert(await page.getByLabel('Título · title', { exact: true }).inputValue() === 'Portfólio editado pelo CMS', 'Recarregar descarta apenas alterações não salvas');

  await page.setViewportSize({ width: 390, height: 844 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth === innerWidth), 'CMS sem overflow horizontal em 390 px');
  await page.getByRole('button', { name: /^Projetos \d/ }).click();
  const trigger = page.getByRole('button', { name: 'Editar projeto: Case privado · CMS', exact: true });
  await trigger.click();
  assert(await page.getByRole('dialog').evaluate(dialog => dialog.scrollWidth === dialog.clientWidth), 'Editor de projeto ajusta-se à tela mobile');
  await page.getByRole('button', { name: 'Remover imagem 2', exact: true }).click();
  assert(await page.getByRole('radio', { name: 'Usar imagem 1 como capa', exact: true }).isChecked(), 'Remover a capa escolhe automaticamente a primeira imagem restante');
  await page.getByRole('button', { name: 'Aplicar projeto', exact: true }).click();
  await save();
  const singleImage = (await read()).projects.find(item => item.id === project.id).visual;
  assert(singleImage.cover === 0 && singleImage.images.length === 1, 'Galeria com uma única imagem continua válida');
  const singlePage = await page.context().newPage();
  await singlePage.goto(`${origin}/`);
  await singlePage.getByRole('button', { name: `Explorar projeto: ${project.title}`, exact: true }).click();
  const singleDialog = singlePage.getByRole('dialog');
  assert(await singleDialog.getByRole('button', { name: 'Imagem anterior', exact: true }).isDisabled() && await singleDialog.getByRole('button', { name: 'Próxima imagem', exact: true }).isDisabled(), 'Galeria de uma imagem desativa as duas setas');
  await singlePage.close();
  await trigger.click();
  await page.keyboard.press('Escape');
  assert(await trigger.evaluate(button => button === document.activeElement), 'Escape fecha o editor e devolve o foco');
  await trigger.click();
  await page.getByLabel('Como apresentar este projeto?', { exact: true }).selectOption('repository');
  await page.getByRole('button', { name: 'Aplicar projeto', exact: true }).click();
  await save();
  assert((await read()).projects.find(item => item.id === project.id).visual.type === 'repository', 'Galeria pode ser substituída por visual técnico');
  await page.getByRole('button', { name: 'Mover para antes: Case privado · CMS', exact: true }).click();
  await save();
  assert((await read()).projects.at(-2).id === 'cms-test-project', 'Reordenação é salva e respeita a sequência do carrossel');
  const orderedContent = await read();
  const orderedPage = await page.context().newPage();
  await orderedPage.goto(`${origin}/`);
  await orderedPage.getByRole('heading', { level: 1 }).waitFor();
  assert(JSON.stringify(await orderedPage.locator('.project-card h3').allTextContents()) === JSON.stringify(orderedContent.projects.map(project => project.title)), 'Landing reflete exatamente a ordem definida no CMS após reordenar');
  await orderedPage.close();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Remover projeto: Case privado · CMS', exact: true }).click();
  await save();
  assert(!(await read()).projects.some(item => item.id === 'cms-test-project'), 'Remover projeto atualiza o JSON no disco');
  return { checks };
}
