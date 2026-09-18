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

The schema in `scripts/generate-acf-reference.py` is the maintained source for these files. Regenerate from the project root:

```sh
python3 scripts/generate-acf-reference.py
node scripts/render-acf-reference.mjs
```

PDF rendering uses the project's existing Playwright dependency and a locally installed Google Chrome. Use the project's supported Node.js version. No production app dependencies or runtime behavior are changed by this package.
