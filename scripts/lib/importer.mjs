/**
 * Drive the real importer app (email-to-en-marketing-tools) headless.
 *
 * startImporter() starts the app's Vite dev server and a CORS file server
 * for this repo, launches Chromium, and returns importCatalog(), which
 * imports dist/local/main.mjml in a FRESH browser context exactly as a
 * person would:
 *
 *   - ASPCA's account settings are typed into Settings AFTER the MJML URL is
 *     fetched, because the app can pre-select another client's settings on
 *     load (known quirk).
 *   - Requests to ASPCA's EN image folder are answered from upload/, so the
 *     app's one-time thumbnail probe sees exactly what upload/ will put on
 *     EN's CDN, and no request reaches the real CDN.
 *
 * Used by export-en and qa-inert-audit. The importer checkout is expected
 * beside this repo (override with EN_TOOLS_DIR), dependencies installed.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { ASSET_ROOT, EN_ACCOUNT } from './config.mjs';
import { serve } from './serve.mjs';

// The container's Playwright is global: require resolves it, ESM import does not.
const { chromium } = createRequire(import.meta.url)('playwright');

export const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const UPLOAD = path.join(ROOT, 'upload');
const TOOLS = path.resolve(process.env.EN_TOOLS_DIR || path.join(ROOT, '../email-to-en-marketing-tools'));
const APP_PORT = Number(process.env.EN_TOOLS_PORT || 5181);
const SRC_PORT = Number(process.env.ASPCA_SERVE_PORT || 8644);
const root = ASSET_ROOT.replace(/\/+$/, '') + '/';

export async function startImporter(log) {
  if (!fs.existsSync(path.join(ROOT, 'dist/local/main.mjml'))) {
    throw new Error('dist/local/main.mjml is missing — run npm run build first');
  }
  if (!fs.existsSync(path.join(TOOLS, 'node_modules'))) {
    throw new Error(`no node_modules in ${TOOLS} — run npm ci there first`);
  }

  const { server: srcServer, url: srcUrl } = await serve(ROOT, SRC_PORT);
  const mjmlUrl = `${srcUrl}/dist/local/main.mjml`;
  const vite = spawn('npx', ['vite', '--port', String(APP_PORT), '--strictPort', '--host', '127.0.0.1'], {
    cwd: TOOLS,
    stdio: ['ignore', 'pipe', 'pipe'],
    // Its own process group: npx starts Vite as a grandchild, and killing
    // npx alone leaves Vite holding our pipes open, so this script would
    // finish its work and never exit.
    detached: true,
  });
  const stopVite = () => {
    try {
      process.kill(-vite.pid, 'SIGTERM');
    } catch {
      /* already gone */
    }
  };
  let viteLog = '';
  vite.stdout.on('data', (d) => (viteLog += d));
  vite.stderr.on('data', (d) => (viteLog += d));
  const appUrl = `http://127.0.0.1:${APP_PORT}/`;
  // Vite's first cold start (dependency pre-bundling) can take a while.
  for (let i = 0; ; i += 1) {
    try {
      if ((await fetch(appUrl, { signal: AbortSignal.timeout(5000) })).ok) break;
    } catch {
      /* not up yet */
    }
    if (i > 120) {
      stopVite();
      srcServer.close();
      throw new Error(`importer dev server did not start\n${viteLog}`);
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  log(`importer at ${appUrl}, MJML at ${mjmlUrl}`);

  const browser = await chromium.launch();

  async function importCatalog(label) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
    const page = await ctx.newPage();
    page.on('dialog', (d) => void d.accept());
    await ctx.route(`${root}**`, (route) => {
      const name = decodeURIComponent(new URL(route.request().url()).pathname.split('/').pop());
      const file = path.join(UPLOAD, name);
      if (!fs.existsSync(file)) return route.fulfill({ status: 404, body: 'not found' });
      return route.fulfill({ path: file, headers: { 'Access-Control-Allow-Origin': '*' } });
    });
    await page.goto(appUrl);
    const urlBox = page.getByPlaceholder(/github\.com\/org\/repo/);
    await urlBox.fill(mjmlUrl);
    await urlBox.press('Enter');
    await page.getByText(/^✓ /).first().waitFor({ timeout: 60_000 });

    await page.getByTitle('EN account settings').click();
    const field = (name) => page.locator('label', { hasText: name }).locator('input').first();
    await field('Client ID').fill(String(EN_ACCOUNT.clientId));
    await field('Owner user ID').fill(String(EN_ACCOUNT.ownedBy));
    await field('Folder ID').fill(String(EN_ACCOUNT.folderId));
    await page.getByPlaceholder('https://…rackcdn.com/1874').fill(ASSET_ROOT);
    await page.getByRole('button', { name: 'Done', exact: true }).click();

    await page.getByPlaceholder('e.g. CLF — Spring Appeal').fill('ASPCA');
    await page.getByRole('button', { name: /Compile MJML & Analyze/ }).click();
    await page.getByRole('button', { name: 'Export…' }).waitFor({ timeout: 180_000 });
    log(`${label}: imported`);
    return { ctx, page };
  }

  const close = async () => {
    await browser.close().catch(() => {});
    stopVite();
    srcServer.close();
  };
  return { importCatalog, close };
}
