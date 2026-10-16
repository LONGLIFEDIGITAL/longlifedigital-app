import { TRANSLATION_PRICE_KEYS, translationOfferings } from '../shared/translation.js';

const text = (v, max = 2000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const publicUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
  } catch {
    return '';
  }
};
export function translationContent(acf) {
  if (acf.lld_service_layout !== 'translation') return null;
  const content = acf.lld_translation || {};
  const showCredentials = content.show_credentials === true || content.show_credentials === 1;
  return {
    offerings: translationOfferings(acf.lld_translation_offerings),
    heading: text(content.heading, 160),
    intro: text(content.intro),
    turnaround: text(content.turnaround, 300),
    confidentiality: text(content.confidentiality),
    credentials: showCredentials
      ? ['translator', 'hipaa'].flatMap((key) => {
          const description = text(content[`${key}_credentials`], 600);
          return description
            ? [{ kind: key, description, url: publicUrl(content[`${key}_credential_url`]) }]
            : [];
        })
      : [],
    terms: text(content.terms),
    secureFormUrl: publicUrl(content.secure_form_url),
    bookId: Number.isSafeInteger(content.book) && content.book > 0 ? content.book : null,
    prices: Object.fromEntries(
      TRANSLATION_PRICE_KEYS.map((key) => {
        const raw = content.prices?.[key];
        const amount =
          typeof raw === 'number' || (typeof raw === 'string' && raw.trim() !== '')
            ? Number(raw)
            : NaN;
        return [key, Number.isFinite(amount) && amount >= 0 && amount <= 10000 ? amount : null];
      }),
    ),
    faqs: ['acceptance', 'timing', 'coverage'].flatMap((key) => {
      const faq = content.faqs?.[key];
      return text(faq?.question) && text(faq?.answer)
        ? [{ question: text(faq.question, 200), answer: text(faq.answer) }]
        : [];
    }),
  };
}
