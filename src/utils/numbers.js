const compactCount = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function formatCompactCount(value) {
  const text = String(value).trim();
  const match = text.match(/^(\d[\d,]*(?:\.\d+)?)(\+)?$/);
  if (!match) return text;
  const number = Number(match[1].replaceAll(',', ''));
  return Number.isFinite(number) ? `${compactCount.format(number)}${match[2] || ''}` : text;
}
