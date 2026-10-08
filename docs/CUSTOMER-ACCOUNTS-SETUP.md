# Customer accounts

The storefront now supports WordPress/WooCommerce customer accounts. No new authentication provider or client-side secret is required.

## Activate on WordPress and Vercel

1. Upload `docs/cms/Longlife-Headless-Commerce.zip` under **WordPress → Plugins → Add New → Upload Plugin** and replace the existing Longlife Headless Commerce plugin with **0.5.7**. Deploy the frontend first for the newsletter confirmation page described below. Keep the existing integration secret and checkout settings. If this is a first installation, activate the plugin to create its database table and secret.
2. In **WooCommerce → Settings → Accounts & Privacy**, enable customer registration on the **My account** page (`woocommerce_enable_myaccount_registration`). Keep guest checkout enabled. The React registration flow uses these WooCommerce accounts and does not require an ACF page.
3. Ensure WordPress can deliver password-reset emails. Registration emails contain a link to the React `/reset-password` page. New customers choose their password through that email before logging in. If delivery fails, fix the mail setup and use **Forgot password** to resend.
4. In Vercel, keep the existing server-only `COMMERCE_SESSION_SECRET` and `LLD_COMMERCE_BRIDGE_SECRET`, and the existing public WooCommerce Store API URL and `VITE_HEADLESS_COMMERCE=true`. Keep every storefront origin used for login in `STOREFRONT_ORIGINS` (including the exact preview branch URL). Redeploy this app after updating the plugin. No new environment variables are needed.
5. Try a new registration with an inbox you control, follow the emailed link, log in, then place a Stripe **test-mode** order while logged in. Verify the WooCommerce order has the correct customer and appears under **My account → Orders**. Also confirm guest checkout still works.

Plugin replacement preserves existing WordPress users, orders, settings and the integration secret. The updated ZIP is generated from the plugin source; no customer data or credentials are included.

## Customer email links

Version **0.5.6** routes WordPress/WooCommerce customer account email links to the React storefront. In **Site Settings → Storefront → Brand**, set **Public storefront URL** (`lld_brand.website`) to the deployed frontend origin, normally `https://longlifedigital.co`, and publish the record. Use an HTTPS origin with no path, query or fragment. If ACF, the published record or a valid URL is missing, the plugin leaves the original email URLs intact.

- WordPress new-user and password-reset notifications for customers/subscribers, and WooCommerce new-account/password-reset links, open `/reset-password#key=…&login=…`. Existing single-use keys are retained. Staff password notifications stay in WordPress.
- The WooCommerce logo/header link and links to the WordPress homepage open the public storefront. Logo image files continue loading from their existing media URLs.
- Account, orders, downloads and password-recovery navigation use `/account`, `/account?view=orders`, `/account?view=downloads` and `/forgot-password`. HTML, plain-text and WooCommerce multipart text alternatives are covered, including customized WooCommerce account page/endpoint URLs.
- Emails requested through the React register/forgot-password forms retain their verified request origin, so preview/local account testing still works. Their branding uses the published public storefront URL.

Install the ZIP on **longlifedigital-zmuro.wpcomstaging.com**. This email change requires no React deployment or new environment variables. Do not change WordPress's core site addresses or the app's WordPress API addresses to fix email navigation. After installation, request a **new** account/password email and verify its password button, logo and account links. Previously delivered emails do not change.

The app confirms a new account through password setup. A newsletter opt-in token is not interchangeable with a WordPress reset key. MailPoet confirmation is handled separately below. Payment links, protected download URLs, admin actions, external URLs and other plugins' tokenized actions are preserved.

Implementation references: [WordPress new-user email filter](https://developer.wordpress.org/reference/hooks/wp_new_user_notification_email/), [WordPress password notification](https://developer.wordpress.org/reference/functions/retrieve_password/), [WooCommerce email pipeline](https://woocommerce.github.io/code-reference/files/woocommerce-includes-emails-class-wc-email.html), [WooCommerce logo link hook](https://woocommerce.github.io/code-reference/files/woocommerce-templates-emails-email-header.html).

### Newsletter subscription confirmation

Version **0.5.7** also returns MailPoet subscribers to the frontend after they click **Confirm your subscription**. Deploy this app (including the `/newsletter-confirmed` route in `vercel.json`) **before** uploading plugin 0.5.7. The same published **Public storefront URL** sets the destination. No additional MailPoet confirmation page, ACF fields or environment variables are required.

The email link still points to MailPoet on WordPress so MailPoet can verify its token, save the subscription, schedule welcome emails and run confirmation listeners. After successful confirmation, the plugin sends the browser to `<public storefront URL>/newsletter-confirmed`, which displays a thank-you message and suppresses the newsletter popup. The redirect is uncached and sends no subscriber email, token or referrer to the frontend. The frontend page itself never creates or confirms a subscription.

Valid links opened again after confirmation also redirect, including links sent before this update. The repeat-click path checks the existing subscribed state and uses MailPoet's own token verifier before its confirmation handler runs. Invalid/missing tokens, previews, pending changes, unsubscribe/manage-subscription actions and provider failures retain MailPoet's normal handling. Keep signup confirmation enabled and keep the original confirmation shortcode/link in the email; replacing it with a static frontend URL would skip verification.

After deploying both parts, subscribe with an inbox you control, open the confirmation email and verify that you land on the frontend thank-you page and the subscriber is **Subscribed** in MailPoet. Reopening that link should return to the same page. MailPoet subscription management and unsubscribe pages remain on WordPress.

References: [MailPoet confirmation-page behavior](https://kb.mailpoet.com/article/178-customize-your-confirmation-page), [confirmation processing and completion action](https://github.com/mailpoet/mailpoet/blob/trunk/mailpoet/lib/Subscription/Pages.php), [router validation and dispatch](https://github.com/mailpoet/mailpoet/blob/trunk/mailpoet/lib/Router/Router.php).

## Storefront flow

- `/register`: name and email, followed by email verification/password setup. Registration does not issue a login session. Retrying an unverified registration resends its password email without creating another user. Already verified customers receive a generic confirmation and can log in or use Forgot password.
- `/login`: email and password. Customer/subscriber accounts are supported; administrator and shop-manager accounts continue using WordPress admin.
- `/forgot-password`: sends a generic confirmation without revealing whether an email exists.
- `/reset-password`: consumes the WordPress reset key from the email URL fragment, removes it from the address bar, and accepts a new password. Resetting a password revokes prior WordPress sessions. Refreshing after the fragment was removed requires reopening the email link.
- `/account`: responsive purple-and-gold dashboard with order totals, recent orders, purchased items, available downloads, account details, password-reset link and logout. Sidebar sections use shareable `?view=` URLs; order pagination uses `?view=orders&page=2`.
- Navigation menu: Login with an account icon at the bottom, changing to My account after login. Login/registration forms are in the initial app bundle and render without waiting for CMS or session requests. Checkout offers login/registration and keeps guest checkout available. Login returns to checkout when started there.

Guest carts remain guest cart-token sessions, so logging in does not discard their items or merge another device’s cart. At checkout, the signed server-to-WordPress request supplies a server-held WordPress token; WordPress validates it and assigns the order customer before payment. Billing email and browser-supplied customer IDs cannot choose the owner. Older guest orders are not proactively claimed by this integration. Existing WooCommerce order/download emails and order-confirmation downloads remain in place; the account download library exposes WooCommerce permission URLs for the authenticated customer, excluding other customers’ orders and expired/exhausted permissions. Raw file paths are never exposed. Existing WooCommerce download delivery/login settings still apply. A profile/address editor is not included.

## Dashboard deployment

Upload commerce plugin **0.5.1** from `docs/cms/Longlife-Headless-Commerce.zip`, then deploy the app. No new secrets, ACF fields or database migrations are required. The release adds authenticated `downloads` reads and a full order count to the account bridge. Private download data is cleared on logout and account changes.

The Services and Domains dashboard sections provide browsing and support links. There are no customer service-contract or domain-ownership records in the existing integration, so the dashboard does not invent active-service/domain counts. “Available downloads” counts currently eligible files, not lifetime download activity. “My Products” lists order line items with their order status, including pending orders; only WooCommerce-authorized files are downloadable.

## Authentication handling

- WordPress verifies passwords and reset keys using its own APIs. New accounts get an unknown random password until mailbox access is proven.
- A separate encrypted `lld_account` cookie is HttpOnly, SameSite=Lax, Secure in production and expires after seven days. No bearer token is returned to browser JavaScript or stored in localStorage.
- Same-origin mutations use the existing storefront-origin allowlist. Bridge requests are signed and protected against replay with the existing nonce store.
- Registration/login/reset requests share atomic WordPress database rate limits: ten per identity and forty per client per 15-minute bucket. Production client identity uses Vercel’s overwritten `x-vercel-forwarded-for` header; local development uses the socket address.
- Responses are private/no-store. Logout revokes the WP session; password reset revokes all sessions for that customer. Account changes refresh other open tabs.
- Account routes are noindex. Deploy routing includes direct loads of all account routes.
- Account requests have a 25-second deadline covering the local queue, cross-tab lock, fetch and response body. Expired queued requests are cancelled rather than submitted later. Account mutations do not silently pause while offline or retry password changes automatically. If a reset times out after reaching WordPress, try logging in with the new password before requesting another reset link.

Third-party WordPress login/2FA/email-verification plugins may add their own requirements; this storefront does not supply a second-factor UI. Confirm compatibility on staging before requiring such a plugin for customer accounts.

## FluentSMTP / Microsoft 365 email delivery

Bridge **0.3.1** creates the reset key with WordPress and sends the account email through WooCommerce's mailer, including WooCommerce's configured From address and email wrapper. Its normal `wp_mail` transport remains handled by FluentSMTP; no Microsoft credentials belong in React or Vercel. This aligns the sender path with WooCommerce test emails. Deferred Woo welcome emails are skipped only for bridge-created accounts so they cannot replace the password key in the storefront email.

After installing this version, retry registration with the same unverified customer email, or use Forgot password for an existing customer. The recipient is the email entered in the form, not a fixed test recipient. Storefront accounts exclude WordPress administrators/shop managers.

If no email arrives, open **FluentSMTP → Email Logs** and find **Set your Longlife Digital password** at the time of the attempt. Check the actual recipient, From address, and delivery result. FluentSMTP routes by From address, so WooCommerce's sender should match the working Microsoft connection (or use that connection's Force From Email setting). A transport rejection returns an error to React and records a sanitized entry under **WooCommerce → Status → Logs → lld-accounts**. A mailer success means acceptance by the transport, not confirmed inbox delivery; inspect Microsoft quarantine/junk or message trace if FluentSMTP reports success. Never share reset links or provider credentials from logs.

The previous registration implementation returned a generic success without resending when an unverified user already existed, and used WordPress's default reset-mail sender rather than WooCommerce's sender. These code paths were changed in 0.3.1; the cause of any particular missing live email still requires its logs.

### No FluentSMTP entry and no storefront error

Version **0.3.2** adds private decision logs under **WooCommerce → Status → Logs**, source **lld-accounts**. Ensure the WooCommerce logging level includes **Info**, then submit once and check the matching time:

| Event | Meaning / next step |
| --- | --- |
| `register_request_received` | The signed registration request reached this WordPress plugin. |
| `registration_skipped_non_customer_account` | The address belongs to an account excluded from storefront authentication, such as an administrator or shop manager. Use a separate customer email for storefront testing; recover administrative passwords through WordPress. |
| `registration_skipped_existing_customer_use_forgot_password` | The customer already exists and is not pending verification. Use the storefront Forgot password form to request a link. |
| `registration_resending_pending_customer` | A previous unverified registration is retrying its email. |
| `registration_customer_created` | A new customer was created; email preparation follows. |
| `password_email_key_failed` | WordPress could not create a reset key; no email was sent. |
| `password_email_send_attempt` | The plugin reached WooCommerce's mailer. |
| `password_email_transport_accepted` | The mailer returned success; this does not prove inbox delivery. Check FluentSMTP/provider logs next. |
| `forgot_skipped_non_customer_account` / `forgot_skipped_unknown_account` | Recovery intentionally sent no email for an excluded or nonexistent account. |

The logs contain event names, plugin version and customer IDs, never email addresses or reset credentials. Public responses remain generic to avoid exposing whether someone else's account exists. If no request-received event appears with Info logging enabled, confirm the plugin version and that the storefront's WooCommerce API URL points to the WordPress installation whose logs you are viewing. The frontend API also now rejects unexpected upstream success bodies instead of showing an email confirmation for an invalid response.

References: [WooCommerce mailer](https://woocommerce.github.io/code-reference/files/woocommerce-includes-class-wc-emails.html), [FluentSMTP routing](https://fluentsmtp.com/docs/using-multiple-smtp-drivers-with-fluent-smtp/), [Microsoft connection setup](https://fluentsmtp.com/docs/configure-fluentsmtp-with-microsoft-outlook-office/).

## Validation

- `node --test tests/account-client.test.mjs tests/account.test.mjs tests/commerce.test.mjs`
- `php tests/account-bridge.php` (includes the commerce bridge checks)
- `php tests/email-links.php` (includes account/commerce checks, native email reset-key consumption, HTML/plain/multipart links and preserved backend actions)
- `php tests/newsletter-confirmation.php` and `php tests/forms-bridge.php` (MailPoet confirmation redirects and existing opt-in signup behavior)
- `npx playwright test --config playwright.config.js tests/newsletter.spec.js` (confirmation page, direct navigation and popup suppression)
- `PLAYWRIGHT_CHANNEL=chrome npx playwright test --config playwright.account.config.js`

The PHP harness stubs WordPress/WooCommerce primitives and exercises the actual bridge logic. Browser tests use mocked endpoints against an optimized Vite build. Real email delivery and a live staging checkout still require the WordPress deployment steps above.

API references: [WordPress authentication cookies](https://developer.wordpress.org/reference/functions/wp_validate_auth_cookie/), [password recovery](https://developer.wordpress.org/reference/functions/retrieve_password/), [WooCommerce customer creation](https://woocommerce.github.io/code-reference/files/woocommerce-includes-wc-user-functions.html), [Vercel request headers](https://vercel.com/docs/headers/request-headers).
