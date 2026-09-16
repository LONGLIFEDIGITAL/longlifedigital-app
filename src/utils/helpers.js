import { CATS, PROD_THEMES } from '../constants/data';

export const stars = (r) =>
  '★'.repeat(Math.floor(r)) + (r % 1 >= 0.5 ? '½' : '') + '☆'.repeat(5 - Math.ceil(r));
export const fmtPrice = (p, currency = 'USD', minorUnit = 2) =>
  p == null
    ? 'Price unavailable'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: minorUnit,
      }).format(p);
export const catLabel = (id) => CATS.find((c) => c.id === id)?.label || id;
export const fmtCard = (val) =>
  val
    .replace(/\D/g, '')
    .replace(/(.{4})/g, '$1 ')
    .trim()
    .slice(0, 19);
export const fmtExp = (val) =>
  val
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1/$2')
    .slice(0, 5);
export const getProdTheme = (id) => PROD_THEMES[id] || PROD_THEMES[1];
