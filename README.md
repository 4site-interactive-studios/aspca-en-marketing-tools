# ASPCA EN Marketing Tools

ASPCA's donation thank-you emails for Engaging Networks (EN), ported from the Springboard auto-acknowledgements to MJML. One block catalog feeds EN Marketing Tools (template and block imports), and three standalone autoresponders are built from the same blocks as paste-ready HTML for EN's autoresponder editor.

## The preview page

`index.html` is the review page for the ASPCA, laid out like the GLAAD repo's: an Email switch over the three autoresponders, Desktop/Phone width, a Version switch between the new EN email and the Springboard original it replaces, and (outside the artifact) whether images load from this repo or from EN. Beside it: setup steps, every file to download (one at a time or as ZIPs), and the open items before the first send. Below it, every block with the thumbnail and field count EN will show.

It is published as a private Claude artifact: https://claude.ai/artifact/4g8FvXkc4hfkRfqo6S2uwa (shared from that page), and on GitHub Pages from the repo root of `main`: https://4site-interactive-studios.github.io/aspca-en-marketing-tools/ (public, like the repo). `.nojekyll` makes Pages serve every file as-is. Locally, `npm run preview` serves it at http://localhost:8643.

GitHub Pages serves the committed `dist/`, `upload/` and `qa/source/` files, so commit them after every build and export, as you would for EN. The artifact copy is updated separately (below).

The page hard-codes no file lists. It reads `dist/files.json` (written by build and export-en) and `dist/en/export-manifest.json` (written by export-en), so it follows whatever the scripts made. A new autoresponder appears in the Email switch once it has an `AUTORESPONDERS` entry in `scripts/lib/config.mjs`; check-sync warns until it does.

To republish the artifact after a change, publish every file the page reads at the same relative paths, with each `.mjml` file published as `<name>.mjml.txt` (the artifact host cannot serve `.mjml`; the page falls back to the `.txt` name and its ZIP restores the original name): `index.html`, `dist/files.json`, everything in `dist/en/` and `dist/local/` (assets included), `upload/`, `qa/source/originals/`, and the three originals `qa/source/monthly-ack.html`, `onetime-ack.resolved.html` and `annual-ack.resolved.html`. Its downloads go through the artifact's `downloads` capability, which is declared on the artifact.

## The deliverables

| File | What it is | Where it goes in EN |
| :-- | :-- | :-- |
| `dist/en/monthly-guardian-thank-you.html` | Guardian (monthly) thank-you | Donation page, Recurring Gift message, filtered to monthly |
| `dist/en/one-time-thank-you.html` | One-time gift thank-you | Donation page, Single Gift message |
| `dist/en/annual-membership-thank-you.html` | Annual membership thank-you | Donation page, Recurring Gift message, filtered to annual |
| `dist/en/en-template-import.json` | The EN email template | Marketing Tools, template import |
| `dist/en/en-blocks-import.json` | The block library (12 blocks plus the importer's 3 utility blocks) | Marketing Tools, block import |
| `upload/` | Every image and thumbnail the above reference | EN image library, ASPCA's folder |

Each autoresponder HTML is the whole email in one file: head CSS included, absolute EN image URLs, no scripts, compacted. Paste it into the autoresponder editor's HTML source view as-is.

The source emails branched in Twig on donation frequency. EN can't run that logic inside an autoresponder; a donation page sends a Single Gift message and a Recurring Gift message, each filterable by frequency. So the one-time/annual source became two pages.

## Layout

```
src/
  main.mjml                     the block catalog: EN template + block library
  autoresponders/
    monthly-guardian-thank-you.mjml
    one-time-thank-you.mjml
    annual-membership-thank-you.mjml
  styles.css                    shared stylesheet, included in every page head
  assets/                       every image, aspca- prefixed (EN folders are flat)
scripts/
  build.mjs                     src -> dist/local, dist/en, upload/
  export-en.mjs                 the real importer app, two passes -> dist/en/*.json, upload/ thumbnails
  check-sync.mjs                autoresponders vs catalog, dist and upload freshness, clientId
  qa-inert-audit.mjs            runs the importer's Test Center Inert Audit
  qa-render.mjs, qa-compare.py  QA screenshots, source vs port
  qa-resolve-source.py          resolves the source's Twig branches for comparison
  lib/                          config (account values, autoresponder list), compaction, importer driver,
                                file server, manifests (the preview page's JSON)
dist/                           GENERATED, never hand-edit
  local/                        MJML + compiled HTML, relative image paths (assets/...)
  en/                           MJML + compiled HTML, absolute EN image URLs; the JSON imports;
                                export-manifest.json (what was exported, for which account)
  files.json                    the preview page's file list
upload/                         GENERATED: images + importer thumbnails for EN's image library
qa/
  source/                       the two Springboard originals, plus resolved one-time/annual branches
  screenshots/                  source and port renders at 600px and 375px
index.html                      preview page (Claude artifact, GitHub Pages)
```

## Commands

Install once (Node 22, plus Playwright's Chromium for `export-en` and the QA scripts):

```bash
npm install
```

Build every page (also refreshes `upload/` images):

```bash
npm run build
```

Make the EN import JSON with the real importer app. Needs the private `email-to-en-marketing-tools` checkout beside this repo with its dependencies installed:

```bash
npm run export-en
```

Check that everything is in step (must print `0 warning(s)`):

```bash
npm run check-sync
```

Run the importer's Test Center Inert Audit over the catalog (every row must PASS; the full report lands in `qa/inert-audit-report.md`):

```bash
npm run inert-audit
```

Order after any change: build, export-en and inert-audit (when the catalog changed), check-sync.

The EN template imports named "Template"; rename it in EN after import.

## EN account values

All in `scripts/lib/config.mjs`, each overridable from the environment.

| Value | Used | Status |
| :-- | :-- | :-- |
| Client ID | `20014` | Inferred: every EN asset URL in the `engrid-aspca` repo uses the `/20014/` folder. Confirm. |
| Owner user ID | `999999` | **Placeholder.** The importer refuses an owner ID of 0, so this is a number no real user should hold. Replace before importing. |
| Folder ID | `0` | **Placeholder** (EN's root folder). Replace with ASPCA's Marketing Tools folder. |
| Image folder | `https://bd6ca9cefa6fb6e0adf1-c2f9aa1adb9f60a775f60074e4c86031.ssl.cf5.rackcdn.com/20014/` | Inferred from the same `engrid-aspca` URLs. The source emails' images live on aspca.org and Mailchimp, not EN, so they could not confirm it. |

To re-export with real values:

```bash
ASPCA_OWNED_BY=123 ASPCA_FOLDER_ID=456 npm run export-en
```

## Switching image paths

Source MJML always uses relative paths (`assets/aspca-…`). The build writes absolute URLs into `dist/en/` only. To point the generated files at a different EN image folder, rebuild with the new root instead of editing `dist/`:

```bash
ASPCA_ASSET_ROOT=https://example.ssl.cf5.rackcdn.com/12345/ npm run build
```

If you need to switch an already-generated file by hand (for example a copy pasted into EN), find and replace:

| From | To |
| :-- | :-- |
| relative, `src="assets/` | absolute, `src="https://bd6ca9cefa6fb6e0adf1-c2f9aa1adb9f60a775f60074e4c86031.ssl.cf5.rackcdn.com/20014/` |
| absolute, `https://bd6ca9cefa6fb6e0adf1-c2f9aa1adb9f60a775f60074e4c86031.ssl.cf5.rackcdn.com/20014/` | relative, `assets/` |
| one EN folder, `…rackcdn.com/20014/` | another, `…rackcdn.com/<folder>/` |

Every image sits directly in the folder (EN's image library is flat), so one replace covers every `src`. Upload everything in `upload/` to the target folder first.

## Keep in sync

**The rule: every block in an autoresponder is a catalog block.** Each START/END pair in `src/autoresponders/*.mjml` names a block in `src/main.mjml` (a trailing qualifier such as `(P.S.)` marks a second use of the same block). A page may differ from its catalog block only in values an editor could set in EN: copy, image src, link, alt text, image width, colors, paddings, divider weight, the Link Color class, and the trailing gap height. Change anything else (an element, a class, a data-* flag, a font size, an alignment) in the catalog block AND every page that uses it, in the same change. `npm run check-sync` enforces this and must print 0 warnings.

Also enforced: the `en-tools-config` comment and `mj-attributes` are byte-identical in every page, every page includes `styles.css`, `dist/` matches `src/`, `upload/` holds every file `dist/en` references, and every exported JSON entry carries the configured client ID.

The annual page is the one-time page with three differences (body copy, Donation Type line, title). Keep the two in step by hand.

## Merge tags

The sources used Springboard (Drupal) tokens. Each is replaced by the EN merge tag ASPCA's own EN receipts already use (`engrid-aspca/src/html/*-receipt.html`), or by EN's documented equivalent ([receipt data tags](https://knowledge.engagingnetworks.net/pages/receipt-data-tags)). **Every one needs a test send before go-live.**

| Springboard | EN | Note |
| :-- | :-- | :-- |
| `$[donation:amount]` | `{receipt_data~amount~[en1]}` | The `$` is dropped: ASPCA's and TPL's EN receipts print this tag bare, which suggests EN formats the currency itself. If a test send shows no `$`, put it back. |
| `[donation:first_name]`, `[donation:last_name]` | `{user_data~First Name}`, `{user_data~Last Name}` | As in ASPCA's EN receipts. |
| `[donation:address]`, `[donation:address_line_2]`, `[donation:city]`, `[donation:state]`, `[donation:zip]` | `{user_data~Address 1}`, `{user_data~Address 2}`, `{user_data~City}`, `{user_data~Region}`, `{user_data~Postcode}` | EN's standard field names. Not used in ASPCA's receipts, so unconfirmed for this account. An empty Address 2 leaves `123 Main St , City` (a stray space before the comma), exactly as the source did. |
| `[current-date:press_release]` | `{receipt_data~createdOn~[MMMM d, yyyy]}` | Now the donation date, not the send date. The format string is unverified (ASPCA's receipts use `[yyyy-MM-dd]`); fall back to that if it misrenders. |
| `[donation:payment_method]` | `{receipt_data~paymentType}` | As in ASPCA's EN receipts. |
| `[donation:commerce-payment-transaction:remote-id]` | `{receipt_data~txId}` | As in ASPCA's EN receipts. |
| Twig Donation Type (`recurs` / `sb_fs_quarterly` / `sb_fs_semi` / `sb_fs_annually` / else) | Fixed text per page: Monthly, One-time, Annual | Quarterly and semi-annual donors have no page; the source would have sent them the one-time copy with their frequency on the receipt line. |

## Design system

**Spacing scale** (declared in every page's `en-tools-config`, taken from the sources' own Mailchimp grid, not TPL's): None 0, Third 6, Half 9, Single 18, Double 36, Triple 54. Gutters: Full Bleed 0, Half 9, Single 18, Double 36. Content sits 18px in from the card edge. Paragraphs keep Mailchimp's 10px margins and are not trimmed at the first and last child; every gap was cut against them.

**Type table** (every size the emails ship; guide section 8, item 3a):

| Use | Size / line-height | Phone |
| :-- | :-- | :-- |
| Display heading (Guardian "More Ways to Take Action") | 30 / 45 bold | 18 / 27 (monthly page) |
| h1 heading | 26 / 33 bold | 22 / 28 (one-time, annual) |
| Body | 16 / 24 | 18 / 27 on the monthly page; 16 / 24 elsewhere |
| Boxed receipt (Guardian) | 14 / 21 | 18 / 27 (monthly page) |
| Receipt (one-time, annual) | 12 / 18 | 16 / 24 |
| Footer | 12 / 18 | 14 / 21 |
| Visible preheader line | 12 / 16 | 12 / 16 |

The phone sizes copy each source's Mailchimp "Mobile Styles", including the Guardian heading dropping to 18px (the source's ID rule overrode its inline 30px). Light mode only: neither source supported dark mode.

**Breakpoint** 480px, as in the sources.

## Thumbnails and the aspca- prefix

Every image in `src/assets` and `upload/` is `aspca-` prefixed. The importer names its thumbnails itself, `thumbnail-<block-slug>.png` plus `placeholder.png`, and has no prefix setting, so those files in `upload/` are unprefixed. `export-en` lists them.

## Open items

- Confirm the client ID, and supply the owner user ID and the Marketing Tools folder ID.
- Test-send each autoresponder and check every merge tag (table above), especially the amount's currency symbol and the date format.
- The one-time and annual pages show the preheader as a visible line (as the source did) and also carry `mj-preview` with the same copy, so inbox previews read it twice. Drop one of them.
- The Guardian email's Advocate for Animals tile links with the one-time tracking codes (`em_ack_onetime-202411`). Kept exactly; probably a copy-paste slip in the source.
- Footer copyright reads 2026 (as in the source). Update yearly.
