# Client handoff review — October 1, 2026

The app can be reviewed as a preview. These items remain before a public sales launch:

1. **Live checkout release.** `wordpress/longlife-headless-commerce/checkout.php` explicitly requires Stripe test mode, a `pk_test_` key, Stripe Gateway 11.0.0 and WooCommerce 11.1.2. The read-only live configuration check also returned `testMode: true`. Real payments require a separately validated implementation/configuration release, not just changing the Stripe dashboard toggle. Complete the payment, authentication, cancellation, duplicate-submission and protected-download acceptance checks in `HEADLESS-CHECKOUT-SETUP.md`.
2. **Contact and newsletter configuration.** The forms now use the signed WordPress bridge. Upload commerce plugin **0.5.0**, select the MailPoet list under **Settings → General → Longlife storefront newsletter**, and check MailPoet sending/confirmation settings. Deploy the frontend/API and verify an actual Contact message reaches `support@longlifedigital.co` and a newsletter signup/confirmation reaches the chosen list. See `CONTACT-NEWSLETTER-SETUP.md`.
3. **Production configuration.** Confirm the final domain/HTTPS, Vercel Production environment variables, exact `STOREFRONT_ORIGINS`, production cookie secret, bridge secret, and matching WordPress/WooCommerce installation URLs. Update CMS Site Settings to the final storefront URL. Install the current commerce and product-content plugins. Keep secrets server-only. This review did not change hosted configuration or DNS.
4. **Client content approval.** Set `VITE_DEMO_REVIEWS=false` for the production build; approve published service/product details, pricing, contact information, policies, and verified statistics. Verify product files and download permissions.
5. **Final-domain smoke check.** After deployment, check direct page URLs and refreshes, registration/password emails and login, service inquiry delivery to the actual mailbox, checkout/payment and downloads. Check WordPress/Vercel logs for persistent throttling and errors. Rebuild when initial HTML/SEO snapshots need updated published content.

The recurring local 502 diagnosis and request-pacing fix are documented in
`LOCAL-SERVER-TROUBLESHOOTING.md`. The local 502 fix requires deploying the frontend/server code; the Contact and
MailPoet integration additionally requires the plugin upload described above.
