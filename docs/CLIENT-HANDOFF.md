# Client handoff review — October 1, 2026

## Favicon update — October 16, 2026

The user still saw Vite's icon while testing locally after adding a version to `/logo.png`. The running Vite server at `http://localhost:5173` served the updated HTML and the correct LD logo, but that logo was a 1 MB, 1254-pixel image and there was no `/favicon.ico` fallback. This confirmed the local files were current; it did not establish why the user's browser retained the Vite icon.

Replaced those favicon references with dedicated assets exported from the existing `public/logo.png`: 16- and 32-pixel PNG favicons, a multi-size `favicon.ico` (16/32/48 pixels), a 180-pixel Apple touch icon, and 192/512-pixel manifest icons. `index.html` declares the icon sizes and uses version `2026101602`; `public/site.webmanifest` uses the same version. The full-size brand logo is unchanged. When replacing the logo, regenerate these assets and increase the version in both files.

Verified in a fresh Chromium context that the homepage and translation request page expose the new icon links, every linked favicon responds with an image, and the 32-pixel PNG decodes correctly. The unversioned `/favicon.ico` fallback and manifest icon requests also pass. The Vite build in test mode passes. Safari's actual tab display has not been verified. Reload or reopen the local dev tab to pick up the new icon declarations; no deployment is needed for localhost. Production still needs the updated files committed and deployed; no production deployment was performed.

## Original launch checklist

The app can be reviewed as a preview. These items remain before a public sales launch:

1. **Checkout compatibility fix (updated in 0.5.9).** The live configuration rejected WooCommerce 11.2.1 because 0.5.8 pinned exact patch versions. The bridge/app now accept stable Stripe Gateway 11.0.x and WooCommerce 11.1.x (from 11.1.2) / 11.2.x releases in either Stripe mode. Replace the WordPress plugin ZIP and deploy the app/API; pushing to Vercel alone cannot update WordPress. Confirm the storefront config returns `enabled: true` with no `configurationIssues`. Automated tests use mocks, not live charges. Complete installation acceptance in `HEADLESS-CHECKOUT-SETUP.md`.
2. **Contact and newsletter configuration.** The forms now use the signed WordPress bridge. Upload commerce plugin **0.5.0**, select the MailPoet list under **Settings → General → Longlife storefront newsletter**, and check MailPoet sending/confirmation settings. Deploy the frontend/API and verify an actual Contact message reaches `support@longlifedigital.co` and a newsletter signup/confirmation reaches the chosen list. See `CONTACT-NEWSLETTER-SETUP.md`.
3. **Production configuration.** Confirm the final domain/HTTPS, Vercel Production environment variables, exact `STOREFRONT_ORIGINS`, production cookie secret, bridge secret, and matching WordPress/WooCommerce installation URLs. Update CMS Site Settings to the final storefront URL. Install the current commerce and product-content plugins. Keep secrets server-only. This review did not change hosted configuration or DNS.
4. **Client content approval.** Set `VITE_DEMO_REVIEWS=false` for the production build; approve published service/product details, pricing, contact information, policies, and verified statistics. Verify product files and download permissions.
5. **Final-domain smoke check.** After deployment, check direct page URLs and refreshes, registration/password emails and login, service inquiry delivery to the actual mailbox, checkout/payment and downloads. Check WordPress/Vercel logs for persistent throttling and errors. Rebuild when initial HTML/SEO snapshots need updated published content.

The recurring local 502 diagnosis and request-pacing fix are documented in
`LOCAL-SERVER-TROUBLESHOOTING.md`. The local 502 fix requires deploying the frontend/server code; the Contact and
MailPoet integration additionally requires the plugin upload described above.
