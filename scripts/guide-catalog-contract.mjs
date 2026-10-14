import assert from 'node:assert/strict';

export const CATEGORIES = new Set(['Начать с ИИ', 'Для жизни', 'Документы и информация', 'Работа и деньги', 'Учёба и семья', 'Проверка и безопасность', 'Система работы']);
const text = value => String(value ?? '').replace(/<[^>]*>/g, '').trim();
const attributes = source => Object.fromEntries([...source.matchAll(/([\w-]+)="([^"]*)"/g)].map(match => [match[1], match[2]]));

export function inspectCatalog(registry, html, pageExists) {
  assert.ok(Array.isArray(registry) && registry.length > 0, 'Registry must be nonempty');
  assert.equal(new Set(registry.map(guide => guide.url)).size, registry.length, 'Registry URLs must be unique');
  assert.equal(typeof pageExists, 'function', 'A page existence check is required');
  const matches = [...html.matchAll(/<article\b([^>]*\bdata-guide-card\b[^>]*)>([\s\S]*?)<\/article>/g)];
  assert.ok(matches.length > 0, 'Catalog must contain cards without JavaScript');
  const cards = matches.map((match) => {
    const [, opening, body] = match;
    const attrs = attributes(opening);
    assert.ok((attrs.class ?? '').split(/\s+/).includes('guide-card'), 'Catalog card class is missing');
    assert.ok(!/\shidden(?:[=\s>])/.test(opening + '>'), 'A catalog card is hidden in source HTML');
    assert.ok(['0', '1', '2'].includes(attrs['data-level']), 'Invalid catalog level');
    assert.ok(['route', 'practical'].includes(attrs['data-type']), 'Invalid catalog type');
    assert.ok(CATEGORIES.has(attrs['data-category']), 'Invalid catalog category');
    const heading = body.match(/<h3\b[^>]*>\s*<a\b([^>]*)>([\s\S]*?)<\/a>\s*<\/h3>/);
    assert.ok(heading && text(heading[2]), 'Catalog card must have a linked nonempty H3');
    const url = attributes(heading[1]).href;
    assert.match(url ?? '', /^\/(?:[a-z0-9-]+\/)+$/, 'A local guide URL is required');
    const cta = [...body.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].find(link => (attributes(link[1]).class ?? '').split(/\s+/).includes('guide-card-link'));
    assert.ok(cta && text(cta[2]) && attributes(cta[1]).href === url, 'Catalog CTA must match its heading link');
    assert.ok(text(body.match(/<p\b[^>]*>([\s\S]*?)<\/p>/)?.[1]), 'Catalog description is missing');
    assert.ok(text(body.match(/<small\b[^>]*>([\s\S]*?)<\/small>/)?.[1]), 'Catalog duration is missing');
    assert.ok(pageExists(url), `Missing page for catalog card: ${url}`);
    return { url, level: Number(attrs['data-level']), type: attrs['data-type'], category: attrs['data-category'], source: match[0] };
  });
  assert.equal(new Set(cards.map(card => card.url)).size, cards.length, 'Catalog HTML URLs must be unique');
  const byUrl = new Map(cards.map(card => [card.url, card]));
  for (const guide of registry) {
    const card = byUrl.get(guide.url);
    assert.ok(card, `Missing registered guide in catalog: ${guide.url}`);
    assert.deepEqual([card.level, card.type, card.category], [guide.LEVEL, guide.TYPE, guide.CATEGORY], `Registry/card classification mismatch: ${guide.url}`);
  }
  const registeredUrls = new Set(registry.map(guide => guide.url));
  const additionalCards = cards.filter(card => !registeredUrls.has(card.url));
  // The published HTML may contain later practical guides not yet in the dated registry.
  // Keep that drift visible; do not let an unregistered route silently alter the ordered curriculum.
  assert.ok(additionalCards.every(card => card.type === 'practical'), 'Unregistered route requires registry update');
  return { cards, additionalUrls: additionalCards.map(card => card.url) };
}
