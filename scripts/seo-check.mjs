import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SERVICE_PAGES = new Set(['404.html', '_not-found/index.html']);
const SKIP_DIRS = new Set(['node_modules', '_next']);

function walk(dir, rel = '') {
  const out = [];
  for (const e of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
    if (e.name.startsWith('.') || SKIP_DIRS.has(e.name)) continue;
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...walk(dir, r));
    else if (e.isFile() && e.name.toLowerCase().endsWith('.html')) out.push(r);
  }
  return out.sort();
}

function strip(html) {
  return html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '');
}

function attrs(tag) {
  const out = Object.create(null);
  const re = /([^\s=\/>'"]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  for (const m of tag.replace(/^<\w+/, '').matchAll(re)) {
    const k = m[1].toLowerCase();
    if (!(k in out)) out[k] = (m[2] ?? m[3] ?? m[4] ?? '').trim();
  }
  return out;
}

const tagsOf = (html, name) => (html.match(new RegExp(`<${name}\\b[^>]*>`, 'gi')) || []).map(attrs);
const textsOf = (html, name) =>
  [...html.matchAll(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`, 'gi'))].map((m) =>
    m[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  );

function tokens(values) {
  const t = new Set();
  for (const v of values) {
    for (const p of v.toLowerCase().split(',')) {
      const s = p.trim();
      if (s) t.add(s);
    }
  }
  if (t.has('none')) {
    t.add('noindex');
    t.add('nofollow');
  }
  return t;
}

function conflicts(t) {
  const c = [];
  if (t.has('index') && t.has('noindex')) c.push('index/noindex');
  if (t.has('follow') && t.has('nofollow')) c.push('follow/nofollow');
  return c;
}

function pageUrlPath(rel) {
  const isIndex = rel === 'index.html' || rel.endsWith('/index.html');
  const p = isIndex ? rel.slice(0, -'index.html'.length) : rel;
  return '/' + p.split('/').map(encodeURIComponent).join('/');
}

// First <meta http-equiv=refresh> with a target; null when absent or unparsable.
function parseRefresh(metas) {
  const tag = metas.find((m) => (m['http-equiv'] || '').toLowerCase() === 'refresh');
  if (!tag) return null;
  const m = /^\s*(\d+(?:\.\d+)?)\s*(?:[;,]\s*(?:url\s*=\s*)?(?:"([^"]*)"|'([^']*)'|(.*?)))?\s*$/i.exec(tag.content || '');
  if (!m) return null;
  const target = (m[2] ?? m[3] ?? m[4] ?? '').trim();
  if (!target) return null;
  return { delay: Number(m[1]), target };
}

// Legacy redirect stub: noindex + immediate meta refresh. Returns null when the page is not a
// stub candidate, otherwise { target, problems }. Caller must only pass noindex pages.
function evalStub({ metas, links, pageUrl, origin }) {
  const r = parseRefresh(metas);
  if (!r || r.delay !== 0) return null;
  const problems = [];
  let target = null;
  try {
    target = new URL(r.target, pageUrl);
    if (!/^https?:$/.test(target.protocol)) throw new Error('scheme');
  } catch {
    target = null;
    problems.push(`redirect stub target is not a valid URL: ${r.target}`);
  }
  if (target) {
    if (origin && target.origin !== origin) problems.push(`redirect stub target is external: ${r.target}`);
    if (target.search || target.hash) problems.push(`redirect stub target has query or fragment: ${r.target}`);
    if (target.pathname === pageUrl.pathname) problems.push('redirect stub target is the page itself');
  }
  if (links.length !== 1) problems.push('redirect stub requires exactly one canonical link');
  else if (target) {
    const raw = links[0].href || '';
    let c = null;
    try {
      if (/^https?:\/\//i.test(raw)) c = new URL(raw);
    } catch {
      c = null;
    }
    if (!c || c.href !== target.href) {
      problems.push(`redirect stub canonical does not match refresh target: ${raw} vs ${r.target}`);
    }
  }
  return { target, problems };
}

export function checkSite({ root = '.', siteUrl } = {}) {
  const errors = [];
  const warnings = [];
  const err = (f, m) => errors.push(`${f}: ${m}`);
  const warn = (f, m) => warnings.push(`${f}: ${m}`);
  let files;
  try {
    files = walk(root);
  } catch (e) {
    err(root, `cannot read directory: ${e.message}`);
    return { errors, warnings, pages: 0 };
  }

  // sitemap.xml
  const locs = [];
  let smOk = false;
  try {
    const xml = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
    smOk = true;
    const blocks = [...xml.matchAll(/<url\b[^>]*>([\s\S]*?)<\/url>/gi)].map((m) => m[1]);
    if (!blocks.length) err('sitemap.xml', 'sitemap has no <url> entries');
    for (const b of blocks) {
      const m = /<loc>\s*([^<]*?)\s*<\/loc>/i.exec(b);
      if (!m || !m[1]) err('sitemap.xml', 'sitemap <url> without <loc>');
      else locs.push(m[1].replace(/&amp;/g, '&'));
    }
  } catch (e) {
    err('sitemap.xml', `sitemap.xml unreadable: ${e.code || e.message}`);
  }

  let origin = null;
  const candidate = siteUrl || locs.find((l) => /^https?:\/\//i.test(l));
  if (candidate) {
    try {
      origin = new URL(candidate).origin;
    } catch {
      err('site', `invalid site URL: ${candidate}`);
    }
  } else {
    err('site', 'cannot determine site URL (pass --site)');
  }

  const sm = new Map();
  const seen = new Set();
  for (const loc of locs) {
    let u;
    try {
      if (!/^https?:\/\//i.test(loc)) throw new Error('relative');
      u = new URL(loc);
    } catch {
      err('sitemap.xml', `invalid sitemap URL: ${loc}`);
      continue;
    }
    if (origin && u.origin !== origin) err('sitemap.xml', `sitemap URL origin mismatch: ${loc}`);
    if (seen.has(u.href)) err('sitemap.xml', `duplicate sitemap URL: ${loc}`);
    seen.add(u.href);
    sm.set(u.pathname, loc);
  }

  // pages
  const base = origin || 'http://site.invalid';
  const baseOrigin = new URL(base).origin;
  const titles = new Map();
  const pageInfo = new Map();
  const stubs = [];
  for (const rel of files) {
    const service = SERVICE_PAGES.has(rel);
    let html;
    try {
      html = strip(fs.readFileSync(path.join(root, rel), 'utf8'));
    } catch (e) {
      err(rel, `unreadable: ${e.code || e.message}`);
      continue;
    }
    const pageUrl = new URL(pageUrlPath(rel), base);
    const pathname = pageUrl.pathname;

    const metas = tagsOf(html, 'meta');
    const named = (n) => metas.filter((m) => (m.name || '').toLowerCase() === n).map((m) => m.content || '');
    const robotsVals = named('robots');
    const general = tokens(robotsVals);
    let noindex = general.has('noindex');
    if (!robotsVals.length) err(rel, 'missing meta robots');
    else if (robotsVals.some((v) => !v.trim())) err(rel, 'empty meta robots');
    const bad = conflicts(general);
    if (bad.length) err(rel, `conflicting robots directives: ${bad.join(', ')}`);
    for (const bot of ['googlebot', 'yandex', 'bingbot']) {
      const bv = named(bot);
      if (!bv.length) continue;
      const bt = tokens(bv);
      const bb = conflicts(bt);
      if (bb.length) err(rel, `conflicting robots directives in ${bot}: ${bb.join(', ')}`);
      if (bt.has('noindex')) {
        noindex = true;
        if (robotsVals.length && !general.has('noindex')) {
          err(rel, `conflicting robots directives: ${bot} noindex vs robots index`);
        }
      } else if (general.has('noindex') && bt.has('index')) {
        err(rel, `conflicting robots directives: ${bot} index vs robots noindex`);
      }
    }

    const info = { service, noindex, selfCanonical: false };
    pageInfo.set(pathname, info);

    const links = tagsOf(html, 'link').filter((l) => (l.rel || '').toLowerCase().split(/\s+/).includes('canonical'));

    const stub = !service && noindex ? evalStub({ metas, links, pageUrl, origin }) : null;
    if (stub) for (const p of stub.problems) err(rel, p);
    const isStub = !!stub && !stub.problems.length;
    if (isStub) stubs.push({ rel, dest: stub.target.pathname });

    const ts = textsOf(html, 'title');
    if (!ts.length) err(rel, 'missing <title>');
    else {
      if (ts.length > 1) {
        if (service && noindex && !sm.has(pathname)) warn(rel, 'multiple <title> tags');
        else err(rel, 'multiple <title> tags');
      }
      if (!ts[0]) err(rel, 'empty <title>');
      else if (!service && !isStub) {
        const list = titles.get(ts[0]) ?? [];
        list.push(rel);
        titles.set(ts[0], list);
      }
    }

    if (!isStub) {
      const hs = textsOf(html, 'h1');
      if (!hs.length) err(rel, 'missing <h1>');
      else {
        if (hs.length > 1) err(rel, 'multiple <h1> tags');
        if (hs.some((h) => !h)) err(rel, 'empty <h1>');
      }
    }

    if (service) {
      if (!noindex) err(rel, 'service page requires noindex robots meta');
      if (sm.has(pathname)) err(rel, 'service page listed in sitemap');
      continue;
    }

    if (!links.length) {
      if (!noindex) err(rel, 'missing canonical');
    } else {
      if (links.length > 1) err(rel, 'multiple canonical links');
      const href = links[0].href || '';
      if (!href) err(rel, 'empty canonical');
      else if (!/^https?:\/\//i.test(href)) err(rel, `canonical not absolute URL: ${href}`);
      else {
        let u = null;
        try {
          u = new URL(href);
        } catch {
          err(rel, `canonical not absolute URL: ${href}`);
        }
        if (u) {
          if (origin && u.origin !== origin) err(rel, `canonical origin mismatch: ${href}`);
          if (u.pathname !== pathname && !isStub) err(rel, `canonical path mismatch: ${href} vs ${pathname}`);
          if (u.search || u.hash) err(rel, `canonical has query or fragment: ${href}`);
          info.selfCanonical =
            links.length === 1 && u.origin === baseOrigin && u.pathname === pathname && !u.search && !u.hash;
        }
      }
    }

    if (smOk) {
      if (noindex && sm.has(pathname)) err(rel, 'noindex page listed in sitemap');
      if (!noindex && !sm.has(pathname)) err(rel, 'indexable page missing from sitemap');
    }
  }

  for (const [t, list] of titles) {
    if (list.length > 1) err(list.join(', '), `duplicate title: ${t}`);
  }

  for (const { rel, dest } of stubs) {
    const d = pageInfo.get(dest);
    if (!d) {
      err(rel, `redirect stub destination has no page: ${dest}`);
      continue;
    }
    if (d.service || d.noindex) err(rel, `redirect stub destination is not indexable: ${dest}`);
    if (!d.selfCanonical) err(rel, `redirect stub destination is not self-canonical: ${dest}`);
    if (smOk && !sm.has(dest)) err(rel, `redirect stub destination missing from sitemap: ${dest}`);
  }

  if (smOk) {
    for (const [p, loc] of sm) {
      if (!pageInfo.has(p)) err('sitemap.xml', `sitemap URL has no page (404): ${loc}`);
    }
  }
  return { errors, warnings, pages: files.length };
}

export function main(argv, out = console) {
  let root = '.';
  let site;
  const args = [...argv];
  while (args.length) {
    const a = args.shift();
    if (a === '--site') {
      site = args.shift();
      if (!site) {
        out.error('--site requires a value');
        return 2;
      }
    } else if (a.startsWith('--site=')) {
      site = a.slice(7);
      if (!site) {
        out.error('--site requires a value');
        return 2;
      }
    } else if (a.startsWith('-')) {
      out.error(`unknown option: ${a}\nusage: seo-check.mjs [root] [--site https://example.com]`);
      return 2;
    } else root = a;
  }
  if (site !== undefined) {
    try {
      if (!/^https?:$/.test(new URL(site).protocol)) throw new Error('scheme');
    } catch {
      out.error(`invalid --site URL: ${site}`);
      return 2;
    }
  }
  try {
    if (!fs.statSync(root).isDirectory()) throw new Error('not a directory');
  } catch (e) {
    out.error(`cannot use root ${root}: ${e.message}`);
    return 2;
  }
  const { errors, warnings, pages } = checkSite({ root, siteUrl: site });
  const warnOut = (out.warn || out.error).bind(out);
  if (warnings.length) warnOut(warnings.map((w) => `WARN ${w}`).join('\n'));
  if (errors.length) {
    out.error(errors.map((e) => `FAIL ${e}`).join('\n'));
    out.error(`${errors.length} problem(s) in ${pages} page(s)`);
    return 1;
  }
  out.log(`OK: ${pages} page(s) checked${warnings.length ? `, ${warnings.length} warning(s)` : ''}`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
