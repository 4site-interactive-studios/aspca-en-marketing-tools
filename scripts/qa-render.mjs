// QA instrument: full-page screenshots of email HTML at 600px and 375px.
// Remote ASPCA/Mailchimp image URLs are served from qa/source/originals so a
// render never depends on the network. Usage:
//   node scripts/qa-render.mjs <outDir> <dsf> <file.html>...
import { createRequire } from 'node:module';
// The container's Playwright is global (require resolves it; ESM import does not).
const { chromium } = createRequire(import.meta.url)('playwright');
import fs from 'node:fs';
import path from 'node:path';

const [outDir, dsfArg, ...files] = process.argv.slice(2);
const dsf = Number(dsfArg) || 1;
const ORIG = path.resolve('qa/source/originals');
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
for (const file of files) {
  for (const width of [600, 375]) {
    const ctx = await browser.newContext({ viewport: { width, height: 800 }, deviceScaleFactor: dsf });
    const page = await ctx.newPage();
    await page.route(/^https?:\/\/(www\.aspca\.org|secure\.aspca\.org|gallery\.mailchimp\.com|[a-z0-9-]+\.ssl\.cf5\.rackcdn\.com)\//, (route) => {
      const name = decodeURIComponent(new URL(route.request().url()).pathname.split('/').pop());
      const local = path.join(ORIG, name);
      if (fs.existsSync(local)) return route.fulfill({ path: local });
      return route.abort();
    });
    await page.goto('file://' + path.resolve(file));
    await page.waitForLoadState('networkidle');
    const base = path.basename(file).replace(/\.html$/, '');
    await page.screenshot({ path: path.join(outDir, `${base}_${width}.png`), fullPage: true });
    await ctx.close();
  }
}
await browser.close();
