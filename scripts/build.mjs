#!/usr/bin/env node
/**
 * Build every page into dist/local and dist/en, and stage upload/.
 *
 *   src/main.mjml                     the block catalog (EN template + blocks)
 *   src/autoresponders/<name>.mjml    standalone autoresponders
 *
 * For each page:
 *   dist/local/<name>.mjml   the source, flattened beside a copy of styles.css
 *                            (MJML 5.4 refuses ../ includes) — relative assets
 *   dist/local/<name>.html   compiled, relative assets — preview copy
 *   dist/en/<name>.mjml      same MJML with absolute EN image URLs
 *   dist/en/<name>.html      compiled, absolute EN image URLs, no scripts,
 *                            compacted — for an autoresponder this is THE
 *                            paste-ready deliverable for EN's editor
 *
 * upload/ receives every src/assets image (all aspca- prefixed). export-en
 * adds the importer's thumbnails there; this script never deletes them.
 *
 * Last, dist/files.json: the file list the preview page (index.html) reads.
 *
 * Everything under dist/ and upload/ is generated. Never hand-edit it.
 * Override the EN image folder with ASPCA_ASSET_ROOT=… npm run build.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mjml2html from 'mjml';
import { compactLive, guard } from './lib/compact.mjs';
import { ASSET_ROOT, pages } from './lib/config.mjs';
import { writeFilesManifest } from './lib/manifests.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const LOCAL = path.join(ROOT, 'dist/local');
const EN = path.join(ROOT, 'dist/en');
const UPLOAD = path.join(ROOT, 'upload');
const root = ASSET_ROOT.replace(/\/+$/, '') + '/';

let warnings = 0;
const warn = (msg) => {
  warnings += 1;
  console.log(`build: WARN ${msg}`);
};

/* ---------- clean ---------- */
// Only what this script owns. export-en's three files (the two EN import
// JSON files and export-manifest.json) belong to it and survive a rebuild.
for (const dir of [LOCAL, EN]) {
  fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(dir)) {
    if (/^(?:en-(?:template|blocks)-import|export-manifest)\.json$/.test(f)) continue;
    fs.rmSync(path.join(dir, f), { recursive: true, force: true });
  }
}
fs.mkdirSync(UPLOAD, { recursive: true });

/* ---------- assets ---------- */
const assets = fs.readdirSync(path.join(SRC, 'assets')).filter((f) => !f.startsWith('.'));
fs.mkdirSync(path.join(LOCAL, 'assets'), { recursive: true });
for (const f of assets) {
  if (!f.startsWith('aspca-')) warn(`src/assets/${f} has no aspca- prefix (EN's image folder is flat and shared)`);
  fs.copyFileSync(path.join(SRC, 'assets', f), path.join(LOCAL, 'assets', f));
  fs.copyFileSync(path.join(SRC, 'assets', f), path.join(UPLOAD, f));
}
// A renamed or deleted asset must not linger in upload/ (thumbnails excepted).
for (const f of fs.readdirSync(UPLOAD)) {
  if (f.startsWith('aspca-') && !assets.includes(f)) fs.rmSync(path.join(UPLOAD, f));
}
for (const dir of [LOCAL, EN]) fs.copyFileSync(path.join(SRC, 'styles.css'), path.join(dir, 'styles.css'));

/* ---------- absolute URLs (every carrier MJML emits, guide section 4) ---------- */
const toAbsolute = (p) => root + p.split('/').pop();
function absolutize(text) {
  let count = 0;
  const swap = (m, pre, p, post) => {
    count += 1;
    return pre + toAbsolute(p) + post;
  };
  const out = text
    .replace(/(\bsrc=")(assets\/[^"]+)(")/g, swap)
    .replace(/(\bbackground=")(assets\/[^"]+)(")/g, swap)
    .replace(/(\bbackground-url=")(assets\/[^"]+)(")/g, swap)
    .replace(/(url\(')(assets\/[^']+)('\))/g, swap)
    .replace(/(url\(")(assets\/[^"]+)("\))/g, swap)
    .replace(/(url\()(assets\/[^)'"]+)(\))/g, swap);
  return { text: out, count };
}

/* ---------- pages ---------- */
const bytes = (s) => Buffer.byteLength(s, 'utf8');
for (const page of pages(SRC)) {
  const name = path.basename(page, '.mjml');
  // Flatten: every page lands beside styles.css, so a subfolder page's
  // ../styles.css include becomes ./styles.css.
  const flat = fs
    .readFileSync(page, 'utf8')
    .replace(/(<mj-include\s+path=")(?:\.\.\/)+styles\.css(")/g, '$1./styles.css$2');
  if (/<mj-include\s+path="\.\.\//.test(flat)) warn(`${name}: an mj-include still climbs out of its folder`);

  const enMjml = absolutize(flat).text;
  fs.writeFileSync(path.join(LOCAL, `${name}.mjml`), flat);
  fs.writeFileSync(path.join(EN, `${name}.mjml`), enMjml);

  const compile = async (dir, source) => {
    const r = await mjml2html(source, {
      filePath: path.join(dir, `${name}.mjml`),
      ignoreIncludes: false, // mjml-core's switch; the CLI's allowIncludes maps onto it
      validationLevel: 'skip',
      keepComments: true,
    });
    for (const e of r.errors || []) warn(`${name}: mjml ${e.formattedMessage || e.message}`);
    return r.html;
  };

  const localHtml = await compile(LOCAL, flat);
  fs.writeFileSync(path.join(LOCAL, `${name}.html`), localHtml);

  // The EN copy is the LOCAL compile, absolutized: one compile, so the two
  // can never differ in anything but their image URLs.
  const { text: absolute, count } = absolutize(localHtml);
  const noScripts = absolute.replace(/[ \t]*<script\b[\s\S]*?<\/script>[ \t]*\n?/gi, '');
  const { html: live } = compactLive(noScripts);
  const problems = guard(`${name}.html`, noScripts, live);
  warnings += problems;
  fs.writeFileSync(path.join(EN, `${name}.html`), live);

  const leftover = (live.match(/["'(]assets\//g) || []).length;
  if (leftover) warn(`${name}: ${leftover} relative asset reference(s) left in dist/en/${name}.html`);
  const missing = [...live.matchAll(/https?:\/\/[^"')\s]+/g)]
    .map((m) => m[0])
    .filter((u) => u.startsWith(root))
    .map((u) => u.slice(root.length))
    .filter((f) => !assets.includes(f));
  for (const f of new Set(missing)) warn(`${name}: references ${f}, which is not in src/assets`);

  console.log(
    `build: ${name} — ${count} image URLs absolutized, ` +
      `dist/en/${name}.html ${bytes(noScripts)} -> ${bytes(live)} bytes compacted`,
  );
}

/* ---------- upload/ prefix report ---------- */
const unprefixed = fs.readdirSync(UPLOAD).filter((f) => !f.startsWith('aspca-') && !f.startsWith('.'));
if (unprefixed.length) {
  // Not a WARN: the importer names its thumbnails thumbnail-<slug>.png and
  // its fallback placeholder.png, with no prefix setting (README).
  console.log(`build: note — ${unprefixed.length} upload/ file(s) carry the importer's own names (no aspca- prefix): ${unprefixed.join(', ')}`);
}

// The preview page's file list (index.html reads it).
writeFilesManifest(ROOT);

console.log(`build: done, ${warnings} warning(s)`);
process.exitCode = warnings ? 1 : 0;
