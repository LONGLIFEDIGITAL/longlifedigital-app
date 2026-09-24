# Longlife Digital LLC

## CMS & Commerce Integration Plan

Vercel · WordPress · WooCommerce · Stripe
Updated September 23, 2026

Commerce and customer-account decisions are detailed in [Headless Commerce & Customer Accounts](Longlife-Digital-Headless-Commerce-Architecture.md). That architecture supersedes earlier hosted-checkout and Firebase proposals. The guest-checkout foundation is prepared locally for test-mode installation; see [setup and acceptance](HEADLESS-CHECKOUT-SETUP.md). Customer account implementation follows payment acceptance. The older PDF export has not been regenerated and is not the current architecture.

Host the customer-facing React/Vite/Mantine app on Vercel. Administrators work exclusively in WordPress/WooCommerce. WordPress owns customer identity and WooCommerce owns digital delivery; customer-facing checkout and accounts stay in React.

## 1. Define what each platform owns

| Platform | Responsibility |
|---|---|
| Vercel | Host the React/Vite storefront, deployments, and preview environments. |
| Vercel Functions | Run secure API integrations, webhook handlers, and download authorization. |
| WordPress | Own customer identity, authentication/session records, content and the staff admin interface. |
| WooCommerce | Own products, carts, checkout, prices, coupons, taxes, customer commerce records, orders, refunds and protected downloads; connect Stripe through its WooCommerce gateway. |

- Firebase is out of scope. Vercel Functions mediate customer requests; WordPress and WooCommerce retain authoritative records in their existing database.
- Keep WooCommerce authoritative for prices and orders. Any asset or service listing sold through checkout must reference its WooCommerce product.
- Keep layouts and responsive behavior in React/Mantine. Staff edit structured content in WordPress and preview changes on the React site.

> Primary flow: React on Vercel → WordPress/WooCommerce APIs. Privileged operations → Vercel Functions. Approved file access → WooCommerce protected downloads.

Planning basis: the current app, LONGLIFE DIGITAL LLC.pdf, and MVPs.pdf. The PDFs inform this proposal; their broader business recommendations do not automatically become implementation tasks.

## 2. Organize and migrate the content

- Inventory hardcoded data in src/constants/data.js, page components, navigation, footer, and chatbot configuration. Review sample products, domains, testimonials, and statistics before publishing them.
- Define structured fields for headings, descriptions, images, buttons, featured sections, contact details, and page metadata. Expose approved content through the WordPress REST API.
- Services: descriptions, packages, starting prices, and consultation options. Products: catalog details, categories, WooCommerce prices, and restricted file references. Assets: domains and ready-to-launch websites, availability, asking prices, and inquiry options.
- Import the approved initial catalog with stable IDs and slugs. Link related service and asset entries to WooCommerce products where direct checkout applies.

## 3. Establish the backend connections

- Use `https://longlifedigital-zmuro.wpcomstaging.com` for all WordPress/WooCommerce features, per the owner’s latest instruction. Keep Stripe in test mode until acceptance is complete; do not mix product, content or customer IDs from the other installation.
- Build shared API services and React hooks for customer features. Use WordPress APIs for content and WooCommerce Store API for carts. Keep privileged integration credentials on the server; staff administration stays in WordPress.
- Build on the existing root-level api/ structure using Vercel Functions. Add webhook, integration, and protected-download endpoints; keep secrets in server environment variables.
- Configure WooCommerce downloadable products and host-supported file protection. Keep customer authentication separate from Store API cart identity, with a dedicated WordPress account/session integration behind Vercel.

## 4. Connect the existing pages gradually

- Start with the homepage, navigation, footer, and general pages. Then connect the shop, product details, services, assets, and blog.
- Add loading indicators, empty states, error handling, caching, and refresh behavior after publication. Keep unpublished content behind authenticated preview access.
- Introduce stable page and product URLs for bookmarks, shared links, account access, and checkout returns. Plan page metadata and prerendering where needed for search indexing.
- Preserve the responsive presentation and customer interactions while replacing their data sources. Remove hardcoded fallbacks after each migrated feature is verified.

## 5. Move commerce into WooCommerce

- First prove one complete purchase using the selected WooCommerce gateway. Validate the headless payment integration early, including required payment data, redirects, and customer authentication challenges.
- Keep checkout inside React. Validate the installed WooCommerce Stripe Gateway 11.0.0 with WooCommerce 11.1.2 before implementing the adapter; do not substitute a redirect to the WordPress checkout. External payment authentication is allowed where required.
- Send product IDs and quantities to WooCommerce and use its calculated totals, discounts, availability, and applicable taxes. Preserve cart identity across navigation and checkout.
- Have the gateway confirm payment to WooCommerce. Verify WooCommerce webhook signatures in Vercel Functions and confirm paid order status before fulfillment. Process retries without duplicating delivery.
- Replace the current standalone Stripe payment flow once the WooCommerce replacement is verified. Display persisted order numbers and status from WooCommerce.

## 6. Implement secure fulfillment

- Separate public previews from protected WooCommerce product files. Configure native download permissions, limits and expiry, and verify that direct file URLs are not publicly accessible.
- On each download request, verify account or guest-order ownership and WooCommerce download eligibility. Use WooCommerce’s protected delivery mechanism and enforce its permission, expiry and limit rules.
- Use the right fulfillment process: automatic downloads for digital products, onboarding for services, and a tracked ownership-transfer process for domains and websites. Prevent a unique asset from being sold twice.
- Send purchase confirmations and download-access instructions. Support both registered-customer history and verified guest access; guest checkout is required.
- Handle failed payments, refunds and canceled orders consistently. Recheck current eligibility before new downloads; already downloaded files cannot be recalled.

> First milestone: one CMS-driven product → successful test payment → persisted WooCommerce order → verified access → protected WooCommerce download.

## 7. Centralize administration in WordPress

- Keep customer sign-up/sign-in, purchase history, and downloads in React. Use WordPress/WooCommerce as the primary identity and define how Vercel verifies customer sessions. Guest checkout remains available. Registration is optional, and prior guest purchases require verified ownership before association with an account.
- Use WordPress/WooCommerce as the only admin interface. Assign Editor, Shop Manager, or Administrator roles according to responsibilities, with permissions enforced server-side.
- Migrate product/contact editing, team access, orders, and subscriber management into WordPress screens or integrations. Staff manage downloadable product files there; no React management screens are retained.
- After workflow validation, remove the React admin dashboard, admin login and shortcut, edit/delete controls, and browser-only role/password code. Preserve customer account and purchase screens.
- Persist form submissions and newsletter subscriptions, with staff management in WordPress. Confirm their storage owner and email service. Supply the chatbot with current published content.

## 8. Roll out in manageable stages

- Foundation: confirm WordPress hosting, staff roles, environments, gateway support, customer sessions, catalog, and storage access. Prove the single-product purchase and delivery milestone.
- Migration: connect the remaining pages, catalog, customer accounts, and forms. Verify WordPress publishing, preview, file uploads, and all staff workflows before retiring the React admin screens.
- Launch: verify payments, refunds, webhook retries, customer access, staff permissions, content updates, and mobile layouts. Confirm admin controls are removed from React. Add logs, retries, and backups.
- Keep a rollback path and label test data clearly on the selected main installation. Retire obsolete payment endpoints after validation. Reuse the same WordPress user identity for future subscriptions, courses and portals; those features receive their own scope.

## Official references

- [Vercel: Vite and API functions](https://vercel.com/docs/frameworks/frontend/vite)
- [WordPress: REST support for custom content](https://developer.wordpress.org/rest-api/extending-the-rest-api/adding-rest-api-support-for-custom-content-types/)
- [WooCommerce: Stripe integration](https://woocommerce.com/document/stripe/)
- [WooCommerce: checkout and payment data](https://developer.woocommerce.com/docs/apis/store-api/resources-endpoints/checkout/)
- [WooCommerce: webhook integration](https://developer.woocommerce.com/docs/best-practices/urls-and-routing/webhooks/)
- [WooCommerce: protected digital downloads](https://woocommerce.com/document/digital-downloadable-product-handling/)
- [WordPress: REST authentication](https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/)
- [WordPress: staff roles and capabilities](https://wordpress.org/documentation/article/roles-and-capabilities/)
- [WooCommerce: Shop Manager permissions](https://woocommerce.com/document/roles-capabilities/)

Source documents: LONGLIFE DIGITAL LLC.pdf and MVPs.pdf, provided by the user.
