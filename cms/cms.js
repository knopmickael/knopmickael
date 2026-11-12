import { validatePortfolio, contentShape } from '/lib/content.js';

const $ = selector => document.querySelector(selector);
const view = $('#view');
const dialog = $('#editor');
let data, revision, token, dirty = false, busy = false, currentView = 'projects', formDirty = false;
let query = '', section = 'profile';
let returnFocus, submitting = false;
const previewUrls = new Set();

function el(tag, attributes = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (value === undefined || value === null || value === false) continue;
    if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'value') node.value = value;
    else node.setAttribute(key, value === true ? '' : String(value));
  }
  node.append(...children.flat(Infinity).filter(child => child !== undefined && child !== null && child !== false));
  return node;
}
const button = (label, handler, style = 'secondary', attributes = {}) => el('button', { type: 'button', class: `button ${style}`, onclick: handler, ...attributes }, label);
let fieldIndex = 0;
const field = (label, control, hint) => {
  const id = `field-${++fieldIndex}`;
  control.id = id;
  if (hint) control.setAttribute('aria-describedby', `${id}-hint`);
  return el('div', { class: 'field' }, el('label', { for: id }, label), control, hint ? el('small', { id: `${id}-hint` }, hint) : null);
};
const input = (name, value = '', attributes = {}) => el('input', { name, value, ...attributes });
const textarea = (name, value = '', attributes = {}) => el('textarea', { name, ...attributes }, value);
const select = (name, value, options) => {
  const node = el('select', { name }, options.map(([id, label]) => el('option', { value: id }, label)));
  node.value = value;
  return node;
};
function feedback(message, error = false) {
  $('#feedback').textContent = message;
  $('#feedback').classList.toggle('error', error);
}
function updateState() {
  view.inert = busy;
  document.querySelector('aside').inert = busy;
  $('#save-state').textContent = busy ? 'Salvando…' : dirty ? 'Alterações no rascunho · salve para atualizar o site' : 'JSON sincronizado · tudo salvo no disco';
  $('#save-state').classList.toggle('dirty', dirty);
  $('#save').disabled = !data || !dirty || busy;
  $('#reload').disabled = !data || busy;
  $('#export').disabled = !data || busy;
  if (data) {
    $('#project-count').textContent = data.projects.length;
  }
}
function changed() { dirty = true; updateState(); }
async function api(path, options = {}) {
  const response = await fetch(path, { ...options, headers: { 'X-CMS-Token': token || '', ...options.headers } });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `Erro HTTP ${response.status}`);
  return result;
}
async function load() {
  try {
    const result = await api('/api/content');
    data = result.content; revision = result.revision; token = result.token; dirty = false;
    updateState(); render(); feedback('');
  } catch (error) {
    feedback(error.message, true);
    view.replaceChildren(el('div', { class: 'empty' }, 'Não foi possível ler o JSON. ', button('Tentar novamente', load)));
  }
}
$('#save').addEventListener('click', async () => {
  if (busy) return;
  try {
    validatePortfolio(data);
    busy = true; updateState();
    const result = await api('/api/content', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'If-Match': revision }, body: JSON.stringify(data) });
    revision = result.revision; dirty = false;
    feedback('Conteúdo salvo em portfolio.json. Atualize a aba do site para ver as mudanças.');
  } catch (error) { feedback(error.message, true); }
  finally { busy = false; updateState(); }
});
$('#reload').addEventListener('click', () => { if (!dirty || confirm('Descartar o rascunho e reler o JSON do disco?')) load(); });
$('#export').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([`${JSON.stringify(data, null, 2)}\n`], { type: 'application/json' }));
  const anchor = el('a', { href: url, download: 'portfolio-rascunho.json' });
  anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
window.addEventListener('beforeunload', event => { if (dirty || formDirty) { event.preventDefault(); event.returnValue = ''; } });
document.querySelectorAll('[data-view]').forEach(node => node.addEventListener('click', () => {
  currentView = node.dataset.view; render();
}));
dialog.addEventListener('cancel', event => { event.preventDefault(); closeEditor(); });
dialog.addEventListener('close', () => {
  formDirty = false;
  previewUrls.forEach(url => URL.revokeObjectURL(url));
  previewUrls.clear();
  if (returnFocus?.isConnected) returnFocus.focus();
  else $('#save').focus();
});
function closeEditor() { if (!submitting && (!formDirty || confirm('Descartar as alterações deste formulário?'))) dialog.close(); }
function openEditor(title, form, submitLabel, submit) {
  returnFocus = document.activeElement;
  formDirty = false;
  const errorBox = el('p', { class: 'form-error', role: 'alert' });
  const submitButton = el('button', { type: 'submit', class: 'button primary' }, submitLabel);
  form.addEventListener('input', () => { formDirty = true; });
  form.addEventListener('change', () => { formDirty = true; });
  form.addEventListener('submit', async event => {
    if (submitting) { event.preventDefault(); return; }
    event.preventDefault(); errorBox.textContent = ''; submitButton.disabled = true;
    submitting = true; form.inert = true;
    try { await submit(new FormData(form)); formDirty = false; dialog.close(); changed(); render(); feedback('Rascunho atualizado. Clique em “Salvar no JSON” para gravar no disco.'); }
    catch (error) { errorBox.textContent = error.message; errorBox.scrollIntoView({ block: 'nearest' }); }
    finally { submitting = false; form.inert = false; submitButton.disabled = false; }
  });
  form.append(el('div', { class: 'editor-body' }, errorBox), el('div', { class: 'editor-footer' }, button('Cancelar', closeEditor), submitButton));
  dialog.replaceChildren(el('div', { class: 'editor-header' }, el('h2', { id: 'editor-title' }, title), button('×', closeEditor, 'quiet small', { 'aria-label': 'Fechar editor' })), form);
  dialog.showModal();
}
function render() {
  if (!data) return;
  document.querySelectorAll('[data-view]').forEach(node => {
    if (node.dataset.view === currentView) node.setAttribute('aria-current', 'page');
    else node.removeAttribute('aria-current');
  });
  updateState();
  if (currentView === 'projects') renderProjects();
  else renderContent();
}
function heading(title, description, action) {
  return el('div', { class: 'page-heading' }, el('div', {}, el('p', { class: 'eyebrow' }, 'ESTÚDIO / CONTEÚDO'), el('h1', {}, title), el('p', { class: 'description' }, description)), action);
}
function moveProject(index, direction) {
  const target = index + direction;
  if (target < 0 || target >= data.projects.length) return;
  [data.projects[index], data.projects[target]] = [data.projects[target], data.projects[index]];
  data.projects.forEach((project, i) => { project.number = String(i + 1).padStart(2, '0'); });
  changed(); renderProjects();
}
function renderProjects() {
  const list = el('div', { class: 'project-list' });
  const listStatus = el('p', { class: 'hint', role: 'status', 'aria-live': 'polite' });
  const searchInput = input('search', query, { type: 'search', placeholder: 'Nome, descrição ou tecnologia…', oninput: event => { query = event.target.value; fillList(); } });
  function fillList() {
    const projects = data.projects.filter(project => `${project.title} ${project.description} ${project.tags.join(' ')}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
    list.replaceChildren(...projects.map(project => {
      const index = data.projects.indexOf(project);
      const cover = project.visual.type === 'gallery' ? project.visual.images[project.visual.cover] : null;
      const mediaLabel = cover ? `Galeria · ${project.visual.images.length} imagem(ns)` : 'Visual técnico';
      return el('article', { class: 'project-row' },
        el('div', { class: 'thumbnail', 'aria-hidden': 'true' }, cover ? el('img', { src: `/${cover.src}`, alt: '', loading: 'lazy' }) : '</>'),
        el('div', { class: 'row-copy' }, el('h3', {}, project.title), el('p', {}, `${project.number} / ${project.tags.join(' · ')}`), el('div', { class: 'badges' }, el('span', { class: 'badge' }, mediaLabel), project.repositoryVisibility === 'private' ? el('span', { class: 'badge' }, 'Código privado') : null)),
        el('div', { class: 'row-actions' }, button('↑', () => moveProject(index, -1), 'quiet small', { disabled: index === 0, 'aria-label': `Mover para antes: ${project.title}` }), button('↓', () => moveProject(index, 1), 'quiet small', { disabled: index === data.projects.length - 1, 'aria-label': `Mover para depois: ${project.title}` }), button('Editar', () => editProject(project), 'secondary', { 'aria-label': `Editar projeto: ${project.title}` }), button('Remover', () => {
          if (!confirm(`Remover “${project.title}” do rascunho?`)) return;
          data.projects.splice(index, 1);
          data.projects.forEach((item, i) => { item.number = String(i + 1).padStart(2, '0'); });
          changed(); render();
        }, 'danger', { 'aria-label': `Remover projeto: ${project.title}` }))
      );
    }));
    if (!projects.length) list.append(el('p', { class: 'empty' }, data.projects.length ? 'Nenhum projeto corresponde à busca.' : 'Seu próximo projeto começa aqui. Clique em “Novo projeto”.'));
    listStatus.textContent = `${projects.length} de ${data.projects.length} projetos`;
  }
  fillList();
  view.replaceChildren(heading('Projetos', 'Use as setas para definir a ordem dos projetos no portfólio. Edite os links e a apresentação de cada ideia.', button('+ Novo projeto', () => editProject(), 'primary')),
    el('div', { class: 'metrics' }, [['Projetos no acervo', data.projects.length], ['Projetos com galeria', data.projects.filter(project => project.visual.type === 'gallery').length], ['Visuais técnicos', data.projects.filter(project => project.visual.type === 'repository').length]].map(([label, count]) => el('div', { class: 'metric' }, el('strong', {}, String(count).padStart(2, '0')), label))),
    el('div', { class: 'filters' }, field('Buscar projetos', searchInput)), listStatus, list);
}
function editProject(original) {
  const project = structuredClone(original || { id: '', number: String(data.projects.length + 1).padStart(2, '0'), title: '', type: '', description: '', tags: [], url: '', demoUrl: '', repositoryVisibility: 'public', visual: { type: 'repository' }, details: [] });
  const form = el('form');
  const idInput = input('id', project.id, { required: true, pattern: '[a-z](?:[a-z0-9]|-)*' });
  const titleInput = input('title', project.title, { required: true, oninput: event => {
    if (!original && !idInput.dataset.manual) idInput.value = event.target.value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').replace(/^[^a-z]+/, '');
  } });
  idInput.addEventListener('input', () => { idInput.dataset.manual = 'true'; });
  const details = el('div');
  const detailList = structuredClone(project.details);
  function drawDetails() {
    details.replaceChildren(...detailList.map((detail, index) => el('div', { class: 'array-entry' },
      field(`Bloco ${index + 1} · título`, input(`detail-title-${index}`, detail.title, { required: true, oninput: event => { detail.title = event.target.value; } })),
      field('Texto', textarea(`detail-text-${index}`, detail.text, { required: true, oninput: event => { detail.text = event.target.value; } })),
      button('Remover bloco', () => { detailList.splice(index, 1); formDirty = true; drawDetails(); }, 'danger')
    )));
  }
  drawDetails();
  const mode = select('visual-mode', project.visual.type, [['repository', 'Visual técnico — sem screenshot'], ['gallery', 'Galeria']]);
  const gallery = project.visual.type === 'gallery' ? structuredClone(project.visual.images) : [];
  let cover = gallery[project.visual.cover] || gallery[0];
  const fileInput = input('images', '', { type: 'file', multiple: true, accept: 'image/png,image/jpeg,image/webp' });
  const galleryList = el('div', { class: 'gallery-list' });
  const galleryStatus = el('p', { class: 'hint', role: 'status', 'aria-live': 'polite' });
  const uploadError = el('p', { class: 'form-error', role: 'alert' });
  const imageFields = el('div', {}, field('Adicionar imagens à galeria', fileInput, 'Selecione várias imagens wide ou mobile. PNG, JPEG ou WebP · até 8 MB por imagem. Defina uma capa e descreva cada imagem.'), uploadError, galleryStatus, galleryList);
  function drawGallery(focusIndex, focusCover = false) {
    galleryList.replaceChildren(...gallery.map((image, index) => {
      const coverInput = input('gallery-cover', index, { type: 'radio', checked: cover === image, 'aria-label': `Usar imagem ${index + 1} como capa`, onchange: () => { cover = image; formDirty = true; drawGallery(index, true); } });
      const move = direction => {
        [gallery[index], gallery[index + direction]] = [gallery[index + direction], gallery[index]];
        formDirty = true; drawGallery(index + direction);
      };
      return el('div', { class: `gallery-entry${cover === image ? ' is-cover' : ''}` },
        el('img', { class: 'media-preview', src: image.preview || `/${image.src}`, alt: image.label || `Prévia da imagem ${index + 1}` }),
        el('div', { class: 'gallery-entry-body' },
          el('label', { class: 'check' }, coverInput, cover === image ? 'Capa do projeto' : 'Usar como capa'),
          image.file ? el('p', { class: 'hint gallery-filename' }, image.file.name) : null,
          field(`Descrição da imagem ${index + 1} (texto alternativo)`, input(`image-alt-${index}`, image.label, { required: mode.value === 'gallery', oninput: event => { image.label = event.target.value; } }), 'Ex.: Tela de batalhas na versão mobile.'),
          el('div', { class: 'actions' },
            button('↑', () => move(-1), 'secondary small', { disabled: index === 0, 'aria-label': `Mover imagem ${index + 1} para antes` }),
            button('↓', () => move(1), 'secondary small', { disabled: index === gallery.length - 1, 'aria-label': `Mover imagem ${index + 1} para depois` }),
            button('Remover imagem', () => {
              gallery.splice(index, 1);
              if (cover === image) cover = gallery[0];
              if (image.preview) { URL.revokeObjectURL(image.preview); previewUrls.delete(image.preview); }
              formDirty = true; drawGallery(Math.min(index, gallery.length - 1));
            }, 'danger', { 'aria-label': `Remover imagem ${index + 1}` }))));
    }));
    galleryStatus.textContent = gallery.length ? `${gallery.length} imagem(ns) · a capa abre o carrossel no site.` : 'A galeria precisa de pelo menos uma imagem. A primeira será a capa até você escolher outra.';
    if (focusIndex >= 0) (focusCover ? galleryList.querySelectorAll('[name="gallery-cover"]')[focusIndex] : galleryList.querySelector(`[name="image-alt-${focusIndex}"]`))?.focus();
  }
  const fallbackHint = el('p', { class: 'hint' }, 'O site usa uma capa técnica com o título e as tecnologias. Não é apresentada como screenshot do produto.');
  function changeMode() {
    imageFields.hidden = mode.value !== 'gallery'; fallbackHint.hidden = mode.value !== 'repository';
    imageFields.querySelectorAll('[name^="image-alt-"]').forEach(control => { control.required = mode.value === 'gallery'; });
  }
  mode.addEventListener('change', changeMode); drawGallery(); changeMode();
  fileInput.addEventListener('change', () => {
    const files = [...fileInput.files];
    uploadError.textContent = '';
    if (files.some(file => !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || !file.size || file.size > 8 * 1024 * 1024)) {
      uploadError.textContent = 'Selecione apenas PNG, JPEG ou WebP de até 8 MB por imagem.';
      fileInput.value = ''; return;
    }
    for (const file of files) {
      const preview = URL.createObjectURL(file); previewUrls.add(preview);
      gallery.push({ label: '', file, preview });
    }
    cover ||= gallery[0];
    fileInput.value = ''; drawGallery();
  });
  form.append(el('div', { class: 'editor-body' }, el('p', { class: 'hint' }, 'Aplicar atualiza o rascunho. “Salvar no JSON” grava todas as mudanças no arquivo.'),
    el('fieldset', {}, el('legend', {}, '01 / O projeto'), el('div', { class: 'form-grid' }, field('Título', titleInput), field('Identificador único', idInput, 'Letras minúsculas, números e hífens.'), field('Tipo / chamada', input('type', project.type, { required: true, placeholder: 'APLICAÇÃO WEB' }))), field('Descrição', textarea('description', project.description, { required: true })), field('Tecnologias', input('tags', project.tags.join(', ')), 'Separe por vírgulas.')),
    el('fieldset', {}, el('legend', {}, '02 / Links e código'), field('Visibilidade do código', select('visibility', project.repositoryVisibility || 'public', [['public', 'Público / não informado'], ['private', 'Repositório privado']])), field('URL do repositório (opcional)', input('url', project.url || '', { type: 'url', placeholder: 'https://github.com/…' }), 'Deixe vazio se não houver código público.'), field('URL do site / demo (opcional)', input('demoUrl', project.demoUrl || '', { type: 'url', placeholder: 'https://…' }))),
    el('fieldset', {}, el('legend', {}, '03 / Apresentação visual'), field('Como apresentar este projeto?', mode), el('div', { class: 'visual-options' }, imageFields, fallbackHint)),
    el('fieldset', {}, el('legend', {}, '04 / Detalhes do projeto'), details, button('+ Adicionar bloco', () => { detailList.push({ title: '', text: '' }); formDirty = true; drawDetails(); }))
  ));
  openEditor(original ? 'Editar projeto' : 'Novo projeto', form, 'Aplicar projeto', async values => {
    const value = name => String(values.get(name) || '').trim();
    const updated = { ...project, id: value('id'), title: value('title'), type: value('type'), description: value('description'), tags: value('tags').split(',').map(tag => tag.trim()).filter(Boolean), url: value('url'), demoUrl: value('demoUrl'), repositoryVisibility: value('visibility'), details: detailList };
    const selectedMode = value('visual-mode');
    if (selectedMode === 'gallery' && !gallery.length) throw new Error('Adicione pelo menos uma imagem à galeria.');
    if (selectedMode === 'repository') updated.visual = { type: 'repository' };
    if (selectedMode === 'gallery') updated.visual = { type: 'gallery', cover: gallery.indexOf(cover), images: gallery.map((image, index) => ({ src: image.src || `assets/projects/upload-${index}.png`, label: image.label.trim() })) };
    const candidate = structuredClone(data);
    const index = original ? data.projects.indexOf(original) : data.projects.length;
    candidate.projects[index] = updated;
    validatePortfolio(candidate);
    if (selectedMode === 'gallery') {
      for (const [imageIndex, image] of gallery.entries()) {
        if (image.file) {
          const result = await api('/api/images', { method: 'POST', headers: { 'Content-Type': image.file.type }, body: image.file });
          image.src = result.src; image.file = undefined;
        }
        updated.visual.images[imageIndex].src = image.src;
      }
    }
    data.projects[index] = updated;
  });
}
const labels = { meta: 'Metadados e tema', ui: 'Textos da interface', profile: 'Perfil', navigation: 'Navegação', header: 'Cabeçalho', hero: 'Apresentação inicial', system: 'Diagrama de camadas', technologyStrip: 'Faixa de tecnologias', about: 'Sobre', projectsSection: 'Seção de projetos', expertise: 'Repertório técnico', experience: 'Experiência', contact: 'Contato', footer: 'Rodapé', title: 'Título', description: 'Descrição', label: 'Rótulo', text: 'Texto', name: 'Nome', summary: 'Resumo', paragraphs: 'Parágrafos', items: 'Itens', groups: 'Grupos', entries: 'Experiências', tags: 'Tecnologias', url: 'URL', company: 'Empresa', role: 'Cargo', period: 'Período', current: 'Atual', eyebrow: 'Chamada superior', number: 'Número', icon: 'Ícone', id: 'Identificador', facts: 'Destaques', value: 'Valor', socials: 'Redes sociais', education: 'Formação', layers: 'Camadas', href: 'Destino' };
function emptyFrom(shape) {
  if (Array.isArray(shape)) return [];
  if (shape && typeof shape === 'object') return Object.fromEntries(Object.entries(shape).map(([key, child]) => [key, emptyFrom(child)]));
  return shape === 'boolean' ? false : shape === 'number' ? 0 : '';
}
function editTree(parent, key, shape, path = key) {
  const value = parent[key];
  const label = `${labels[key] || key}${labels[key] ? ` · ${key}` : ''}`;
  if (Array.isArray(value)) {
    const fixed = path === 'system.layers';
    const box = el('fieldset', {}, el('legend', {}, label));
    const redraw = () => {
      box.replaceChildren(el('legend', {}, label), ...value.map((item, index) => el('div', { class: 'array-entry' }, el('div', { class: 'actions' }, button('↑', () => { [value[index - 1], value[index]] = [value[index], value[index - 1]]; changed(); redraw(); }, 'quiet small', { disabled: index === 0, 'aria-label': `Mover item ${index + 1} para antes` }), button('↓', () => { [value[index + 1], value[index]] = [value[index], value[index + 1]]; changed(); redraw(); }, 'quiet small', { disabled: index === value.length - 1, 'aria-label': `Mover item ${index + 1} para depois` }), fixed ? null : button('Remover item', () => { value.splice(index, 1); changed(); redraw(); }, 'danger')), editTree(value, index, shape?.[0], `${path}.${index}`))), fixed ? null : button('+ Adicionar item', () => { value.push(emptyFrom(shape?.[0] || 'string')); changed(); redraw(); }));
    };
    redraw(); return box;
  }
  if (value && typeof value === 'object') return el('fieldset', {}, el('legend', {}, label), Object.keys(value).map(child => editTree(value, child, shape?.[child], `${path}.${child}`)));
  const type = typeof value;
  let control;
  if (type === 'boolean') control = input(path, '', { type: 'checkbox', checked: value, onchange: event => { parent[key] = event.target.checked; changed(); } });
  else {
    const attributes = { oninput: event => { parent[key] = type === 'number' ? Number(event.target.value) : event.target.value; changed(); } };
    control = type === 'number' ? input(path, value, { ...attributes, type: 'number' }) : textarea(path, String(value ?? ''), { ...attributes, rows: String(value).length > 100 ? 3 : 1 });
    if (/^(about|projectsSection|expertise|experience|contact)\.id$/.test(path) || /^system\.layers\.\d+\.id$/.test(path)) control.readOnly = true;
  }
  return field(typeof key === 'number' ? `Item ${key + 1}` : label, control);
}
function renderContent() {
  const choices = select('section', section, Object.keys(contentShape).map(key => [key, labels[key] || key]));
  const form = el('div', { class: 'content-form' });
  const draw = () => form.replaceChildren(editTree(data, section, contentShape[section]));
  choices.addEventListener('change', () => { section = choices.value; draw(); });
  draw();
  view.replaceChildren(heading('Conteúdo do site', 'Formulários montados a partir do JSON atual. Cada campo mantém seu tipo; as alterações ficam no rascunho até salvar.'), el('div', { class: 'section-select' }, field('Qual seção deseja editar?', choices)), form);
}

load();
