# Headless checkout: install and acceptance

Bridge **0.6.6** determines checkout readiness from the available WooCommerce/Stripe APIs and payment settings. Plugin version numbers no longer disable checkout in either WordPress or the app. Unreviewed releases produce `compatibilityWarnings` and a WordPress administrator notice, while actual missing APIs or invalid settings remain blocking `configurationIssues`. The user previously completed a Stripe test purchase through React (Woo order 334, 30-Day Social Media Content Pack) and downloaded the product. Live charges have not been exercised by the automated checks; the installation-specific acceptance scenarios below remain relevant.

## Pre-payment fraud rejection: bridge 0.6.6

On November 10, the merchant correlated order 910048 (pending payment, with no
matching payment found in Stripe) with a Blackbox `block` decision from
`blocks_checkout`. Woo Fraud Protection verifies on
`woocommerce_store_api_checkout_order_processed`, before the gateway runs, and
an enforced block returns HTTP 403 with `woocommerce_rest_checkout_error`.
See the [official protector implementation](https://github.com/woocommerce/woocommerce-fraud-protection/blob/329f5375b7dbecb7ee19f90391a701e188616e1d/src/Internal/FraudProtectionPlugin/Protectors/BlocksCheckoutProtector.php).

The raw received decision alone is not proof of enforcement: the merchant's
automatic-blocking setting and rules determine the final outcome. Check
**WooCommerce → Settings → Fraud prevention → View checkout attempts** for the
matching attempt. Woo's [merchant documentation](https://woocommerce.com/document/fraud-protection/)
explains the difference between **Blocked** and **Allowed + Flagged**, and warns
that headless/custom checkout coverage needs verification.

Our React checkout currently does not load the Blackbox browser integration or
send its session data in the Store API extensions. The WordPress request also
comes through the storefront server. Missing browser data or proxy context is a
possible cause of false positives; the service does not publish the exact
signals behind this decision. This release does **not** integrate that SDK,
disable fraud protection, override a verdict, or change WordPress settings.

The app now retains the original customer-facing submission/authentication error
on the confirmation page, including after a refresh, and clears it after verified
payment. A fraud-related 403 is no longer mislabeled as rejected bridge credentials.

For new attempts, the bridge records whether the gateway dispatch hook ran.
Only a recorded pre-gateway 403 with the known checkout error code, a pending/draft
order, and no payment evidence is reported as `blocked`. The app stops polling,
shows a support message, and clears the unresolved-attempt flag; the bridge releases
that attempt's checkout lock. All later attempts still pass through fraud checking.
No payment is submitted automatically. Older attempts without the dispatch marker,
other errors, and orders with payment evidence remain protected as uncertain.

This fixes rejection reporting, not the underlying fraud decision. An administrator
can review the attempt and add an exact email allow rule for a confirmed false
positive. Temporarily clearing **Automatically block checkout attempts flagged by
fraud prevention** leaves evaluation and merchant rules active but reduces automatic
bot blocking; it does not change Stripe's own controls. This is an operational choice,
not a setting changed by the bridge. Older unpaid orders such as 910048 require
administrator reconciliation against Stripe and the recorded fraud outcome before
cancellation; reloading their confirmation page then clears the canceled attempt.

Deploy the app and replace the WordPress plugin with the current ZIP to apply both
parts of the reporting fix. Passing mocked tests is not live checkout acceptance.

## November 10 checkout fix and critical alerts: bridge 0.6.5

The public WordPress and storefront configuration responses both reported
`enabled: false`, Stripe Gateway `11.1.1`, WooCommerce `11.3.0-rc.2`, and only
`stripe_version` / `woocommerce_version` issues. The existing compatibility
checks caused the outage; plugin activation, credentials and checkout settings
passed their checks.

Both `shared/checkoutConfig.js` and the WordPress bridge now treat versions as
diagnostics. The bridge checks that required payment, verification, order,
download, Store API and billing methods exist, are public, and can be called
with the arguments this integration supplies. Keys/modes, card enablement,
automatic capture, guest checkout and the explicit enable switch remain required.
Install the replacement [plugin ZIP](cms/Longlife-Headless-Commerce.zip)
using **Plugins → Add New Plugin → Upload Plugin → Replace current with uploaded**,
and deploy the updated app/API. Preserve the existing integration secret and
checkout enablement. The archive is built from this checkout's complete plugin
directory, including existing translation features. A Git push does not install
the WordPress plugin. Verify `/api/commerce?action=config` returns `enabled: true`
and `configurationIssues: []` before considering deployment complete.

A newer release can report compatibility warnings while checkout remains enabled.
Version warnings do not generate critical email. The current review baseline is
Stripe Gateway 11.0.x/11.1.x and WooCommerce 11.1.2–11.3.x, including the reviewed
11.3.0-rc.2. This baseline controls administrator notices only.

API presence/signature checks cannot establish identical behavior in a future
release. Use stable releases in production, test the full checkout and download
flow on staging before updating, and keep a current backup. This follows
[WooCommerce's update guidance](https://woocommerce.com/document/how-to-update-woocommerce/).
After an update, run `node scripts/check-commerce-readiness.mjs`; it prints blocking
issues separately from review warnings and exits nonzero if checkout is not ready.
It creates no order or payment. Scheduling external monitoring is separate; this
change does not modify production plugin auto-update settings.

Critical checkout alerts use WordPress `wp_mail` and its configured mail transport,
with the fixed recipient **admin@longlifedigital.com**:

- Checkout readiness/configuration failures while React checkout is enabled.
- Stripe transport failures and HTTP 401, 403, 429, or 5xx responses.
- Commerce API server failures, rejected bridge authentication, and errors verifying
  payments. App reports use the authenticated `/lld-headless/v1/alert` endpoint.
- Signed WordPress checkout responses with HTTP 5xx.

Ordinary card declines, billing/coupon validation, customer authentication failures,
and intentional checkout disablement do not email. Messages contain fixed issue
codes, installed versions, mode, operation and HTTP status, never raw errors,
customer details, request bodies or payment credentials. Each category sends at
most once per six hours using a shared database lock and cooldown; rejected mail
is retried after a five-minute backoff on the next observation. Mail transport
acceptance is not proof of inbox delivery.

Configuration is checked on public config requests and an hourly WP-Cron event
(subject to WordPress traffic/cron execution). This is not an independent uptime
monitor: if WordPress, the bridge credentials, or its mail transport are unavailable,
the app records a sanitized Vercel delivery-failure log and preserves the original
checkout response. No alert error may make an uncertain payment safe to retry.

Source review covered the [Stripe 11.1.1 Blocks adapter](https://github.com/woocommerce/woocommerce-gateway-stripe/blob/11.1.1/includes/class-wc-stripe-blocks-support.php),
[UPE gateway](https://github.com/woocommerce/woocommerce-gateway-stripe/blob/11.1.1/includes/payment-methods/class-wc-stripe-upe-payment-gateway.php),
payment gateway/API/order helpers, and WooCommerce's
[11.3.0-rc.2 checkout handler](https://github.com/woocommerce/woocommerce/blob/11.3.0-rc.2/plugins/woocommerce/src/StoreApi/Routes/V1/Checkout.php)
and [checkout trait](https://github.com/woocommerce/woocommerce/blob/11.3.0-rc.2/plugins/woocommerce/src/StoreApi/Utilities/CheckoutTrait.php).
The payment-data keys, deferred-intent path, confirmation hash and gateway
verification methods used by this bridge remain supported. Upstream changes add
order-save checks and recovery after payment; our independent paid-order and
download-entitlement checks remain in place. Source review and mocked regression
tests do not establish end-to-end live-payment acceptance.

## Checkout remains disabled after an update: bridge 0.5.9

The October 9 read-only check returned HTTP 200 with `enabled: false`,
`woocommerceVersion: "11.2.1"`, and `configurationIssues: ["woocommerce_version"]`.
Bridge 0.5.8 and the app API accepted only specific patch versions, ending at
WooCommerce 11.2.0. This disabled checkout after the 11.2.1 update. Switching
Stripe modes cannot clear that version mismatch. A successful configuration
request can disable checkout without a browser console error.

Replace the installed WordPress plugin with the current **0.5.9**
[plugin ZIP](cms/Longlife-Headless-Commerce.zip), choosing **Replace current with
uploaded**, and deploy the updated app/API by pushing the code to the Vercel
production branch. Both checks have changed. Pushing to `main` deploys the app
only; it does not update PHP installed in WordPress. Preserve the existing
integration secret and checkout enablement setting.

After deployment, inspect `/api/commerce?action=config` on the storefront (or
the WordPress `/wp-json/lld-headless/v1/config` endpoint). Expect `enabled: true`
and `configurationIssues: []`. A remaining `woocommerce_version` issue with
11.2.1 means the responding WordPress site still has the old plugin. Other issue
names identify the specific setting to address; do not toggle Stripe modes to
work around an unrelated configuration issue.

The bridge now chooses the active mode's publishable/secret keys, checks that
they match the gateway's active credentials, and rejects missing or mixed-mode
keys. The API and payment form accept the matching public key for either mode;
test-card instructions appear only in test mode. Secret keys stay in WordPress.
Version, card, capture, guest-checkout and explicit enablement checks remain.
The public configuration includes `configurationIssues` with fixed setting names
for diagnosis, without exposing credentials.

The official [Stripe Gateway 11.0.1 source](https://github.com/woocommerce/woocommerce-gateway-stripe/tree/11.0.1)
has the same UPE payment gateway and Blocks adapter files as 11.0.0.
[WooCommerce 11.2.0 checkout](https://github.com/woocommerce/woocommerce/blob/11.2.0/plugins/woocommerce/src/StoreApi/Routes/V1/Checkout.php)
adds cart-session exception handling without changing the payment handoff used here.
The [11.2.1 checkout handler](https://github.com/woocommerce/woocommerce/blob/11.2.1/plugins/woocommerce/src/StoreApi/Routes/V1/Checkout.php)
is byte-for-byte identical to 11.2.0. The API and PHP regression suites share a
version matrix covering current releases, later patches, range boundaries and
invalid/prerelease versions, with mocked checkout exercised in both Stripe modes.

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
2. Open **Settings → General → Longlife headless checkout**. Check **Enable React checkout** and save. An existing enabled setting is preserved on update.
3. Click **Copy secret** beside the integration secret, then paste it into **`.env.local`** as `LLD_COMMERCE_BRIDGE_SECRET=...`. **Show / Hide** lets you reveal or mask the value. If the browser blocks automatic copying, the plugin reveals and selects the secret for manual copying. Keep it out of chat and Git. A local `COMMERCE_SESSION_SECRET` has already been generated; preserve it. `STOREFRONT_ORIGINS` currently allows `http://localhost:5173` and `http://127.0.0.1:5173`; add the exact origin if you use a different port.
4. Select the intended mode under **WooCommerce → Settings → Payments → Stripe**. Use test mode for testing; disable it for real sales with the live account connected. Keep **cards enabled**, **automatic capture**, and the gateway's webhook connection enabled for that mode. Live and test connections are configured separately; see [WooCommerce Stripe settings](https://woocommerce.com/document/stripe/setup-and-configuration/settings-guide/) and [webhooks](https://woocommerce.com/document/stripe/setup-and-configuration/stripe-webhooks/). Do not point Stripe events at the retired `/api/stripe-webhook` endpoint in React/Vercel.
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

## Customer accounts: bridge 0.3.1

WordPress/WooCommerce registration, email password setup/recovery, login, revocable account sessions, logout and customer order history are now implemented. Signed checkout requests associate new orders with the verified customer while retaining guest checkout. Follow [Customer accounts setup](CUSTOMER-ACCOUNTS-SETUP.md) to install bridge **0.3.1**, enable registration and verify email delivery. This update sends account emails through WooCommerce's mailer and resends password setup when an unverified registration is retried. Cross-device guest-order recovery and verified guest purchase linking remain future work. Native Woo purchase emails continue to provide guest access.

PayPal, saved cards, subscriptions and physical shipping are outside this payment adapter. Test failure/authentication scenarios on a staging installation in Stripe test mode. The same Woo gateway owns live payment creation, verification and fulfillment.

## Deployment settings

Configure `VITE_WORDPRESS_API_URL`, `VITE_WOOCOMMERCE_STORE_API_URL`, and `VITE_HEADLESS_COMMERCE=true` in the **Production** environment in Vercel. Configure `LLD_COMMERCE_BRIDGE_SECRET`, `COMMERCE_SESSION_SECRET`, and `STOREFRONT_ORIGINS` there too; `.env.local` does not configure Vercel. Use a production cookie secret (at least 32 characters) and the exact allowed React origins, including `www` if served; no wildcard origin. The bridge secret must match WordPress. Redeploy after changing environment variables. WordPress administration and gateway credentials stay in WordPress. This work does not deploy Vercel or change DNS.

## Local checks

```sh
node --test tests/commerce.test.mjs
php tests/checkout-alerts.php
npx playwright test --config playwright.checkout.config.js
npm run test:catalog
npm run lint
VITE_HEADLESS_COMMERCE=true npm run build -- --mode test
php tests/commerce-bridge.php
```

The browser suite mocks Woo/Stripe and the PHP harness stubs WordPress. These verify local contracts and failure handling; they do not substitute for the installation acceptance above. `tests/commerce-bridge.php` can also run with the installed PHP WASM CLI when native PHP is unavailable.

An opt-in rendering check uses the main site's public Stripe test configuration with a mocked cart: `LLD_REAL_STRIPE_MOUNT=1 npx playwright test --config playwright.checkout.config.js --grep 'real Stripe test-mode'`. It verifies that the real card field is visible and accepts focus, saves `test-results/stripe-fields-real.png`, and never enters card data or submits a payment. This check passed with bridge 0.2.3 installed, alongside all 24 mocked checkout checks.

Reviewed contracts: [Stripe Gateway 11.0.0](https://github.com/woocommerce/woocommerce-gateway-stripe/tree/11.0.0), [WooCommerce 11.1.2 checkout](https://github.com/woocommerce/woocommerce/blob/11.1.2/plugins/woocommerce/src/StoreApi/Routes/V1/Checkout.php), [Store API Cart Tokens](https://developer.woocommerce.com/docs/apis/store-api/cart-tokens/).
