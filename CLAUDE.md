# Repo instructions: ASPCA EN Marketing Tools

ASPCA's EN donation thank-you emails in MJML: one block catalog (`src/main.mjml`) imported into EN Marketing Tools, and three standalone autoresponders (`src/autoresponders/`) built from the same blocks. README.md has the layout, commands and account values.

## Binding documents

Read both before changing any MJML, and treat them as binding:

- MJML Authoring Guide: https://raw.githubusercontent.com/4site-interactive-studios/tpl-en-marketing-tools/main/MJML-AUTHORING-GUIDE.md
- Conventions (the importer's contract): https://raw.githubusercontent.com/4site-interactive-studios/tpl-en-marketing-tools/main/CONVENTIONS.md

Both are mirrors of the private importer repo. If one is wrong for this repo, record the correct rule here and tell the user; never work around it silently.

## The sync rule (binding)

**Every block in an autoresponder is a catalog block, and the two stay in step.**

1. Each START/END pair in `src/autoresponders/*.mjml` names a block in `src/main.mjml`. A second use of a block in one page takes a trailing qualifier: `WYSIWYG Text (P.S.)`, `Heading (centered, take action)`.
2. A page may differ from its catalog block ONLY in values an editor can set in EN: copy, image src/alt/width, links, colors, paddings, divider weight, the `link-*` Link Color class, and the trailing gap height (a 0px gap is omitted from a page, as EN's "None" removes it).
3. Any other change (an element, a class, a data-* flag, a font size, an alignment, a new block) lands in the catalog AND every page that uses the block, in the same change.
4. `en-tools-config` and `mj-attributes` are byte-identical in every `src` page. Change them everywhere at once.
5. `npm run check-sync` enforces 1 to 4 plus generated-file freshness. It must print `check-sync: 0 warning(s)` before you report work as done.

The annual page is the one-time page with three differences (body copy, Donation Type line, title). Edit both together.

## Generated files

`dist/` and `upload/` are generated. Never hand-edit them. After any source change:

1. `npm run build` (must end `build: done, 0 warning(s)`)
2. When the catalog changed: `npm run export-en` (must end `done, 0 problem(s)`) and `npm run inert-audit` (must report 0 FAIL)
3. `npm run check-sync` (must print 0 warnings)
4. Run guide section 8's QA checklist and report what each check returned.

## The preview page

`index.html` reads `dist/files.json` and `dist/en/export-manifest.json`; never hard-code a file or email list in it. A new autoresponder needs an `AUTORESPONDERS` entry in `scripts/lib/config.mjs` (title, EN use, original). After a change that touches anything the page shows, republish the artifact as README "The preview page" describes; only the user can share it.

## Facts specific to this repo

- Spacing scale is the sources' Mailchimp grid, not TPL's: None 0, Third 6, Half 9, Single 18, Double 36, Triple 54. Paragraph margins stay at 10px and are NOT trimmed at first/last child (styles.css explains why). Do not add TPL's first/last-child trims without re-cutting every gap.
- Vertical rhythm (README "Design system"): 10px text to text, 18-19px around images, the signature and the grey panel, 27-28px around divider lines. Never use an empty paragraph or `<br>&nbsp;<br>` for space; split the copy into paragraphs and set the gap. Measure a change rather than eyeballing it.
- Breakpoint 480px. Light mode only; ask the user before adding dark mode.
- No mechanism CSS (no light/dark twins, no viewport forks), so there is no head-resident `data-en-tools-template-css` sheet. If you add a twin or a fork, add one to every page (guide 2c-bis).
- Phone type sizes are page-level rules in each autoresponder's `mj-style`, under the spaced condition `(max-width: 480px)`; styles.css's shared phone rules use `(max-width:480px)`. Keep the two strings distinct (guide section 8, item 6f).
- Every image is `aspca-` prefixed (EN's image folder is flat and shared). The importer's own thumbnail names (`thumbnail-*.png`, `placeholder.png`) cannot be prefixed.
- EN account values live in `scripts/lib/config.mjs`. Owner user ID (999999) and folder ID (0) are placeholders until ASPCA supplies them; the client ID (20014) and image folder are inferred from `engrid-aspca`.
- Merge tags are EN's (`{user_data~…}`, `{receipt_data~…}`). In MJML attributes write a raw `&` in URLs; inside `mj-text` HTML, `&amp;`.
- The importer is not ours to change. Report importer bugs to the user.

## Working rules

- Never commit or push unless asked. "Commit" means commit and push.
- After every commit, give the user the GitHub Pages link: https://4site-interactive-studios.github.io/aspca-en-marketing-tools/ (user request, 2026-11-16). Pages updates only once the commit is on GitHub `main`.
- Before committing: `git status -sb` must show a branch, not `HEAD (no branch)`. After pushing, `git ls-remote origin <branch>` must equal `git rev-parse HEAD`.
- When a step does not need the user's input, keep going. Stop and ask before anything destructive or visible outside this repo.
