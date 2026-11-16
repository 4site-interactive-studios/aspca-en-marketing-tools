#!/usr/bin/env node
/**
 * check-sync: keep the autoresponders, the catalog and the generated files
 * in step. WARN-only output, one line per problem; exits 1 when any WARN
 * printed, so "0 warnings" is a real gate.
 *
 *  1. Every page declares the same en-tools-config and mj-attributes
 *     (byte-identical, as TPL requires of its pages).
 *  2. Every page pulls styles.css into its head.
 *  3. BLOCK PARITY. Every START/END block in an autoresponder resolves to a
 *     catalog block: by exact name, else with its last qualifier dropped
 *     ("Heading (centered, take action)" -> "Heading (centered)"), else with
 *     the whole parenthetical dropped ("WYSIWYG Text (P.S.)" ->
 *     "WYSIWYG Text"). The two must have the same STRUCTURE once every value
 *     an editor could set in EN is masked: text content, image src, href,
 *     alt and width, colors, paddings, divider weight, the Link Color class
 *     token, and the trailing gap section (whose height, None included, is
 *     a field). Anything else that differs (an element, a class, a data-*
 *     flag, a font size, an alignment) means the page has drifted from the
 *     catalog: fix the catalog block or the page, never mask it away.
 *  4. dist/ is current: each dist/local/<name>.mjml equals its flattened
 *     source (else run npm run build).
 *  5. upload/ holds every image dist/en references and every thumbnail the
 *     blocks JSON references; every aspca- file in upload/ still has a source.
 *  6. The EN import JSON carries the configured clientId on every entry.
 *  7. The preview page's inputs: dist/files.json matches the disk, every
 *     autoresponder has a config entry (title, EN use, source) and its
 *     source file exists, export-manifest.json matches the account in
 *     config, and every local path index.html names exists.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ASSET_ROOT, AUTORESPONDERS, AUTORESPONDER_DIR, EN_ACCOUNT, pages } from './lib/config.mjs';
import { filesManifestText } from './lib/manifests.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
let warnings = 0;
const warn = (m) => {
  warnings += 1;
  console.log(`check-sync: WARN ${m}`);
};
const rel = (p) => path.relative(ROOT, p);
const read = (p) => fs.readFileSync(p, 'utf8');

const all = pages(SRC);
const catalogPath = all[0];
const autoresponders = all.filter((p) => p.includes(`${path.sep}${AUTORESPONDER_DIR}${path.sep}`));

/* ---------- 1 + 2: heads ---------- */
const configOf = (s) => (/<!--\s*en-tools-config[\s\S]*?-->/.exec(s) || [null])[0];
const attrsOf = (s) => (/<mj-attributes>[\s\S]*?<\/mj-attributes>/.exec(s) || [null])[0];
const catalogSrc = read(catalogPath);
for (const p of all) {
  const s = read(p);
  if (!configOf(s)) warn(`${rel(p)} declares no en-tools-config`);
  else if (configOf(s) !== configOf(catalogSrc)) warn(`${rel(p)}: en-tools-config differs from src/main.mjml`);
  if (attrsOf(s) !== attrsOf(catalogSrc)) warn(`${rel(p)}: mj-attributes differ from src/main.mjml`);
  if (!/<mj-include\s+path="(?:\.\.\/|\.\/)styles\.css"\s+type="css"/.test(s)) warn(`${rel(p)} does not include styles.css`);
}

/* ---------- 3: block parity ---------- */
const stripComments = (s) => s.replace(/<!--(?!\s*\[if|\s*<!\[endif)[\s\S]*?-->/g, '');

function blocksOf(s) {
  const out = new Map();
  const re = /<!--\s*START:\s*(.+?)\s*-->([\s\S]*?)<!--\s*END:\s*\1\s*-->/g;
  for (const m of s.matchAll(re)) {
    if (m[1] === 'Main Content') {
      for (const [k, v] of blocksOf(m[2])) out.set(k, v);
      continue;
    }
    if (out.has(m[1])) warn(`block name "${m[1]}" appears twice in one page — qualify the second use`);
    out.set(m[1], m[2]);
  }
  return out;
}

const MASKED_ATTRS = new Set([
  'src', 'href', 'alt', 'title', 'target',
  'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
  'background-color', 'color', 'border-color', 'border-width', 'height',
]);

function fingerprint(markup) {
  let s = stripComments(markup);
  // the trailing gap section is a field (Height, None removes it)
  s = s.replace(/<mj-section\s[^>]*css-class="spacer-block[^"]*"[^>]*>[\s\S]*?<\/mj-section>/g, '');
  // text content is a field
  s = s.replace(/(<mj-text\b[^>]*>)[\s\S]*?(<\/mj-text>)/g, '$1…$2');
  const tokens = [];
  for (const m of s.matchAll(/<(\/?)(mj-[\w-]+)([^>]*?)(\/?)>|…/g)) {
    if (m[0] === '…') {
      tokens.push('…');
      continue;
    }
    const [, close, tag, attrText] = m;
    if (close) {
      tokens.push(`</${tag}>`);
      continue;
    }
    const attrs = [];
    // An element without css-class inherits mj-attributes' default (the
    // wysiwyg hook on every mj-text), so compare the class it actually gets.
    const effective = /\bcss-class=/.test(attrText) || !DEFAULT_CLASS[tag] ? attrText : `${attrText} css-class="${DEFAULT_CLASS[tag]}"`;
    for (const a of effective.matchAll(/([\w:-]+)(?:="([^"]*)")?/g)) {
      const [, name, value = ''] = a;
      if (MASKED_ATTRS.has(name)) continue;
      if (name === 'width' && tag === 'mj-image') continue;
      if (name === 'css-class') {
        attrs.push(`css-class=${value.split(/\s+/).filter((t) => t && !t.startsWith('link-')).join(' ')}`);
        continue;
      }
      attrs.push(value ? `${name}=${value}` : name);
    }
    tokens.push(`<${tag} ${attrs.sort().join(' ')}>`);
  }
  return tokens;
}

const DEFAULT_CLASS = {};
for (const m of (attrsOf(catalogSrc) || '').matchAll(/<(mj-[\w-]+)\b[^>]*\bcss-class="([^"]*)"/g)) DEFAULT_CLASS[m[1]] = m[2];

const catalog = blocksOf(catalogSrc);
const used = new Set();
function resolve(name) {
  if (catalog.has(name)) return name;
  const lastQualifier = name.replace(/,\s*[^,()]+\)$/, ')');
  if (lastQualifier !== name && catalog.has(lastQualifier)) return lastQualifier;
  const family = name.replace(/\s*\([^()]*\)$/, '');
  if (family !== name && catalog.has(family)) return family;
  return null;
}
for (const p of autoresponders) {
  for (const [name, markup] of blocksOf(read(p))) {
    const target = resolve(name);
    if (!target) {
      warn(`${rel(p)}: block "${name}" has no catalog block in src/main.mjml`);
      continue;
    }
    used.add(target);
    const a = fingerprint(catalog.get(target));
    const b = fingerprint(markup);
    const i = a.findIndex((t, k) => t !== b[k]);
    if (i !== -1 || a.length !== b.length) {
      const k = i === -1 ? Math.min(a.length, b.length) : i;
      warn(`${rel(p)}: "${name}" drifted from catalog "${target}" at token ${k}: catalog ${a[k] ?? '(end)'} vs page ${b[k] ?? '(end)'}`);
    }
  }
}
const unused = [...catalog.keys()].filter((n) => !used.has(n));
console.log(`check-sync: ${autoresponders.length} autoresponders, ${catalog.size} catalog blocks, ${used.size} used by a page${unused.length ? ` (catalog-only: ${unused.join(', ')})` : ''}`);

/* ---------- 4: dist is current ---------- */
for (const p of all) {
  const name = path.basename(p, '.mjml');
  const flat = read(p).replace(/(<mj-include\s+path=")(?:\.\.\/)+styles\.css(")/g, '$1./styles.css$2');
  const built = path.join(ROOT, 'dist/local', `${name}.mjml`);
  if (!fs.existsSync(built)) warn(`dist/local/${name}.mjml missing — run npm run build`);
  else if (read(built) !== flat) warn(`dist/local/${name}.mjml is stale — run npm run build`);
  for (const f of [`dist/local/${name}.html`, `dist/en/${name}.mjml`, `dist/en/${name}.html`]) {
    if (!fs.existsSync(path.join(ROOT, f))) warn(`${f} missing — run npm run build`);
  }
}
for (const f of ['styles.css']) {
  for (const d of ['dist/local', 'dist/en']) {
    const built = path.join(ROOT, d, f);
    if (!fs.existsSync(built) || read(built) !== read(path.join(SRC, f))) warn(`${d}/${f} is stale — run npm run build`);
  }
}

/* ---------- 5: upload/ ---------- */
const UPLOAD = path.join(ROOT, 'upload');
const root = ASSET_ROOT.replace(/\/+$/, '') + '/';
const uploaded = new Set(fs.existsSync(UPLOAD) ? fs.readdirSync(UPLOAD) : []);
const needed = new Set();
for (const f of fs.existsSync(path.join(ROOT, 'dist/en')) ? fs.readdirSync(path.join(ROOT, 'dist/en')) : []) {
  if (!/\.(html|json)$/.test(f)) continue;
  for (const m of read(path.join(ROOT, 'dist/en', f)).matchAll(/https?:\/\/[^"'()\s\\]+/g)) {
    if (m[0].startsWith(root)) needed.add(decodeURIComponent(m[0].slice(root.length)));
  }
}
needed.delete(''); // the asset root itself (export-manifest.json's assetRoot), not a file
for (const f of needed) if (!uploaded.has(f)) warn(`upload/${f} is referenced by dist/en but missing`);
const assets = new Set(fs.readdirSync(path.join(SRC, 'assets')));
for (const f of uploaded) if (f.startsWith('aspca-') && !assets.has(f)) warn(`upload/${f} has no source in src/assets`);

/* ---------- 6: EN JSON account ---------- */
for (const f of ['en-template-import.json', 'en-blocks-import.json']) {
  const p = path.join(ROOT, 'dist/en', f);
  if (!fs.existsSync(p)) {
    warn(`dist/en/${f} missing — run npm run export-en`);
    continue;
  }
  const data = JSON.parse(read(p));
  for (const e of Array.isArray(data) ? data : [data]) {
    if (e.clientId !== EN_ACCOUNT.clientId) warn(`dist/en/${f}: "${e.name ?? e.id}" has clientId ${e.clientId}, expected ${EN_ACCOUNT.clientId}`);
  }
}

/* ---------- 7: preview page inputs ---------- */
const filesJson = path.join(ROOT, 'dist/files.json');
if (!fs.existsSync(filesJson)) warn('dist/files.json missing — run npm run build');
else if (read(filesJson) !== filesManifestText(ROOT)) warn('dist/files.json is stale — run npm run build');
const configured = new Set(AUTORESPONDERS.map((a) => a.id));
for (const p of autoresponders) {
  const id = path.basename(p, '.mjml');
  if (!configured.has(id)) warn(`${rel(p)} has no AUTORESPONDERS entry in scripts/lib/config.mjs (the preview page will not show it)`);
}
for (const a of AUTORESPONDERS) {
  if (!autoresponders.some((p) => path.basename(p, '.mjml') === a.id)) warn(`config AUTORESPONDERS lists ${a.id}, which has no source page`);
  if (!fs.existsSync(path.join(ROOT, a.source))) warn(`${a.id}: original ${a.source} is missing`);
}
const manifestPath = path.join(ROOT, 'dist/en/export-manifest.json');
if (!fs.existsSync(manifestPath)) warn('dist/en/export-manifest.json missing — run npm run export-en');
else {
  const m = JSON.parse(read(manifestPath));
  for (const k of ['clientId', 'ownedBy', 'folderId']) {
    if (m[k] !== EN_ACCOUNT[k]) warn(`dist/en/export-manifest.json ${k} ${m[k]} differs from config ${EN_ACCOUNT[k]} — run npm run export-en`);
  }
}
const index = read(path.join(ROOT, 'index.html'));
const markup = index.slice(0, index.indexOf('<script'));
for (const m of markup.matchAll(/(?:href|src)="([^"#:]+)"/g)) {
  if (!fs.existsSync(path.join(ROOT, m[1]))) warn(`index.html links ${m[1]}, which does not exist`);
}
for (const m of index.matchAll(/\b(\w+): '((?:dist|upload|qa)\/[^']*)'/g)) {
  if (!fs.existsSync(path.join(ROOT, m[2]))) warn(`index.html PATHS.${m[1]} names ${m[2]}, which does not exist`);
}

console.log(`check-sync: ${warnings} warning(s)`);
process.exitCode = warnings ? 1 : 0;
