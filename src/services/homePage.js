import { plainText } from './catalog';

export const DEMO_HOME_HERO = {
  eyebrow: 'Premium Digital Products',
  heading: '',
  prefix: 'Beautifully Crafted',
  highlight: 'Digital Products',
  suffix: 'for Life & Business',
  intro:
    'Instant download ebooks, courses, marketing tools and premium domains — everything you need to grow online.',
  primaryCta: { label: 'Shop Now', destination: '/products' },
  secondaryCta: { label: 'Learn More', destination: '/about' },
};

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

// Demo content is used only when no WordPress endpoint is configured.
export const DEMO_HOME_CONTENT = {
  hero: DEMO_HOME_HERO,
  collections: {
    catalog: { title: 'Explore Our Products', intro: 'Discover our latest digital products' },
    featured: { title: 'Featured Products', intro: 'Handpicked for quality and results' },
    more: { title: 'More to Explore', intro: 'Browse our digital product collection' },
    cta: { label: 'View All →', destination: '/products' },
  },
  offer: { title: 'Special Offer', button: 'Shop This Deal' },
  heroStats: [],
  trustItems: [
    ['⚡', 'Instant Delivery', 'Download immediately after purchase'],
    ['🔒', 'Secure Payments', 'Protected by Payhip & Stripe'],
    ['♾️', 'Lifetime Access', 'Buy once, yours forever'],
    ['💬', '24hr Support', 'We reply within 24 hours'],
    ['⭐', '5-Star Rated', 'Loved by thousands of customers'],
    ['🌍', 'Global Store', 'Serving customers worldwide'],
  ].map(([icon, title, description], id) => ({ id, icon, title, description })),
  about: {
    eyebrow: 'Who are we?',
    heading: 'About Longlife Digital',
    body: '<p>At Longlife Digital, we believe that powerful knowledge tools should be accessible, impactful, and incredibly easy to use. We are more than just a digital product shop — we are a trusted partner for entrepreneurs, creators and learners worldwide.</p><p>Every product we create is built on three principles: <strong>real value</strong>, <strong>professional quality</strong>, and <strong>actionable results</strong>. We stand behind everything we sell.</p>',
    benefits: [
      'Pre-built and ready to use',
      'No subscriptions — one-time purchase',
      'Instant digital delivery',
      'Lifetime access included free',
    ].map((title, id) => ({ id, title, icon: '✓', description: '' })),
    stats: [],
    cta: { label: 'Learn More →', destination: '/about' },
  },
  blog: {
    heading: 'Blog Posts',
    intro: 'Tips, guides and strategies to grow your business',
    postIds: [],
    cta: { label: 'View All →', destination: '/blog' },
  },
  closingCta: {},
};
