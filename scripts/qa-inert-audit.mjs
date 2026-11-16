#!/usr/bin/env node
/**
 * QA gate: run the importer's Test Center > Inert Audit over this catalog
 * and print its verdict line. The audit renders every Select option at 600px
 * and 375px; PASS means the field behaves the way its label and kind promise
 * (guide section 8, item 9). Saves the app's full report to
 * qa/inert-audit-report.* for the record.
 *
 * Run after npm run build. Uses the same headless import as export-en.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, startImporter } from './lib/importer.mjs';

const log = (m) => console.log(`qa-inert-audit: ${m}`);
let app;
try {
  app = await startImporter(log);
  const { ctx, page } = await app.importCatalog('import');
  await page.getByRole('button', { name: 'Test Center', exact: true }).click();
  await page.getByRole('button', { name: 'Inert Audit', exact: true }).click();
  await page.getByRole('button', { name: 'Run Audit', exact: true }).click();
  // Finished when Run Audit (or a Resume) is back and Cancel is gone.
  await page.getByRole('button', { name: 'Cancel (keeps results)', exact: true }).waitFor({ state: 'visible', timeout: 120_000 });
  await page.getByRole('button', { name: 'Cancel (keeps results)', exact: true }).waitFor({ state: 'detached', timeout: 1_800_000 });
  const summary = await page.locator('h2', { hasText: 'Inert Dropdown Audit' }).locator('xpath=..').innerText();
  log(summary.replace(/\s+/g, ' ').slice(0, 600));
  const [dl] = await Promise.all([
    page.waitForEvent('download', { timeout: 120_000 }),
    page.getByRole('button', { name: 'Download Report', exact: true }).click(),
  ]);
  const dest = path.join(ROOT, 'qa', `inert-audit-report${path.extname(dl.suggestedFilename()) || '.txt'}`);
  await dl.saveAs(dest);
  log(`report saved to ${path.relative(ROOT, dest)}`);
  await ctx.close();
} catch (err) {
  console.error('qa-inert-audit: FAILED —', err);
  process.exitCode = 1;
} finally {
  await app?.close();
}
