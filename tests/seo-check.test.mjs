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

test('valid fixture has no errors', () => {
  assert.deepEqual(run().errors, []);
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
}

test('CLI exit status', () => {
  const cli = (...a) => spawnSync(process.execPath, [SCRIPT, ...a], { encoding: 'utf8' });
  assert.equal(cli(mk(valid()), '--site', SITE).status, 0);
  const bad = { ...valid(), 'about/index.html': page({ title: null, canonical: SITE + '/about/' }) };
  const r = cli(mk(bad), '--site', SITE);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /missing <title>/);
  assert.equal(cli(mk(valid()), '--bogus').status, 2);
  assert.equal(cli(path.join(os.tmpdir(), 'seo-does-not-exist-xyz')).status, 2);
});
