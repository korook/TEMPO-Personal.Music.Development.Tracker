// Builds stand-alone preview files: each page becomes ONE .html file with all of its
// scripts and styles inside, so Baranay can open it straight from the Finder (file://)
// with no server, review it, and approve it before anything is pushed to GitHub.
//
// Usage: npm run preview:file   →   preview/Tempo app.html, preview/Tempo design system.html

import { build } from 'vite';
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const previewDir = join(root, 'preview');
const workDir = join(previewDir, '.build');

// Each page to preview: its source HTML and the name of the finished preview file.
const PAGES = [
  { source: 'index.html', output: 'Tempo app.html' },
  { source: 'components.html', output: 'Tempo design system.html' },
];

// ─── Building ───

// Builds one page on its own, so all of its code ends up in a single script file.
async function buildPage(page) {
  const outDir = join(workDir, page.source.replace('.html', ''));
  await build({
    configFile: false,
    root,
    base: './',
    logLevel: 'warn',
    build: {
      outDir,
      emptyOutDir: true,
      modulePreload: false,
      cssCodeSplit: false,
      assetsInlineLimit: Number.MAX_SAFE_INTEGER,
      rolldownOptions: { input: join(root, page.source) },
    },
  });
  return outDir;
}

// ─── Inlining ───

// Replaces each <script src> and <link rel="stylesheet"> with the file's contents.
function inlineAssets(html, outDir) {
  const withScripts = html.replace(/<script type="module"[^>]*src="\.\/([^"]+)"[^>]*><\/script>/g, (_, file) => {
    const code = readFileSync(join(outDir, file), 'utf8').replace(/<\/script/gi, '<\\/script');
    return `<script type="module">\n${code}\n</script>`;
  });
  return withScripts.replace(/<link rel="stylesheet"[^>]*href="\.\/([^"]+)"[^>]*>/g, (_, file) => (
    `<style>\n${readFileSync(join(outDir, file), 'utf8')}\n</style>`
  ));
}

// Makes sure nothing was left pointing at a separate local file.
function checkSelfContained(html, name) {
  const leftovers = html.match(/(src|href)="\.\/assets\/[^"]+"/g);
  if (leftovers) throw new Error(`${name} still links to: ${leftovers.join(', ')}`);
}

// ─── Run ───

mkdirSync(previewDir, { recursive: true });
for (const page of PAGES) {
  const outDir = await buildPage(page);
  const html = inlineAssets(readFileSync(join(outDir, page.source), 'utf8'), outDir);
  checkSelfContained(html, page.output);
  writeFileSync(join(previewDir, page.output), html);
  console.log(`✓ preview/${page.output}`);
}
rmSync(workDir, { recursive: true, force: true });
console.log(`Open these from the Finder: ${readdirSync(previewDir).filter((name) => name.endsWith('.html')).join(', ')}`);
