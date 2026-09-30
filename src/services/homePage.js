import { plainText } from './catalog';

export function normalizeHomeContent(page) {
  const hero = page?.hero;
  if (
    !hero ||
    !['eyebrow', 'heading', 'prefix', 'highlight', 'suffix', 'intro'].every(
      (key) => typeof hero[key] === 'string',
    ) ||
    ![hero.primaryCta, hero.secondaryCta].every(
      (button) => typeof button?.label === 'string' && typeof button?.destination === 'string',
    )
  ) {
    throw new Error('Invalid homepage content.');
  }
  const blocks = (items = []) =>
    items.map((item) => ({
      ...item,
      title: plainText(item.title),
      description: plainText(item.description),
    }));
  return {
    ...page,
    hero: { ...hero, heading: hero.heading || plainText(page.title) || 'Home' },
    trustItems: blocks(page.trustItems),
    heroStats: blocks(page.heroStats),
    about: {
      ...page.about,
      benefits: blocks(page.about?.benefits),
      stats: blocks(page.about?.stats),
    },
  };
}
