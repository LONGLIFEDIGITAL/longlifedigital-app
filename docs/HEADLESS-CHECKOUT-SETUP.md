# Headless checkout: install and acceptance

The guest-checkout implementation is **test-only**. The user has completed a Stripe test purchase through React (Woo order 334, 30-Day Social Media Content Pack) and successfully downloaded the product. The exact Stripe Gateway 11.0.0 / WooCommerce 11.1.2 source contract has been reviewed; the remaining installation-specific failure/authentication scenarios below still need acceptance.

All content and commerce now target **https://longlifedigital-zmuro.wpcomstaging.com**. The test product is **318 — Small Business AI Prompt Pack**. Firebase is not used.

## Checkout update: bridge 0.2.4

Version 0.2.4 includes each download's WooCommerce product ID/name and file ID, and serializes its permission expiry with a timezone. The confirmation page uses compact product-title links and an Expires column. Unlimited permissions show Never; missing metadata does not. Expired/exhausted permissions stay excluded. The date comes from the purchase's download permission, so changing a product's expiry setting later does not invent a new expiry for an old purchase. This follows [WooCommerce's order download data](https://github.com/woocommerce/woocommerce/blob/11.1.2/plugins/woocommerce/includes/class-wc-order-item-product.php#L420).

The confirmation page also shows published FAQs tagged Products or General, in CMS order, with duplicates avoided. Maintain these under WordPress FAQs using the existing Topics field. Coupon errors are rendered as plain text with decoded entities. Headings use Plus Jakarta Sans and body text uses Inter; the home hero retains Playfair Display.

Upload the current [plugin ZIP](cms/Longlife-Headless-Commerce.zip) on the main site using **Plugins → Add New Plugin → Upload Plugin**, then choose **Replace current with uploaded**. Keep the existing secret and test-checkout setting. Version 0.2.3 fixes a variable collision introduced in 0.2.2 that returned a billing field name instead of Stripe's publishable key. It includes WooCommerce's country-specific billing requirements and recognition of recorded validation failures that left an order in draft before payment began. The React and server fixes also require the updated application code.

React validates the publishable-key format and waits for the Payment Element's ready event before enabling Pay. The Stripe client is reused across renders, the provider initializes asynchronously, and the card accordion opens by default. SDK/iframe load failures and timeouts show a reload action that recreates the payment form without losing billing details or submitting a purchase.

Billing fields now survive refreshes in the same tab for up to two hours; the draft is cleared after verified payment. Card data and the reviewed payment step are never restored. Postal codes are marked required when Woo requires them; optional/hidden postal fields follow Woo's country rules. Until the plugin is updated, postal code defaults to required.

Order confirmation displays a themed spinner and progress messages, with up to eight automatic checks and a one-minute overall deadline. Verified success unlocks downloads. Confirmed rejection/cancellation offers a return to checkout; an unknown outcome stops the spinner and directs the customer to purchase email/support without claiming the charge failed. The server rejects attempts to treat an unresolved draft as proof of payment failure. No manual status-check button or raw Woo status is shown.

## Your remaining setup

1. In the **main** WordPress dashboard, open **Plugins → Add New Plugin → Upload Plugin**. Upload [Longlife-Headless-Commerce.zip](cms/Longlife-Headless-Commerce.zip), install and activate **Longlife Headless Commerce**. If an earlier version of this same plugin exists, replace it with this ZIP. This is separate from the `Longlife Storefront` content plugin; keep that plugin.
2. Open **Settings → General → Longlife headless checkout**. Check **Enable React test checkout** and save.
3. Click **Copy secret** beside the integration secret, then paste it into **`.env.local`** as `LLD_COMMERCE_BRIDGE_SECRET=...`. **Show / Hide** lets you reveal or mask the value. If the browser blocks automatic copying, the plugin reveals and selects the secret for manual copying. Keep it out of chat and Git. A local `COMMERCE_SESSION_SECRET` has already been generated; preserve it. `STOREFRONT_ORIGINS` currently allows `http://localhost:5173` and `http://127.0.0.1:5173`; add the exact origin if you use a different port.
4. Keep **Stripe in test mode**, with **cards enabled** and **automatic capture**. The bridge deliberately refuses live mode and unreviewed gateway/Woo versions. Keep the gateway's own Stripe webhook connection enabled. Do not point Stripe events at the retired `/api/stripe-webhook` endpoint in React/Vercel.
5. Keep **guest checkout enabled** under WooCommerce → Settings → Accounts & Privacy. Under Products → Downloadable products, **Downloads require login must be off** for guests. Use the host-supported protected delivery method and a real downloadable file on product 318. Confirm a direct file URL cannot bypass purchase permission. No need to recreate ACF or your pages.
6. Restart Vite once after these environment changes. Tell the developer the plugin is active and the secret is saved. No secrets need to be sent in chat.

You can check readiness with `node scripts/check-commerce-readiness.mjs`. Add `--cart` to add, update and remove product 318 in an isolated guest cart; this creates no order and makes no payment.

## What is implemented

- Woo Store API carts behind an encrypted HttpOnly cookie: add, quantity, remove, clear, coupons, billing/tax updates and Woo totals.
- React `/checkout` with billing, authoritative total review and Stripe Payment Element. Raw card details go directly to Stripe.
- Checkout requires a phone number and supplies it with the other externally collected billing fields to Stripe. Woo validation errors identify the affected billing fields inline. The billing edit action unlocks the form without submitting it again.
- Public configuration does not write a cart cookie. Session requests are serialized (across tabs with Web Locks where available); temporary refresh errors retain the last cart and entered billing details. Focus refresh pauses while a payment is awaiting verification.
- Native Store API checkout invokes the Woo Stripe gateway. Woo creates the order and gateway payment; Vercel does not create a separate Stripe intent or session.
- Signed Vercel-to-WordPress calls, body validation, origin checks and replay rejection. Durable WordPress request records prevent duplicate submissions; a pending/ambiguous payment keeps its session lock.
- React `/order-confirmation`, including required Stripe authentication and server verification. Client success flags never grant access.
- Confirmed orders retry temporary cart synchronization failures automatically. Paid orders keep their downloads available and do not ask customers to verify an already confirmed payment again.
- Owned, paid Woo orders expose only native permission-based download URLs, excluding expired/exhausted permissions and ineligible order states. Woo remains responsible for file delivery and its own gateway webhooks/fulfillment.
- Previous standalone Stripe source is retained but not active; its server endpoints return HTTP 410.

## Acceptance still required after installation

Use test customer details and Stripe's official test cards. Confirm in WooCommerce and Stripe, not only the React message:

- Product 318 paid in React, correct total/customer/items, one Woo order and its matching Stripe payment, purchase email and usable protected file download.
- 3D Secure successful and canceled authentication, card decline and pending verification.
- Reload/back, double-click, timed-out request and retry produce no duplicate payment or fulfillment.
- Coupons/taxes and price changes require the right reviewed total; stock and quantity rules are enforced.
- Another browser/session cannot read the order or receive its download links. Exhausted, expired, canceled and refunded permissions fail; native file delivery also enforces them.
- The cart clears/reconciles correctly after both immediate payment and 3D Secure. Confirm mobile form and Stripe authentication behavior.
- Your gateway's webhook logs show successful verification/delivery. No separate Vercel fulfillment webhook is introduced in this phase.

If a request times out before an order can be identified, do not clear database locks and pay again blindly. Inspect the Woo order/Stripe payment first. Pending/ambiguous attempts intentionally remain blocked; support-assisted resolution is required if they cannot be reconciled. Refreshing the cart is not proof that payment failed.

## Remaining account work

This package covers the guest checkout foundation. The planned WordPress customer login/registration, email verification/recovery, revocable account sessions, dashboard/history, cross-device guest-order recovery and verified guest purchase linking are **not implemented yet**. They follow the gateway acceptance test, using the separate identity/session design in [the architecture](Longlife-Digital-Headless-Commerce-Architecture.md). Native Woo purchase emails continue to provide guest access meanwhile.

PayPal, saved cards, subscriptions and physical shipping are outside this first payment adapter. Production/live Stripe enablement requires another validation and release step; do not remove the test-mode guard to launch prematurely.

## Deployment settings (later)

Configure `VITE_WORDPRESS_API_URL`, `VITE_WOOCOMMERCE_STORE_API_URL`, and `VITE_HEADLESS_COMMERCE=true` in Vercel. Configure the three **server-only** fields from `.env.example` separately. Use a new production cookie secret and exact allowed React origins; no wildcard origin. WordPress administration and gateway credentials stay in WordPress. This work does not deploy Vercel or change DNS.

## Local checks

```sh
node --test tests/commerce.test.mjs
npx playwright test --config playwright.checkout.config.js
npm run test:catalog
npm run lint
VITE_HEADLESS_COMMERCE=true npm run build -- --mode test
php tests/commerce-bridge.php
```

The browser suite mocks Woo/Stripe and the PHP harness stubs WordPress. These verify local contracts and failure handling; they do not substitute for the installation acceptance above. `tests/commerce-bridge.php` can also run with the installed PHP WASM CLI when native PHP is unavailable.

An opt-in rendering check uses the main site's public Stripe test configuration with a mocked cart: `LLD_REAL_STRIPE_MOUNT=1 npx playwright test --config playwright.checkout.config.js --grep 'real Stripe test-mode'`. It verifies that the real card field is visible and accepts focus, saves `test-results/stripe-fields-real.png`, and never enters card data or submits a payment. This check passed with bridge 0.2.3 installed, alongside all 24 mocked checkout checks.

Reviewed contracts: [Stripe Gateway 11.0.0](https://github.com/woocommerce/woocommerce-gateway-stripe/tree/11.0.0), [WooCommerce 11.1.2 checkout](https://github.com/woocommerce/woocommerce/blob/11.1.2/plugins/woocommerce/src/StoreApi/Routes/V1/Checkout.php), [Store API Cart Tokens](https://developer.woocommerce.com/docs/apis/store-api/cart-tokens/).
