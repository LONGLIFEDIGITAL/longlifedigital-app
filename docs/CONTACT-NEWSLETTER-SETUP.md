# Contact and MailPoet setup

The general Contact form sends to **support@longlifedigital.co** with subject
**Longlife Digital Contact Inquiry**. It uses WooCommerce’s HTML email wrapper
and mail transport, like the service inquiry form. FluentSMTP continues to
control the WordPress sender/transport. The visitor’s email is Reply-To, never
From. Service inquiries still go to their existing recipient.

## Install

1. Upload `docs/cms/Longlife-Headless-Commerce.zip` through WordPress → Plugins →
   Add New → Upload Plugin, and replace the installed plugin. This release is
   **0.5.2**. Activate WooCommerce and MailPoet.
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

## WELCOME10 subscriber discount (0.5.2)

Keep the existing `WELCOME10` coupon and welcome automation. Under WooCommerce
→ Marketing → Coupons, keep **Usage limit per user = 1**; the total coupon usage
limit can remain unlimited. MailPoet's **Run automation once per subscriber**
controls email delivery; WooCommerce controls redemption.

Upload the **0.5.2** plugin ZIP first, then deploy the storefront/API. No new
secrets or ACF fields are needed. The plugin uses the newsletter list already
selected under WordPress → Settings → General → Longlife storefront newsletter.

The welcome code requires a logged-in customer whose **account email** is
subscribed to that list in MailPoet. Unconfirmed, unsubscribed, bounced, deleted,
and other-list subscribers are rejected. Enable MailPoet signup confirmation to
require double opt-in. Guest shoppers see login/registration links that return
to checkout with the code prefilled; guest checkout and other coupons still work.

WordPress validates eligibility on coupon application and again at checkout.
The account credential is sent only server-to-server, signed together with the
cart request; no browser-supplied customer ID or email establishes eligibility.
WooCommerce's coupon usage records (including pending holds and past guest uses
against the account email) enforce the configured per-user limit. Resubscribing
does not clear those records. MailPoet errors reject the discount with a retry
message instead of accepting an unverified subscriber.

After deployment, verify an eligible subscriber can apply the code, a guest or
non-subscriber cannot, and an already-used code is rejected for that account.
Local coverage: `node --test tests/commerce.test.mjs`,
`php tests/coupons-bridge.php`, and the welcome-coupon checkout browser test.

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
