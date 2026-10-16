# Translation service implementation handoff

Last updated: October 15, 2026. Status: ESTIMATED TOTAL UPDATE COMPLETE LOCALLY — deploy the updated app.

## Latest update — include selected extras in the estimate

- User reported that rush and notarization did not increase the base-only amount. Implement an itemized estimated total including selected extras.
- User explicitly confirmed: rush applies to translation charges only, including additional pages, not notarization or delivery. One $45 certificate + 50% rush + $15 notarization = $82.50 with digital delivery.
- Keep rates editable in the existing WordPress fields. Missing rates and standard/custom-priced translation must not produce a misleading complete total. No payments or new upload integration are part of this change.
- Completed `translationPriceBreakdown()` in `shared/translation.js`: calculate translation and extra pages, apply rush to that subtotal only, add per-document notarization and one delivery fee per request. Integer-cent line amounts sum to the displayed estimate. `translationEstimate()` now returns the full estimated total.
- `TranslationRequest.jsx` renders itemized prices and **Estimated total**, updates immediately as extras change, retains the values on review, and replaces the old base-only disclaimer. Standard/unpriced work shows **Custom quote**, with known items still listed. Zero rates remain valid. Landing-page rush guidance and generated ACF help text reflect the confirmed rule.
- Verification passed: 12 inquiry/pricing Node checks (`node --test tests/inquiry.test.mjs`), 4 browser checks (existing quote retry and dependent document flow, mobile extras/review/toggle totals, unpriced extras), optimized test-mode build, targeted ESLint, Prettier and `git diff --check`. Browser command uses the existing executable override and `--grep 'selected extras|unpriced selected extra|guided quote|document dropdown'` with `playwright.services.config.js`.
- Activation: deploy the updated app. No plugin update or ACF/content reimport is required for this change; plugin remains 0.6.3. Regenerated ACF files only update field help text. Email still records the selected extras, not a browser-authoritative payment amount. No live email, charge or deployment was performed.

## Previous update — exact document within a service group (0.6.3)

- User confirmed the earlier fixes work. New request: keep service groups, add a dependent Document dropdown, and email both the group and selected document.
- Implemented optional `documentTypes` lists on existing offerings, edited under **Document choices (one per line)** in the WordPress row editor. Up to 50 unique choices per group, 160 characters each. No hardcoded public list or automatic changes to saved offerings; the original seed is unchanged. Missing/empty lists retain the group-only flow, including existing packages. Configured lists require a valid document selection.
- React shows a dependent **Document** dropdown, clears it on group changes, retains it when going Back, and displays it in the review summary. `api/inquiry.js` allowlists `document`; WordPress checks current group membership and adds a separate **Document** email row after **Document service**. Renamed/removed/mismatched choices produce 422 and a reload message. Changing the document also changes the existing replay fingerprint. Pricing remains group-based.
- Plugin header and admin script cache version are **0.6.3**. All 17 ZIP files were verified byte-for-byte against source. ACF generator/import help text updated; field keys and stored content structure stay backward-compatible. Existing row-editor users need no ACF reimport or content XML reimport.
- **Verification:** 22 Node checks passed (`node --test tests/inquiry.test.mjs tests/content-bootstrap.test.mjs`); PHP mail/catalog/escaped-save/choice-membership checks passed; 4 targeted browser checks passed (guided quote retries, dependent dropdown/mobile review/submission, existing catalogs/packages, WordPress row editor). Browser config also completed the optimized test-mode build. Targeted ESLint passed. No live WordPress save, actual email or production deployment performed.
- Browser command: `PLAYWRIGHT_EXECUTABLE_PATH='/Users/handersoncoq/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell' node node_modules/@playwright/test/cli.js test --config playwright.services.config.js tests/translation.spec.js --grep 'document dropdown|WordPress row editor|guided quote|CMS document edits'`.
- Activation order: replace WordPress plugin with 0.6.3, deploy app/API, then enter choices in existing groups and Update. Example for certificates: Birth certificate / Marriage certificate / Death certificate, each on its own line. Later content edits need only WordPress Update and the normal cache refresh. Detailed instructions are at the top of `docs/cms/TRANSLATION-SERVICE.md`.

## Latest save-validation fix — plugin 0.6.2

- Reproduced the user's save failure: `acf/validate_save_post` forwards WordPress-slashed POST values to `acf/validate_value`. The custom validator tried to decode that transport value directly as JSON, rejecting otherwise valid lists and blocking unrelated Service edits.
- Fixed `lld_translation_offerings_validate()` to remove one WordPress escaping layer only when the incoming string is not already valid JSON. Stored-value decoding remains strict. No changes to saved content, row schema, permissions or public APIs.
- Regression added in `tests/translation-inquiry.php`: WordPress-style escaped submissions, hidden rows, blank/zero rates, quotes, apostrophes, backslashes and Unicode; invalid rows/duplicates still rejected, previous ACF errors retained, stored-value decoding unchanged.
- Confirmed regression failed against 0.6.1, then passed after the fix. Existing PHP inquiry/catalog/legacy-upgrade checks also passed. This is an isolated simulation of request escaping, not a live WordPress save test. No browser/app changes in this fix.
- Repackaged plugin 0.6.2; archive verified against all 17 source files. No ACF JSON or XML reimport and no Vercel redeploy required for this fix when 0.6.1 is already installed.
- Owner next step: replace the plugin via the ZIP, reload the translation Service edit screen, and retry Update. Preserve existing entries/prices.
- Technical references: https://developer.wordpress.org/reference/functions/wp_magic_quotes/ and https://github.com/AdvancedCustomFields/acf/blob/master/includes/validation.php .

## Earlier follow-up completed

- Translation document, custom-quote and package cards are clickable across their full area via the existing links. Visible calls to action remain, document links identify the selected offering, and keyboard focus outlines the full card. No tests run for this small UI follow-up, per the user's request; verification below predates it.
- Service specialties now appear as labels below the translation landing-page introduction, using the existing Service details field. The Services overview continues using that field too.
- Document types and packages are editable in **Services → Document Translation → Translation service → Documents and packages offered**. Add, remove, hide, reorder, name, describe and price entries, including the package document count. No ACF Pro is needed.
- The ACF `lld_translation_offerings` textarea stores JSON, enhanced into row controls by `translation-offerings-admin.js` and CSS. The editor does not ask the client to edit JSON. `translation-offerings.php` validates saved rows and supplies backward-compatible starter values for previously configured services.
- React pricing cards, the quote selector, estimates and WordPress email validation use this catalog. There are no fixed frontend document IDs. WordPress rejects removed/hidden entries with a specific 422, even for stale open forms. Empty catalogs remain empty.
- Existing document rates (including blank and zero prices) carry over into starter rows when upgrading. Saved lists never repopulate deleted entries. Original prices survive as legacy post metadata, while current rates are edited in rows.
- Home hero ebook mockups were constrained by a fixed-height exception. All hero images now use the card content width and natural aspect ratio, keeping ebook corners square and the product-details link intact.
- Plugin ZIP **0.6.2** contains **17 files**, verified byte-for-byte against source. Updated schema/imports and guide included. The XML contains one service with **37 valid ACF field references**; do not reimport it for an existing service.
- **Verification:** 21 Node checks passed (12 bootstrap + 9 inquiry/catalog); PHP mail-boundary, catalog validation and legacy-price compatibility checks passed. All 8 browser scenarios passed across the initial run (7 passed) and one targeted rerun. That rerun corrected the test fixture to clear its still-fresh browser content cache before simulating a newly empty catalog. Optimized test-mode build, targeted ESLint, Prettier, source-file and diff checks passed.
- Browser tests cover standard services, translation discovery/specialties/mobile, quote submission/retry, credentials/provider handoff, CMS document changes/empty catalog, row editor operations and hero ebook width/aspect ratio at 393px and 1440px. They use mocked CMS/mail and a local editor fixture, not the live WordPress admin.
- Jotform remains only a possible future provider. The user will discuss cost with the client. No provider was purchased, activated or configured; actual uploads and payments remain unconnected.

## Immediate next steps for the owner

For the latest estimated-total fix, deploy the updated app only. The steps below apply if the earlier document-dropdown update has not yet been activated.

1. Install `docs/cms/Longlife-Headless-Commerce.zip` version **0.6.3**.
2. Deploy the updated app/API before configuring document choices. Import `docs/cms/Longlife-Digital-ACF-Translation-Update.json` only if the document row editor's ACF field was not already installed; existing users do not need a reimport.
3. Open the existing translation Service and add **Document choices (one per line)** in the relevant document/package rows, then click **Update**. Do not import the content XML again.
4. Later document edits require only WordPress Update and the normal content-cache refresh, not another deployment.
5. Decide on the upload provider separately. No actual document uploads exist until that provider is configured and connected.

## Request and confirmed decisions

- Implement the client's `LONGLIFE_DIGITAL_LLC_Translation_Service.pdf`, located in the sibling `resources` directory. It has three pages.
- Add a modern service landing page, a dedicated quote request page, a Services menu entry driven by the CMS, and translation-specific ACF fields.
- All inquiries go to `info@longlifedigital.co` through the existing authenticated WordPress inquiry bridge.
- **User approved preparing the quote flow and form connection.** Actual uploads/payments are still pending a provider decision. Prepare a configurable public secure-form URL. Do not invent a working upload/payment integration or collect sensitive files in public WordPress media.
- **User confirmed: credentials are entered by the client in WordPress.** Include an explicit display switch, initially off; do not invent certifications.
- Keep this document current so another agent can resume after an interruption. No credentials or customer data belong in this log.

## Brief requirements

- Haitian Creole, French and Spanish, each to/from English. Certified or standard translation.
- Certificates: $45/document (one page, front/back); diploma/degree: $55/document; transcripts/report cards: $35/page; court/legal: $40/page; medical: $40/page; additional pages: $35/page.
- Long legal/medical files: $0.12/word, quoted upfront.
- Rush within 24 hours: +50%, subject to review; notarization: +$15/document; tracked USPS hard copy: $10; overnight: $40.
- Family package: any three certificates $120. Immigration bundle: birth + marriage + diploma $130.
- Free quote CTA, pricing/service cards, how-it-works section, confidentiality/terms, FAQs, configurable Haitian Creole Translation Book product link.
- Pricing is an indication for a reviewed quote. The user subsequently confirmed that rush applies to translation charges, including additional pages, and excludes notarization/delivery. This governs the displayed estimate; there is still no translation checkout/payment calculation.

## Completed implementation

- `shared/translation.js`: language pairs, editable catalog projection, request validation and itemized estimate including selected extras.
- `server/translationContent.js`: explicit public ACF projection, credentials visibility switch and safe proof links; hidden credentials omitted from app API.
- `server/siteContent.js`: translation projection and service illustration support.
- `api/inquiry.js`: validates and forwards structured translation metadata; drops free-text message for translation requests.
- `src/hooks/useServiceInquiry.js`: extracted existing inquiry submission/retry logic; `ServiceInquiryForm.jsx` now uses it.
- `src/components/TranslationRequest.jsx`: guided details/contact form, review summary, confirmation and future secure-form handoff.
- `/services/:serviceSlug/request` recognition in navigation/App/ServiceDetailPage.
- Translation SVG mark and service-card accent.

- `TranslationServicePage.jsx` and CSS: complete landing, pricing, packages, process, opt-in credentials, FAQs, book link and request route.
- WordPress plugin is now 0.6.3; `translation-inquiry.php` validates translation metadata and current document choices again at the mail boundary.
- ACF generator updated; focused translation JSON import and translation-only XML generated from `docs/cms/translation-content.json`.
- Setup guide: `docs/cms/TRANSLATION-SERVICE.md`.

- Direct-entry/prerendered translation page metadata and a noindex quote-request page are included. The build emits both routes when the service is published.
- Chat and newsletter overlays are suppressed on the guided quote page.
- Plugin archive `docs/cms/Longlife-Headless-Commerce.zip` contains version **0.6.3**, 17 files, verified byte-for-byte against source.

## Initial-release verification (before the follow-up above)

- **20 Node checks:** `node --test tests/inquiry.test.mjs tests/content-bootstrap.test.mjs`. Covers existing inquiry signing/error paths, translation selection and counts, projection/credential visibility, estimates, direct-entry metadata and content bootstrap regressions.
- **5 browser checks:** existing service navigation/inquiry regressions plus translation landing/mobile routes, guided form validation/retry/success, configured credentials/book and secure-form handoff. Final run: 5 passed in 9.4 seconds.
- **Optimized Vite build:** passed as part of the browser configuration (`npm run build -- --mode test`). This deliberately uses mocked CMS data, not production CMS preloading.
- **PHP:** `tests/translation-inquiry.php` passed with fake mail. Verified fixed info recipient, Reply-To, escaped structured content, no document text/file URLs, retries, changed replay rejection, failed transport, invalid selections and ordinary service inquiries. Plugin entry-point syntax check passed.
- Targeted ESLint, Prettier checks, `git diff --check` and source duplicate/API filename checks passed.
- Import validation: all **217 existing ACF keys** retained with their names; **43 translation field references** resolve; XML contains exactly **one** Service. Credentials initially off and secure-form URL empty.
- Desktop/mobile screenshots inspected. Fixed a real horizontal-overflow issue caused by rotated hero artwork. Both landing and request page now fit a 393px viewport.
- Initial-run screenshot artifacts (ignored by Git; later targeted runs may clear them): `test-results/services/translation-desktop.png`, `translation-mobile.png`, `translation-request-mobile.png`.

## Remaining activation steps (not executed)

1. Install WordPress plugin ZIP version 0.6.3 before deploying the new inquiry form.
2. Import `docs/cms/Longlife-Digital-ACF-Translation-Update.json` in ACF Tools only if the existing document row editor's field is not installed yet.
3. The user has already imported/reviewed the translation service. Update that existing record; do not import the XML again. The XML is for first-time installations only.
4. Push/deploy app/API to Vercel, then configure the document choices in WordPress. Existing CMS, commerce, bridge-secret and allowed-origin configuration is reused.
5. Client enters their credentials and optional proof URLs, then enables the display switch when ready. Select the Haitian Creole book product. The secure-form URL can remain blank until a provider is configured.
6. After deployment, verify the live service/menu and one authorized real inquiry delivery. This task used mocked mail only; no live emails, charges, document uploads, CMS imports or production deployment were performed.

Full editor instructions: [Translation setup guide](cms/TRANSLATION-SERVICE.md).

## Instructions for the next tool or session

The local implementation is complete; do not reimplement it. Start with `git status --short` and this document, preserve all user changes, then carry out the next requested action. Keep this log updated at meaningful milestones and before long-running work. Record completed work, exact commands/results, unresolved issues and the next concrete step; never put secrets or customer data here.

Browser reproduction on this machine (Chrome is absent; installed Chromium revision differs from Playwright's default):

```sh
PLAYWRIGHT_EXECUTABLE_PATH='/Users/handersoncoq/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell' node node_modules/@playwright/test/cli.js test --config playwright.services.config.js
```

The local preview requires permission to bind localhost outside the sandbox. The optional executable-path override was added to `playwright.services.config.js`; other machines can use their normal installed Playwright browser.

PHP reproduction (temporary tools may be cleaned up later):

```sh
node /tmp/lld-translation-php/node_modules/@php-wasm/cli/php-wasm.js tests/translation-inquiry.php
node /tmp/lld-translation-php/node_modules/@php-wasm/cli/php-wasm.js -l wordpress/longlife-headless-commerce/longlife-headless-commerce.php
```

The PHP runtime's localhost helper also required approval. It was installed under `/tmp`, not into project dependencies. No source changes were needed for the runtime.

## Environment notes

- Workspace is a React/Vite/Mantine app with Vercel APIs and a separate WordPress plugin.
- No AGENTS.md found in workspace/ancestor directories during this task. No subagents authorized.
- Working tree was clean at start. Do not discard new work or unrelated user changes.
- `node` is available via nvm. Native PHP is absent. Earlier `/tmp/lld-oct9-php` and `/tmp/lld-coupon-php` directories had missing package files; use the newer temporary path above if still present.
- Extracted PDF with macOS PDFKit using `swift -module-cache-path /tmp/lld-swift-cache`; Python PDF modules/pdftotext absent.
- Existing browser setup: `playwright.services.config.js`, `tests/fixtures/fluidStorefront.js`, `playwright.production.config.js`.
- No live WordPress changes or deployments have been made.

## Reference sources checked

- Jotform security/features: https://www.jotform.com/hipaa/security/
- Jotform payments: https://www.jotform.com/online-payments/faq/
- USCIS translation requirements: certification concerns accuracy/completeness and translator competence, not guaranteed application acceptance. Do not claim USCIS accreditation or approval.
