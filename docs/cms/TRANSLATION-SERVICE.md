# Translation service setup

The translation service has two storefront pages:

- `/services/translation` — introduction, language pairs, certified prices, packages, extras, process, credentials and FAQs.
- `/services/translation/request` — translation details, contact/review and inquiry confirmation.

This release prepares quote requests and a future secure-form connection. It does not charge cards or upload documents. Jotform is being considered; provider selection and cost are pending the owner's decision.

## Estimated total includes selected extras

The quote summary now itemizes translation, additional pages, rush, notarization and delivery. **Deploy the updated app to enable this change.** The existing WordPress rates are reused; no plugin update or ACF/content reimport is required for the estimate update.

- Rush applies to translation charges, including additional pages, using the configured percentage. It does not apply to notarization or postage.
- Notarization is the configured rate multiplied by the document count, including the document count of a package.
- The selected mailing fee is added once per request. Digital delivery has no mailing charge.
- Example: $45 translation + $22.50 rush (50%) + $15 notarization = **$82.50** with digital delivery.
- Each monetary line is rounded to cents, and the displayed total is the sum of those lines. Deselecting an extra removes its charge.
- If any selected charge is unpriced, it displays **Quoted on request** and the total displays **Custom quote**. Standard translations remain custom-quoted; known extras can still be shown separately.

This is an estimate for a reviewed quote. It does not create a payment. The email still carries the visitor's document details and selected extras; browser-supplied amounts are not accepted as an authoritative price.

## Add a document dropdown within each service group — version 0.6.3

1. Install [Longlife-Headless-Commerce.zip](Longlife-Headless-Commerce.zip), version **0.6.3**, replacing the current plugin.
2. Deploy the updated app/API to Vercel before adding document choices. The plugin keeps existing groups working without choices during this upgrade.
3. Open **Services → Document Translation → Translation service → Documents and packages offered**. Each row now has **Document choices (one per line)**. For **Birth, marriage & death certificates**, enter:

   ```text
   Birth certificate
   Marriage certificate
   Death certificate
   ```

4. Click **Update**. After the normal content-cache refresh, selecting this group displays a required **Document** dropdown. Changing the service group clears the previous document selection.

The client can add, remove or rename these choices at any time. Each group supports up to 50 unique choices of 160 characters each. Leaving the list blank keeps the existing group-only form, suitable for a single document service or a fixed package. Existing entries, prices and package counts are preserved; choices are not inferred from the group title or automatically inserted into saved content.

The review summary shows the selected document. The email includes separate rows:

| Field | Example |
| --- | --- |
| Document service | Birth, marriage & death certificates |
| Document | Birth certificate |

WordPress checks the chosen document against that group's current choices before sending. Removed choices or choices from another group are rejected with a request to reload. Document choices use the group's existing pricing rules.

**No ACF reimport or content XML reimport is needed when the existing row editor is already installed.** The updated ACF import only refreshes the field's help text for this feature. Actual file uploads remain a separate future secure-form step.

## Fix for the update/save error in plugin 0.6.1

The current **0.6.3** plugin includes the earlier **0.6.2** save-validation fix. Replacing the plugin and reloading the Service editor is sufficient for that fix; it needs **no ACF reimport, content reimport or app redeploy** if 0.6.1 and its fields are already installed. The new document dropdown does require the app/API deployment described above.

The previous custom validator tried to decode WordPress-escaped form data as plain JSON, so valid entries blocked any update to the Service. Version 0.6.2 removes request escaping at the validation boundary while keeping stored content intact. WordPress documents its [request escaping](https://developer.wordpress.org/reference/functions/wp_magic_quotes/); ACF's [validation implementation](https://github.com/AdvancedCustomFields/acf/blob/master/includes/validation.php) passes those submitted values to the custom validator. Invalid entries are still rejected.

## Updating an already imported translation service

Install the updated plugin ZIP **0.6.3**. If you have not installed the document row editor's ACF field yet, import **Longlife-Digital-ACF-Translation-Update.json** in ACF Tools. Open your existing **Services → Document Translation** record and review **Translation service → Documents and packages offered**, then click **Update**. Legacy services without a saved row catalog receive starter rows with their previously saved prices. Blank prices remain blank. **Do not reimport the content XML** if this service already exists. Deploy the updated app/API, then add document choices as described above.

## Install and publish

1. Update **Longlife Headless Commerce** using [Longlife-Headless-Commerce.zip](Longlife-Headless-Commerce.zip), version **0.6.3**. Install this before deploying the new inquiry form. Existing checkout/account settings and the integration secret remain in place.
2. Import [Longlife-Digital-ACF-Translation-Update.json](Longlife-Digital-ACF-Translation-Update.json) through **ACF → Tools → Import Field Groups**. It updates the **Service details** and **Translation service** groups, using ACF Free. If you manually changed these field definitions in WordPress, compare/export those changes first: importing replaces field definitions, not the saved service content.
3. Import [Longlife-Digital-Translation-Content.xml](Longlife-Digital-Translation-Content.xml) through **Tools → Import → WordPress**, assigning its author to your own account. This adds one published translation Service with the brief's prices and prepared text. It requires the existing Services post type. If a service already uses the `translation` slug, edit that record instead of importing a duplicate; this is a one-time seed, not a content synchronization tool.
4. Under **Services → Document Translation**, review the content, set **Service page layout = Translation service**, and verify the page address is `translation`. Publish/update it. The published service appears in the existing Services menu, overview and Contact service selector automatically.
5. Push/deploy the updated app and API to Vercel. No new environment variables are required. The CMS and commerce API must use the same WordPress installation.

These files have been prepared locally; this task does not install them into live WordPress or deploy production.

## WordPress controls

Under **Services → Document Translation → Translation service**:

| Field | Purpose |
| --- | --- |
| Hero heading / introduction | Landing-page headline and description |
| Standard turnaround wording | Quote-summary wording; initially “Confirmed with your quote” |
| Documents and packages offered | Add/remove/hide/reorder service groups and packages, with editable names, descriptions, document choices, billing units, USD prices and package document counts |
| Additional services and fees | Extra-page, per-word, rush, notarization and postage rates; blank prices show “Request a quote” |
| Confidentiality statement | Public explanation of the client's document-handling process |
| Quote and service terms summary | Shown before submitting, with Privacy Policy and Terms links |
| Show credentials on the translation page | **Off initially**; enables only populated credential entries |
| Translator / HIPAA credentials and certificate links | Client-entered qualification details and optional public HTTPS proof links |
| Haitian Creole Translation Book | Select the actual published WooCommerce product; no link appears until it exists in the public catalog |
| Translation questions and answers | Acceptance, turnaround and service-area FAQs |
| Secure document and payment form URL | Future public HTTPS provider form, shown after a successful inquiry |

The certificate fields describe credentials held by the client. Their visibility switch does not establish HIPAA compliance for the website or upload provider. No certification logos or credentials are invented.

**Service specialties** remains in the **Service details** group on the same edit screen. Enter one specialty per line. These appear on the Services overview card and as small labels below the introduction on the translation landing page. They describe your service; they do not create document offerings.

## Add or remove document types

Go to **Services → Document Translation → Translation service → Documents and packages offered**.

1. Click **Add document or package** and enter its name and optional description/page-count guidance.
2. Choose whether the price applies to each document, each page, or the whole package. For packages, enter the included document count.
3. Enter the certified price in USD, or leave it blank for a custom quote.
4. For a group of documents, enter **Document choices (one per line)**. Customers must select one from the dependent dropdown. Leave blank for an individual offering or fixed package.
5. Use **Show on website and quote form** to temporarily hide an entry, **Remove** to delete it, and **Move up/down** to change its order. Documents and packages are displayed in separate sections, preserving their order within each section.
6. Click WordPress **Update**. The pricing cards, quote choices, estimates and accepted email submissions use this list. No app redeploy is needed for subsequent content edits; cached content may take a short time to refresh.

The editor supports up to 50 entries and works with ACF Free. You do not edit JSON. If a raw text box appears instead of row controls, check that plugin 0.6.3 is active and reload the editor. Removing all entries keeps the list empty and replaces the quote form with a contact message. Hidden/removed offerings are rejected by WordPress even if a visitor still has an older page open.

The starter document list is only an editable starting point from the brief. Existing packages have their own descriptions: update or hide a package as well if a document in that package is no longer offered.

## Inquiry and pricing behavior

- Certified/standard choice; Haitian Creole, French or Spanish **to/from English**; document service, specific document (when choices are configured) and counts; rush, notarization and delivery preferences; name, email, phone and consent.
- Only the supported six language directions are accepted. Each package uses its configured document count. Document/page counts are validated on both the API and WordPress; WordPress also checks current offerings and package sizes before sending email.
- The summary shows an itemized **estimated total**, including selected rush, notarization and delivery. Rush applies only to translation and additional-page charges, as confirmed by the owner. Final scope and pricing are confirmed with the quote. Standard translations, unpriced selections and long-file per-word pricing require a custom quote.
- Every inquiry goes to **info@longlifedigital.co**. The visitor is Reply-To; the existing authenticated sender is retained. The service title determines the subject. Neither recipient nor amount is accepted from the browser.
- Structured job details appear in the email. No document text, attachments or file URLs are collected. The inquiry system stores only its existing keyed replay fingerprint/status, not a document submission.
- A failed send displays an error and keeps the form values. Retrying unchanged details reuses the same inquiry ID to avoid duplicate messages.
- Success means the email transport accepted the message. It does not mean a payment was made or documents were received.

## Connect secure uploads and payments later

Create/configure the provider form, then enter its **public form URL** in WordPress. The confirmation screen will show **Open document form** in a new tab. We do not put contact details, document types or tokens into that URL.

The provider form must collect files and handle any payment separately. Configure its prices, notifications, access controls and data retention there. Have it send a minimal notification to the info mailbox, with access to documents through the provider rather than attachments. For medical records, choose the appropriate provider plan, contractual arrangements and settings before accepting files. Jotform documents its [security features](https://www.jotform.com/hipaa/security/) and [payment integrations](https://www.jotform.com/online-payments/faq/); a link alone does not configure those features.

When the URL is blank, customers can still request quotes and are told the team will arrange secure submission. They are asked not to email sensitive documents.

## Maintained source

- `scripts/generate-acf-reference.py` generates schema imports and the current Markdown/HTML reference. The older PDF reference remains the original schema snapshot.
- `docs/cms/translation-content.json` holds the approved brief's one-time content seed.
- `python3 scripts/generate-translation-import.py` regenerates the translation-only XML and the plugin's legacy-upgrade starter rows after the ACF generator runs. It does not change live content.
- The plugin enhances an ACF textarea into row controls and uses ACF's [load-value](https://www.advancedcustomfields.com/resources/acf-load_value/) and [validation](https://www.advancedcustomfields.com/resources/acf-validate_value/) hooks. Stored data stays in the service's ACF fields.
- [Implementation progress and verification](../TRANSLATION-SERVICE-PROGRESS.md) records the current handoff status.
