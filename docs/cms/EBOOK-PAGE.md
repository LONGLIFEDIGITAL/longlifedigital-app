# E-book storefront

The storefront page is `/ebook`, rendered by `src/pages/EbookPage.jsx`. Its styles are in `src/pages/EbookPage.module.css`.

## Publish content

1. In WordPress Pages, publish a page with slug `ebook` and **Storefront page → Ebook**. If that choice is missing, add `ebook : Ebook` to the existing ACF Page content group's Storefront page field. The repository's ACF import and generator now include it.
2. The page's eyebrow, heading, introduction, editor body, SEO, and closing CTA are connected. The **Collection page editorial content** group also controls hero buttons/note, collection headings, and the editorial closing message/button. See [Collection page setup](COLLECTION-PAGES.md) for the updated ACF import. Without a display heading, the API uses the native page title. Missing editorial copy does not hide the product collection.
3. In WooCommerce, assign books to a category or tag named/sluggified **Ebook**, **Ebooks**, **E-book**, or **E-books**. Names such as Business Ebooks are supported too. Products are selected by categories/tags, not their titles or file extensions. Other digital products are excluded.
4. To show the page in the menu, publish a **Navigation Links** record with destination `/ebook` and area **Header**. Existing CMS menus are preserved.

Search and sorting operate on the ebook collection. Product details, prices, stock, Add to Cart, and Buy Now use the existing catalog and checkout. The book illustration is decorative; it does not represent a purchasable product. No demo products or invented review counts are added by this page.

## One or two sample pages on product details

An ebook detail page shows a small hand icon and **Preview** label in the top-right corner of its book card when samples are available. Tapping the card, or activating it with Enter/Space, opens a reader with one or two sample images, Previous/Next controls for two pages, a full-size image link, and a close button. The reader uses the existing [Mantine Modal](https://mantine.dev/core/modal/) and becomes full screen on phones. Samples load only after opening the reader. If none are configured, the cover remains visible without a preview control.

To enable it:

1. On the WordPress installation that serves WooCommerce products, import [Longlife-Digital-ACF-Ebook-Preview-Update.json](Longlife-Digital-ACF-Ebook-Preview-Update.json) through **ACF → Tools → Import Field Groups**. This adds only **Longlife Digital | Ebook preview**; it does not replace existing field groups. New installations can use the full ACF import instead.
2. Upload the updated [Longlife-Storefront-Product-Content.zip](Longlife-Storefront-Product-Content.zip) in **Plugins → Add New → Upload Plugin**. Replace the previous version if prompted and activate **Longlife Storefront Product Content 1.1.0 or newer**. This is the product content plugin, separate from Headless Commerce.
3. Export one or two selected interior pages as individual JPG, PNG, WebP or AVIF images. Use legible images around 1200–1800 pixels wide, up to 5 MB each. Upload only these public samples, not the full ebook PDF or a protected download link.
4. Edit the WooCommerce ebook product. Under **Longlife Digital | Ebook preview**, choose the image for **Sample page 1** and optionally **Sample page 2**. Add meaningful alternative text. A **Public image URL** can be used instead of an attachment; it must be HTTPS and takes precedence. Save/update the product. Keep its Ebook/Ebooks category or tag assigned.
5. Push/deploy the updated React app to Vercel. The preview appears once the catalog refreshes. WordPress plugin installation and sample selection must also be completed; deploying React alone does not publish samples.

The content plugin uses WooCommerce's [Store API extension mechanism](https://developer.woocommerce.com/docs/apis/store-api/extending-store-api/extend-store-api-add-data/) to expose only `extensions.longlife-content.ebook_preview_pages`, an array of at most two `{ src, alt, width, height }` objects. ACF fields are `lld_ebook_preview_page_1` and `lld_ebook_preview_page_2`, each with `attachment`, `public_url`, and `alt`. The app does not infer samples from the cover, product gallery, or purchased downloads. The full ebook stays in the existing fulfillment flow.
