# Storefront content checklist

Updated September 22, 2026. The React storefront now reads the content below from WordPress. You do not need to rebuild these designs in the WordPress theme editor or create new ACF field groups.

## Start with About

1. Open **Pages → About** in the staging WordPress dashboard.
2. Set **Storefront page → About**. Keep the slug `about`.
3. Enter the display heading and introduction. Use the normal WordPress editor for the main story, if desired.
4. For separate cards such as **Our Mission**, **What We Sell**, and **Our Promise**, create one **Content Block** per card. Select **Value / story card** as the block kind, use its title as the heading, and write its paragraphs in the normal editor.
5. Select those blocks under the About page's **About → Sections**, in the order they should appear. Fill the optional tagline and closing button, then **Save/Publish**.

The About page is now published and connected, including its selected Mission, Offering and Promise cards. Edit each card under Content Blocks and save it; editing a card's text does not require re-selecting it on About. Changes to which cards appear or their order are saved on the About page itself.

## Pages to publish

For every page, set the matching **Storefront page** selection, use the exact slug below, and publish publicly. A draft or a mismatched page key does not appear in the storefront. The WordPress editor supplies body content; the common ACF fields supply the small heading, display heading, introduction, closing call to action, and optional search/sharing metadata.

| Storefront page selection | WordPress slug     | Public route        | Content to enter                                                                                                                |
| ------------------------- | ------------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Home                      | `home`             | `/`                 | Already connected and published: hero, collections, offer, trust items, About preview, blog preview, closing button.            |
| Shop                      | `products`         | `/products`         | Product-list heading, introduction, optional body and closing button. Products themselves come from WooCommerce.                |
| About                     | `about`            | `/about`            | Heading, introduction, tagline, native body, selected Value/story content blocks.                                               |
| Blog                      | `blog`             | `/blog`             | Blog-list heading, introduction, optional body and closing button. Articles are written under Posts.                            |
| Services                  | `services`         | `/services`         | Page introduction/body and closing button. Individual cards are created under Services.                                         |
| Courses                   | `courses`          | `/courses`          | Heading, introduction/body, closing button. Course products come from WooCommerce's course category.                            |
| Domains                   | `domains`          | `/domains`          | Page heading/introduction/body and closing button. Listings are created under Assets.                                           |
| Contact                   | `contact`          | `/contact`          | Page introduction, information/form headings, form introduction and confirmation copy. Contact details come from Site Settings. |
| FAQ                       | `faq`              | `/faq`              | Page heading/introduction/body. Questions and answers are created under FAQs.                                                   |
| Refund                    | `refund-policy`    | `/refund-policy`    | Approved policy in the normal editor; optional last-updated date and callout.                                                   |
| Privacy                   | `privacy-policy`   | `/privacy-policy`   | Approved policy in the normal editor; optional last-updated date and callout.                                                   |
| Terms                     | `terms-of-service` | `/terms-of-service` | Approved terms in the normal editor; optional last-updated date and callout.                                                    |

**Keep WooCommerce's existing Shop (`shop`), Cart, Checkout and My Account pages separate.** Leave their Storefront page field empty. The React products listing uses the new `products` content page.

Home and About are now published with their storefront page keys. The remaining rows are connected in code and ready for content; they display a neutral preparation message until published. Network failures display a retry message instead. Blank optional fields are omitted.

## Shared content and collections

| WordPress location               | What to enter                                                                                                                                          | Where it appears                                                                                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Site Settings → Storefront       | Brand name/logo/tagline, public React website URL, contact email/hours, social URLs, announcement and footer text                                      | Header, footer, contact details and browser metadata.                                                                                                                              |
| Site Settings → Newsletter copy  | Heading, description, button label, consent wording, success message; enable switch; popup heading/body and delay                                      | Homepage signup and the once-only popup. The minimum popup delay is three minutes, even if the existing ACF field contains a smaller number. A disabled signup/popup stays hidden. |
| Site Settings → Chat public copy | Display name, welcome, unavailable message, suggested questions (one per line)                                                                         | Chat window. Chat's business facts also use the published settings and services; old sample promotions and support addresses were removed.                                         |
| Navigation Links                 | Label as native title; area, destination, optional new-tab setting; Order; child source and optional parent                                            | Header, mobile drawer and footer. Areas: Header, Footer Company, Footer Support, Footer Legal.                                                                                     |
| Services                         | Title; excerpt for summary; native body; optional featured image, icon, navigation label/summary, pricing display, package details and inquiry button  | Services cards, service dropdowns and Contact's service choices. Individual service sections use `/services#<slug>`.                                                               |
| Assets                           | Domain/website title; excerpt and body; optional featured image, availability, badge, demo URL, price wording, inquiry button; assign Asset Categories | Domains/website listings. Reserved/sold records remain visible but do not show an inquiry/purchase button.                                                                         |
| Asset Categories                 | Native name/slug/description; icon and order                                                                                                           | Domain filters and derived domain dropdowns. Link to `/domains?category=<slug>`.                                                                                                   |
| FAQs                             | Question as title, answer in the normal editor, topics, Order                                                                                          | FAQ page; service/product/domain questions also appear in the relevant sections.                                                                                                   |
| Content Blocks                   | Trust/Benefit/Statistic/Value kind; native title; excerpt for short descriptions; native body for story cards; icon; statistic value when applicable   | Selected Home sections and selected About story cards. A checkmark is a valid icon.                                                                                                |
| Posts                            | Title, slug, body, excerpt, categories, date and featured image                                                                                        | Blog list, Home preview, `/blog/<slug>` article. Read More destinations are generated automatically.                                                                               |
| WooCommerce Products             | Name, descriptions, images, categories, tags, featured setting, prices, stock and published status                                                     | Product cards, detail pages, product filters and calculated counts.                                                                                                                |

Navigation destinations use storefront paths such as `/about`, `/products`, `/contact` or `/blog`, or public HTTPS URLs. Navigation also accepts `mailto:` and `tel:` links. For a dropdown, select **Manual children**, **Services**, or **Asset categories**. Manual children must have a parent in the same area. Essential route links remain available until you publish navigation records, so missing menus never make the site unusable.

For service/asset **Linked WooCommerce product** pricing, the CMS and WooCommerce feed must point to the same WordPress installation. The current staging content and product feeds use different installations; the storefront deliberately shows a contact-for-pricing fallback until those sources are aligned. This prevents an identical numeric ID on another site from displaying the wrong product or price. An indicative amount is display copy only.

## Product-specific ACF extras: one installation step

The frontend is ready for **What is included**, skill level, duration, compatibility, license summary and product search/sharing fields. WooCommerce does not expose these ACF fields in its Store API automatically. The prepared plugin uses WooCommerce's [documented product extension mechanism](https://developer.woocommerce.com/docs/apis/store-api/extending-store-api/available-endpoints-to-extend/).

1. On the WordPress installation that serves the products, open **Plugins → Add New → Upload Plugin**.
2. Upload [Longlife-Storefront-Product-Content.zip](Longlife-Storefront-Product-Content.zip), install and activate it. ACF and WooCommerce must already be active, with the existing Product display extras field group imported there.
3. Fill the extra fields on a product and save it. The public product response will contain `extensions.longlife-content`; the storefront reads only its approved display fields.

**Current product installation:** `longlifedigital-zmuro.wpcomstaging.com`.
**Current content installation:** `staging-a7b0-longlifedigital-zmuro.wpcomstaging.com`.

Installing only on the content installation will not change the product feed. If you later move the products to the content staging site, switch the WooCommerce environment URL after the products are ready and activate the plugin there. Product IDs and relationships must be checked during that move. No passwords or API keys belong in these public fields.

The plugin source is [wordpress/longlife-storefront/longlife-storefront.php](../../wordpress/longlife-storefront/longlife-storefront.php). It is prepared locally; it has **not** been installed or run inside your WordPress environment. This repository does not include a PHP runtime, so the installation check must be completed in staging.

## What remains application code

Functional labels such as Add to Cart, quantity controls, filters, form field labels, validation messages, skeletons and missing-content messages remain in React. Visual styling also stays in React/CSS. These are interface behavior, not editorial records to create in WordPress.

Product category and AI-prompt-product counts are calculated from the catalog. The owner-confirmed `24hr Support` and `100% Digital` figures remain fixed. Pricing and stock always come from WooCommerce for purchasable products.

The unconfigured demo mode retains example products and Home content for local UI work. When the WordPress and WooCommerce URLs are configured, those examples do not substitute for missing or unavailable published content.

This completes the storefront **content-reading** connections. It does not implement WooCommerce checkout, protected downloads, contact-form delivery or newsletter subscriber storage. Those existing workflows are separate integrations; keep signup disabled until subscription persistence is available. Service/asset per-item SEO fields are retained in the API for future dedicated detail routes; the current shared listing pages use their Page SEO fields.

## Publishing and loading

- All WordPress/ACF pages, shared collections, settings, posts and WooCommerce products inherit one refresh policy: every 15 seconds while visible and online, plus tab return/reconnection. Opening an editorial page also rechecks it immediately. This is automatic polling, so publishing is reflected on the next successful read, not synchronously at the instant Save is clicked.
- Local and Preview API responses are not cached. Production has short five-second server/CDN caches, without an additional stale-while-revalidate window. Every upstream read bypasses WordPress's public REST cache, including related blocks and media. Network/WordPress response time still affects when a change arrives.
- A successful response is saved as the last-known published copy for repeat visits. Failed refreshes retain that copy; a confirmed removal clears it.
- Home copy and available blog cards are also included in initial HTML at dev startup/build. They appear before React executes. Published page headers and metadata are generated for the other fixed routes and the prefetched articles.
- During local development, successful CMS reads also update Vite's in-memory initial HTML snapshot and its `.cache/content-*.json` file. Refreshing the page therefore uses the latest observed content without restarting Vite. The cache files are generated: do not edit them or delete them to publish updates.
- Deployed static HTML is refreshed by a rebuild/redeploy; React still updates its content automatically at runtime. A WordPress-triggered Vercel deploy hook can update crawler/initial HTML when the deployment is configured.
- On Vercel, configure both public CMS environment URLs for the intended environment. The filesystem routes serve generated pages first; new articles and products use the React route fallback.

Developer entry points: `shared/contentSync.js` owns refresh timing and API cache policy; `src/services/queryClient.js` applies WordPress and WooCommerce query defaults; `src/hooks/usePublishedContent.js` owns editorial fetching, validation, persistence and confirmed removals. New editorial resources should use that hook rather than implement another fetch or polling timer. The shared upstream transport is `server/wordpressRequest.js`.

The local performance check is reproducible with a configured build and `node scripts/check-content-performance.mjs`. It measures cold-profile Chrome on localhost and keeps CMS requests unavailable during the measurement; it is not a production-network guarantee.
