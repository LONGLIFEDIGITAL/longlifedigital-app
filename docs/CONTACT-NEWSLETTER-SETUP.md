# Contact and MailPoet setup

The general Contact form sends to **support@longlifedigital.co** with subject
**Longlife Digital Contact Inquiry**. It uses WooCommerce’s HTML email wrapper
and mail transport, like the service inquiry form. FluentSMTP continues to
control the WordPress sender/transport. The visitor’s email is Reply-To, never
From. Service inquiries still go to their existing recipient.

## Install

1. Upload `docs/cms/Longlife-Headless-Commerce.zip` through WordPress → Plugins →
   Add New → Upload Plugin, and replace the installed plugin. This release is
   **0.5.0**. Activate WooCommerce and MailPoet.
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
