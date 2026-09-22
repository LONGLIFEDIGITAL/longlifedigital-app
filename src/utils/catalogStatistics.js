// Count published catalog entries, not prompts within packs or words in product titles.
export function catalogStatistics(products) {
  const uniqueProducts = [...new Map(products.map((product) => [product.id, product])).values()];
  const categories = new Set();
  let aiPromptProductCount = 0;
  for (const product of uniqueProducts) {
    const categoryIds = product.categories?.length
      ? product.categories.map((category) => category.id)
      : [product.cat];
    categoryIds.filter((id) => id && id !== 'all').forEach((id) => categories.add(id));
    if (
      categoryIds.some((id) => ['ai-prompt-packs', 'ai-prompts'].includes(id)) ||
      product.tags?.some((tag) => tag.id === 'ai-prompts')
    ) {
      aiPromptProductCount++;
    }
  }
  return { categoryCount: categories.size, aiPromptProductCount };
}
