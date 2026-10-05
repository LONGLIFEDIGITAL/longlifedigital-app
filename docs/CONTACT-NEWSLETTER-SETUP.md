# Contact and MailPoet setup

The general Contact form sends to **support@longlifedigital.co** with subject
**Longlife Digital Contact Inquiry**. It uses WooCommerce’s HTML email wrapper
and mail transport, like the service inquiry form. FluentSMTP continues to
control the WordPress sender/transport. The visitor’s email is Reply-To, never
From. Service inquiries still go to their existing recipient.

## Install

1. Upload `docs/cms/Longlife-Headless-Commerce.zip` through WordPress → Plugins →
   Add New → Upload Plugin, and replace the installed plugin. This release is
   **0.5.4**. Activate WooCommerce and MailPoet.
2. In MailPoet → Lists, create or choose a regular newsletter list.
3. In WordPress → Settings → General, select that list under **Longlife storefront
   newsletter**, then save. Choosing “Disabled — select a list” disables signup.
   Automated WooCommerce/system lists and trashed lists are excluded.
4. Check MailPoet’s sending method and signup-confirmation settings. MailPoet has
   its own sending configuration; successful WooCommerce/FluentSMTP mail alone
   does not verify MailPoet delivery. Configure any desired welcome automation
   for the selected list.
5. Deploy the frontend/API changes to Vercel. The existing bridge secret,
   WordPress/WooCommerce URL, and storefront-origin settings are reused; no new
   browser key or MailPoet secret is needed. For local development, restart Vite.
6. Submit one Contact message and one newsletter signup with an address you
   control. Verify the support inbox, FluentSMTP log, MailPoet subscriber list,
   and confirmation email (if enabled); complete the confirmation link.

The homepage and popup submit to the same selected list. Signup requires explicit
consent. MailPoet decides whether the subscriber is subscribed or unconfirmed,
according to its signup-confirmation settings. Existing profiles are not
renamed, current list members are not duplicated, and bounced/suppressed/trashed
subscribers are not reactivated. A pending subscriber can retry using MailPoet’s
confirmation flow. Changing the selected list affects future signups; it does
not migrate existing subscribers.

CMS continues to control newsletter copy and visibility. Use a success message
such as “Thank you for signing up” that fits both single and double opt-in. The
app also displays “Check your inbox for any confirmation steps.”

## Personal newsletter discounts (0.5.3)

Newsletter signup and discount redemption do not require a customer account.
MailPoet issues personal coupons; WooCommerce validates their billing-email
restrictions, expiry, usage limits and final checkout total.

1. In MailPoet, enable signup confirmation and use a subscription-triggered
   welcome automation for the storefront's selected newsletter list.
2. Keep **Run automation once per subscriber** enabled. Edit its email's Coupon
   block and choose **Create new**, replacing the existing shared `WELCOME10`.
3. Set **Percentage discount = 10**, **Usage limit per coupon = 1**, and
   **Usage limit per user = 1**. Enable **Restrict to subscriber email** (called
   **Limit this coupon to the recipient’s email address** in the block editor).
   Leave additional allowed emails empty. The restriction is available in
   automation emails; a normal newsletter can generate a shared code instead.
4. Save/activate the email. Stop any other welcome email that would issue another
   discount. Keep subscriber/automation history to preserve once-per-subscriber
   delivery; do not delete and recreate subscribers to resend this offer.
5. Upload plugin **0.5.4** from `docs/cms/Longlife-Headless-Commerce.zip`, replacing
   the old plugin, then deploy the app/API. Manage coupon availability under
   **Marketing → Coupons**. Trash `WELCOME10` if retiring the shared offer, or
   keep it published with its own restrictions if offering a public discount.
   The plugin does not block specific coupon codes; WooCommerce validates them.
6. Subscribe with an address you control, confirm, and inspect the generated
   Woo coupon: correct allowed email, 10%, total usage limit 1. At guest checkout,
   enter that billing email and apply the personal code. Verify a different email
   and a previously redeemed code are rejected, including if the billing email
   changes after application.

The storefront sends the current billing email to Woo before applying a coupon
when one is entered. No account or MailPoet lookup is used to authorize redemption.
A published site-wide coupon still works according to its own Woo settings.
These coupons reward a confirmed signup; later unsubscribing does not revoke an
already-issued personal coupon. Email restrictions match the billing address;
anyone given both the personal code and its email can use them, so these are not
identity-verification credentials.

If you retire `WELCOME10`, existing recipients need a replacement coupon; retiring
that code does not automatically resend the welcome email. Do not reset the
entire automation's once-per-subscriber history.

Local coverage: `node --test tests/commerce.test.mjs`,
`php tests/account-bridge.php`, and the personal-coupon checkout browser test.
These use stubs/mocks; live MailPoet coupon generation and redemption require the
WordPress setup above.

References: [MailPoet coupon setup](https://kb.mailpoet.com/article/399-adding-a-discount-coupon-to-emails)
and [WooCommerce coupon settings](https://woocommerce.com/document/coupon-management/).

## Failure handling

Forms show errors and retain entered values on failure. Browser requests time
out after 25 seconds; the API’s WordPress request times out after 20 seconds.
Retries reuse the same request ID until the inputs change or the request succeeds.
WordPress retains idempotency hashes for 24 hours, and shares the service inquiry
rate limiter (5 per email / 10 per client in 15 minutes). Raw contact messages are
not stored in the app database; newsletter subscribers are stored by MailPoet.

WordPress → WooCommerce → Status → Logs → `lld-forms` records provider failures
without email addresses, message content or tokens. Missing MailPoet/list
configuration produces an unavailable response rather than a false success.
A successful submission means the mail transport/provider accepted it, not that
an email has reached the recipient’s inbox.

API references: [MailPoet addSubscriber](https://github.com/mailpoet/mailpoet/blob/trunk/doc/api_methods/AddSubscriber.md)
and [subscribeToList](https://github.com/mailpoet/mailpoet/blob/trunk/doc/api_methods/SubscribeToList.md).
