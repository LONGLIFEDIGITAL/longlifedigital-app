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

Local development reads published products from the WordPress staging store,
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
action rather than demo products. Vercel caches successful responses for 60 seconds;
reload the storefront to see publishing changes after that interval.

To enable this connection on a **Vercel Preview** deployment, set
`VITE_WOOCOMMERCE_STORE_API_URL` to
`https://longlifedigital-zmuro.wpcomstaging.com/wp-json/wc/store/v1`
in the Preview environment and redeploy. No API key is required for this public
catalog. This change does not modify Vercel settings or deploy the app.
Production must use its own production CMS URL when ready; the local staging
configuration is not loaded by a production build. With the variable unset,
the existing demo catalog and workflows remain available during migration.

This is the catalog milestone only. WooCommerce products can be added to the
local cart, but checkout is disabled until WooCommerce orders, payment and
fulfillment are connected. They never use the old standalone Stripe flow.
The React admin entry points are hidden in CMS mode; edit these products in
WordPress. Other page content and backend integrations still await migration.

```sh
npm run test:catalog
```

These tests mock the feed and cover pagination, featured products, categories,
prices, loading/errors/retry, stock restrictions, the read-only Vercel endpoint,
and product/cart behavior on mobile and desktop.

## UI and responsive layouts

The app uses React, Vite, and Mantine. Brand colors, typography, and shared
component defaults live in `src/theme.js`; `src/main.jsx` installs the provider.
Pages use Mantine containers, grids, flex layouts, buttons, and inputs. Custom
gradients and decorative effects remain in component styles and CSS modules.

The navigation measures its header and announcement heights and uses a drawer
below the desktop breakpoint. Mobile category filters, scrollable dialogs, and
the chat panel adapt to the available viewport. App state and business handlers
remain in `src/App.jsx`, with admin and editor views in `src/components`.

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

`npm run lint` also checks the source. Existing unused state and the existing
newsletter timer dependency warning are retained to keep application logic
unchanged during the layout refactor.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
