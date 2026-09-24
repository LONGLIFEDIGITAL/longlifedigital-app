# LongLife Digital — Headless Commerce & Customer Accounts

Updated September 23, 2026. Architecture decision and implementation status.

This replaces the earlier hosted-checkout handoff and Firebase proposals. The **guest cart/checkout/confirmation bridge is prepared locally for test-mode installation**, with [setup and acceptance instructions](HEADLESS-CHECKOUT-SETUP.md). Main-site cart operations were exercised against product 318. A real integrated payment is pending plugin installation and the server-only bridge secret. Customer accounts, dashboard, recovery and guest linking remain planned; this document describes their target behavior, not completed features.

## Platform ownership

| Component | Responsibility |
| --- | --- |
| React + Mantine on Vercel | Shopping, cart, guest/account checkout choice, payment form, confirmation, login, registration, password reset, profile and customer dashboard. |
| Vercel Functions | Same-origin customer API, secure cookies, request validation, authorization coordination, WooCommerce proxying and verified webhook handling. Privileged credentials stay here or in WordPress. |
| WordPress | Canonical user identity, password verification, customer registration, account verification/recovery, revocable customer session records, content and staff administration. |
| WooCommerce | Products, authoritative cart totals, coupons, taxes, order creation, customer/order association, payment status, refunds and download permissions/delivery. |
| WooCommerce Stripe Gateway | Creates/processes Stripe payments for WooCommerce orders and receives Stripe's gateway webhooks. React uses Stripe's secure payment components and required authentication flows. |

Firebase Authentication, Storage and Firestore are out of scope. WordPress's existing database holds identity and durable integration records; no separate customer database is planned.

## Environment decision

Use `https://longlifedigital-zmuro.wpcomstaging.com` for content, products, accounts, carts, checkout and downloads, as instructed by the owner. Do not send commerce requests or create customer records on `staging-a7b0-longlifedigital-zmuro.wpcomstaging.com`.

Owner-reported installed versions:

- WooCommerce: **11.1.2**.
- WooCommerce Stripe Gateway: **11.0.0**.
- WooCommerce PayPal Payments: **4.1.3**.

Stripe remains in **test mode** for implementation and acceptance testing. Initial payment integration targets Stripe; installed PayPal is not automatically compatible with a custom React checkout and needs its own adapter/testing before inclusion. Using the main WordPress installation supersedes the earlier separate-staging requirement; use clearly labeled test customers, orders and products there. No live-payment or production-deployment change is implied.

The exact Stripe 11.0.0 and WooCommerce 11.1.2 source contracts have been reviewed. Installed gateway compatibility, 3D Secure and webhook/download behavior still require a real test-mode acceptance run. The main public product API and isolated guest cart add/update/remove succeeded; the bridge endpoint returned 404 before installation.

## Customer journey

1. A visitor adds products to the WooCommerce cart from React, without an account.
2. React checkout offers **Continue as guest**, **Sign in**, and **Create an account**. Account creation is optional, not a condition of purchase.
3. React collects billing/checkout details. WooCommerce recalculates discounts, taxes and the total; the customer reviews the authoritative amount.
4. Stripe's secure components collect payment details. The WooCommerce Store API submits the order and invokes the installed gateway. Any Stripe intent belongs to that same WooCommerce order.
5. React handles any required payment authentication. A WordPress checkout page is not the ordinary customer destination.
6. React retrieves verified WooCommerce order status. Successful submission or a Stripe return alone does not mean the order is paid.
7. Eligible paid orders receive WooCommerce-authorized download access. Pending, failed, canceled and refunded states have explicit behavior.
8. Guests can optionally register after purchase. Registered customers can view their profile, orders, purchased products and currently available downloads in React.

## Two independent sessions

**Cart session:** use WooCommerce's native Store API and its supported Cart-Token/session mechanism. Vercel retains the Cart-Token behind a separate HttpOnly cookie or server session reference. Only product IDs, quantities, coupon codes and validated customer fields are submitted; payment amounts and eligibility come from WooCommerce. A cart token is not customer authentication.

**Customer session:** a separate, revocable session identifies a WordPress user. Proposed implementation is a narrowly scoped WordPress customer integration plugin, using WordPress's native authentication/password APIs. Successful login issues a high-entropy session credential; WordPress stores its hash, user ID, expiry and revocation state. Vercel manages the browser-facing Secure, HttpOnly, SameSite cookie and forwards the credential over HTTPS to the customer API. Passwords are used only for authentication, never retained or logged by Vercel.

The plugin must implement registration, email verification, login/logout, password reset and profile operations with role restrictions, CSRF protection, rate limits, generic recovery responses and revocation on relevant security changes. WordPress REST cookie authentication is not by itself a complete cross-origin headless login solution; application passwords and WooCommerce administrative API keys are not shopper login credentials.

For signed-in checkout, the integration must establish verified WordPress customer context server-side before associating the WooCommerce order. Never trust a browser-supplied user/customer ID. Verify the cart/session behavior when signing in, changing accounts and signing out; preserve the current guest cart intentionally without leaking one account's cart or private details to another.

## Account dashboard and guest purchase claims

Proposed React routes:

| Route | Purpose |
| --- | --- |
| `/checkout` | Native billing/payment UI, including optional sign-in/registration. |
| `/order-confirmation` | Verified confirmation or pending/failure status and eligible downloads. |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Customer authentication and recovery. |
| `/account` | Customer overview and profile. |
| `/account/orders` | Paginated order history scoped to the authenticated WordPress user. |
| `/account/downloads` | Currently authorized WooCommerce downloads. |
| `/account/claim-purchase` | Ownership verification for eligible guest purchases. |

A claim requires both an authenticated account and proof of purchase ownership. Send a short-lived, single-use confirmation link/code to the order's billing email; validate it server-side and bind the claim to the intended account and order. An email typed into a form, knowledge of an order number, or an unverified matching account email is insufficient.

Only eligible guest orders can be linked. Do not reassign orders already owned by another customer. Perform the ownership check and assignment atomically, update applicable WooCommerce download permissions through supported APIs, and audit the claim. Repeated or simultaneous claims must not transfer or duplicate access. Account email changes do not silently claim historical purchases.

## Payment and order integrity

- Inspect Stripe Gateway **11.0.0** source/configuration and its Store API payment data before choosing the payment adapter. Support only the payment methods actually implemented and tested.
- Use `/wc/store/v1/cart` and `/wc/store/v1/checkout`. Do not create a parallel Stripe Checkout or standalone PaymentIntent flow that bypasses WooCommerce.
- Use server-validated customer context, gateway-required payment data and WooCommerce totals. Review any total change before payment.
- Handle 3D Secure, declined cards, cancellation, timeouts and delayed confirmation without creating a second charge/order on retry.
- Keep durable checkout-attempt and webhook deduplication records in the WordPress database. A process-local map in a Vercel Function is insufficient.
- Stripe gateway webhooks remain directed to WooCommerce. Any WooCommerce webhooks consumed by Vercel require raw-body signature verification and replay-safe processing; re-read authoritative state when events arrive late or out of order.
- Expose order data only after authenticated ownership or a narrowly scoped, verified guest-order grant. Neither a cart token nor an order number grants access to another customer's history.
- Retain the existing standalone Stripe implementation as rollback/reference material until the WooCommerce flow is validated. Do not enable it as a second active payment path.

## WooCommerce-managed digital delivery

Staff configure downloadable files, limits and expiry on WooCommerce products. Public previews stay separate from purchased deliverables. Verify the host-supported protected download method and direct-file protection; placing a paid file at a public Media Library URL is not protection.

React lists download entitlements returned by the authorized customer/guest-order API. On each download, verify ownership, applicable order/payment/refund status and WooCommerce's permission, expiry and remaining-download rules. Deliver through WooCommerce's protected file mechanism; a controlled download response may originate from WordPress without navigating the customer to its storefront or admin interface.

Guests receive order emails and a verified React recovery/access flow; registration remains optional. Registered customers can return through their dashboard. Apply revocation consistently for canceled/refunded orders, including the agreed policy for partial refunds. Downloaded files cannot be recalled.

WooCommerce's native **Downloads require login** setting must remain off for guest delivery. This does not make files public: guest access still uses WooCommerce's purchase-specific download authorization. Confirm this configuration alongside guest checkout and protected file delivery.

Purchase and recovery emails should link to the React experience where appropriate. Test those templates, guest recovery and password-reset links as part of acceptance, not just the checkout form.

## Implementation sequence

1. **Reconcile the interrupted work:** remove the hosted-checkout path and unused Firebase additions, retain useful Store API/security groundwork, restore a buildable baseline and preserve the previous payment source. This local reconciliation is complete; live integration acceptance is pending.
2. **Prove the gateway contract:** inspect the reported versions on the main installation, confirm test mode and public/API access, and prove one Store API → gateway → WooCommerce order payment including 3D Secure. Resolve incompatibility before expanding UI work.
3. **Complete cart and guest checkout:** authoritative cart operations/totals, native React checkout, idempotent submission, verified order confirmation, guest recovery and protected WooCommerce download.
4. **Add customer identity:** the WordPress account/session integration, React registration/login/verification/reset/logout, profile and session-security checks. Bind signed-in orders to verified customers while keeping guest checkout available.
5. **Add dashboard and purchase claims:** orders, products, downloads, verified guest linking, email links and revocation/refund checks.
6. **Run acceptance and prepare launch:** full payment/error/security checks, mobile and desktop flows, then retire the old payment path only after success. Live Stripe mode and deployment are separate release actions.

## Acceptance checks

Use **318 — Small Business AI Prompt Pack** on the main installation. The owner confirmed purchase email delivery and migration of ACF/pages/settings. Confirm its protected downloadable file during payment acceptance. Do not reuse IDs from the other installation.

- Guest checkout completes inside React and produces the correct paid WooCommerce order and protected download.
- Registered checkout associates the order with the correct WordPress user and shows it in the React dashboard.
- 3D Secure success/cancellation, card decline, pending confirmation and interrupted requests show accurate states.
- Duplicate clicks, retries and replayed/out-of-order webhooks do not duplicate charges, orders or fulfillment.
- No download is issued for unpaid/ineligible orders or to another customer. Expiry, limits, refunds and cancellations are enforced.
- Registration is optional, both before and after purchase. Verification/reset links return to React.
- Guest claims require verified ownership and are single-use; another customer's order cannot be claimed.
- Login/logout, session expiry/revocation and account switching preserve the intended cart without leaking private data.
- Private credentials, raw card details, session tokens and protected file locations are absent from public responses, frontend bundles and logs.

## Official references

- [WooCommerce Cart Tokens](https://developer.woocommerce.com/docs/apis/store-api/cart-tokens): supported headless cart identity; distinct from customer login.
- [WooCommerce Checkout API](https://developer.woocommerce.com/docs/apis/store-api/resources-endpoints/checkout): order/payment submission and gateway-specific payment data.
- [WordPress REST authentication](https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/): native REST authentication capabilities and boundaries.
- [Official WooCommerce Stripe gateway source](https://github.com/woocommerce/woocommerce-gateway-stripe): inspect the installed release before implementing its adapter.
- [WooCommerce digital/downloadable products](https://woocommerce.com/document/digital-downloadable-product-handling/): verify download protection, permissions and configuration on the actual host.
