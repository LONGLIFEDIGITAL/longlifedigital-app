# E-book and Domains page content

The editorial content for `/ebook` and `/domains` is managed under **WordPress → Pages**, while sale listings remain separate records.

## Install the updated fields

In **ACF → Tools → Import Field Groups**, import `Longlife-Digital-ACF-Collection-Pages-Update.json` from this folder. It updates the existing **Longlife Digital | Page content** field group using its stable field keys; it does not create page content or listings. Export a copy first if you have customized that field group directly in WordPress, and reconcile those changes before importing. The complete import and generated reference also include the changes.

These files have been updated locally; importing them into WordPress is still required.

## Edit either page

1. Open the published Page with slug `ebook` or `domains`. Set **Storefront page** to **Ebook** or **Domains** respectively.
2. Use **Small heading / badge**, **Display heading**, and **Page introduction** for the hero. Without a display heading, the existing API uses the native page title. Native editor content appears above the collection. SEO fields remain connected.
3. Open **Collection page editorial content** to edit the two hero buttons, hero note, collection small heading/title, and the editorial closing message and button. Blank fields retain the designed defaults. A button override needs both its label and destination. Collection destinations: `/ebook#ebook-library` and `/domains#domain-collection`.
4. The existing **Page closing call to action** provides an additional optional CTA.
5. Domains also offers **Featured domain / website**. Choose a published, available Asset. If missing, sold, or reserved, the first available published Asset is featured. With none available, the hero shows an editorial illustration rather than fictitious inventory.

Layout, typography, color palettes, functional control labels, and decorative ebook illustration lettering stay in React/CSS.

## Domain and website listings

Under **Assets**, publish one record per listing:

- **Title:** actual domain (such as `yourdomain.com`) or website name.
- **Excerpt:** short description; **Content:** optional extended details, shown in an expandable section.
- **Asset type**, **Listing availability**, **Badge text**, and **Asset Categories** control presentation and filtering. Available, reserved and sold listings remain visible; only available listings show an inquiry/product action.
- **Pricing:** use Contact for price-on-request, Estimate for “Starting at”, or Linked WooCommerce product. A linked product uses live catalog pricing only when the catalog and content API share an origin, matching the existing storefront safeguards.
- **Inquiry button:** supply label and storefront path or approved HTTPS destination. An available listing without a complete CTA defaults to Contact.
- **Public website preview:** optional HTTPS demo for a website listing.
- **Order:** use the native menu order to arrange listings.

Search checks titles and descriptions; category filtering keeps `/domains?category=slug` links working. Direct listing links use `/domains#asset-slug`. Publish domain-topic FAQs under **FAQs** to show them below the collection.

Ebooks continue to come from WooCommerce ebook categories/tags; see `EBOOK-PAGE.md`.
