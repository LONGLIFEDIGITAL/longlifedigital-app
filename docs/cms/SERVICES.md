# Digital services and quote inquiries

## Install once

1. Replace the **Longlife Headless Commerce** plugin with `Longlife-Headless-Commerce.zip` in this folder (version **0.4.4**). This adds the signed inquiry endpoint, consistent email-row alignment, spacing above the reply instructions and a Service page address editor; account and checkout settings remain in place. It uses the existing bridge secret and WooCommerce/FluentSMTP sender.
2. In **ACF → Tools → Import Field Groups**, import `Longlife-Digital-ACF-Services-Update.json`. It updates the existing Page content and Service details groups; no ACF Pro is needed. Export/reconcile any custom edits to those groups before importing. The Services custom post type comes from the original full ACF import and must already exist.
3. In **Tools → Import → WordPress**, import `Longlife-Digital-Services-Content.xml`, assigning the author to your own WordPress user. Install the official WordPress Importer if prompted. This creates five published Services, with their specialties, descriptions and process copy. It does not replace or delete older Services. Review the imported copy and draft any old services you no longer offer. If you already have records with these slugs, update them instead of creating duplicates. Do not repeatedly import the file to update content.
4. Deploy the frontend/API changes. Existing `LLD_COMMERCE_BRIDGE_SECRET`, `VITE_WOOCOMMERCE_STORE_API_URL` and `STOREFRONT_ORIGINS` settings are reused. The content and commerce URLs must point to the same WordPress site. Each deployed storefront origin needs to be allowed, as with account forms. Inquiries do not require the test-checkout toggle to be enabled.

The generated imports are local deliverables; they have not been applied to your WordPress installation. No live inquiry email was sent during automated tests.

## Edit the content

Under **Services**, each published record has a storefront page at `/services/<slug>`:

| Service | Slug |
| --- | --- |
| SEO & Local SEO | `seo-local-seo` |
| Website Design & Development | `website-design-development` |
| AI Automation & Chatbot Setup | `ai-automation-chatbot-setup` |
| Digital Advertising Management | `digital-advertising-management` |
| Business & LLC Launch Services | `business-llc-launch-services` |

- **Title / Excerpt / Content:** service name, short card/hero summary, and detailed explanation.
- **Service page address → Service slug:** edit the last URL segment, such as `portfolio-management`, then Save draft / Publish / Update. This panel appears in the service editor (under Meta Boxes in the block editor). It edits the native WordPress slug used by the storefront and requires plugin 0.4.2; no ACF re-import is needed. Blank input keeps the existing slug; new services can use WordPress's title-derived slug. Reload after saving to see the final saved path, including any suffix WordPress adds for uniqueness. Changing a published slug requires updating existing links; the storefront does not automatically redirect old slugs. The normal Quick Edit slug control is hidden because these headless post types are not publicly queryable on WordPress; keep that setting disabled.
- **Service specialties:** one line per specialty, displayed on the overview card and detail page.
- **Included work / package details** and **What happens next:** formatted detail sections.
- **Service illustration and accent:** choose the icon and color family; SVG icons render consistently across devices.
- **Inquiry form heading / introduction:** editable copy above the form. Field labels, validation and the recipient are intentionally controlled by code.
- **Featured image:** optional detail image. **Order** controls card ordering. SEO fields remain available.
- Existing pricing/CTA fields are retained for compatibility. The redesigned service pages use a quote request, not a fixed-price purchase or the old CTA destination.

Under **Pages → Services**, use the existing `services` slug and **Storefront page = Services**. The display heading, eyebrow and introduction control the hero; **Services overview** controls the card-section heading and introduction. Native page content appears above the cards; the existing closing CTA and service-topic FAQs remain supported.

Suggested hero copy: **Digital services · Human ambition** / **Your next chapter. Built together.** / **From your first business idea to your next stage of growth. Find the digital expertise to move forward with purpose.**

The header link to `/services` automatically lists all published services in its hover/click dropdown, including when the app is using its default navigation. No dropdown setting is required for that link. Other Navigation Links can use **Dropdown content = Published services** to show the same list. In mobile navigation, Services is collapsed each time the menu opens; tap it to reveal View all services and the individual service links. Old `/services#slug` links redirect to the corresponding detail page. Remove or update manually maintained menu links if they refer to retired services.

## Inquiry delivery

Every form requires first name, last name, email and telephone number. Business name and project description are optional. Visitors do not need an account.

The browser posts to `/api/inquiry`. The API validates the allowed origin and fields, then signs a request to WordPress `/wp-json/lld-headless/v1/inquiry`. WordPress checks the signature and the published Service record before sending to **info@longlifedigital.co**. The subject is the current WordPress service title plus **Inquiry**, for example **Website Design & Development Inquiry**. The visitor is the **Reply-To**, while the authenticated WooCommerce/FluentSMTP From address is preserved.

The form has a 25-second deadline, displays failures and preserves fields for retry. Retries with unchanged details retain an inquiry ID to avoid duplicate emails after an ambiguous network response. WordPress retains only a keyed fingerprint and delivery status for about 24 hours, not a public record of personal details. SMTP/email logs may retain the email under your existing FluentSMTP settings. A honeypot and shared rate limits (10 attempts per client / 5 per email every 15 minutes) reduce automated abuse.

Success means the mail transport accepted the message, not proof of inbox delivery. After installation, submit one inquiry and check **FluentSMTP → Email Logs** and the info mailbox. If WordPress reports a transport failure, **WooCommerce → Status → Logs → lld-inquiries** provides a diagnostic without contact details. Sending errors appear on the form; they are never shown as success.

## Maintained source and checks

- `scripts/generate-acf-reference.py`: ACF field schema and reference files.
- `docs/cms/services-content.json` → `python3 scripts/generate-services-import.py`: one-time editorial seed, not runtime fallback/mock data.
- `api/inquiry.js`, `wordpress/longlife-headless-commerce/inquiry.php`: validated signed email flow.
- `src/pages/ServicesPage.jsx`, `ServiceDetailPage.jsx`, `ServicesPage.module.css`: layouts.
- `src/components/ServiceInquiryForm.jsx`: form and error handling.

Focused checks: `node --test tests/inquiry.test.mjs` and `PLAYWRIGHT_CHANNEL=chrome npx playwright test --config playwright.services.config.js`.
