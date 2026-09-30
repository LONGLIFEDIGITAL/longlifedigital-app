import { CATS } from '../constants/data';
import { cardEmoji, cardTheme } from './cardPresentation';

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
export const getProdTheme = (product) => {
  const theme = cardTheme(product);
  return {
    ...theme,
    orb2: 'rgba(201,150,63,0.2)',
    priceColor: theme.accent,
    icon: cardEmoji(product),
  };
};
