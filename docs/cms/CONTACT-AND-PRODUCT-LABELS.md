# Contact social handles and hero product button labels

The Contact info card uses Font Awesome Free brand SVGs for Instagram, Facebook, TikTok, YouTube and LinkedIn. Its visible profile text is editable independently of the saved destination URL. The hero product button uses an explicit short noun, independent of category order or hierarchy.

## Install the field definitions and publish

1. In the WordPress dashboard, open **ACF → Tools → Import Field Groups** and import [Longlife-Digital-ACF-Contact-and-Product-Update.json](Longlife-Digital-ACF-Contact-and-Product-Update.json). It updates the existing **Longlife Digital | Page content** and **Longlife Digital | Product display extras** definitions using their stable field keys. If pages and products live on different WordPress installations, import the matching groups on each.
2. For hero product labels, upload [Longlife-Storefront-Product-Content.zip](Longlife-Storefront-Product-Content.zip) through **Plugins → Add New → Upload Plugin** on the WooCommerce installation. Replace the previous version when prompted. Confirm **Longlife Storefront Product Content 1.2.0** is active. This is separate from the Headless Commerce plugin; the update includes the existing ebook preview support.
3. Fill in the fields below and update the relevant Page/product.
4. Push and deploy the updated app and API on Vercel. Importing fields alone does not update the app, and deploying the app alone does not add fields to WordPress. Published changes appear after the content/catalog cache refreshes.

## Contact info card

Open **Pages → Contact** and confirm **Storefront page → Contact**. Under **Contact page copy → Social handles**, enter the display text for each configured platform, such as `@longlifedigital` or a Facebook profile name. The text is used as entered; include `@` if wanted. Each field is optional and allows up to 80 characters.

Destinations still come from **Site Settings → Storefront → Social links**. A platform with no URL stays hidden even if a handle is supplied. A URL with no handle displays **View our profile**. Existing URLs, including query strings and temporary test URLs, are left unchanged. The icon follows the platform field, not the hostname in the URL.

The ACF paths are `lld_contact.social_handles.instagram`, `.facebook`, `.tiktok`, `.youtube` and `.linkedin`. `/api/content?resource=page&key=contact` exposes only these known display fields under `contact.social_handles`. This change does not alter footer links.

The SVG paths come from [Font Awesome Free 6.7.2](https://github.com/FortAwesome/Font-Awesome/tree/6.7.2/svgs/brands), rendered with `currentColor` by `src/components/SocialIcon.jsx`. Attribution and the original [free license](https://fontawesome.com/license/free) are included at `public/licenses/font-awesome.txt`. No font or new runtime dependency is required.

## Hero button

Open **Products → the featured product → Product display extras → Button product label**. Select **Spreadsheet**, **Ebook**, **Template**, **Course**, or **Product (generic)**, then update the product.

For the bookkeeping product, select **Spreadsheet**. The hero button will say **Get this spreadsheet** with the shared SVG arrow and will still open that product's details. The full title remains above the button. A blank or unsupported label falls back to **Get this product**, including while an older product content plugin is active.

The [ACF Select field](https://www.advancedcustomfields.com/resources/select/) is named `lld_button_product_label`, returns its single value, and is optional. The content plugin publishes it as `extensions.longlife-content.button_product_label`; the catalog normalizer permits only the known short labels. This field controls display wording only, not WooCommerce's product type or purchasing behavior.

Maintain these field definitions in `scripts/generate-acf-reference.py`. Its output includes the focused update JSON and the full import/reference files.
