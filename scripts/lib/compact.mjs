/**
 * Delivery compaction for the EN paste copies (dist/en/*.html), copied
 * VERBATIM from tpl-en-marketing-tools/scripts/emit-variants.mjs (TPL commit
 * dcbe714). TPL's emit-variants is itself a mirror of the importer's
 * compactEmailHtml (email-to-en-marketing-tools, src/core/compact.ts), so
 * the paste carries the same bytes an EN template built by the importer
 * would. KEEP IN STEP with TPL: when its copy changes, re-copy this section
 * rather than editing it here.
 *
 * Only render-inert bytes go: authoring prose comments, line indentation,
 * trailing blanks, blank-line runs and CSS comments. guard() re-parses both
 * copies on every build and returns the number of problems it found (it also
 * prints a WARN line per problem).
 */

/* ---------- delivery compaction ---------- */

/*
 * Mirror of the importer's compactEmailHtml (email-to-en-marketing-tools,
 * src/core/compact.ts — KEEP IN STEP, like applyInlineFluid in
 * restore-excluded.mjs). The app runs it on every import, so the EN
 * templates and blocks carry the same bytes this paste does.
 *
 * Removed: prose comments (the MJML's inline notes — EN delivers body
 * comments untouched, guide §2), line indentation and trailing blanks, and
 * blank-line runs (collapsed to one newline — no line is ever joined to
 * another). KEPT byte-for-byte: conditional comments (hidden AND revealed —
 * `<!--[if !mso]><!-->` is one complete comment to this scan), START:/END:
 * markers (check-catalog names blocks by them), `- Not Displayed` markers,
 * en-tools-keep, EVERY start tag (attribute values are never compacted), the
 * bodies of the raw-text/RCDATA elements and CDATA. The scan ends a comment
 * where an HTML tokenizer does: `-->`, `--!>`, or abruptly as `<!-->` /
 * `<!--->`.
 */
const HOLD = '\u0000';
const TAG_INNARDS = String.raw`(?:[^<>"']|"[^"]*"|'[^']*')*`;
const COMMENT_SRC = String.raw`<!--(?:>|->|[\s\S]*?--!?>)`;
const RAW_ELEMENTS = 'style|script|pre|textarea|title|xmp|iframe|noembed|noframes|noscript';
const OPAQUE_RE = new RegExp(
  [
    COMMENT_SRC,
    String.raw`<(${RAW_ELEMENTS})\b${TAG_INNARDS}>[\s\S]*?<\/\1\s*>`,
    String.raw`<!\[CDATA\[[\s\S]*?\]\]>`,
    String.raw`<[a-zA-Z][\w:.-]*${TAG_INNARDS}>`,
  ].join('|'),
  'gi',
);
const HELD_RE = new RegExp(`${HOLD}(\\d+)${HOLD}`, 'g');
const KEEP_COMMENT_RE =
  /^<!--\s*(?:\[if\b|<!\[endif\]|(?:START|END):|en-tools-keep\b)|- Not Displayed\s*--!?>$/i;
const HEAD_END_RE = /<\/head\s*>/i;
const EDGE_BLANKS_RE = /^[ \t]+|[ \t]+$/gm;
const BLANK_RUN_RE = /\n(?:[ \t]*\n)+/g;

const isProseComment = (c) => c.startsWith('<!--') && !KEEP_COMMENT_RE.test(c);

function dropProseComments(html, headAware) {
  const held = [];
  const masked = html.replace(OPAQUE_RE, (m) => `${HOLD}${held.push(m) - 1}${HOLD}`);
  const head = headAware ? HEAD_END_RE.exec(masked) : null;
  const from = head ? head.index : 0;
  // `a <!-- note --> b` keeps ONE space; `a<!-- x -->b` never had one.
  let out = masked.slice(0, from);
  let pos = from;
  HELD_RE.lastIndex = from;
  for (let m = HELD_RE.exec(masked); m; m = HELD_RE.exec(masked)) {
    if (!isProseComment(held[Number(m[1])])) continue;
    out += masked.slice(pos, m.index);
    pos = m.index + m[0].length;
    if (/[ \t]$/.test(out)) while (masked[pos] === ' ' || masked[pos] === '\t') pos += 1;
    HELD_RE.lastIndex = pos;
  }
  return { text: out + masked.slice(pos), held };
}

const restoreHeld = (text, held) => text.replace(HELD_RE, (_, i) => held[Number(i)]);

/**
 * The app's compactEmailHtml leaves head COMMENTS to its stripHeadComments;
 * the paste has no importer, so `headAware: false` takes the head's prose
 * (en-tools-config, the VIEWPORT FORK notes, …) with the rest. The
 * en-tools-keep stamp stays, as it does in the app.
 */
export function compactEmailHtml(html, { headAware = true } = {}) {
  const { text, held } = dropProseComments(html, headAware);
  return restoreHeld(text.replace(EDGE_BLANKS_RE, '').replace(BLANK_RUN_RE, '\n'), held);
}

/**
 * Walk a stylesheet the way a CSS tokenizer does — quoted strings and
 * unquoted url() are opaque (a `/*` inside either is content) — handing each
 * comment to `onComment(textSoFar, comment, nextChar)` for its replacement.
 */
function mapCssComments(css, onComment) {
  let out = '';
  for (let i = 0; i < css.length; ) {
    const c = css[i];
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < css.length && css[j] !== c && css[j] !== '\n') j += css[j] === '\\' ? 2 : 1;
      out += css.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    if ((c === 'u' || c === 'U') && !/[\w-]$/.test(out) && /^url\(\s*[^\s"')]/i.test(css.slice(i, i + 64))) {
      const close = css.indexOf(')', i);
      const end = close === -1 ? css.length : close + 1;
      out += css.slice(i, end);
      i = end;
      continue;
    }
    if (c === '/' && css[i + 1] === '*') {
      const close = css.indexOf('*/', i + 2);
      const end = close === -1 ? css.length : close + 2;
      out += onComment(out, css.slice(i, end), css.slice(end, end + 1));
      i = end;
      continue;
    }
    out += c;
    i += 1;
  }
  return out;
}

/**
 * A comment only separates tokens, so deleting it is safe exactly when white
 * space or a `{ } ; ,` (which never fuse with a neighbour) already sits on one
 * side. Anywhere else (`and/**` + `/(`, `1/**` + `/.5em`) it is KEPT and
 * counted — deleting it could mint a new token.
 */
const CSS_SEPARATOR = /[\s{};,]/;
const cssCommentRemovable = (before, next) =>
  before === '' || CSS_SEPARATOR.test(before.slice(-1)) || next === '' || CSS_SEPARATOR.test(next);

/**
 * CSS comments, line indentation and blank lines out of one stylesheet.
 * Nothing else moves: at-rule preludes keep their exact text (EN merges
 * @media blocks by condition STRING — guide §2a), declarations and
 * ` !important` keep their spacing. EN strips CSS comments at send anyway
 * (guide §2), so this costs the delivered email nothing; it trims the paste
 * (about a quarter of an autoresponder, ~5% of the catalog).
 */
function compactCss(css) {
  let kept = 0;
  const out = mapCssComments(css, (before, comment, next) => {
    if (cssCommentRemovable(before, next)) return '';
    kept += 1;
    return comment;
  });
  return { css: out.replace(EDGE_BLANKS_RE, '').replace(/\n{2,}/g, '\n'), kept };
}

/** Every stylesheet OUTSIDE a comment (conditional-comment sheets stay verbatim) */
function compactStyles(html) {
  let kept = 0;
  const out = html.replace(
    new RegExp(`${COMMENT_SRC}|(<style\\b${TAG_INNARDS}>)([\\s\\S]*?)(<\\/style\\s*>)`, 'gi'),
    (m, open, body, close) => {
      if (!open) return m;
      const r = compactCss(body);
      kept += r.kept;
      return open + r.css + close;
    },
  );
  return { html: out, kept };
}

export function compactLive(html) {
  const { html: styled, kept } = compactStyles(html);
  return { html: compactEmailHtml(styled, { headAware: false }), kept };
}

/* ---------- the guard: prove the compaction render-inert, every build ---------- */

/*
 * Deliberately NOT built on the compactor's own shortcuts: it normalises only
 * what a client ignores (white space runs collapse to one space; a CSS
 * comment is a token separator; white space around `{ } ; ,` is nothing), so
 * a compactor mistake — joined words, a swallowed element, a fused CSS token —
 * shows up as a difference instead of agreeing with itself.
 */
function parts(html) {
  const re = new RegExp(
    [
      COMMENT_SRC,
      String.raw`<(${RAW_ELEMENTS})\b${TAG_INNARDS}>[\s\S]*?<\/\1\s*>`,
      String.raw`<!\[CDATA\[[\s\S]*?\]\]>`,
      String.raw`<\/?[a-zA-Z][\w:.-]*${TAG_INNARDS}>`,
      String.raw`<!doctype[^>]*>`,
    ].join('|'),
    'gi',
  );
  const tags = [];
  const comments = [];
  const sheets = [];
  const raw = [];
  let text = '';
  let pos = 0;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    text += html.slice(pos, m.index);
    pos = m.index + m[0].length;
    const t = m[0];
    if (t.startsWith('<!--')) {
      comments.push(t);
      continue;
    }
    if (m[1]) {
      const open = t.slice(0, t.indexOf('>') + 1);
      const body = t.slice(open.length, t.lastIndexOf('<'));
      tags.push(open);
      if (m[1].toLowerCase() === 'style') sheets.push(body);
      else raw.push(body);
    } else tags.push(t);
    text += '§TAG§';
  }
  text += html.slice(pos);
  return { tags, comments, sheets, raw, text: text.replace(/\s+/g, ' ').trim() };
}

/** CSS as a client tokenizes it: comments separate, white space runs collapse */
const cssShape = (css) =>
  mapCssComments(css, () => ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};,])\s*/g, '$1')
    .trim();

export function guard(page, before, after) {
  const a = parts(before);
  const b = parts(after);
  const problems = [];
  const firstDiff = (x, y) => {
    for (let i = 0; i < Math.max(x.length, y.length); i += 1) if (x[i] !== y[i]) return i;
    return -1;
  };
  let i = firstDiff(a.tags, b.tags);
  if (i !== -1) problems.push(`tag #${i} differs: ${JSON.stringify(a.tags[i])} -> ${JSON.stringify(b.tags[i])}`);
  if (a.text !== b.text) {
    i = firstDiff(a.text, b.text);
    problems.push(`text differs at ${i}: ${JSON.stringify(a.text.slice(i, i + 60))} -> ${JSON.stringify(b.text.slice(i, i + 60))}`);
  }
  const kept = a.comments.filter((c) => !isProseComment(c));
  i = firstDiff(kept, b.comments);
  if (i !== -1) problems.push(`kept comment #${i} differs: ${JSON.stringify((kept[i] || '').slice(0, 80))}`);
  const cond = (list) => list.filter((c) => /^<!--\s*(?:\[if|<!\[endif)/i.test(c)).length;
  if (cond(a.comments) !== cond(b.comments)) problems.push(`conditional comments ${cond(a.comments)} -> ${cond(b.comments)}`);
  i = firstDiff(a.sheets.map(cssShape), b.sheets.map(cssShape));
  if (i !== -1) problems.push(`stylesheet #${i} parses differently`);
  i = firstDiff(a.raw, b.raw);
  if (i !== -1) problems.push(`raw-text body #${i} (pre/textarea/title/…) differs`);
  const longest = (h) => Math.max(...h.split('\n').map((l) => Buffer.byteLength(l)));
  if (longest(after) > longest(before)) problems.push(`a line grew: longest ${longest(before)} -> ${longest(after)} bytes`);
  for (const p of problems) console.log(`variants: WARN ${page} compaction is not render-inert — ${p}`);
  return problems.length;
}
