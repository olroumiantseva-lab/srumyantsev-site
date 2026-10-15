import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { checkSite } from '../scripts/seo-check.mjs';

const SITE = 'https://example.test';
const SCRIPT = fileURLToPath(new URL('../scripts/seo-check.mjs', import.meta.url));

const page = ({ title = 'Title', h1 = 'Heading', robots = 'index, follow', canonical, extra = '' } = {}) =>
  `<!doctype html><html><head><meta charset='utf-8'>` +
  (title === null ? '' : `<title>${title}</title>`) +
  (robots === null ? '' : `<meta name='robots' content='${robots}'>`) +
  (canonical ? `<link rel='canonical' href='${canonical}'>` : '') +
  extra +
  `</head><body>` +
  (h1 === null ? '' : `<h1>${h1}</h1>`) +
  `</body></html>`;

const svc = (o = {}) => page({ title: '404', robots: 'noindex, follow', ...o });

// legacy redirect stub: noindex, immediate meta refresh, canonical = refresh target, no h1
const stub = (target, o = {}) =>
  page({
    title: 'Old',
    h1: null,
    robots: 'noindex, follow',
    canonical: target,
    extra: `<meta http-equiv='refresh' content='0; url=${target}'>`,
    ...o,
  });

const sitemap = (...paths) =>
  `<?xml version='1.0'?><urlset xmlns='http://www.sitemaps.org/schemas/sitemap/0.9'>` +
  paths.map((p) => `<url><loc>${p.startsWith('http') ? p : SITE + p}</loc></url>`).join('') +
  `</urlset>`;

const valid = () => ({
  'index.html': page({ title: 'Home', canonical: SITE + '/' }),
  'about/index.html': page({ title: 'About', canonical: SITE + '/about/' }),
  '404.html': svc(),
  '_not-found/index.html': svc(),
  'sitemap.xml': sitemap('/', '/about/'),
});

const mk = (files) => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'seo-'));
  for (const [f, c] of Object.entries(files)) {
    if (c === null) continue;
    const p = path.join(d, f);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, c);
  }
  return d;
};

const run = (over = {}) => checkSite({ root: mk({ ...valid(), ...over }), siteUrl: SITE });
const has = (r, s) => assert.ok(r.errors.some((e) => e.includes(s)), `expected '${s}' in ${JSON.stringify(r.errors)}`);
const hasNot = (r, s) => assert.ok(!r.errors.some((e) => e.includes(s)), `unexpected '${s}' in ${JSON.stringify(r.errors)}`);
const hasWarn = (r, s) =>
  assert.ok(r.warnings.some((w) => w.includes(s)), `expected warning '${s}' in ${JSON.stringify(r.warnings)}`);

test('valid fixture has no errors', () => {
  const r = run();
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, []);
});

test('sitemap image:loc entries are not treated as page URLs', () => {
  const xml =
    `<urlset><url><loc>${SITE}/</loc><image:image><image:loc>${SITE}/x.webp</image:loc></image:image></url>` +
    `<url><loc>${SITE}/about/</loc></url></urlset>`;
  assert.deepEqual(run({ 'sitemap.xml': xml }).errors, []);
});

test('title: missing, empty, multiple, duplicate', () => {
  has(run({ 'about/index.html': page({ title: null, canonical: SITE + '/about/' }) }), 'missing <title>');
  has(run({ 'about/index.html': page({ title: '  ', canonical: SITE + '/about/' }) }), 'empty <title>');
  has(
    run({ 'about/index.html': page({ canonical: SITE + '/about/', extra: '<title>x</title>' }) }),
    'multiple <title>'
  );
  has(run({ 'about/index.html': page({ title: 'Home', canonical: SITE + '/about/' }) }), 'duplicate title');
});

test('h1: missing, empty, multiple', () => {
  const c = SITE + '/about/';
  has(run({ 'about/index.html': page({ title: 'About', h1: null, canonical: c }) }), 'missing <h1>');
  has(run({ 'about/index.html': page({ title: 'About', h1: '', canonical: c }) }), 'empty <h1>');
  has(run({ 'about/index.html': page({ title: 'About', h1: 'A</h1><h1>B', canonical: c }) }), 'multiple <h1>');
});

test('robots: missing and conflicts', () => {
  const c = SITE + '/about/';
  has(run({ 'about/index.html': page({ title: 'About', robots: null, canonical: c }) }), 'missing meta robots');
  has(
    run({ 'about/index.html': page({ title: 'About', robots: 'index, noindex', canonical: c }) }),
    'conflicting robots directives'
  );
  has(
    run({ 'about/index.html': page({ title: 'About', robots: 'follow, nofollow', canonical: c }) }),
    'conflicting robots directives'
  );
  has(
    run({
      'about/index.html': page({
        title: 'About',
        canonical: c,
        extra: `<meta name='googlebot' content='noindex'>`,
      }),
    }),
    'conflicting robots directives'
  );
});

test('canonical: missing, empty, relative, origin, path, multiple', () => {
  const p = (o) => ({ 'about/index.html': page({ title: 'About', ...o }) });
  has(run(p({})), 'missing canonical');
  has(run(p({ extra: `<link rel='canonical' href=''>` })), 'empty canonical');
  has(run(p({ canonical: '/about/' })), 'canonical not absolute');
  has(run(p({ canonical: 'https://other.test/about/' })), 'canonical origin mismatch');
  has(run(p({ canonical: SITE + '/other/' })), 'canonical path mismatch');
  has(
    run(p({ canonical: SITE + '/about/', extra: `<link rel='canonical' href='${SITE}/about/'>` })),
    'multiple canonical'
  );
});

test('noindex pages: no canonical needed, must stay out of sitemap', () => {
  const noidx = { 'about/index.html': page({ title: 'About', robots: 'noindex, follow' }) };
  assert.deepEqual(run({ ...noidx, 'sitemap.xml': sitemap('/') }).errors, []);
  has(run(noidx), 'noindex page listed in sitemap');
  const none = { 'about/index.html': page({ title: 'About', robots: 'none' }) };
  has(run(none), 'noindex page listed in sitemap');
});

test('noindex page without refresh still needs h1 and self canonical (not treated as redirect)', () => {
  const noidx = (o) => ({
    'about/index.html': page({ title: 'About', robots: 'noindex, follow', ...o }),
    'sitemap.xml': sitemap('/'),
  });
  has(run(noidx({ h1: null })), 'missing <h1>');
  has(run(noidx({ canonical: SITE + '/other/' })), 'canonical path mismatch');
});

test('sitemap: missing, empty, duplicate, membership, invalid, origin, 404 url', () => {
  has(run({ 'sitemap.xml': null }), 'sitemap.xml unreadable');
  has(run({ 'sitemap.xml': sitemap() }), 'sitemap has no <url>');
  has(run({ 'sitemap.xml': sitemap('/', '/about/', '/about/') }), 'duplicate sitemap URL');
  has(run({ 'sitemap.xml': sitemap('/') }), 'indexable page missing from sitemap');
  has(
    run({ 'sitemap.xml': `<urlset><url><loc>/about/</loc></url><url><loc>${SITE}/</loc></url></urlset>` }),
    'invalid sitemap URL'
  );
  has(run({ 'sitemap.xml': sitemap('/', 'https://other.test/about/') }), 'sitemap URL origin mismatch');
  has(run({ 'sitemap.xml': sitemap('/', '/about/', '/gone/') }), 'sitemap URL has no page');
});

test('indexable /cases/ page: listed ok, missing from sitemap is blocking error', () => {
  const cases = { 'cases/index.html': page({ title: 'Cases', canonical: SITE + '/cases/' }) };
  assert.deepEqual(run({ ...cases, 'sitemap.xml': sitemap('/', '/about/', '/cases/') }).errors, []);
  const r = run(cases);
  has(r, 'cases/index.html: indexable page missing from sitemap');
});

for (const [file, url] of [
  ['404.html', '/404.html'],
  ['_not-found/index.html', '/_not-found/'],
]) {
  test(`service page ${file}: exempt from canonical/unique title`, () => {
    assert.deepEqual(run({ [file]: svc({ title: 'Home' }) }).errors, []);
  });
  test(`service page ${file}: requires noindex`, () => {
    has(run({ [file]: svc({ robots: 'index, follow' }) }), 'service page requires noindex');
    has(run({ [file]: svc({ robots: null }) }), 'service page requires noindex');
  });
  test(`service page ${file}: excluded from sitemap`, () => {
    has(run({ 'sitemap.xml': sitemap('/', '/about/', url) }), 'service page listed in sitemap');
  });
  test(`service page ${file}: multiple titles is warning when noindex and not in sitemap`, () => {
    const r = run({ [file]: svc({ extra: '<title>second</title>' }) });
    assert.deepEqual(r.errors, []);
    hasWarn(r, 'multiple <title>');
  });
  test(`service page ${file}: multiple titles stays error when indexable`, () => {
    const r = run({ [file]: svc({ robots: 'index, follow', extra: '<title>second</title>' }) });
    has(r, 'multiple <title>');
    has(r, 'service page requires noindex');
  });
  test(`service page ${file}: multiple titles stays error when listed in sitemap`, () => {
    const r = run({ [file]: svc({ extra: '<title>second</title>' }), 'sitemap.xml': sitemap('/', '/about/', url) });
    has(r, 'multiple <title>');
    has(r, 'service page listed in sitemap');
  });
  test(`service page ${file}: other checks still blocking with multiple titles`, () => {
    const r = run({ [file]: svc({ title: '', extra: '<title>second</title>' }) });
    has(r, 'empty <title>');
    hasWarn(r, 'multiple <title>');
  });
}

test('non-service noindex page with multiple titles stays an error', () => {
  const r = run({
    'about/index.html': page({ title: 'About', robots: 'noindex, follow', extra: '<title>x</title>' }),
    'sitemap.xml': sitemap('/'),
  });
  has(r, 'multiple <title>');
  assert.deepEqual(r.warnings, []);
});

test('redirect stub: valid stub passes without h1 or self canonical', () => {
  const r = run({ 'old/index.html': stub(SITE + '/about/') });
  assert.deepEqual(r.errors, []);
});

test('redirect stub: relative refresh target equal to canonical passes', () => {
  const r = run({
    'old/index.html': stub(SITE + '/about/', {
      extra: `<meta http-equiv='Refresh' content='0;URL=/about/'>`,
    }),
  });
  assert.deepEqual(r.errors, []);
});

test('redirect stub: title shared with destination is not a duplicate', () => {
  const r = run({ 'old/index.html': stub(SITE + '/about/', { title: 'About' }) });
  assert.deepEqual(r.errors, []);
});

test('redirect stub: external target rejected', () => {
  const t = 'https://evil.test/about/';
  const r = run({ 'old/index.html': stub(t) });
  has(r, 'redirect stub target is external');
  has(r, 'missing <h1>');
});

test('redirect stub: invalid target URL rejected', () => {
  const r = run({
    'old/index.html': stub(SITE + '/about/', { extra: `<meta http-equiv='refresh' content='0; url=http://'>` }),
  });
  has(r, 'redirect stub target is not a valid URL');
  has(r, 'missing <h1>');
});

test('redirect stub: non-http scheme rejected', () => {
  const r = run({
    'old/index.html': stub(SITE + '/about/', { extra: `<meta http-equiv='refresh' content='0; url=javascript:alert(1)'>` }),
  });
  has(r, 'redirect stub target is not a valid URL');
});

test('redirect stub: canonical differing from refresh target rejected', () => {
  const r = run({
    'old/index.html': stub(SITE + '/about/', { canonical: SITE + '/' }),
  });
  has(r, 'redirect stub canonical does not match refresh target');
  has(r, 'missing <h1>');
});

test('redirect stub: missing canonical rejected', () => {
  const r = run({ 'old/index.html': stub(SITE + '/about/', { canonical: null }) });
  has(r, 'redirect stub requires exactly one canonical');
});

test('redirect stub: listed in sitemap rejected', () => {
  const r = run({ 'old/index.html': stub(SITE + '/about/'), 'sitemap.xml': sitemap('/', '/about/', '/old/') });
  has(r, 'noindex page listed in sitemap');
});

test('redirect stub: delayed refresh is not a stub', () => {
  const r = run({
    'old/index.html': stub(SITE + '/about/', { extra: `<meta http-equiv='refresh' content='5; url=${SITE}/about/'>` }),
  });
  has(r, 'missing <h1>');
  has(r, 'canonical path mismatch');
});

test('redirect stub: indexable page with refresh is not exempt', () => {
  const r = run({
    'old/index.html': stub(SITE + '/about/', { robots: 'index, follow' }),
    'sitemap.xml': sitemap('/', '/about/', '/old/'),
  });
  has(r, 'missing <h1>');
  has(r, 'canonical path mismatch');
});

test('redirect stub: destination must exist', () => {
  const r = run({ 'old/index.html': stub(SITE + '/gone/') });
  has(r, 'redirect stub destination has no page');
});

test('redirect stub: destination must be indexable', () => {
  const r = run({
    'about/index.html': page({ title: 'About', robots: 'noindex, follow', canonical: SITE + '/about/' }),
    'old/index.html': stub(SITE + '/about/'),
    'sitemap.xml': sitemap('/'),
  });
  has(r, 'redirect stub destination is not indexable');
});

test('redirect stub: destination must be self canonical', () => {
  const r = run({
    'about/index.html': page({ title: 'About', canonical: SITE + '/' }),
    'old/index.html': stub(SITE + '/about/'),
  });
  has(r, 'redirect stub destination is not self-canonical');
});

test('redirect stub: destination must be in sitemap', () => {
  const r = run({ 'old/index.html': stub(SITE + '/about/'), 'sitemap.xml': sitemap('/') });
  has(r, 'redirect stub destination missing from sitemap');
});

test('redirect stub: destination cannot be another stub', () => {
  const r = run({
    'old/index.html': stub(SITE + '/older/'),
    'older/index.html': stub(SITE + '/about/'),
  });
  has(r, 'redirect stub destination is not indexable');
});

test('CLI exit status', () => {
  const cli = (...a) => spawnSync(process.execPath, [SCRIPT, ...a], { encoding: 'utf8' });
  assert.equal(cli(mk(valid()), '--site', SITE).status, 0);
  assert.equal(cli(mk(valid()), `--site=${SITE}`).status, 0);
  const bad = { ...valid(), 'about/index.html': page({ title: null, canonical: SITE + '/about/' }) };
  const r = cli(mk(bad), '--site', SITE);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /missing <title>/);
  assert.equal(cli(mk(valid()), '--bogus').status, 2);
  assert.equal(cli(mk(valid()), '--site').status, 2);
  assert.equal(cli(mk(valid()), '--site', 'not a url').status, 2);
  assert.equal(cli(path.join(os.tmpdir(), 'seo-does-not-exist-xyz')).status, 2);
});

test('CLI: warnings alone exit 0, errors alongside warnings exit 1', () => {
  const cli = (...a) => spawnSync(process.execPath, [SCRIPT, ...a], { encoding: 'utf8' });
  const warnOnly = { ...valid(), '404.html': svc({ extra: '<title>second</title>' }) };
  const r = cli(mk(warnOnly), '--site', SITE);
  assert.equal(r.status, 0);
  assert.match(r.stderr, /WARN 404\.html: multiple <title> tags/);
  const both = { ...warnOnly, 'about/index.html': page({ title: null, canonical: SITE + '/about/' }) };
  assert.equal(cli(mk(both), '--site', SITE).status, 1);
});
