// Language directions and billing rules are structural. Offered document types,
// packages, descriptions and rates come from WordPress.
export const TRANSLATION_LANGUAGES = ['English', 'Haitian Creole', 'French', 'Spanish'];
export const TRANSLATION_PRICE_KEYS = [
  'additional_page',
  'legal_word',
  'rush_percent',
  'notarization',
  'mail_standard',
  'mail_overnight',
];
const offeringId = /^[a-z][a-z0-9_-]{0,63}$/;

function documentChoices(value = []) {
  if (!Array.isArray(value) || value.length > 50) return null;
  const seen = new Set();
  const choices = [];
  for (const name of value) {
    if (typeof name !== 'string' || !name.trim() || name.length > 160 || /[\r\n\0]/.test(name))
      return null;
    const label = name.trim();
    const key = label.toLowerCase();
    if (seen.has(key)) return null;
    seen.add(key);
    choices.push(label);
  }
  return choices;
}

export function translationOfferings(raw) {
  let rows;
  try {
    rows = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return [];
  }
  if (!Array.isArray(rows) || rows.length > 50) return [];
  const seen = new Set();
  let invalid = false;
  const offerings = rows.flatMap((row) => {
    const documentTypes = documentChoices(row?.documentTypes);
    if (
      !row ||
      !documentTypes ||
      typeof row.id !== 'string' ||
      !offeringId.test(row.id) ||
      seen.has(row.id) ||
      typeof row.title !== 'string' ||
      !row.title.trim() ||
      row.title.length > 160 ||
      !['document', 'page', 'package'].includes(row.unit) ||
      typeof row.note !== 'string' ||
      row.note.length > 600 ||
      typeof row.enabled !== 'boolean' ||
      (row.price !== null &&
        (typeof row.price !== 'number' ||
          !Number.isFinite(row.price) ||
          row.price < 0 ||
          row.price > 10000)) ||
      !Number.isSafeInteger(row.documents) ||
      row.documents < 1 ||
      row.documents > 200
    ) {
      invalid = true;
      return [];
    }
    seen.add(row.id);
    return row.enabled
      ? [
          {
            id: row.id,
            title: row.title.trim(),
            note: row.note.trim(),
            unit: row.unit,
            price: row.price,
            documents: row.unit === 'package' ? row.documents : 1,
            documentTypes,
          },
        ]
      : [];
  });
  return invalid ? [] : offerings;
}
export function translationPairAllowed(source, target) {
  return (
    TRANSLATION_LANGUAGES.includes(source) &&
    TRANSLATION_LANGUAGES.includes(target) &&
    source !== target &&
    (source === 'English' || target === 'English')
  );
}
// The API validates shape; WordPress independently checks its latest catalog.
export function translationRequestError(value, offerings) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return 'Please check your translation details.';
  if (!['certified', 'standard'].includes(value.type)) return 'Please choose a translation type.';
  if (!translationPairAllowed(value.source, value.target))
    return 'Choose English and either Haitian Creole, French or Spanish.';
  if (typeof value.service !== 'string' || !offeringId.test(value.service))
    return 'Please choose a document service.';
  const option = offerings?.find(({ id }) => id === value.service);
  if (offerings && !option)
    return 'This document service is no longer available. Please choose another.';
  const document = value.document === undefined ? '' : value.document;
  if (typeof document !== 'string' || document.length > 160 || /[\r\n\0]/.test(document))
    return 'Please choose a valid document.';
  if (option) {
    const choices = option.documentTypes || [];
    if (choices.length && !document) return 'Please choose a document from this service group.';
    if (document && !choices.includes(document))
      return 'This document is no longer available in this service group. Please choose another.';
  }
  for (const key of ['documents', 'pages']) {
    if (!Number.isSafeInteger(value[key]) || value[key] < 1 || value[key] > 200)
      return 'Enter between 1 and 200 documents and pages.';
  }
  if (value.pages < value.documents) return 'The page count must be at least the document count.';
  if (option?.unit === 'package' && value.documents !== option.documents)
    return `This package includes ${option.documents} documents. Request a separate quote for a larger bundle.`;
  if (
    typeof value.rush !== 'boolean' ||
    typeof value.notarized !== 'boolean' ||
    !['digital', 'mail_standard', 'mail_overnight'].includes(value.delivery)
  )
    return 'Please check your delivery options.';
  if (value.consent !== true) return 'Please agree to the privacy notice and service terms.';
  return '';
}
// An indicative quote, not a charge. Rush applies to translation work only;
// notarization is per document and delivery is charged once per request.
export function translationPriceBreakdown(value, config = {}) {
  const options = config.offerings || [];
  if (translationRequestError(value, options)) return null;
  const option = options.find(({ id }) => id === value.service);
  const prices = config.prices || {};
  const validRate = (rate) => typeof rate === 'number' && Number.isFinite(rate) && rate >= 0;
  const cents = (rate, quantity = 1) =>
    validRate(rate) ? Math.round((rate + Number.EPSILON) * 100) * quantity : null;
  const items = [];
  const add = (id, label, amount) => items.push({ id, label, cents: amount });
  const certified = value.type === 'certified';
  add(
    'translation',
    certified ? 'Certified translation' : 'Standard translation',
    certified
      ? cents(
          option.price,
          option.unit === 'page' ? value.pages : option.unit === 'document' ? value.documents : 1,
        )
      : null,
  );
  const additional = option.unit === 'page' ? 0 : value.pages - value.documents;
  if (certified && additional) {
    add(
      'additional_pages',
      `Additional pages (${additional})`,
      cents(prices.additional_page, additional),
    );
  }
  const sum = () =>
    items.every((item) => item.cents !== null)
      ? items.reduce((total, item) => total + item.cents, 0)
      : null;
  const translationSubtotal = sum();
  if (value.rush) {
    const percent = validRate(prices.rush_percent) ? prices.rush_percent : null;
    add(
      'rush',
      percent === null ? '24-hour rush' : `24-hour rush (${percent}%)`,
      translationSubtotal !== null && percent !== null
        ? Math.round((translationSubtotal * percent) / 100)
        : null,
    );
  }
  if (value.notarized) {
    add(
      'notarization',
      `Notarization (${value.documents} ${value.documents === 1 ? 'document' : 'documents'})`,
      cents(prices.notarization, value.documents),
    );
  }
  add(
    'delivery',
    {
      digital: 'Digital delivery',
      mail_standard: 'Tracked USPS delivery',
      mail_overnight: 'Overnight delivery',
    }[value.delivery],
    value.delivery === 'digital' ? 0 : cents(prices[value.delivery]),
  );
  const total = sum();
  return {
    items: items.map(({ id, label, cents: amount }) => ({
      id,
      label,
      amount: amount === null ? null : amount / 100,
    })),
    total: total === null ? null : total / 100,
  };
}

export function translationEstimate(value, config = {}) {
  return translationPriceBreakdown(value, config)?.total ?? null;
}
