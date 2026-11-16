/**
 * The two JSON files the preview page (index.html) reads, so the page never
 * hard-codes a file list and stays in step with whatever the scripts made.
 *
 *   dist/files.json            written by build AND export-en (export-en adds
 *                              thumbnails to upload/ after the build ran):
 *                              { emails, local, en, uploads, originals }
 *   dist/en/export-manifest.json  written by export-en: when, and for which
 *                              EN account, the import JSON was made
 *
 * Both are generated. Never hand-edit them; check-sync verifies files.json
 * against the disk.
 */
import fs from 'node:fs';
import path from 'node:path';
import { AUTORESPONDERS } from './config.mjs';

const listDir = (dir, prefix = '') =>
  fs.existsSync(dir)
    ? fs
        .readdirSync(dir, { withFileTypes: true })
        .filter((d) => !d.name.startsWith('.'))
        .sort((a, b) => a.name.localeCompare(b.name))
        .flatMap((d) =>
          d.isDirectory()
            ? listDir(path.join(dir, d.name), `${prefix}${d.name}/`)
            : [{ name: `${prefix}${d.name}`, bytes: fs.statSync(path.join(dir, d.name)).size }],
        )
    : [];

/** What files.json should hold right now, computed from the disk. */
export function filesManifest(root) {
  return {
    emails: AUTORESPONDERS.map((a) => ({ file: `${a.id}.html`, title: a.title, use: a.use, source: a.source })),
    local: listDir(path.join(root, 'dist/local')),
    en: listDir(path.join(root, 'dist/en')).filter((f) => f.name !== 'export-manifest.json'),
    uploads: listDir(path.join(root, 'upload')),
    // The source emails' images, for the page's Original view (their own
    // URLs point at aspca.org and Mailchimp, which an artifact cannot load).
    originals: listDir(path.join(root, 'qa/source/originals')),
  };
}

export const filesManifestText = (root) => `${JSON.stringify(filesManifest(root), null, 2)}\n`;

export function writeFilesManifest(root) {
  fs.writeFileSync(path.join(root, 'dist/files.json'), filesManifestText(root));
}
