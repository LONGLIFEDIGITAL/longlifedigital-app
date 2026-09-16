# Longlife Digital LLC

## Monthly Operating Cost Estimate

Vercel · WordPress/WooCommerce · Firebase Storage  
Updated September 10, 2026

This estimate outlines Longlife Digital's recurring website services and payment-processing costs. All amounts are in USD, before tax. Three usage scenarios show how the budget changes with sales, file downloads, email volume and AI assistant activity.

## 1. Estimated monthly website budget

| Cost category | Low activity | Launch | Growth |
|---|---|---|---|
| Website services, including usage reserve | $96.64 | $112.19 | $234.74 |
| Payment processing on example sales | $35.00 | $175.00 | $875.00 |
| Total service and transaction budget | $131.64 | $287.19 | $1,109.74 |


## Usage assumptions

| Monthly workload | Low activity | Launch | Growth |
|---|---|---|---|
| Successful domestic-card orders | 20 | 100 | 500 |
| Monthly sales / $50 average order | $1,000 | $5,000 | $25,000 |
| Files stored / downloaded (GiB) | 10 / 25 | 25 / 100 | 100 / 500 |
| AI assistant replies | 500 | 2,000 | 10,000 |
| Combined emails / stored contacts | 500 / 100 | 2,500 / 250 | 4,500 / 500 |
| Vercel paid seats / business mailbox | 2 / 1 | 2 / 1 | 2 / 1 |


> Launch example: $112.19 in website services + $175 in payment fees for 100 orders totaling $5,000 = $287.19 per month.

The scenarios illustrate possible usage rather than forecast revenue. Website service totals include a reserve for Vercel overages; actual invoices depend on consumption. Existing subscriptions can satisfy the listed requirements and should be counted only once.

Fixed means a recurring plan or license at the selected tier. Mixed means a fixed base plus possible usage charges. Annual renewals are shown as a monthly budgeting equivalent; promotions and free trials are excluded.

## 2. Hosting, software and business essentials

| Item / category | Cost type | Monthly cost | Billing basis / scope |
|---|---|---|---|
| Vercel Pro [S1–S2] | Mixed | $40/month | $20 platform fee includes one deploying seat and $20 usage credit; a second paid seat adds $20. |
| WordPress hosting: Kinsta [S3] | Mixed | $35–$50/month | Reference tiers: Single 20GB at $35; Single 40GB at $50. Growth uses $50. Monthly billing; final tier depends on store capacity. |
| WordPress / WooCommerce core + Stripe plugin [S4–S5] | Fixed | $0 | Core software and the official payment gateway extension are free. Hosting and payment-processing charges are listed separately. |
| Primary .co domain [S13] | Annual fixed | $3.79/month equivalent | $45.48 annual renewal benchmark. Actual renewal follows the chosen registrar; applicable fees and taxes are additional. |
| Business mailbox [S12] | Per user | $7/month | One Google Workspace Starter user, one-year commitment, billed monthly. Existing email service can replace this line. |
| Transactional + newsletter email [S10] | Tiered fixed | $9/month | Brevo Starter entry tier: up to 5,000 combined sends and 500 stored contacts. All scenarios stay within both limits. |
| SSL, baseline security, WP backups [S3] | Included | $0 extra | The reference host includes SSL, a web application firewall and daily WordPress backups. Firebase files use a separate backup process. |
| Firebase Hosting / Cloud Functions | Not used | $0 | Vercel hosts the storefront and planned API functions. No duplicate Firebase hosting plan. |


> Fixed/tiered baseline: $94.79 per month with $35 WordPress hosting, or $109.79 with $50 hosting. Storage, AI usage, the overage reserve and payment-processing fees complete the monthly budget.

The budget includes two Vercel paid team accounts. One paid account reduces the estimate by $20 per month; read-only viewers are free. WordPress staff accounts do not each require a Vercel account. Kinsta provides a pricing benchmark; final provider selection remains open.

Variable costs depend on actual consumption. This model uses a new Firebase Storage bucket, Standard storage in us-central1, eligible US-region free allowances, and mainly US downloads. Legacy buckets and other regions can have different charges. [S6–S8, S15]

## 3. Metered rates and assumptions

| Service | Cost type | Published rate / estimate basis |
|---|---|---|
| Firebase Storage [S6–S8] | Variable | About $0.02/GiB-month after 5 GiB; eligible outbound transfer: $0.12/GiB after 100 GiB/month. |
| Storage operations [S7–S8] | Variable | After 5,000 Class A / 50,000 Class B monthly free operations: $0.005 / $0.0004 per 1,000, respectively. |
| Vercel functions/builds [S1] | Variable | $20 usage credit is included in Pro. The scenarios allow $0 / $10 / $40 for additional usage; these reserves are estimates, not fixed provider charges. |
| AI: Claude Haiku 4.5 [S14] | Variable | $1 per million input tokens + $5 per million output tokens. Model 2,000 input + 300 output tokens per reply: $0.0035. |
| Optional Firestore | Variable | $0 in these scenarios. If added, charges will depend on database reads, writes and storage. |


## Monthly usage model

| Usage category | Low activity | Launch | Growth |
|---|---|---|---|
| Storage + download + operations | $0.10 | $0.40 | $49.95 |
| AI assistant | $1.75 | $7.00 | $35.00 |
| Vercel overage budget reserve | $0.00 | $10.00 | $40.00 |
| Combined variable allocation | $1.85 | $17.40 | $124.95 |


> Growth storage example: (100 − 5) × $0.02 + (500 − 100) × $0.12 + $0.045 operations = $49.945, rounded to $49.95/month. A 1 GiB file downloaded 500 times uses 500 GiB.

Operations assumed: 500/5,000, 2,000/20,000 and 10,000/100,000 Class A/B requests across the three scenarios. Free allowances must be available to this billing account. Stored totals must include retained versions and backup copies. Firebase Storage requires Blaze billing; free allowances do not mean a Spark plan is sufficient. Longer chat histories or added retrieval/tool calls increase AI costs; no caching discounts are assumed.

## 4. Payment processing: tied to sales

| Scenario | Amount processed | Transactions | Variable fees |
|---|---|---|---|
| Low activity | $1,000 | 20 | $35.00 |
| Launch | $5,000 | 100 | $175.00 |
| Growth | $25,000 | 500 | $875.00 |

- Stripe US standard pricing is 2.9% + $0.30 per successful domestic-card transaction, with no standard monthly payment-processing fee. WooCommerce adds no core-platform revenue share. [S4, S9]
- Formula: monthly fees = 0.029 × total amount processed + $0.30 × successful transactions. The scenarios assume one payment per order, domestic cards, USD and no separate taxes/shipping added to the stated sales.

## Other payment and commerce charges

- International cards add 1.5%; currency conversion adds 1% when required. Alternative payment methods, disputes, refunds and additional Stripe products can affect the final charge. Account-specific rates apply. [S9]
- Recurring service billing may require a paid subscription extension. Automated tax, online-course software and domain escrow/transfer services are optional additions whose costs depend on the products selected.

## 5. Email plans and capacity

| Email option | Cost type | Price | Limit / treatment |
|---|---|---|---|
| Budgeted: Brevo Starter [S10] | Tiered fixed | $9/month | One combined allowance for newsletter and transactional sends; 5,000 sends / 500 contacts. Included once in totals. |
| Alternative: Brevo Free [S10] | Free / limited | $0 | 300 sends/day. Suitable only if campaigns and order messages can stay within the daily cap. |
| Alternative: Resend [S11] | Mixed | $0 or $20/month | Free: 3,000 transactional emails/month, 100/day. Pro: 50,000/month; $0.90 per additional 1,000. Newsletter service separate. |
| Business mailbox [S12] | Per user | $7/month | Workspace mailbox handles staff correspondence. It serves a different purpose from automated delivery. |


Brevo is counted once. Higher contact/send volumes or optional features may require a higher tier. Alternatives replace the Brevo allowance. Service accounts remain under Longlife Digital ownership.

The baseline covers the services listed in the monthly budget. The options below allow capacity or features to expand as business requirements change. They are not included in the scenario totals.

## 6. Optional service additions

| Item | Cost type | Price or billing basis |
|---|---|---|
| More frequent WordPress backups [S3] | Fixed add-on | $20/month for backups every six hours; $100/month for hourly backups. Daily backups are included in the reference hosting plan. |
| Premium plugins, automated tax, online courses | License / usage | Pricing depends on the selected service and plan. No premium extension is included in the baseline. |
| Additional mailbox [S12] | Per account | +$7/month for each Workspace Starter account with a one-year commitment. |
| Additional Vercel team account [S1] | Per account | +$20/month for each additional paid account. Read-only access is free. |
| Additional domains and advertising | Annual / variable | Only the primary .co renewal is included. Resale-domain renewals and advertising spend depend on the portfolio and campaigns. |


## Billing schedule

| Expense | Budget treatment | Payment schedule |
|---|---|---|
| Primary .co domain [S13] | $3.79/month equivalent | $45.48 annual renewal; the monthly equivalent spreads the annual cost across the budget. |
| Workspace Starter [S12] | $7/account/month | Billed monthly with a one-year commitment. A flexible plan may cost more. |
| Hosting and email plans [S1, S3, S10] | Monthly subscription | Regular monthly rates are used; introductory offers and free trials are not included. |
| Usage and card processing [S7, S9, S14] | Variable | Charges depend on actual consumption and successful payments. |


All figures exclude applicable taxes on provider invoices. Retained file versions and backup copies count toward storage usage. WordPress hosting backups do not automatically include files held in Firebase.

Provider prices were checked on September 10, 2026 using official pricing pages and documentation. Source identifiers beside each cost item correspond to the links below. Estimates use standard ongoing prices, without temporary promotions.

## How to use this estimate

- Final costs depend on the existing subscriptions, registrar, team accounts, payment methods, file sizes, download volume and email contact list. The scenarios provide a starting budget until actual usage is available.
- Annual renewals are shown as monthly equivalents. Domain renewal is $45.48 ÷ 12 = $3.79 per month. The $7 Workspace rate requires a one-year commitment.
- Usage alerts and regular billing reviews help track changes. The Vercel reserve is a budget allowance, not a spending cap. Hosting capacity depends on store activity and API traffic as well as website visits.

## Official sources

- [S1: Vercel Pro: platform, seats, credit and usage](https://vercel.com/docs/plans/pro-plan)
- [S2: Vercel pricing: commercial plan eligibility](https://vercel.com/pricing)
- [S3: Kinsta: monthly hosting, annual billing and backup options](https://kinsta.com/pricing/)
- [S4: WooCommerce: free core platform](https://woocommerce.com/pricing/)
- [S5: WooCommerce: official Stripe extension](https://woocommerce.com/products/stripe/)
- [S6: Firebase pricing: current and legacy storage buckets](https://firebase.google.com/pricing)
- [S7: Google Cloud Storage: storage, requests and data transfer](https://cloud.google.com/storage/pricing)
- [S8: Google Cloud: regional free-tier allowances](https://docs.cloud.google.com/free/docs/free-cloud-features#cloud-storage)
- [S9: Stripe: US standard payment pricing](https://stripe.com/pricing)
- [S10: Brevo: plan prices, email volumes and contact limits](https://help.brevo.com/hc/en-us/articles/208589409-About-Brevo-s-pricing-plans)
- [S11: Resend: transactional email plans](https://resend.com/pricing)
- [S12: Google Workspace: Starter pricing and commitment](https://workspace.google.com/pricing)
- [S13: Namecheap: .co renewal pricing](https://www.namecheap.com/domains/registration/cctld/co/)
- [S14: Anthropic: Claude Haiku 4.5 API pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- [S15: Firebase: Blaze billing requirement for Storage](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024)
