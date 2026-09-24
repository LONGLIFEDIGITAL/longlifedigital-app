// Retired: WooCommerce owns order creation, totals and payment confirmation.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(410).json({ error: 'This payment endpoint has been retired. Please return to the storefront checkout.' });
}
