export function catalogStatistics(products) {
  const uniqueProducts = [...new Map(products.map((product) => [product.id, product])).values()];
  const categories = new Set();
  let aiToolsProductCount = 0;
  for (const product of uniqueProducts) {
    const categoryIds = product.categories?.length
      ? product.categories.map((category) => category.id)
      : [product.cat];
    categoryIds.filter((id) => id && id !== 'all').forEach((id) => categories.add(id));
    if (
      categoryIds.some((id) => ['ai-tools', 'ai-tools'].includes(id)) ||
      product.tags?.some((tag) => tag.id === 'ai-tools')
    ) {
      aiToolsProductCount++;
    }
  }
  return { categoryCount: categories.size, aiToolsProductCount };
}
