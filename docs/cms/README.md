# WordPress content model

- [PDF reference](Longlife-Digital-ACF-Field-Definitions.pdf): field definitions, editor instructions, REST mappings and migration decisions.
- [ACF import package](Longlife-Digital-ACF-Import.json): 10 field groups, 6 custom post types and 1 taxonomy, using ACF Free features.
- [Editable reference](Longlife-Digital-ACF-Field-Definitions.md) and [print HTML](Longlife-Digital-ACF-Field-Definitions.html).

In the staging WordPress dashboard, import the JSON through **ACF → Tools → Import Field Groups**. The reference explains which records to create afterward. Importing the definitions alone does not populate content or connect the React app.

The import and published `storefront` record have now been verified on
`staging-a7b0-longlifedigital-zmuro.wpcomstaging.com`. React reads the brand/logo,
contact information, announcement, footer and social links through `/api/content`.
See the project's [WordPress site settings setup](../../README.md#wordpress-site-settings)
for environment configuration and the remaining content migration. The PDF records
the initial schema; these integration notes track the implementation afterward.

The published Home page (slug `home`, Storefront page `Home`) now supplies the
homepage hero and remaining Home sections, including selected trust/benefit blocks,
About rich text and blog preview. Published Posts power `/blog` and individual
`/blog/<slug>` articles; Read More links are automatic. Navigation Links and the remaining storefront pages are now connected. See the
[content checklist](CONTENT-CHECKLIST.md) for exact slugs, fields, missing-content behavior,
and the product ACF plugin installation step. See the
[homepage integration notes](../../README.md#wordpress-homepage-hero-and-catalog-statistics).

The About preview's Product Categories and AI Prompt Products counts are computed
from WooCommerce products. Support (`24hr`) and Digital (`100%`) are fixed,
owner-confirmed values. Leave these four values out of the manual Statistics
relationship; that field remains available for additional editorial statistics
when additional verified content blocks are selected. No ACF re-import is needed.

The schema in `scripts/generate-acf-reference.py` is the maintained source for these files. Regenerate from the project root:

```sh
python3 scripts/generate-acf-reference.py
node scripts/render-acf-reference.mjs
```

PDF rendering uses the project's existing Playwright dependency and a locally installed Google Chrome. Use the project's supported Node.js version. No production app dependencies or runtime behavior are changed by this package.

## Remaining content migration

Use [CONTENT-CHECKLIST.md](CONTENT-CHECKLIST.md) as the current implementation checklist. The existing ACF import remains compatible. Home and Storefront settings are published; About needs its page key selected, and the remaining page/collection records need authoring.
