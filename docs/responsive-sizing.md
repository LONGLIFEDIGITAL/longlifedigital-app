# Responsive sizing

The shared scale is in `src/index.css`:

```css
font-size: clamp(100%, calc(75% + 0.4vw), 150%);
```

With the browser's standard 16px font, the root stays at 16px through 1000px viewport width, grows smoothly to about 18px at 1440px and 22px at 2560px, and stops at 24px. Percentages preserve the user's default font preference. Small screens reflow content instead of shrinking text indefinitely.

Component CSS uses `rem` for typography, spacing, media sizes, and card widths. Mantine numeric style props also convert to `rem`, so both follow this scale. Keep DOM measurements such as the observed navbar height in CSS pixels; passing those measurements into a Mantine numeric sizing prop would scale them twice.

- `src/theme.js`: shared form and button sizing, including readable inputs and minimum click targets.
- `src/components/Nav.module.css`: navigation visibility follows available container width; the gold underline is positioned relative to the centered text rather than the bottom of the button.
- `src/pages/HomePage.module.css` and `src/components/HomeHeroContent.module.css`: hero columns, fluid heading, card, and spacing.
- `src/components/ProductCard.module.css`, `ProductCollection.module.css`, and `BlogCards.module.css`: card proportions and mobile scrolling rows.
- `server/initialMarkup.js`: the initial HTML uses the same root scale and hero sizing to avoid a size jump when React loads. Keep these values synchronized with the corresponding CSS.

Keep hairline borders in pixels. Use `rem` for new component sizes, percentages for available space, and bounded `clamp()` values where a component should grow faster than the shared scale. Existing mobile layouts and scrollable rows remain responsible for how content rearranges.

Run the optimized-production viewport and enlarged-text checks with:

```sh
PLAYWRIGHT_CHANNEL=chrome npx playwright test --config playwright.fluid.config.js
```

These checks use mocked CMS and cart responses and never submit a payment.
