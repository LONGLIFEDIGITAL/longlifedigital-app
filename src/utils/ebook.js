// Membership comes from merchandising metadata, never a guess based on the title.
export function isEbook(product) {
  const terms = [
    product.cat,
    ...(product.categoryIds || []),
    ...(product.categories || []).flatMap((term) => [term.id, term.label]),
    ...(product.tags || []).flatMap((term) => [term.id, term.label]),
  ];
  return terms.some((term) => /(^|[^a-z0-9])e[\s-]?books?($|[^a-z0-9])/i.test(term || ''));
}
