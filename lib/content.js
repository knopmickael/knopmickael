const sectionIds = ['sobre', 'projetos', 'repertorio', 'experiencia', 'contato'];

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

  const categories = new Set(data.projectsSection.categories?.map(category => category.id));
  if (!categories.has('all')) errors.push('Project categories must include all');
  const ids = new Set();
  for (const project of data.projects) {
    if (!/^[a-z][a-z0-9-]*$/.test(project.id) || ids.has(project.id)) errors.push(`Invalid or duplicate project ID: ${project.id}`);
    ids.add(project.id);
    if (!categories.has(project.category) || project.category === 'all') errors.push(`Unknown category: ${project.id}`);
    if (!safeUrl(project.url) || project.url.startsWith('#')) errors.push(`Invalid repository URL: ${project.id}`);
    for (const key of ['title', 'description', 'type', 'number']) {
      if (typeof project[key] !== 'string' || !project[key]) errors.push(`Missing project text: ${project.id}.${key}`);
    }
    if (!Array.isArray(project.tags) || !Array.isArray(project.details)) errors.push(`Missing project arrays: ${project.id}`);
    if (!['cinema', 'pipeline', 'cluster', 'document'].includes(project.visual?.type)) errors.push(`Unknown visual: ${project.id}`);
  }
  for (const item of [...data.navigation, ...data.profile.socials, { href: data.header.contactHref }, data.hero.primaryAction]) {
    const value = item.href ?? item.url;
    if (!safeUrl(value)) errors.push(`Invalid link: ${value}`);
    if (value?.startsWith('#') && !actualIds.includes(value.slice(1))) errors.push(`Unknown anchor: ${value}`);
  }
  const socials = new Set(data.profile.socials.map(social => social.id));
  for (const id of [data.hero.secondaryAction.socialId, data.contact.primarySocialId]) {
    if (!socials.has(id)) errors.push(`Unknown social ID: ${id}`);
  }
  if (!safeUrl(data.contact.copyValue)) errors.push('Invalid contact copyValue');
  if (!data.system.layers?.some(layer => layer.id === data.system.defaultLayer)) errors.push('Unknown default system layer');
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
    ...data.projects.map(project => `- [${project.title}](${project.url}) — ${project.description}`), '',
    `## ${ui.resumeEducationHeading}`, '',
    profile.education.degree, profile.education.institution, profile.education.period, ''
  ].join('\n');
}
