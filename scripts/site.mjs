import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { validatePortfolio } from '../lib/content.js';

export const projectRoot = fileURLToPath(new URL('../', import.meta.url));
export const publicFiles = ['index.html', 'styles.css', 'app.js', 'portfolio.json', 'lib/content.js', 'assets/favicon.svg'];

export function filesForPortfolio(data) {
  return [...new Set([...publicFiles, ...data.projects.flatMap(project => project.visual.type === 'gallery' ? project.visual.images.map(image => image.src) : [])])];
}

export async function readPortfolio() {
  return validatePortfolio(JSON.parse(await readFile(resolve(projectRoot, 'portfolio.json'), 'utf8')));
}

export function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

export function compileHtml(template, data) {
  const boot = Object.fromEntries(['loading', 'loadErrorTitle', 'loadErrorDescription', 'retry'].map(key => [key, data.ui[key]]));
  return template
    .replace(/<html[^>]*>/, `<html lang="${escapeHtml(data.meta.language)}" data-theme="${data.meta.defaultTheme === 'light' ? 'light' : 'dark'}">`)
    .replace('<title></title>', `<title>${escapeHtml(data.meta.title)}</title>`)
    .replace('<meta name="description" content="" />', `<meta name="description" content="${escapeHtml(data.meta.description)}" />`)
    .replace('<meta property="og:title" content="" />', `<meta property="og:title" content="${escapeHtml(data.meta.title)}" />`)
    .replace('<meta property="og:description" content="" />', `<meta property="og:description" content="${escapeHtml(data.meta.description)}" />`)
    .replace(/<meta name="theme-color"[^>]*>/, `<meta name="theme-color" content="${escapeHtml(data.meta.themeColor)}" />`)
    .replace('<script id="boot-content" type="application/json">{}</script>', `<script id="boot-content" type="application/json">${JSON.stringify(boot).replaceAll('<', '\\u003c')}</script>`)
    .replace('<span id="boot-label"></span>', `<span id="boot-label">${escapeHtml(data.ui.loading)}</span>`)
    .replace('<noscript id="noscript-message"></noscript>', `<noscript id="noscript-message">${escapeHtml(data.ui.noscript)}</noscript>`);
}
