#!/usr/bin/env node
/**
 * export-en: make dist/en/en-template-import.json and en-blocks-import.json
 * with the REAL importer app, driven headless (scripts/lib/importer.mjs).
 * Run `npm run build` first.
 *
 * Two passes, because the app probes the asset root for each block's
 * thumbnail exactly once, at import:
 *
 *   1. Import, download the app's Block Thumbnails ZIP, unpack it into
 *      upload/ (thumbnail-<slug>.png per block, plus placeholder.png).
 *   2. Import again in a fresh browser, now with every thumbnail "on the
 *      CDN" (upload/ answers for ASPCA's EN image folder), so each block's
 *      JSON points at its own thumbnail rather than placeholder.png. Export
 *      the Blocks and Template JSON.
 *
 * Then it checks what the importer quirks make worth checking: clientId on
 * every exported entry, no placeholder.png reference, no relative asset path,
 * and it prints every notice the Export panel showed on each tab.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ASSET_ROOT, EN_ACCOUNT } from './lib/config.mjs';
import { writeFilesManifest } from './lib/manifests.mjs';
import { ROOT, UPLOAD, startImporter } from './lib/importer.mjs';

const EN = path.join(ROOT, 'dist/en');
const log = (m) => console.log(`export-en: ${m}`);

const modal = (page) => page.locator('[aria-label="Export for Engaging Networks"]');

async function openExport(page) {
  await page.getByRole('button', { name: 'Export…' }).click();
  await modal(page).waitFor();
}

/** Wait until the thumbnail probe finishes and Download unlocks. */
async function downloadButton(page) {
  const btn = modal(page).getByRole('button', { name: 'Download', exact: true });
  await page.waitForFunction((el) => !el.disabled, await btn.elementHandle(), { timeout: 300_000 });
  return btn;
}

async function saveDownload(page, click, dest) {
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 600_000 }), click()]);
  await dl.saveAs(dest);
  return dest;
}

/** Every banner the Export panel shows right now, with its tone. */
function notices(page) {
  return modal(page).evaluate((m) =>
    [...m.querySelectorAll('div.rounded-lg.border')]
      .map((d) => {
        const c = d.className;
        const tone = c.includes('border-red-800')
          ? 'error'
          : c.includes('border-amber-800')
            ? 'warn'
            : c.includes('border-emerald-800')
              ? 'info'
              : null;
        return tone ? { tone, text: d.innerText.trim() } : null;
      })
      .filter(Boolean),
  );
}

let app;
try {
  app = await startImporter(log);

  /* ---------- pass 1: thumbnails ---------- */
  {
    const { ctx, page } = await app.importCatalog('pass 1');
    await openExport(page);
    await downloadButton(page);
    const zip = path.join(ROOT, '.export-thumbnails.zip');
    await saveDownload(page, () => modal(page).getByRole('button', { name: /^Block Thumbnails \(/ }).click(), zip);
    const r = spawnSync('unzip', ['-o', '-q', zip, '-d', UPLOAD], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`unzip failed: ${r.stderr}`);
    fs.rmSync(zip);
    const thumbs = fs.readdirSync(UPLOAD).filter((f) => f.startsWith('thumbnail-') || f === 'placeholder.png');
    log(`pass 1: ${thumbs.length} thumbnail files unpacked into upload/`);
    await ctx.close();
  }

  /* ---------- pass 2: the exports ---------- */
  const { ctx, page } = await app.importCatalog('pass 2');
  await openExport(page);
  let btn = await downloadButton(page);
  const blockNotices = await notices(page);
  const blocksFile = await saveDownload(page, () => btn.click(), path.join(EN, 'en-blocks-import.json'));

  await modal(page).getByRole('button', { name: 'Template', exact: true }).click();
  btn = await downloadButton(page);
  const templateNotices = await notices(page);
  const templateFile = await saveDownload(page, () => btn.click(), path.join(EN, 'en-template-import.json'));
  await ctx.close();

  /* ---------- checks ---------- */
  let problems = 0;
  const raw = fs.readFileSync(blocksFile, 'utf8');
  const blocks = JSON.parse(raw);
  const template = JSON.parse(fs.readFileSync(templateFile, 'utf8'));
  const entries = Array.isArray(blocks) ? blocks : [blocks];
  const templates = Array.isArray(template) ? template : [template];
  for (const e of [...entries, ...templates]) {
    if (e.clientId !== EN_ACCOUNT.clientId) {
      problems += 1;
      log(`WARN ${e.name ?? e.id}: clientId ${e.clientId}, expected ${EN_ACCOUNT.clientId}`);
    }
  }
  const placeholders = (raw.match(/placeholder\.png/g) || []).length;
  if (placeholders) {
    problems += 1;
    log(`WARN ${placeholders} block(s) still point at placeholder.png`);
  }
  const leftover = (JSON.stringify(template) + raw).match(/["'(]assets\//g) || [];
  if (leftover.length) {
    problems += 1;
    log(`WARN ${leftover.length} relative asset path(s) survived into the JSON`);
  }
  log(`blocks: ${entries.length} entries (${entries.map((e) => e.name).join(' | ')})`);
  log(`template: ${templates.length} entr${templates.length === 1 ? 'y' : 'ies'}; clientId ${EN_ACCOUNT.clientId} on every entry: ${problems ? 'see WARN' : 'yes'}`);
  for (const [tab, list] of [['Blocks', blockNotices], ['Template', templateNotices]]) {
    for (const n of list) log(`${tab} tab ${n.tone.toUpperCase()}: ${n.text.replace(/\s+/g, ' ')}`);
    if (!list.length) log(`${tab} tab: no notices`);
  }
  // For the preview page: what was exported, when, for which account. And
  // the file list again, since upload/ now holds the thumbnails.
  fs.writeFileSync(
    path.join(EN, 'export-manifest.json'),
    `${JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        clientId: EN_ACCOUNT.clientId,
        ownedBy: EN_ACCOUNT.ownedBy,
        folderId: EN_ACCOUNT.folderId,
        assetRoot: ASSET_ROOT,
        blocks: entries.length,
      },
      null,
      2,
    )}\n`,
  );
  writeFilesManifest(ROOT);
  log(`done, ${problems} problem(s)`);
  process.exitCode = problems ? 1 : 0;
} catch (err) {
  console.error('export-en: FAILED —', err);
  process.exitCode = 1;
} finally {
  await app?.close();
}
