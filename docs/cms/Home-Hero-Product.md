# Homepage hero product

The store owner can select the homepage hero product independently of WooCommerce's
Featured Products collection. The existing hero styling, artwork, price, reviews,
and product link all use that selection.

## One-time setup

1. In WordPress, open **ACF → Tools → Import Field Groups** and import
   [Longlife-Digital-ACF-Home-Hero-Update.json](Longlife-Digital-ACF-Home-Hero-Update.json).
   This updates the existing **Longlife Digital | Page content** field definitions
   using their stable keys and retains saved page values. Export that field group
   first if its definitions were customized directly in WordPress; this import
   contains the repository's complete Page content group.
2. Deploy the accompanying app changes, including `/api/content` and `/api/catalog`.
   No commerce-plugin update is needed.

## Owner workflow

1. Open **Pages → Home → Edit**.
2. Under **Longlife Digital | Page content**, confirm **Storefront page** is **Home**.
3. In **Homepage sections → Hero featured product**, search for and select a
   published WooCommerce product.
4. Click **Update**. The storefront picks up the change through its normal content
   refresh; selecting a different product does not require another app deployment.

Clear the selector and update the page to return to the newest product in the
public catalog. If a selected product is removed, unpublished, password-protected,
or otherwise absent from that catalog, the hero also uses the newest product.
The hero's selection does not change WooCommerce's featured flags or reorder
the Featured Products collection. An empty catalog continues to show the existing
catalog loading/empty/error UI.

The ACF field is optional, single-select, restricted to published `product` posts,
and returns an ID at `acf.lld_home.hero_product`. The content API exposes only a
validated positive integer or `null` as `hero.productId`. React resolves it against
the already loaded public catalog; it never displays arbitrary post-object data.
The catalog API explicitly requests `orderby=date&order=desc` for the fallback.

Field definitions are maintained in `scripts/generate-acf-reference.py`.
The generated JSON and HTML/Markdown field reference include this selector; the
previously exported PDF has not been regenerated for this addition.

References: [ACF Post Object field](https://www.advancedcustomfields.com/resources/post-object/)
and [WooCommerce Store API product ordering](https://developer.woocommerce.com/docs/apis/store-api/resources-endpoints/products/).
