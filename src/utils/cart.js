const positiveInteger = (value, fallback) =>
  Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : fallback;

export function getQuantityLimits(item) {
  if (item.soldIndividually) return { minimum: 1, maximum: 1, step: 1 };
  const step = positiveInteger(item.quantityLimits?.multipleOf, 1);
  return {
    minimum: Math.ceil(positiveInteger(item.quantityLimits?.minimum, 1) / step) * step,
    maximum:
      Math.floor(positiveInteger(item.quantityLimits?.maximum, Number.MAX_SAFE_INTEGER) / step) *
      step,
    step,
  };
}

export const getItemQuantity = (item) =>
  positiveInteger(item.quantity, getQuantityLimits(item).minimum);
export const getCartCount = (cart) =>
  cart.reduce((count, item) => count + getItemQuantity(item), 0);

// Calculate in the currency's smallest unit to avoid accumulating decimal rounding errors.
export function getLineTotal(item) {
  const scale = 10 ** (item.minorUnit ?? 2);
  return (Math.round(Number(item.price) * scale) * getItemQuantity(item)) / scale;
}

export function getCartTotal(cart) {
  const scale = 10 ** (cart[0]?.minorUnit ?? 2);
  return cart.reduce((total, item) => total + Math.round(getLineTotal(item) * scale), 0) / scale;
}

export function adjustCartQuantity(cart, id, direction) {
  if (direction !== 1 && direction !== -1) return cart;
  return cart.map((item) => {
    if (item.id !== id) return item;
    const { minimum, maximum, step } = getQuantityLimits(item);
    const quantity = Math.max(minimum, Math.min(maximum, getItemQuantity(item) + direction * step));
    return quantity === getItemQuantity(item) ? item : { ...item, quantity };
  });
}

export function addCartItem(cart, product) {
  const { minimum, maximum } = getQuantityLimits(product);
  if (
    product.canAddToCart === false ||
    maximum < minimum ||
    cart.some((item) => (item.currency || 'USD') !== (product.currency || 'USD'))
  )
    return cart;
  if (cart.some((item) => item.id === product.id)) return adjustCartQuantity(cart, product.id, 1);
  return [...cart, { ...product, quantity: minimum }];
}
