/**
 * The one place this repo's account values and page list live. build,
 * export-en and check-sync all read from here.
 *
 * ASSET_ROOT: ASPCA's EN image folder. Inferred, not confirmed by ASPCA:
 * every EN asset URL in the engrid-aspca repo (page template, five receipt
 * templates) uses this host and the /20014/ folder, which is also EN's
 * client ID. Override with ASPCA_ASSET_ROOT=… for another folder.
 *
 * EN account settings for export-en. CLIENT_ID is inferred the same way.
 * OWNED_BY is a PLACEHOLDER (999999) until ASPCA supplies the real owner
 * user ID: the importer will not analyze with an owner ID of 0, so the
 * placeholder has to be a number no real EN user is likely to hold.
 * FOLDER_ID 0 is EN's root folder, also a placeholder until ASPCA names
 * the folder. Override any of them from the environment, then re-run
 * export-en.
 */
import fs from 'node:fs';
import path from 'node:path';

export const ASSET_ROOT =
  process.env.ASPCA_ASSET_ROOT ||
  'https://bd6ca9cefa6fb6e0adf1-c2f9aa1adb9f60a775f60074e4c86031.ssl.cf5.rackcdn.com/20014/';

export const EN_ACCOUNT = {
  clientId: Number(process.env.ASPCA_CLIENT_ID || 20014),
  ownedBy: Number(process.env.ASPCA_OWNED_BY || 999999), // PLACEHOLDER: owner user ID unknown
  folderId: Number(process.env.ASPCA_FOLDER_ID || 0), // PLACEHOLDER: 0 = EN root folder
};

/**
 * The autoresponders as the preview page shows them, in switch order. Every
 * src/autoresponders page needs an entry (check-sync warns otherwise).
 *   title   the Email switch label
 *   use     where it goes in EN
 *   source  the Springboard original it was ported from (the one-time and
 *           annual entries are the resolved branches of one shared source,
 *           written by scripts/qa-resolve-source.py)
 */
export const AUTORESPONDERS = [
  {
    id: 'monthly-guardian-thank-you',
    title: 'Monthly (Guardian)',
    use: 'Donation page thank-you: Recurring Gift message, filtered to monthly',
    source: 'qa/source/monthly-ack.html',
  },
  {
    id: 'one-time-thank-you',
    title: 'One-time',
    use: 'Donation page thank-you: Single Gift message',
    source: 'qa/source/onetime-ack.resolved.html',
  },
  {
    id: 'annual-membership-thank-you',
    title: 'Annual',
    use: 'Donation page thank-you: Recurring Gift message, filtered to annual',
    source: 'qa/source/annual-ack.resolved.html',
  },
];

export const CATALOG = 'main.mjml';
export const AUTORESPONDER_DIR = 'autoresponders';

/** Every compiled page: the catalog first, then the autoresponders, sorted. */
export function pages(srcDir) {
  const ar = path.join(srcDir, AUTORESPONDER_DIR);
  const list = [path.join(srcDir, CATALOG)];
  if (fs.existsSync(ar)) {
    for (const f of fs.readdirSync(ar).sort()) if (f.endsWith('.mjml')) list.push(path.join(ar, f));
  }
  return list;
}
