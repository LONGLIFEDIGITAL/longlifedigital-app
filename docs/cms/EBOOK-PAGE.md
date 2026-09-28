# E-book storefront

The storefront page is `/ebook`, rendered by `src/pages/EbookPage.jsx`. Its styles are in `src/pages/EbookPage.module.css`.

## Publish content

1. In WordPress Pages, publish a page with slug `ebook` and **Storefront page → Ebook**. If that choice is missing, add `ebook : Ebook` to the existing ACF Page content group's Storefront page field. The repository's ACF import and generator now include it.
2. The page's eyebrow, heading, introduction, editor body, SEO, and closing CTA are connected. The **Collection page editorial content** group also controls hero buttons/note, collection headings, and the editorial closing message/button. See [Collection page setup](COLLECTION-PAGES.md) for the updated ACF import. Without a display heading, the API uses the native page title. Missing editorial copy does not hide the product collection.
3. In WooCommerce, assign books to a category or tag named/sluggified **Ebook**, **Ebooks**, **E-book**, or **E-books**. Names such as Business Ebooks are supported too. Products are selected by categories/tags, not their titles or file extensions. Other digital products are excluded.
4. To show the page in the menu, publish a **Navigation Links** record with destination `/ebook` and area **Header**. Existing CMS menus are preserved.

Search and sorting operate on the ebook collection. Product details, prices, stock, Add to Cart, and Buy Now use the existing catalog and checkout. The book illustration is decorative; it does not represent a purchasable product. No demo products or invented review counts are added by this page.
