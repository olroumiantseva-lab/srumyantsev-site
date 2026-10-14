import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectCatalog } from './guide-catalog-contract.mjs';

const registry = [{ url: '/existing/', LEVEL: 0, TYPE: 'practical', CATEGORY: 'Для жизни' }];
const card = (url, category = 'Для жизни', type = 'practical') => `<article class="guide-card" data-guide-card data-category="${category}" data-level="0" data-type="${type}"><h3><a href="${url}">Guide</a></h3><p>Description</p><small>10 минут</small><a class="guide-card-link" href="${url}">Read</a></article>`;
const exists = url => ['/existing/', '/additional/'].includes(url);

test('catalog can grow without a fixed count; registry membership remains checked', () => {
  const result = inspectCatalog(registry, card('/existing/') + card('/additional/'), exists);
  assert.equal(result.cards.length, 2);
  assert.deepEqual(result.additionalUrls, ['/additional/']);
});
test('duplicate catalog URLs fail', () => {
  assert.throws(() => inspectCatalog(registry, card('/existing/') + card('/existing/'), exists), /unique/);
});
test('missing registered guide fails', () => {
  assert.throws(() => inspectCatalog(registry, card('/additional/'), exists), /missing registered/i);
});
test('broken page link fails', () => {
  assert.throws(() => inspectCatalog(registry, card('/existing/') + card('/missing/'), exists), /missing page/i);
});
test('invalid category and classification fail', () => {
  assert.throws(() => inspectCatalog(registry, card('/existing/', 'Unknown'), exists), /category/i);
  assert.throws(() => inspectCatalog(registry, card('/existing/', 'Для жизни', 'route'), exists), /classification/i);
});
test('hidden card and mismatching CTA fail', () => {
  assert.throws(() => inspectCatalog(registry, card('/existing/').replace('data-guide-card ', 'hidden data-guide-card '), exists), /hidden/i);
  assert.throws(() => inspectCatalog(registry, card('/existing/').replace('class="guide-card-link" href="/existing/"', 'class="guide-card-link" href="/additional/"'), exists), /CTA/i);
});
test('unsafe URLs and nonregistered route entries fail', () => {
  assert.throws(() => inspectCatalog(registry, card('/existing/') + card('//outside.example/'), () => true), /local guide URL/i);
  assert.throws(() => inspectCatalog(registry, card('/existing/') + card('/additional/', 'Для жизни', 'route'), exists), /unregistered route/i);
});
