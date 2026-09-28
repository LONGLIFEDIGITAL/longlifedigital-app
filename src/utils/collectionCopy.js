// Blank CMS fields retain the designed defaults, including complete CTA pairs.
export function collectionButton(value, label, destination) {
  return value?.label && value?.destination ? value : { label, destination };
}
