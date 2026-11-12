import { validatePortfolio, createResume } from './lib/content.js';

const root = document.querySelector('#app');
const boot = JSON.parse(document.querySelector('#boot-content').textContent);
const bootLabel = document.querySelector('#boot-label');
if (bootLabel) bootLabel.textContent = boot.loading || '';

const paths = {
  arrowUpRight: ['M7 17 17 7M7 7h10v10'],
  arrowRight: ['M4 12h15m-6-6 6 6-6 6'],
  arrowDown: ['M12 4v16m-6-6 6 6 6-6'],
  arrowUp: ['M12 20V4m-6 6 6-6 6 6'],
  sun: ['M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8', 'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5'],
  moon: ['M20.8 13A9 9 0 0 1 11 3.2 9 9 0 1 0 20.8 13Z'],
  menu: ['M4 7h16M4 12h16M4 17h16'],
  close: ['m6 6 12 12M6 18 18 6'],
  code: ['m8 8-4 4 4 4m8-8 4 4-4 4m-3-11-2 14'],
  layout: ['M3 5h18v14H3zM3 9h18M9 9v10'],
  database: ['M20 6c0 2.2-16 2.2-16 0s16-2.2 16 0ZM4 6v12c0 2.2 16 2.2 16 0V6M4 12c0 2.2 16 2.2 16 0'],
  terminal: ['M3 4h18v16H3zM7 9l3 3-3 3m6 0h4'],
  layers: ['m12 3 10 5-10 5L2 8l10-5Zm-9 9 9 5 9-5M3 16l9 5 9-5'],
  spark: ['m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z'],
  globe: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z'],
  copy: ['M8 8h12v13H8zM16 8V3H3v13h5'],
  check: ['m5 12 4 4L19 6'],
  download: ['M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5'],
  chevron: ['m7 10 5 5 5-5'],
  linkedin: ['M4 9v12m0-17v.1M9 21V9h5v2c2-4 7-3 7 2v8M14 11v10'],
  github: ['M9 19c-4 1-4-2-6-2m12 5v-4c0-1 .1-1.7-.5-2.3 3-.3 6-1.5 6-6A4.7 4.7 0 0 0 19.2 6c.1-.4.6-1.8-.2-3 0 0-1.2-.4-4 1.5a14 14 0 0 0-7 0C5.2 2.6 4 3 4 3c-.8 1.2-.3 2.6-.2 3A4.7 4.7 0 0 0 2.5 9.7c0 4.5 3 5.7 6 6-.6.6-.6 1.3-.5 2.3v4']
};

function icon(name, className = '') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  for (const [key, value] of Object.entries({ viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.6', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', class: `icon ${className}` })) svg.setAttribute(key, value);
  for (const d of paths[name] || paths.code) {
    const path = document.createElementNS(svg.namespaceURI, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || (value === false && !key.startsWith('aria-'))) continue;
    if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
    else node.setAttribute(key, value === true && !key.startsWith('aria-') ? '' : String(value));
  }
  node.append(...children.flat(Infinity).filter(child => child !== null && child !== undefined && child !== false).map(child => child instanceof Node ? child : document.createTextNode(String(child))));
  return node;
}

function lines(text, className) {
  return text.map((line, index) => el('span', { class: className?.(index) || '' }, line));
}

function externalLink(url, label, ui, className = '', ...children) {
  return el('a', { href: url, target: '_blank', rel: 'noopener noreferrer', class: className }, label, children, el('span', { class: 'sr-only' }, ` (${ui.externalLink})`));
}

function sectionHeading(data, extras = null) {
  return el('div', { class: 'section-heading' },
    el('div', {}, el('p', { class: 'eyebrow' }, data.eyebrow), el('h2', { id: `${data.id}-title` }, lines(data.title))),
    extras || (data.description ? el('p', { class: 'section-description' }, data.description) : null)
  );
}

function projectArtwork(project, ui, miniature = false) {
  const visual = project.visual;
  if (visual.type === 'repository') {
    return el('div', { class: `project-art art-repository${miniature ? ' art-miniature' : ''}`, 'aria-hidden': 'true' },
      el('div', { class: 'repository-cover' }, el('div', { class: 'repository-cover-top' }, icon('terminal'), el('span', {}, project.type)),
        el('span', { class: 'repository-cover-title' }, project.title),
        el('div', { class: 'repository-cover-bottom' }, el('span', {}, '</>'), el('span', {}, project.tags.slice(0, 3).join(' / ')))));
  }
  let current = visual.cover;
  const gallery = el('div', { class: `project-art art-gallery${miniature ? ' art-miniature' : ''}`, role: 'group', 'aria-roledescription': 'carrossel', 'aria-label': ui.galleryLabel.replace('{title}', project.title), tabindex: '0' });
  const stage = el('div', { class: 'gallery-stage' });
  const position = el('span', { class: 'sr-only', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' });
  function showImage(index) {
    current = (index + visual.images.length) % visual.images.length;
    const image = visual.images[current];
    stage.replaceChildren(el('img', { src: image.src, alt: image.label, loading: miniature ? 'eager' : 'lazy', decoding: 'async', draggable: 'false', onerror: event => {
      if (!event.currentTarget.isConnected) return;
      stage.replaceChildren(projectArtwork({ ...project, visual: { type: 'repository' } }, ui, miniature), el('p', { class: 'gallery-error', role: 'status' }, ui.galleryImageError));
    } }));
    position.textContent = `${ui.galleryPosition.replace('{current}', String(current + 1)).replace('{count}', String(visual.images.length))}: ${image.label}`;
  }
  const previous = el('button', { type: 'button', class: 'icon-button gallery-previous carousel-previous', 'aria-label': ui.previousImage, disabled: visual.images.length === 1, onclick: () => showImage(current - 1) }, icon('arrowRight'));
  const next = el('button', { type: 'button', class: 'icon-button gallery-next', 'aria-label': ui.nextImage, disabled: visual.images.length === 1, onclick: () => showImage(current + 1) }, icon('arrowRight'));
  gallery.addEventListener('keydown', event => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault(); event.stopPropagation();
    showImage(event.key === 'Home' ? 0 : event.key === 'End' ? visual.images.length - 1 : current + (event.key === 'ArrowRight' ? 1 : -1));
  });
  let touch;
  stage.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse') return;
    touch = { x: event.clientX, y: event.clientY }; stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener('pointercancel', () => { touch = undefined; });
  stage.addEventListener('pointerup', event => {
    if (!touch) return;
    const x = event.clientX - touch.x, y = event.clientY - touch.y;
    touch = undefined;
    if (Math.abs(x) > 40 && Math.abs(x) > Math.abs(y) * 1.4) showImage(current + (x < 0 ? 1 : -1));
  });
  gallery.append(stage, previous, next, position);
  showImage(current);
  return gallery;
}

function createSystem(data) {
  const caption = el('p', { class: 'system-caption', 'aria-live': 'polite' }, data.layers.find(layer => layer.id === data.defaultLayer).description);
  const buttons = [];
  const stage = el('div', { class: 'system-stage', role: 'group', 'aria-label': data.label });
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  for (const [key, value] of Object.entries({ viewBox: '0 0 500 370', fill: 'none', class: 'system-connections', 'aria-hidden': 'true' })) svg.setAttribute(key, value);
  for (const d of ['M145 113V150Q145 165 160 165H320Q335 165 335 180V200', 'M335 238V270Q335 285 320 285H145Q130 285 130 300']) {
    const path = document.createElementNS(svg.namespaceURI, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  stage.append(svg, el('div', { class: 'system-cross cross-one', 'aria-hidden': 'true' }, '+'), el('div', { class: 'system-cross cross-two', 'aria-hidden': 'true' }, '+'));
  for (const layer of data.layers) {
    const button = el('button', {
      type: 'button', class: `system-node system-${layer.id}`, 'aria-pressed': layer.id === data.defaultLayer,
      onclick: () => {
        buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
        caption.textContent = layer.description;
      }
    }, el('span', { class: 'system-node-icon' }, icon(layer.icon)), el('span', { class: 'system-node-copy' },
      el('span', { class: 'system-node-eyebrow' }, `${layer.number} / ${layer.eyebrow}`),
      el('span', { class: 'system-node-title' }, layer.title), el('span', { class: 'system-node-stack' }, layer.stack)
    ), el('span', { class: 'system-node-indicator', 'aria-hidden': 'true' }));
    buttons.push(button);
    stage.append(button);
  }
  return el('div', { class: 'system-figure' },
    el('div', { class: 'system-topline' }, el('span', {}, data.eyebrow), el('span', {}, data.index)),
    stage, caption,
    el('div', { class: 'system-bottomline' }, el('span', { class: 'system-hint' }, el('i', { 'aria-hidden': 'true' }), data.hint), el('span', {}, data.footer))
  );
}

function render(data) {
  const { ui, profile } = data;
  const social = id => profile.socials.find(item => item.id === id);
  let toastTimeout;
  const toast = el('div', { class: 'toast', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' });
  function notify(message, error = false) {
    clearTimeout(toastTimeout);
    toast.replaceChildren(icon(error ? 'copy' : 'check'), el('span', {}, message));
    toast.classList.add('is-visible');
    toastTimeout = setTimeout(() => toast.classList.remove('is-visible'), 5000);
  }

  const dialog = el('dialog', { class: 'project-dialog', 'aria-labelledby': 'project-dialog-title' });
  let dialogTrigger;
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('modal-open');
    dialogTrigger?.focus({ preventScroll: true });
  });
  dialog.addEventListener('click', event => {
    const box = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
  });
  function showProject(project, trigger) {
    dialogTrigger = trigger;
    dialog.replaceChildren(el('div', { class: 'dialog-content' },
      el('div', { class: 'dialog-topline' }, el('span', { class: 'eyebrow' }, `${project.number} / ${project.type}`),
        el('button', { class: 'icon-button', type: 'button', 'aria-label': ui.closeDialog, autofocus: true, onclick: () => dialog.close() }, icon('close'))),
      el('h2', { id: 'project-dialog-title' }, project.title),
      el('p', { class: 'dialog-description' }, project.description),
      el('div', { class: 'tags' }, project.tags.map(tag => el('span', {}, tag))),
      projectArtwork(project, ui, true),
      el('div', { class: 'dialog-details' }, project.details.map(detail => el('section', {}, el('h3', {}, detail.title), el('p', {}, detail.text)))),
      el('div', { class: 'project-links' },
        project.demoUrl ? externalLink(project.demoUrl, ui.visitProject, ui, 'button button-primary dialog-action', icon('globe'), icon('arrowUpRight')) : null,
        project.url ? externalLink(project.url, ui.repository, ui, 'text-link dialog-action', icon('github'), icon('arrowUpRight')) : null,
        project.repositoryVisibility === 'private' ? el('span', { class: 'private-code' }, icon('code'), ui.privateRepository) : null)
    ));
    dialog.showModal();
    document.documentElement.classList.add('modal-open');
  }

  function updateTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeButton.setAttribute('aria-label', theme === 'dark' ? ui.lightTheme : ui.darkTheme);
    themeButton.replaceChildren(icon(theme === 'dark' ? 'sun' : 'moon'));
    document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? data.meta.themeColor : '#f4f5ef';
    try { localStorage.setItem('portfolio-theme', theme); } catch {}
  }
  const themeButton = el('button', { type: 'button', class: 'icon-button theme-toggle', onclick: () => updateTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark') });
  let initialTheme = data.meta.defaultTheme;
  try { initialTheme = localStorage.getItem('portfolio-theme') || initialTheme; } catch {}
  updateTheme(initialTheme === 'light' ? 'light' : 'dark');

  const navigation = el('nav', { class: 'navigation', id: 'main-navigation', 'aria-label': ui.navigationLabel }, data.navigation.map(item => el('a', { href: item.href }, item.label)), el('a', { class: 'mobile-contact-link', href: data.header.contactHref }, data.header.contactLabel, icon('arrowUpRight')));
  const menuButton = el('button', { class: 'icon-button menu-toggle', type: 'button', 'aria-label': ui.openMenu, 'aria-expanded': 'false', 'aria-controls': 'main-navigation' });
  const header = el('header', { class: 'site-header' });
  function closeMenu(restoreFocus = false) {
    header.classList.remove('menu-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', ui.openMenu);
    menuButton.replaceChildren(icon('menu'));
    if (restoreFocus) menuButton.focus();
  }
  menuButton.replaceChildren(icon('menu'));
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    header.classList.toggle('menu-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? ui.closeMenu : ui.openMenu);
    menuButton.replaceChildren(icon(open ? 'close' : 'menu'));
    if (open) navigation.querySelector('a')?.focus({ preventScroll: true });
  });
  navigation.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && header.classList.contains('menu-open')) closeMenu(true); });
  document.addEventListener('click', event => { if (!event.composedPath().includes(header)) closeMenu(); });
  header.addEventListener('focusout', event => { if (event.relatedTarget && !header.contains(event.relatedTarget)) closeMenu(); });
  matchMedia('(min-width: 800px)').addEventListener('change', () => closeMenu());
  header.append(el('div', { class: 'container header-inner' },
    el('a', { href: '#inicio', class: 'brand', 'aria-label': data.header.homeLabel }, el('span', { class: 'brand-mark', 'aria-hidden': 'true' }, profile.initials, el('i', {})), el('span', { class: 'brand-name' }, profile.brand)),
    navigation,
    el('div', { class: 'header-actions' }, themeButton, el('span', { class: 'header-divider', 'aria-hidden': 'true' }), el('a', { href: data.header.contactHref, class: 'header-contact' }, data.header.contactLabel, icon('arrowUpRight')), menuButton)
  ));

  const hero = el('section', { class: 'hero container', 'aria-labelledby': 'hero-title' },
    el('div', { class: 'hero-copy' },
      el('p', { class: 'eyebrow hero-eyebrow' }, el('span', { class: 'status-dot', 'aria-hidden': 'true' }), data.hero.eyebrow),
      el('h1', { id: 'hero-title' }, lines(data.hero.title, index => index === data.hero.accentLine ? 'accent-text' : '')),
      el('p', { class: 'hero-description' }, el('strong', {}, data.hero.introduction), ' ', data.hero.description),
      el('div', { class: 'hero-actions' }, el('a', { href: data.hero.primaryAction.href, class: 'button button-primary' }, data.hero.primaryAction.label, icon('arrowDown')), externalLink(social(data.hero.secondaryAction.socialId).url, data.hero.secondaryAction.label, ui, 'text-link', icon('github'), icon('arrowUpRight')))
    ),
    createSystem(data.system),
    el('div', { class: 'hero-footnote' }, el('span', {}, icon('globe'), profile.locationShort), el('span', {}, data.hero.footer), el('span', {}, data.hero.index))
  );

  const strip = el('div', { class: 'technology-strip' }, el('div', { class: 'container technology-inner' }, el('p', {}, data.technologyStrip.label), el('ul', {}, data.technologyStrip.items.map(item => el('li', {}, item)))));
  const about = el('section', { id: data.about.id, class: 'section about-section container', 'aria-labelledby': `${data.about.id}-title` },
    sectionHeading(data.about), el('div', { class: 'about-copy' }, data.about.paragraphs.map(paragraph => el('p', {}, paragraph))),
    el('dl', { class: 'about-facts' }, data.about.facts.map(fact => el('div', {}, el('dt', {}, fact.value), el('dd', {}, fact.label))))
  );

  const projectGrid = el('div', { class: 'project-grid', id: 'project-grid', tabindex: '0', role: 'region', 'aria-roledescription': 'carrossel', 'aria-label': ui.carouselLabel });
  const carouselPosition = el('p', { class: 'carousel-position', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' });
  const scrollBehavior = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
  const step = () => (projectGrid.querySelector('.project-card')?.getBoundingClientRect().width || 0) + parseFloat(getComputedStyle(projectGrid).gap || '0');
  const previousProject = el('button', { type: 'button', class: 'icon-button carousel-previous', 'aria-label': ui.previousProject, 'aria-controls': 'project-grid', onclick: () => projectGrid.scrollBy({ left: -step(), behavior: scrollBehavior() }) }, icon('arrowRight'));
  const nextProject = el('button', { type: 'button', class: 'icon-button', 'aria-label': ui.nextProject, 'aria-controls': 'project-grid', onclick: () => projectGrid.scrollBy({ left: step(), behavior: scrollBehavior() }) }, icon('arrowRight'));
  function syncCarousel() {
    const cards = [...projectGrid.querySelectorAll('.project-card')];
    const viewport = projectGrid.getBoundingClientRect();
    const visible = cards.map((card, index) => ({ box: card.getBoundingClientRect(), index })).filter(({ box }) => box.left < viewport.right - 10 && box.right > viewport.left + 10);
    previousProject.disabled = projectGrid.scrollLeft < 2 || !cards.length;
    nextProject.disabled = projectGrid.scrollLeft >= projectGrid.scrollWidth - projectGrid.clientWidth - 2 || !cards.length;
    carouselPosition.textContent = cards.length && visible.length ? ui.carouselPosition.replace('{start}', String(visible[0].index + 1).padStart(2, '0')).replace('{end}', String(visible.at(-1).index + 1).padStart(2, '0')).replace('{count}', String(cards.length).padStart(2, '0')) : ui.carouselEmpty;
  }
  let scrollFrame;
  projectGrid.addEventListener('scroll', () => { cancelAnimationFrame(scrollFrame); scrollFrame = requestAnimationFrame(syncCarousel); }, { passive: true });
  new ResizeObserver(syncCarousel).observe(projectGrid);
  projectGrid.addEventListener('keydown', event => {
    if (event.target !== projectGrid || !['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home' || event.key === 'End') projectGrid.scrollTo({ left: event.key === 'Home' ? 0 : projectGrid.scrollWidth, behavior: scrollBehavior() });
    else projectGrid.scrollBy({ left: step() * (event.key === 'ArrowRight' ? 1 : -1), behavior: scrollBehavior() });
  });
  projectGrid.replaceChildren(...data.projects.map((project, index) => {
    const button = el('button', { class: 'project-open', type: 'button', 'aria-label': `${ui.projectDetails}: ${project.title}`, onclick: () => showProject(project, button) }, ui.projectDetails, icon('arrowUpRight'));
    return el('article', { class: 'project-card', 'aria-label': `${index + 1} / ${data.projects.length}: ${project.title}` },
      projectArtwork(project, ui),
      el('div', { class: 'project-info' },
        el('div', { class: 'project-type' }, el('span', {}, project.type), el('span', {}, `/${project.number}`)),
        el('h3', {}, project.title), el('p', {}, project.description),
        el('div', { class: 'tags' }, project.tags.map(tag => el('span', {}, tag))),
        el('div', { class: 'project-card-footer' }, button, el('div', { class: 'project-links' },
          project.demoUrl ? externalLink(project.demoUrl, '', ui, 'icon-button', icon('globe'), el('span', { class: 'sr-only' }, `${ui.visitProject}: ${project.title}`)) : null,
          project.url ? externalLink(project.url, '', ui, 'icon-button project-repository', icon('github'), el('span', { class: 'sr-only' }, `${ui.repository}: ${project.title}`)) : null,
          project.repositoryVisibility === 'private' ? el('span', { class: 'private-code', title: ui.privateRepository }, icon('code'), el('span', { class: 'sr-only' }, ui.privateRepository)) : null))
      )
    );
  }));
  if (!data.projects.length) projectGrid.append(el('div', { class: 'empty-state' }, icon('spark'), el('h3', {}, ui.emptyTitle), el('p', {}, ui.emptyDescription)));
  requestAnimationFrame(syncCarousel);
  const projects = el('section', { id: data.projectsSection.id, class: 'section projects-section container', 'aria-labelledby': `${data.projectsSection.id}-title` },
    sectionHeading(data.projectsSection, externalLink(social('github').url, data.projectsSection.githubLabel, ui, 'text-link section-link', icon('arrowUpRight'))),
    el('p', { class: 'projects-intro' }, data.projectsSection.description), projectGrid,
    el('div', { class: 'carousel-toolbar' }, carouselPosition, el('div', { class: 'carousel-controls' }, previousProject, nextProject))
  );

  const expertise = el('section', { id: data.expertise.id, class: 'section expertise-section', 'aria-labelledby': `${data.expertise.id}-title` }, el('div', { class: 'container' },
    sectionHeading(data.expertise),
    el('div', { class: 'expertise-grid' }, data.expertise.groups.map(group => el('article', { class: 'expertise-card' },
      el('div', { class: 'expertise-topline' }, icon(group.icon), el('span', {}, group.number)), el('h3', {}, group.title), el('p', {}, group.description), el('ul', {}, group.items.map(item => el('li', {}, item)))
    )))
  ));

  const experience = el('section', { id: data.experience.id, class: 'section experience-section container', 'aria-labelledby': `${data.experience.id}-title` },
    el('div', { class: 'experience-intro' }, sectionHeading(data.experience),
      el('button', { class: 'text-link resume-button', type: 'button', onclick: () => {
        const url = URL.createObjectURL(new Blob([createResume(data)], { type: 'text/markdown;charset=utf-8' }));
        const anchor = el('a', { href: url, download: ui.resumeFilename });
        document.body.append(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } }, icon('download'), ui.resumeLabel)
    ),
    el('div', { class: 'experience-list' }, data.experience.entries.map(entry => el('details', { class: `experience-item${entry.current ? ' is-current' : ''}`, open: entry.current },
      el('summary', {}, el('span', { class: 'experience-marker', 'aria-hidden': 'true' }),
        el('span', { class: 'experience-summary' }, el('span', { class: 'experience-period' }, entry.period, entry.current ? el('span', { class: 'current-badge' }, data.experience.currentLabel) : null), el('span', { class: 'experience-company' }, entry.company), el('span', { class: 'experience-role' }, entry.role)), icon('chevron')),
      el('div', { class: 'experience-details' }, el('p', { class: 'experience-lead' }, entry.summary), entry.paragraphs.map(paragraph => el('p', {}, paragraph)), el('div', { class: 'tags' }, entry.tags.map(tag => el('span', {}, tag))))
    )))
  );

  const contact = el('section', { id: data.contact.id, class: 'contact-section container', 'aria-labelledby': `${data.contact.id}-title` },
    el('div', { class: 'contact-panel' }, el('div', { class: 'contact-grid-decoration', 'aria-hidden': 'true' }),
      el('div', { class: 'contact-main' }, el('p', { class: 'eyebrow' }, el('span', { class: 'status-dot', 'aria-hidden': 'true' }), data.contact.eyebrow),
        el('h2', { id: `${data.contact.id}-title` }, lines(data.contact.title, index => index === 1 ? 'accent-text' : '')),
        el('p', { class: 'contact-description' }, data.contact.description),
        el('div', { class: 'contact-actions' }, externalLink(social(data.contact.primarySocialId).url, data.contact.primaryLabel, ui, 'button button-primary', icon('arrowUpRight')),
          el('button', { class: 'icon-button contact-copy', type: 'button', 'aria-label': data.contact.copyLabel, onclick: async () => {
            try { await navigator.clipboard.writeText(data.contact.copyValue); notify(ui.copySuccess); }
            catch { notify(ui.copyError, true); }
          } }, icon('copy')))
      ),
      el('div', { class: 'contact-aside' }, icon('globe', 'contact-globe'), el('p', { class: 'eyebrow' }, data.contact.locationLabel), el('p', { class: 'contact-location' }, profile.location), el('p', {}, profile.workMode), el('div', { class: 'contact-socials' }, profile.socials.map(item => externalLink(item.url, item.label, ui, 'text-link', icon('arrowUpRight')))), el('span', { class: 'contact-signature' }, data.contact.signature))
    )
  );
  const footer = el('footer', { class: 'site-footer container' },
    el('div', { class: 'footer-brand' }, el('span', { class: 'brand-mark', 'aria-hidden': 'true' }, profile.initials, el('i', {})), el('span', {}, data.footer.copyright)), el('p', {}, data.footer.note),
    el('a', { href: '#inicio', class: 'footer-top', 'aria-label': ui.backToTop }, data.footer.index, icon('arrowUp'))
  );

  document.documentElement.lang = data.meta.language;
  document.title = data.meta.title;
  document.querySelector('meta[name="description"]').content = data.meta.description;
  document.querySelector('meta[property="og:title"]').content = data.meta.title;
  document.querySelector('meta[property="og:description"]').content = data.meta.description;
  root.replaceChildren(el('a', { class: 'skip-link', href: '#conteudo' }, ui.skipToContent), el('div', { id: 'inicio' }), header, el('main', { id: 'conteudo', tabindex: '-1' }, hero, strip, about, projects, expertise, experience, contact), footer, dialog, toast);

  const sections = [...document.querySelectorAll('main section[id]')];
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      navigation.querySelectorAll('a').forEach(link => {
        if (link.getAttribute('href') === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
  }, { rootMargin: '-15% 0px -60% 0px', threshold: 0 });
  sections.forEach(section => observer.observe(section));

  if (location.hash) {
    requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'instant' }));
  }
}

async function load() {
  try {
    const response = await fetch(new URL('./portfolio.json', import.meta.url), { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Content request failed: ${response.status}`);
    render(validatePortfolio(await response.json()));
  } catch (error) {
    console.error('[portfolio]', error);
    root.replaceChildren(el('main', { class: 'boot-state boot-error' }, icon('code'), el('h1', {}, boot.loadErrorTitle || '…'), el('p', {}, boot.loadErrorDescription || ''), el('button', { type: 'button', class: 'button button-primary', onclick: () => location.reload() }, boot.retry || '↻')));
  }
}

load();
