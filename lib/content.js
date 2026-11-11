const sectionIds = ['sobre', 'projetos', 'repertorio', 'experiencia', 'contato'];

export const imagePathPattern = /^assets\/projects\/[a-zA-Z0-9][a-zA-Z0-9_-]*\.(png|jpe?g|webp)$/;
const text = 'string';
const heading = { id: text, eyebrow: text, title: [text] };
// Also used by the local editor to create entries when an array is empty.
export const contentShape = {
  meta: { title: text, description: text, language: text, themeColor: text, defaultTheme: text },
  ui: Object.fromEntries(['loading', 'loadErrorTitle', 'loadErrorDescription', 'retry', 'noscript', 'skipToContent', 'navigationLabel', 'openMenu', 'closeMenu', 'lightTheme', 'darkTheme', 'externalLink', 'closeDialog', 'projectDetails', 'repository', 'visitProject', 'privateRepository', 'carouselLabel', 'previousProject', 'nextProject', 'carouselPosition', 'carouselEmpty', 'filterLabel', 'projectCount', 'projectCountSingular', 'emptyTitle', 'emptyDescription', 'copySuccess', 'copyError', 'backToTop', 'illustrationLabel', 'resumeFilename', 'resumeLabel', 'resumeProjectHeading', 'resumeSkillsHeading', 'resumeExperienceHeading', 'resumeEducationHeading'].map(key => [key, text])),
  profile: { name: text, firstName: text, brand: text, initials: text, role: text, location: text, locationShort: text, workMode: text, summary: text, socials: [{ id: text, label: text, url: text, handle: text }], education: { degree: text, institution: text, period: text } },
  navigation: [{ label: text, href: text }],
  header: { contactLabel: text, contactHref: text, homeLabel: text },
  hero: { eyebrow: text, title: [text], accentLine: 'number', introduction: text, description: text, primaryAction: { label: text, href: text }, secondaryAction: { label: text, socialId: text }, footer: text, index: text },
  system: { eyebrow: text, index: text, label: text, footer: text, hint: text, defaultLayer: text, layers: [{ id: text, number: text, eyebrow: text, title: text, stack: text, icon: text, description: text }] },
  technologyStrip: { label: text, items: [text] },
  about: { ...heading, paragraphs: [text], facts: [{ value: text, label: text }] },
  projectsSection: { ...heading, description: text, githubLabel: text, categories: [{ id: text, label: text }] },
  expertise: { ...heading, description: text, groups: [{ number: text, icon: text, title: text, description: text, items: [text] }] },
  experience: { ...heading, description: text, currentLabel: text, entries: [{ id: text, company: text, role: text, period: text, current: 'boolean', summary: text, paragraphs: [text], tags: [text] }] },
  contact: { ...heading, description: text, primaryLabel: text, primarySocialId: text, copyLabel: text, copyValue: text, locationLabel: text, signature: text },
  footer: { copyright: text, note: text, index: text }
};

function checkShape(value, shape, path, errors) {
  if (typeof shape === 'string') {
    if (typeof value !== shape || (shape === 'number' && !Number.isFinite(value))) errors.push(`Invalid ${path}: expected ${shape}`);
  } else if (Array.isArray(shape)) {
    if (!Array.isArray(value)) errors.push(`Invalid ${path}: expected array`);
    else value.forEach((item, index) => checkShape(item, shape[0], `${path}[${index}]`, errors));
  } else if (!value || typeof value !== 'object' || Array.isArray(value)) errors.push(`Invalid ${path}: expected object`);
  else for (const [key, child] of Object.entries(shape)) checkShape(value[key], child, `${path}.${key}`, errors);
}

export function safeUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  if (/^#[a-z][a-z0-9-]*$/i.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function validatePortfolio(data) {
  const errors = [];
  const required = ['meta', 'ui', 'profile', 'header', 'hero', 'system', 'technologyStrip', 'about', 'projectsSection', 'expertise', 'experience', 'contact', 'footer'];
  if (!data || typeof data !== 'object') throw new Error('portfolio.json: expected an object');
  for (const key of required) {
    if (!data[key] || typeof data[key] !== 'object') errors.push(`Missing section: ${key}`);
  }
  for (const key of ['navigation', 'projects']) {
    if (!Array.isArray(data[key])) errors.push(`Expected array: ${key}`);
  }
  if (errors.length) throw new Error(errors.join('\n'));

  checkShape(data, contentShape, 'content', errors);
  if (errors.length) throw new Error(`portfolio.json:\n${errors.join('\n')}`);

  const stringPaths = [
    ['meta', 'title'], ['meta', 'description'], ['meta', 'language'],
    ['profile', 'name'], ['profile', 'role'], ['ui', 'loading'],
    ['ui', 'loadErrorTitle'], ['ui', 'retry'], ['ui', 'noscript']
  ];
  for (const [section, key] of stringPaths) {
    if (typeof data[section][key] !== 'string' || !data[section][key].trim()) errors.push(`Expected nonempty text: ${section}.${key}`);
  }

  const actualIds = [data.about.id, data.projectsSection.id, data.expertise.id, data.experience.id, data.contact.id];
  if (new Set(actualIds).size !== actualIds.length || actualIds.some(id => !sectionIds.includes(id))) errors.push('Invalid or duplicate section IDs');

  const categories = new Set();
  for (const category of data.projectsSection.categories) {
    if (!/^[a-z][a-z0-9-]*$/.test(category.id) || categories.has(category.id) || !category.label.trim()) errors.push(`Invalid or duplicate category: ${category.id}`);
    categories.add(category.id);
  }
  if (!categories.has('all')) errors.push('Project categories must include all');
  const ids = new Set();
  for (const project of data.projects) {
    if (!project || typeof project !== 'object') { errors.push('Invalid project'); continue; }
    if (!/^[a-z][a-z0-9-]*$/.test(project.id) || ids.has(project.id)) errors.push(`Invalid or duplicate project ID: ${project.id}`);
    ids.add(project.id);
    if (!categories.has(project.category) || project.category === 'all') errors.push(`Unknown category: ${project.id}`);
    for (const [key, label] of [['url', 'repository'], ['demoUrl', 'demo']]) {
      if (project[key] !== undefined && project[key] !== '' && (!safeUrl(project[key]) || project[key].startsWith('#'))) errors.push(`Invalid ${label} URL: ${project.id}`);
    }
    if (project.repositoryVisibility !== undefined && !['public', 'private'].includes(project.repositoryVisibility)) errors.push(`Invalid repository visibility: ${project.id}`);
    for (const key of ['title', 'description', 'type', 'number']) {
      if (typeof project[key] !== 'string' || !project[key]) errors.push(`Missing project text: ${project.id}.${key}`);
    }
    checkShape(project, { tags: [text], details: [{ title: text, text }] }, `projects.${project.id}`, errors);
    const visual = project.visual;
    if (['cinema', 'pipeline', 'cluster', 'document'].includes(visual?.type)) {
      checkShape(visual, { label: text, eyebrow: text, title: text, subtitle: text, footer: text, items: [text] }, `projects.${project.id}.visual`, errors);
      const minimum = ['pipeline', 'cluster'].includes(visual.type) ? 4 : 3;
      if (visual.items?.length < minimum) errors.push(`Visual needs ${minimum} items: ${project.id}`);
    } else if (visual?.type === 'image') {
      if (!imagePathPattern.test(visual.src) || typeof visual.label !== 'string' || !visual.label.trim()) errors.push(`Invalid image or alternative text: ${project.id}`);
    } else if (visual?.type === 'pending') {
      if (typeof visual.prompt !== 'string' || !visual.prompt.trim()) errors.push(`Missing inference briefing: ${project.id}`);
    } else if (visual?.type !== 'repository') errors.push(`Unknown visual: ${project.id}`);
  }
  for (const item of [...data.navigation, ...data.profile.socials, { href: data.header.contactHref }, data.hero.primaryAction]) {
    const value = item.href ?? item.url;
    if (!safeUrl(value)) errors.push(`Invalid link: ${value}`);
    if (value?.startsWith('#') && !actualIds.includes(value.slice(1))) errors.push(`Unknown anchor: ${value}`);
  }
  const socials = new Set(data.profile.socials.map(social => social.id));
  if (!socials.has('github')) errors.push('Missing GitHub profile');
  if (socials.size !== data.profile.socials.length) errors.push('Duplicate social IDs');
  for (const id of [data.hero.secondaryAction.socialId, data.contact.primarySocialId]) {
    if (!socials.has(id)) errors.push(`Unknown social ID: ${id}`);
  }
  if (!safeUrl(data.contact.copyValue)) errors.push('Invalid contact copyValue');
  if (!data.system.layers?.some(layer => layer.id === data.system.defaultLayer)) errors.push('Unknown default system layer');
  if (data.system.layers.length !== 3 || new Set(data.system.layers.map(layer => layer.id)).size !== 3 || data.system.layers.some(layer => !['interface', 'domain', 'foundation'].includes(layer.id))) errors.push('Preserve the three system layer IDs');
  if (!['dark', 'light'].includes(data.meta.defaultTheme)) errors.push('Theme must be dark or light');
  if (!Array.isArray(data.experience.entries) || !Array.isArray(data.expertise.groups)) errors.push('Missing experience or expertise arrays');
  if (errors.length) throw new Error(`portfolio.json:\n${errors.join('\n')}`);
  return data;
}

export function filterProjects(projects, category) {
  return category === 'all' ? projects : projects.filter(project => project.category === category);
}

export function projectCountLabel(ui, count) {
  return (count === 1 ? ui.projectCountSingular : ui.projectCount).replace('{count}', String(count));
}

export function createResume(data) {
  const { profile, ui } = data;
  return [
    `# ${profile.name}`, `${profile.role} · ${profile.location}`, '', profile.summary, '',
    ...profile.socials.map(social => `${social.label}: ${social.url}`), '',
    `## ${ui.resumeExperienceHeading}`, '',
    ...data.experience.entries.flatMap(entry => [
      `### ${entry.company} — ${entry.role}`, entry.period, '', ...entry.paragraphs, '', entry.tags.join(' · '), ''
    ]),
    `## ${ui.resumeSkillsHeading}`, '',
    ...data.expertise.groups.map(group => `- **${group.title}:** ${group.items.join(', ')}`), '',
    `## ${ui.resumeProjectHeading}`, '',
    ...data.projects.map(project => `- ${project.url ? `[${project.title}](${project.url})` : project.title} — ${project.description}${project.demoUrl ? ` · [Site](${project.demoUrl})` : ''}`), '',
    `## ${ui.resumeEducationHeading}`, '',
    profile.education.degree, profile.education.institution, profile.education.period, ''
  ].join('\n');
}
