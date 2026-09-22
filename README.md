# Longlife Digital

## Local development

Use Node.js 22.21.1, pinned in `.nvmrc`. With nvm installed, run:

```sh
nvm install
nvm use
npm ci
npm run dev
```

If an existing terminal still reports Node.js 18, run `nvm use` from this
directory before starting Vite. The supported Node.js versions are declared in
`package.json` and satisfy both Vite and ESLint.

## WooCommerce catalog connection

Local development reads published products from the configured WordPress store,
configured in `.env.development`. Restart Vite after changing environment values.
The homepage product highlights, shop, product details, categories, search and
local cart use this feed. Product descriptions retain their WordPress paragraphs,
lists, headings, emphasis and links. `src/utils/richText.js` uses DOMPurify to
sanitize that HTML before rendering; pasted styles and editor attributes are
removed, and `src/pages/ProductPage.module.css` controls the presentation.
Legacy descriptions still render as plain text. Images, prices, stock availability
and featured selections come from WooCommerce.
Mark products as featured in WooCommerce to select the homepage highlights.
If none are featured, the homepage shows the latest products instead.

The browser reads `/api/catalog`. Vite proxies this route locally and
`api/catalog.js` supplies the same read-only route on Vercel, avoiding cross-origin
browser restrictions. All catalog pages are fetched, and errors show a retry
action rather than demo products.

Catalog data is cached in the browser with TanStack Query. The storefront checks
for published changes every 15 seconds while its tab is visible and online, and
refreshes when the tab becomes visible again or the network reconnects. Product
details, categories, featured selections, availability and prices update together
without reloading the document or resetting navigation, filters or cart selections.
Existing content stays visible during background requests. Failed requests retry
twice with backoff; a background failure retains the last successful catalog and
later refreshes recover automatically. Skeletons appear only before the first
successful load. The local cart remains a separate in-memory snapshot; authoritative
cart pricing and order validation are still part of the WooCommerce checkout work.

Local development and Vercel Preview catalog responses use `Cache-Control: no-store`.
Production responses have no browser freshness window and a five-second shared CDN
cache. Upstream requests bypass WordPress REST caching. Production changes can
take an extra short cache interval plus network time to appear. This is background polling,
not an immediate server-push subscription. No WordPress plugin, webhook or Vercel
deployment is needed to use it locally. The refresh policy lives in
`shared/contentSync.js` and `src/services/queryClient.js`, shared by the catalog and every editorial resource.

References: [TanStack Query refresh and caching defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)
and [Vercel cache-control headers](https://vercel.com/docs/caching/cache-control-headers).

To enable this connection on a **Vercel Preview** deployment, set
`VITE_WOOCOMMERCE_STORE_API_URL` to
`https://longlifedigital-zmuro.wpcomstaging.com/wp-json/wc/store/v1`
in the Preview environment and redeploy. No API key is required for this public
catalog. This change does not modify Vercel settings or deploy the app.
Production must use its own production CMS URL when ready; the local staging
configuration is not loaded by a production build. With the variable unset,
the existing demo catalog and workflows remain available during migration.

WooCommerce products can be added to the
local cart, but checkout is disabled until WooCommerce orders, payment and
fulfillment are connected. They never use the old standalone Stripe flow.
The React admin entry points are hidden in CMS mode; edit these products in
WordPress. Editorial content also reads WordPress; checkout and delivery integrations remain separate work.

The local cart supports quantity controls, repeated additions and immediate
removal. Item totals, the subtotal and navigation badge update together.
Quantity controls respect the minimum, maximum, increment and sold-individually
limits supplied by WooCommerce. Cart contents remain in memory until page reload.

```sh
npm run test:catalog
```

These tests mock the feed and cover pagination, featured products, categories,
prices, loading/errors/retry, timed and tab-return refreshes, offline recovery,
stock restrictions, the read-only Vercel endpoint,
and product/cart behavior on mobile and desktop.

## WordPress site settings

Shared brand/logo, contact details, announcement copy/visibility, footer text and
social links now read the published ACF **Site Settings → Storefront** record
(slug `storefront`). Set the public REST root in `VITE_WORDPRESS_API_URL`:

```dotenv
VITE_WORDPRESS_API_URL=https://staging-a7b0-longlifedigital-zmuro.wpcomstaging.com/wp-json/wp/v2
```

This is the CMS address. The **Public storefront URL** field in WordPress remains
`https://longlifedigital.co`; it supplies customer-facing website links.
Restart Vite after editing environment values. For Vercel Preview, set the same
variable in the Preview environment and redeploy; no deployment is performed here.

`/api/content?resource=settings` uses the same read-only handler in Vite and Vercel.
It fetches the published record, resolves the WordPress logo attachment and returns
only the fields used in this migration. It accepts no arbitrary CMS resource or
URL. Optional blank fields stay blank, and disabled announcements stay hidden.
An initial failure shows a retry action without substituting demo contact details
or promotions. Product browsing remains available. TanStack Query retains the last
successful settings and refreshes every 15 seconds while visible/online, on tab
return and on reconnect. Settings requests bypass the browser HTTP cache. The
handler also requests fresh WordPress settings and logo metadata with a unique
upstream query value, because the CMS edge can reuse REST responses even with
`Cache-Control: no-cache`. This value is generated per request, not at Vite startup.
Local and Preview responses are uncached; Production retains a five-second shared
cache at Vercel to limit WordPress traffic. Published field edits therefore appear
on the next successful refresh locally (a 15-second polling interval in an active
tab, plus the CMS response time); Production can take an additional cache interval. Returning to the tab or
reloading also fetches settings. Editing content does not require restarting Vite;
changing the CMS environment URL still does.

**Temporary catalog split:** the corrected `staging-a7b0-…` site has the ACF content,
but its public WooCommerce catalog was empty when verified. The existing
`VITE_WOOCOMMERCE_STORE_API_URL` still points to `longlifedigital-zmuro.wpcomstaging.com`
so existing product browsing remains usable. Publish or import test products into
the new staging site, then point the catalog variable at that site's
`/wp-json/wc/store/v1`. Both feeds should use the same environment before checkout
integration. No records were copied or modified on either WordPress site.

The remaining pages, navigation records, FAQs, policy text, newsletter/chat
copy and server-side chatbot context now read published CMS records. The
[content checklist](docs/cms/CONTENT-CHECKLIST.md) lists every page slug, field and collection
to populate. Missing records show a preparation message; failed requests offer retry.
This connection does not implement form delivery, subscriptions, payments or files.
The ACF field reference and import package are in [docs/cms](docs/cms/README.md).

```sh
PLAYWRIGHT_CHANNEL=chrome npx playwright test --config playwright.content.config.js
```

## WordPress homepage hero and catalog statistics

The published WordPress Page with slug `home` and **Storefront page → Home**
supplies `/api/content?resource=home`: the hero, collection headings and buttons,
sale banner labels, trust statements, About preview, benefits, additional editorial
statistics, blog preview and optional closing call to action. Product names, prices,
images and collection membership continue to come from WooCommerce. Empty optional
fields and incomplete/unsafe buttons stay hidden; managed mode never substitutes
sample marketing copy. Demo content is used only without a WordPress endpoint.

The hero's three segments take precedence over its display heading, with the page
title as the final heading fallback. Internal buttons use React Router; HTTPS
links to the public storefront are converted to local routes when settings load.
Trust and Benefit relationships preserve the order selected in ACF. A block's
native title supplies its heading, its native Excerpt supplies its description,
and `lld_icon` supplies its symbol (including `✓`). Only selected, published blocks
of the expected kind are returned. No new ACF import is required.

The hero and blog no longer wait on a chain of CMS requests. Vite prepares a
snapshot of the published pages, settings, shared collections, first blog page,
selected cards and those cards' full articles before the dev server is ready or the build completes.
The hero and blog preview are included as escaped initial HTML with critical CSS,
so visitors see content before React executes. Route headers and metadata are also
generated as static HTML. The snapshot additionally seeds TanStack Query through
non-executable JSON. Other routes and payment code load when needed.
Snapshots contain public editorial content only;
WooCommerce prices, stock, carts and customer data are never snapshotted.

Configure `VITE_WORDPRESS_API_URL` in the **build environment**, including Vercel
Preview/Production. Snapshots are scoped to that exact CMS URL. `.cache/` stores a
local, git-ignored copy for build reuse; no new CMS plugin, field or service is
required for editorial content. Product-specific ACF extras require the small plugin
linked in the content checklist. Builds without a CMS URL retain demo mode. Test mode disables bootstrap
network calls. A configured build with neither available published content nor a
previous snapshot fails explicitly rather than deploying an empty homepage.

Published content refreshes every 15 seconds while the tab is visible and
on tab return/reconnect. Reopening a page checks in the background while showing
its last content. Successful browser reads are retained for up to 24 hours to keep
reloads fast; confirmed removals take priority over older build snapshots. If
browser storage is blocked, the embedded snapshot still provides the first render.
The last successful content remains visible during temporary CMS failures.

Identical concurrent API requests are combined. Local/Preview reads are uncached;
Production has a five-second process cache and a five-second CDN cache, with no
extra stale-while-revalidate window. Page-list reads share in-flight work but have
no second timed cache. Every upstream read bypasses WordPress edge caching using
the shared `server/wordpressRequest.js` transport. A cache miss has a 6-second
upstream deadline and at most one rate-limit retry; the client has an 8-second
deadline and no stacked retry loop. An uncached failure shows a retry action instead
of a minute-long skeleton. Cache expiry and background refresh bring in published
edits and remove unpublished records without restarting Vite or rebuilding.

Every editorial hook uses `usePublishedContent`, including Home, About, all other
pages, related content blocks, settings, posts, menus, services, assets and FAQs.
It centralizes request deadlines, validation, browser persistence and removal
handling. Query scheduling is configured globally in `src/services/queryClient.js`;
`shared/contentSync.js` owns the timing and public API cache constants.

During development, successful public API reads update the running Vite HTML
snapshot and `.cache/content-*.json` automatically. Errors do not overwrite good
content, and confirmed removals update both copies. These generated cache files
are not an editing interface. On Vercel, runtime content refreshes automatically;
the deployed static HTML/crawler snapshot still updates on rebuild/redeployment.

References: [TanStack initial query data](https://tanstack.com/query/latest/docs/framework/react/guides/initial-query-data),
[Vercel cache headers](https://vercel.com/docs/caching/cache-control-headers).

### WordPress articles

Write articles in **Posts**: title, body, Excerpt, categories and featured image.
Publish them to make them available to the storefront. Home → Blog preview → Posts
can select up to three articles in display order; leaving it empty shows the latest
three published posts. Home's Blog button is the section-wide **View All → /blog**.
Each card's **Read More** link is generated automatically as `/blog/<post-slug>`.
Keep published slugs stable to preserve existing links.

`/blog` lists articles with pagination. `/blog/:postSlug` renders the full article;
Vercel rewrites support direct visits and reloads. The public content handler exposes
only allowlisted fields through `resource=posts` (`page`, `limit`, or up to three
`include` IDs) and `resource=post&slug=...`. Draft and password-protected articles
are excluded. Rich text is sanitized and styled with scoped CSS, preserving lists,
headings, paragraphs, links, images and tables without WordPress theme styles.
No WordPress permalink needs to be entered for a card. A post's embedded body links
remain the author's URLs; use storefront paths for links to other storefront pages.

Any WordPress starter post is displayed if it remains published; unpublish unwanted
sample posts in WordPress. Navigation records, search/sharing metadata and the other
editorial pages are connected. Newsletter subscriber storage, contact delivery,
WooCommerce checkout and protected downloads remain separate integrations.
After publishing, rebuild/redeploy to update initial HTML and crawler metadata;
React refreshes visible content at runtime without waiting for another build.

API references: [WordPress posts](https://developer.wordpress.org/rest-api/reference/posts/),
[embedding](https://developer.wordpress.org/rest-api/using-the-rest-api/global-parameters/),
[pagination](https://developer.wordpress.org/rest-api/using-the-rest-api/pagination/).

The About preview's four statistic tiles use these rules:

- **Product Categories:** count distinct category slugs assigned to products in
  the public catalog, excluding the synthetic All Products filter.
- **AI Prompt Products:** count each product once if it belongs to `ai-prompt-packs`
  or `ai-prompts`, or has the `ai-prompts` tag. All tags are checked, not just the
  card's first badge. This counts products, not prompts within a pack. Assign one
  of these existing classifications to new prompt products in WooCommerce.
- **24hr Support** and **100% Digital:** fixed values confirmed by the site owner.

These four tiles do not require manual Statistics blocks. Catalog counts refresh
with the existing product query and include published products returned by the
Store API, including listed products that are temporarily out of stock. First-load
skeletons and error placeholders avoid presenting unavailable data as zero; a
successfully loaded empty catalog correctly shows zero. No numbers are inferred
from product titles, descriptions or old sample marketing claims.

## UI and responsive layouts

The newsletter popup waits three minutes from the browser's first visit, then
appears once. A localStorage flag is saved when it opens, so closing, refreshing,
navigating or returning later does not repeat it. Only the timestamp/display flag
are stored, never the entered name or email. Tabs coordinate the display, and a
hidden tab or an open cart/checkout/dialog defers it until the page is available.
Subscribing through the page also suppresses the popup on future visits. If browser
storage is unavailable, repeat prevention lasts for the current page visit only.

The app uses React, Vite, and Mantine. Brand colors, typography, and shared
component defaults live in `src/theme.js`; `src/main.jsx` installs the provider.
Pages use Mantine containers, grids, flex layouts, buttons, and inputs. Custom
gradients and decorative effects remain in component styles and CSS modules.

Below the Mantine `sm` breakpoint, the homepage product sections and shop use
`ProductCollection`: Mantine Carousel/Embla pages with two columns and two rows.
Cards show compact images, titles, prices and cart buttons; descriptions remain
on the product page. Touch swipes, arrow buttons and keyboard navigation move
between groups of four, and filtering/sorting resets to the first group. Desktop
grids retain their existing layout. Styles live in the collection and card CSS modules.

Loading states use Mantine's built-in `Skeleton`, with reusable components in
`src/components/skeletons`. The homepage, shop, courses and product details show
placeholders for their data-dependent content, including categories and counts.
Product grids reserve the same column widths and compact mobile layout as the
loaded cards. Static content and navigation remain available while requests run.
`CatalogStatus` accepts a page-specific `loading` placeholder and keeps error,
retry and empty states separate from loading.

`LoadingImage` handles product photos independently after catalog data arrives,
including featured images, product details and cart thumbnails. It reserves the
image's container, removes the skeleton when the image loads and shows a fallback
on failure. Skeleton colors live in `Skeletons.module.css`; loading regions are
labelled for assistive technology and animation stops with reduced motion enabled.
The catalog test suite covers delayed responses, responsive skeleton layouts,
retry/empty states, delayed and failed images, and navigation during loading.

The navigation measures its header and announcement heights and uses a drawer
below the desktop breakpoint. Mobile category filters, scrollable dialogs, and
the chat panel adapt to the available viewport. App state and business handlers
remain in `src/App.jsx`, with admin and editor views in `src/components`.

React Router owns browser history. `src/hooks/useAppNavigation.js` maps the existing
navigation handlers to URLs such as `/products`, `/about` and `/products/15`.
Product URLs resolve against the catalog after loading. Back/Forward preserve the
in-memory cart and restore scroll positions; repeated clicks on the current page
do not add history entries. `vercel.json` rewrites these page paths to `index.html`
for direct visits and refreshes, while leaving API and asset routes untouched.
Those hosting rules take effect on the next deployment.

## Verification

```sh
npm run build
npx playwright install chromium
npm run test:e2e
```

To use an existing Google Chrome installation instead:

```sh
PLAYWRIGHT_CHANNEL=chrome npm run test:e2e
```

Browser tests cover pages from 320px to 1440px wide, navigation, search, cart,
checkout, chat, product editing, admin tabs, contact forms, and newsletter
dialogs. Payment and chat requests are mocked during tests.

`npm run lint` also checks the source. Existing unused checkout/admin variables in
`src/App.jsx` still produce lint errors. The new CMS settings and newsletter hook
pass their targeted lint checks; the old newsletter timer dependency warning has
been removed with the new hook.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
