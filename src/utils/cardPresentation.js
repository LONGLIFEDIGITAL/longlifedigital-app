import { formatCompactCount } from './numbers';
// Shared taxonomy-based artwork for listing cards; detail pages retain CMS media.
const emojiRules = [
  [/\b(course|courses|training|learning|education)\b/, '🚀'],
  [/\b(ai|artificial intelligence|prompt|prompts|automation)\b/, '🤖'],
  [/\b(seo|search|analytics)\b/, '📈'],
  [/\b(social|instagram|facebook|content marketing)\b/, '📱'],
  [/\b(ebook|ebooks|book|books|guide|guides)\b/, '📚'],
  [/\b(spreadsheet|spreadsheets|finance|budget|financial)\b/, '📊'],
  [/\b(design|branding|creative|art)\b/, '🎨'],
  [/\b(domain|domains|website|websites)\b/, '🌐'],
  [/\b(entrepreneurship|startup|startups|business)\b/, '💼'],
  [/\b(marketing|advertising|sales)\b/, '📣'],
  [/\b(template|templates|planner|planners|notion)\b/, '📝'],
  [/\b(wellness|health|journal)\b/, '🌿'],
];
const label = (term) =>
  typeof term === 'string'
    ? term
    : [term?.id, term?.label, term?.name, term?.slug].filter(Boolean).join(' ');
export function cardEmoji(item, fallback = '📦') {
  const terms = [
    ...(item.tags || []),
    ...(item.categories || []),
    item.cat,
    item.categoryLabel,
    item.tag,
  ]
    .filter(Boolean)
    .map(label)
    .join(' ')
    .toLowerCase()
    .replace(/[-_]/g, ' ');
  return emojiRules.find(([pattern]) => pattern.test(terms))?.[1] || fallback;
}

const categoryPalettes = {
  purple: ['#0a001e', '#2d0f6b', '#9333ea', '#d8b4fe'],
  blue: ['#020c35', '#08266a', '#6366f1', '#a5b4fc'],
  green: ['#001b15', '#005643', '#10b981', '#6ee7b7'],
  teal: ['#001b25', '#075568', '#06b6d4', '#67e8f9'],
  rose: ['#26091d', '#701747', '#db2777', '#f9a8d4'],
  amber: ['#261306', '#65380c', '#d97706', '#fcd34d'],
};

export function cardTheme(product) {
  // Category-based so products in the same collection share their artwork palette.
  const category = [product.categoryLabel, product.cat, ...(product.categories || [])]
    .filter(Boolean).map(label).join(' ').toLowerCase().replace(/[-_]/g, ' ');
  const rules = [
    [/\b(course|courses|ai|prompt|prompts|automation)\b/, 'purple'],
    [/\b(ebook|ebooks|book|books|education|domain|domains|website|websites)\b/, 'blue'],
    [/\b(seo|search|analytics|template|templates)\b/, 'teal'],
    [/\b(social|design|branding|creative)\b/, 'rose'],
    [/\b(business|spreadsheet|spreadsheets|finance|wellness|health|digital)\b/, 'green'],
    [/\b(marketing|advertising|sales)\b/, 'amber'],
  ];
  const names = Object.keys(categoryPalettes);
  const seed = [...category].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 0);
  const name = rules.find(([pattern]) => pattern.test(category))?.[1]
    || (category ? names[seed % names.length] : 'purple');
  const [dark, bright, glow, accent] = categoryPalettes[name];
  return {
    bg: `linear-gradient(135deg, ${dark}, ${bright})`,
    orb1: `${glow}66`,
    bar: `linear-gradient(90deg, ${glow}, #e8c97a, ${glow})`,
    accent,
  };
}

const previewEnabled = import.meta.env.VITE_DEMO_REVIEWS === 'true';
const previewSeed = (value) =>
  [...String(value)].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 0);

// Presentation-only placeholders. Replace with verified store metrics when available.
export function heroPreviewStatistics(storeName, enabled = previewEnabled) {
  if (!enabled) return [];
  const seed = previewSeed(storeName || 'Longlife Digital');
  return [
    { value: formatCompactCount(`${5000 + (seed % 400)}+`), label: 'Happy Customers', demo: true },
    { value: `${(5 + (seed % 3) / 10).toFixed(1)}★`, label: 'Avg Rating', demo: true },
  ];
}

export function cardReviews(product, demoEnabled = previewEnabled) {
  if (product.reviews > 0) return { rating: product.rating, count: product.reviews, demo: false };
  if (!demoEnabled) return null;
  // Stable preview numbers: no changes on rerender, no mutation of real Woo review data.
  const seed = previewSeed(product.id);
  return { rating: 5, count: 24 + (seed % 157), demo: true };
}
