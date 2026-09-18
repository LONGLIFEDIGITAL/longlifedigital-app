"""Generate the ACF import and its reference from one content model (stdlib only)."""
from pathlib import Path
from html import escape
import json

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs' / 'cms'
OUT.mkdir(parents=True, exist_ok=True)
VERSION = '1.0'
DATE = 'September 17, 2026'


def field(name, label, kind='text', help='', required=False, **settings):
    result = dict(name=name, label=label, type=kind, instructions=help, required=int(required))
    defaults = {
        'text': dict(default_value='', maxlength=160),
        'textarea': dict(default_value='', rows=3, new_lines='', maxlength=1000),
        'wysiwyg': dict(default_value='', tabs='all', toolbar='basic', media_upload=0, delay=0),
        'url': dict(default_value=''),
        'email': dict(default_value=''),
        'number': dict(min=0, step=1),
        'true_false': dict(default_value=0, ui=1),
        'select': dict(allow_null=0, multiple=0, ui=1, return_format='value'),
        'checkbox': dict(layout='vertical', return_format='value', allow_custom=0),
        'group': dict(layout='block'),
        'relationship': dict(return_format='id', filters=['search', 'post_type'], min=0, max=8),
        'post_object': dict(return_format='id', allow_null=1, multiple=0, ui=1),
        'image': dict(return_format='id', preview_size='medium', library='all', mime_types='jpg,jpeg,png,webp,avif', max_size=5),
        'date_picker': dict(display_format='F j, Y', return_format='Y-m-d', first_day=1),
    }
    result.update(defaults.get(kind, {}))
    result.update(settings)
    return result


def select(name, label, choices, help='', default='', **settings):
    return field(name, label, 'select', help, choices=dict(choices), default_value=default, **settings)


def group(name, label, children, help='', **settings):
    return field(name, label, 'group', help, sub_fields=children, **settings)


def when(key, *values):
    return [[dict(field=key, operator='==', value=value)] for value in values]


def cta(name='lld_cta', label='Call to action', heading=False):
    fields = []
    if heading:
        fields += [field('heading', 'Heading'), field('body', 'Description', 'textarea')]
    fields += [field('label', 'Button label', help='Leave both label and destination empty to hide this button.', maxlength=60),
               field('destination', 'Destination', help='A storefront path such as /contact, or a complete HTTPS URL. Never a WordPress page permalink.', maxlength=500)]
    return group(name, label, fields)


def media(name, label):
    return group(name, label, [
        field('attachment', 'WordPress image', 'image', 'Optional public preview image; REST value is an attachment ID.'),
        field('public_url', 'Public image URL', 'url', 'Optional HTTPS public image, including a public Firebase preview. If set, this takes precedence over the attachment.'),
        field('alt', 'Alternative text', help='Describe meaningful images; empty for purely decorative images.'),
    ], 'Public presentation media only. Purchased files and signed download links do not belong here.')


def related(name, label, types, maximum=8, help=''):
    return field(name, label, 'relationship', help or 'Select published records in the desired display order. REST returns IDs.', post_type=types, max=maximum)


GROUPS = []
PURPOSES = {}


def add_group(slug, title, locations, fields, purpose):
    def keys(items, prefix):
        for item in items:
            item['key'] = f"field_{prefix}_{item['name']}"
            if 'sub_fields' in item:
                keys(item['sub_fields'], f"{prefix}_{item['name']}")
    keys(fields, f'lld_{slug}')
    entry = dict(key=f'group_lld_{slug}', title=f'Longlife Digital | {title}', fields=fields,
                 location=[[dict(param=param, operator='==', value=value)] for param, value in locations],
                 menu_order=len(GROUPS), position='normal', style='default', label_placement='top',
                 instruction_placement='label', hide_on_screen=[], active=True, description=purpose, show_in_rest=1)
    GROUPS.append(entry)
    PURPOSES[entry['key']] = purpose


PAGE_ROUTES = [
    ('home', '/', 'HomePage.jsx'), ('shop', '/products', 'ShopPage.jsx'),
    ('about', '/about', 'AboutPage.jsx'), ('blog', '/blog', 'BlogPage.jsx'),
    ('services', '/services', 'ServicesPage.jsx'), ('courses', '/courses', 'CoursesPage.jsx'),
    ('domains', '/domains', 'DomainsPage.jsx'), ('contact', '/contact', 'ContactPage.jsx'),
    ('faq', '/faq', 'FAQPage.jsx'), ('refund', '/refund-policy', 'RefundPage.jsx'),
    ('privacy', '/privacy-policy', 'PrivacyPage.jsx'), ('terms', '/terms-of-service', 'TermsPage.jsx'),
]
PAGE_KEY = 'field_lld_page_lld_page_key'
home_fields = [
    field('hero_prefix', 'Hero opening line', help='For example: Beautifully Crafted.'),
    field('hero_highlight', 'Hero highlighted words', help='For example: Digital Products. Gradient styling remains in React.'),
    field('hero_suffix', 'Hero closing line', help='For example: for Life & Business.'),
    cta('primary_cta', 'Primary hero button'), cta('secondary_cta', 'Secondary hero button'),
    field('catalog_title', 'Catalog heading', default_value='Explore Our Products'),
    field('catalog_intro', 'Catalog introduction', 'textarea'),
    field('featured_title', 'Featured heading', default_value='Featured Products'),
    field('featured_intro', 'Featured introduction', 'textarea'),
    field('more_title', 'Second collection heading', default_value='More to Explore'),
    field('more_intro', 'Second collection introduction', 'textarea'),
    cta('collection_cta', 'Collection view-all button'),
    field('offer_title', 'Sale banner heading', default_value='Special Offer'),
    field('offer_button', 'Sale banner button label', default_value='Shop This Deal', maxlength=60),
    related('trust_items', 'Trust strip items', ['lld_block'], help='Select blocks of kind Trust statement; approve delivery/payment claims before publishing.'),
    related('hero_stats', 'Additional hero statistics', ['lld_block'], 3, 'Select approved Statistic blocks. Product count and product review averages are derived from WooCommerce, not manually entered here.'),
    group('about', 'About preview', [
        field('eyebrow', 'Small heading', default_value='Who are we?'), field('heading', 'Heading'),
        field('body', 'Body', 'wysiwyg'),
        related('benefits', 'Benefits', ['lld_block'], 8, 'Select Benefit blocks in display order.'),
        related('stats', 'Statistics', ['lld_block'], 4, 'Select verified Statistic blocks. Hide unverified claims.'), cta('cta', 'About button'),
    ]),
    group('blog', 'Blog preview', [field('heading', 'Heading'), field('intro', 'Introduction', 'textarea'),
        related('posts', 'Featured articles', ['post'], 3, 'Choose up to three published posts. Empty means the latest three published posts.'), cta('cta', 'Blog button')]),
]
add_group('page', 'Page content', [('post_type', 'page')], [
    select('lld_page_key', 'Storefront page', [(key, key.title()) for key, _, _ in PAGE_ROUTES],
           'Set this for each storefront content page. Leave empty on WooCommerce Cart, Checkout, My Account and other unrelated pages. Create one published entry per key using the route table.', allow_null=1),
    field('lld_eyebrow', 'Small heading / badge', help='Optional text above the page heading; Home uses this as the hero badge.'),
    field('lld_heading', 'Display heading', help='Optional override of the WordPress page title. Home uses its three hero segments when supplied.'),
    field('lld_intro', 'Page introduction', 'textarea', 'Home uses this as the hero paragraph; other pages use it below the heading.'),
    cta('lld_cta', 'Page closing call to action', heading=True),
    group('lld_home', 'Homepage sections', home_fields, conditional_logic=when(PAGE_KEY, 'home')),
    group('lld_about', 'About page', [field('tagline', 'Brand introduction', 'textarea'),
        related('sections', 'Mission, offering and promise cards', ['lld_block'], 6, 'Select Value/story blocks. Native page content can hold additional introductory prose.')], conditional_logic=when(PAGE_KEY, 'about')),
    group('lld_contact', 'Contact page copy', [field('information_heading', 'Contact information heading'),
        field('form_heading', 'Form heading'), field('form_intro', 'Form introduction', 'textarea'),
        field('success_heading', 'Success heading'), field('success_body', 'Success message', 'textarea', 'Show only after the future submission API confirms receipt, not on a failed request.')], conditional_logic=when(PAGE_KEY, 'contact')),
    group('lld_policy', 'Policy details', [field('updated_on', 'Policy effective / updated date', 'date_picker', 'Date of the approved policy text, not the last incidental WordPress edit.', required=True),
        field('callout_heading', 'Optional callout heading'), field('callout_body', 'Optional callout text', 'textarea')], conditional_logic=when(PAGE_KEY, 'privacy', 'refund', 'terms')),
], 'Shared page headings and structured sections. Policy prose lives in the native WordPress editor. Collection cards remain separate records. No CSS or React layout code is stored in these fields.')

add_group('settings', 'Site settings', [('post_type', 'lld_settings')], [
    group('lld_brand', 'Brand', [field('name', 'Brand name', required=True, default_value='Longlife Digital'),
        field('legal_name', 'Legal business name', default_value='Longlife Digital LLC'),
        field('tagline', 'Navigation tagline'), field('website', 'Public storefront URL', 'url', required=True), media('logo', 'Brand logo')]),
    group('lld_contact', 'Public contact details', [field('email', 'Support email', 'email', 'Resolve the existing support@lldhome.com versus support@longlifedigital.co mismatch before publishing.', required=True),
        field('social_handle', 'Main social handle'), field('response_note', 'Response-time statement'),
        field('hours', 'Support hours and timezone', 'textarea')]),
    group('lld_social', 'Social links', [field(name, name.title(), 'url') for name in ['instagram', 'facebook', 'tiktok', 'youtube', 'linkedin']]),
    group('lld_announcement', 'Announcement bar', [field('enabled', 'Show announcement', 'true_false'),
        field('message', 'Message', 'textarea', 'Public marketing copy. Any advertised offer must match an active WooCommerce coupon.'),
        field('coupon_code', 'Displayed coupon code', help='Display only; does not create, enable or validate a coupon.'),
        field('delivery_note', 'Delivery note'), cta('cta', 'Optional announcement link')]),
    group('lld_footer', 'Footer', [field('description', 'Business description', 'textarea'),
        field('company_heading', 'Company links heading', default_value='Company'),
        field('support_heading', 'Support links heading', default_value='Support'),
        field('contact_heading', 'Contact heading', default_value='Contact'),
        field('copyright_name', 'Copyright owner', help='Year is generated by React; do not enter a fixed year.')]),
    group('lld_newsletter', 'Newsletter copy', [field('enabled', 'Show newsletter signup', 'true_false', 'Enable in the integrated storefront only once subscription persistence is available.'),
        field('heading', 'Section heading'), field('body', 'Description', 'textarea'),
        field('button_label', 'Subscribe button label', maxlength=60),
        field('consent_text', 'Consent wording', 'textarea'), field('success_message', 'Confirmed subscription message', 'textarea'),
        field('popup_enabled', 'Show newsletter popup', 'true_false'), field('popup_heading', 'Popup heading'),
        field('popup_body', 'Popup body', 'textarea'), field('popup_delay_seconds', 'Popup delay (seconds)', 'number', default_value=30, max=300)]),
    group('lld_chat', 'Chat public copy', [field('display_name', 'Assistant display name'),
        field('welcome', 'Welcome message', 'textarea'), field('unavailable_message', 'Unavailable message', 'textarea'),
        field('suggested_questions', 'Suggested questions', 'textarea', 'One question per line; front end caps the list at four. Public copy only, never model instructions or credentials.')]),
], 'One published record with slug storefront. This is a public content record, not an ACF Pro Options Page. Do not put secrets, staff notes or customer records here.')


def pricing(prefix):
    key = f'field_lld_{prefix}_lld_pricing_mode'
    return [select('lld_pricing_mode', 'Pricing display', [('contact', 'Contact for pricing'), ('estimate', 'Indicative asking / starting price'), ('product', 'Linked WooCommerce product')],
                   'A quoted amount is informational only. Purchasable prices always come from the linked WooCommerce product.', default='contact'),
        field('lld_amount', 'Indicative amount', 'number', 'Never used to charge a customer.', required=True, min=0, step=0.01, conditional_logic=when(key, 'estimate')),
        select('lld_currency', 'Quote currency', [('USD', 'USD')], 'Initial business currency; expand deliberately if other currencies are supported.', default='USD', conditional_logic=when(key, 'estimate')),
        select('lld_billing_period', 'Price wording', [('once', 'One time'), ('month', 'Per month'), ('year', 'Per year')], 'Display wording only; this does not create a subscription.', default='once', conditional_logic=when(key, 'estimate')),
        field('lld_product', 'Linked WooCommerce product', 'post_object', 'Choose a published product. Resolve its ID through the WooCommerce catalog. Checkout remains a later integration.', required=True,
              post_type=['product'], allow_null=0, conditional_logic=when(key, 'product'))]


add_group('service', 'Service details', [('post_type', 'lld_service')], [
    field('lld_icon', 'Icon', help='A short emoji or symbol; no HTML or SVG.', maxlength=12),
    field('lld_nav_label', 'Short menu label', help='Optional; fallback is the service title.', maxlength=60),
    field('lld_nav_summary', 'Menu description', 'textarea', maxlength=160),
    *pricing('service'), cta('lld_cta', 'Service inquiry / consultation button'),
    field('lld_package_details', 'Included work / package details', 'wysiwyg'),
], 'Native title is the service name, excerpt is the card description, content is extended copy, featured image is optional and menu_order controls sorting. The same records feed the Services menu and contact form service choices.')

add_group('asset', 'Domain and website listing', [('post_type', 'lld_asset')], [
    select('lld_asset_type', 'Asset type', [('domain', 'Domain'), ('website', 'Ready-to-launch website')], default='domain', required=True),
    select('lld_availability', 'Listing availability', [('available', 'Available'), ('reserved', 'Reserved'), ('sold', 'Sold')],
           'Editorial status only. Future checkout must enforce inventory and transfer eligibility in WooCommerce.', default='available', required=True),
    field('lld_badge', 'Badge text', maxlength=40),
    field('lld_demo_url', 'Public website preview', 'url', 'HTTPS public demo only; never registrar credentials or transfer codes.', conditional_logic=when('field_lld_asset_lld_asset_type', 'website')),
    *pricing('asset'), cta('lld_cta', 'Inquiry button'),
], 'Native title is the domain or website name; excerpt is the listing summary. Assign Asset Categories for filtering. Initial domain names and asking prices in the React source are samples, not a verified inventory.')

add_group('faq', 'FAQ placement', [('post_type', 'lld_faq')], [
    field('lld_topics', 'Relevant sections', 'checkbox', 'General items appear on the FAQ page. Additional placements can be connected later.', choices={'general': 'General', 'products': 'Products', 'services': 'Services', 'domains': 'Domains'}, default_value=['general']),
], 'Native title is the question and native content is the formatted answer. Use menu_order for ordering. Store approved explanations, not application rules or customer messages.')

add_group('block', 'Reusable content block', [('post_type', 'lld_block')], [
    select('lld_kind', 'Block kind', [('trust', 'Trust statement'), ('benefit', 'Benefit'), ('stat', 'Statistic'), ('value', 'Value / story card')], default='benefit', required=True),
    field('lld_icon', 'Icon', help='Optional short emoji or symbol.', maxlength=12),
    field('lld_stat_value', 'Statistic display value', help='Only approved, supportable marketing figures. Do not duplicate live product counts, prices or product ratings.', required=True, maxlength=30,
          conditional_logic=when('field_lld_block_lld_kind', 'stat')),
], 'Native title is the label, excerpt the short description, and content longer story-card text. Homepage/About relationship fields select and order blocks; no ACF Pro Repeater is required.')

add_group('navigation', 'Navigation link', [('post_type', 'lld_nav_item')], [
    select('lld_area', 'Menu area', [('header', 'Header'), ('footer_company', 'Footer: Company'), ('footer_support', 'Footer: Support'), ('footer_legal', 'Footer: Legal')], default='header', required=True),
    field('lld_destination', 'Destination', help='Storefront path, approved HTTPS URL, mailto: or tel:. Never javascript:, a CMS admin URL or a file download token.', required=True, maxlength=500),
    field('lld_new_tab', 'Open external link in new tab', 'true_false'),
    field('lld_icon', 'Optional icon', maxlength=12),
    select('lld_children_source', 'Dropdown content', [('none', 'No children'), ('manual', 'Child navigation records'), ('services', 'Published services'), ('asset_categories', 'Asset categories')], default='none'),
    field('lld_parent', 'Parent navigation record', 'post_object', 'Optional. Choose a top-level record in the same menu area with Manual children. One level only; no cycles.', post_type=['lld_nav_item']),
], 'Native title is the label, excerpt is an optional dropdown description, and menu_order controls sibling order. Service/category dropdowns are derived from their records so their names are not copied into multiple lists.')

add_group('product', 'Product display extras', [('post_type', 'product')], [
    field('lld_includes', 'What is included', 'wysiwyg', 'Optional additional product section; do not repeat the full WooCommerce description.'),
    field('lld_level', 'Audience / skill level', help='For example: Beginner or All levels. Optional.'),
    field('lld_duration', 'Course duration', help='Display text only, for example 10 weeks. No enrollment or entitlement logic.'),
    field('lld_compatibility', 'Software / format requirements', 'textarea'),
    field('lld_license_summary', 'Public license summary', 'textarea', 'Plain-language display copy; any licensed deliverable is handled separately.'),
], 'Optional product metadata only. WooCommerce owns title, description, short description, categories, images, tags, featured status, prices, discounts, ratings, stock and purchasing rules. ACF REST visibility does not automatically add these extras to the WooCommerce Store API.')

add_group('seo', 'Search and sharing metadata', [('post_type', name) for name in ['page', 'post', 'lld_service', 'lld_asset', 'product']], [
    field('lld_seo_title', 'Search title', help='Optional; fallback is the page or product title plus brand.', maxlength=70),
    field('lld_meta_description', 'Search description', 'textarea', help='Optional concise summary; not a ranking guarantee.', maxlength=180),
    media('lld_share_image', 'Social sharing image'),
    field('lld_noindex', 'Request noindex', 'true_false', 'An indexing preference only, not access control. The React metadata/prerender integration must apply it.'),
], 'Applies to public pages, posts, services, assets and products. Use this as the initial metadata source; reconcile with any future SEO plugin instead of maintaining two competing sets of fields.')

add_group('asset_category', 'Asset category display', [('taxonomy', 'lld_asset_cat')], [
    field('lld_icon', 'Category icon', help='Optional short emoji or symbol.', maxlength=12),
    field('lld_order', 'Category display order', 'number', default_value=0),
], 'Native term name and description supply category labels and menu descriptions. Native slug identifies each filter. Initial categories: Premium, Brandable, Local, AI-related, Marketing and Real Estate.')

CPT_DEFS = [
    ('lld_settings', 'Site Settings', 'Site Settings Record', 'lld-settings', 'Public brand/contact/newsletter/chat copy; one record named Storefront with slug storefront.', ['title', 'revisions'], 'dashicons-admin-settings'),
    ('lld_service', 'Services', 'Service', 'lld-services', 'One published record per service or package.', ['title', 'editor', 'excerpt', 'thumbnail', 'revisions', 'page-attributes'], 'dashicons-businessman'),
    ('lld_asset', 'Assets', 'Asset', 'lld-assets', 'Domains now; website listings supported for later migration.', ['title', 'editor', 'excerpt', 'thumbnail', 'revisions', 'page-attributes'], 'dashicons-admin-site-alt3'),
    ('lld_faq', 'FAQs', 'FAQ', 'lld-faqs', 'Question in title, answer in content.', ['title', 'editor', 'revisions', 'page-attributes'], 'dashicons-editor-help'),
    ('lld_block', 'Content Blocks', 'Content Block', 'lld-blocks', 'Reusable trust statements, benefits, story cards and approved statistics.', ['title', 'editor', 'excerpt', 'revisions', 'page-attributes'], 'dashicons-screenoptions'),
    ('lld_nav_item', 'Navigation Links', 'Navigation Link', 'lld-navigation', 'Public header/footer links and dropdown sources.', ['title', 'excerpt', 'revisions', 'page-attributes'], 'dashicons-menu'),
]
CPTS = []
for name, plural, singular, rest, purpose, supports, icon in CPT_DEFS:
    CPTS.append(dict(key=f'post_type_{name}', title=plural, active=True, post_type=name,
        advanced_configuration=True, labels=dict(name=plural, singular_name=singular, menu_name=plural,
            add_new_item=f'Add {singular}', edit_item=f'Edit {singular}', all_items=f'All {plural}'),
        description=purpose, public=True, publicly_queryable=False, exclude_from_search=True,
        hierarchical=False, show_ui=True, show_in_menu=True, show_in_admin_bar=True,
        show_in_nav_menus=False, show_in_rest=True, rest_base=rest, rest_namespace='wp/v2',
        rest_controller_class='WP_REST_Posts_Controller', menu_icon=icon, supports=supports,
        taxonomies=['lld_asset_cat'] if name == 'lld_asset' else [],
        has_archive=False, rewrite=dict(permalink_rewrite='no_permalink'), query_var='none',
        can_export=True, delete_with_user=False, rename_capabilities=False))
TAXONOMIES = [dict(key='taxonomy_lld_asset_cat', title='Asset Categories', active=True,
    taxonomy='lld_asset_cat', object_type=['lld_asset'], advanced_configuration=True,
    labels=dict(name='Asset Categories', singular_name='Asset Category', menu_name='Asset Categories'),
    public=True, publicly_queryable=False, hierarchical=True, show_ui=True, show_in_menu=True,
    show_in_nav_menus=False, show_in_rest=True, rest_base='lld-asset-categories', rest_namespace='wp/v2',
    rest_controller_class='WP_REST_Terms_Controller', show_admin_column=True,
    rewrite=dict(permalink_rewrite='no_permalink'), query_var='none')]

IMPORT = CPTS + TAXONOMIES + GROUPS


def walk(items, path=''):
    for item in items:
        dotted = f"{path}.{item['name']}".strip('.')
        yield item, dotted
        yield from walk(item.get('sub_fields', []), dotted)


FIELDS = [entry for item in GROUPS for entry in walk(item['fields'])]
KEYS = [item['key'] for item in IMPORT] + [item['key'] for item, _ in FIELDS]
assert len(KEYS) == len(set(KEYS)), 'Duplicate ACF key'
FREE_TYPES = {'text', 'textarea', 'wysiwyg', 'url', 'email', 'number', 'true_false', 'select', 'checkbox', 'group', 'relationship', 'post_object', 'image', 'date_picker'}
for item, _ in FIELDS:
    assert item['type'] in FREE_TYPES
    for conditions in item.get('conditional_logic', []):
        for condition in conditions:
            assert condition['field'] in KEYS, condition
            controller = next(f for f, _ in FIELDS if f['key'] == condition['field'])
            assert condition['value'] in controller['choices'], condition
    if item['type'] in {'post_object', 'relationship'}:
        assert set(item['post_type']) <= {x['post_type'] for x in CPTS} | {'post', 'product'}
for item in CPTS:
    assert len(item['post_type']) <= 20
assert all(item['show_in_rest'] == 1 for item in GROUPS)
(OUT / 'Longlife-Digital-ACF-Import.json').write_text(json.dumps(IMPORT, indent=2, ensure_ascii=False) + '\n')

# The rest of this generator builds the human reference from these same definitions.
SECTIONS = []


def section(title, body):
    SECTIONS.append((title, body))


def paragraph(text):
    return f'<p>{text}</p>'


def bullets(items):
    return '<ul>' + ''.join(f'<li>{item}</li>' for item in items) + '</ul>'


def table(headers, rows):
    widths = [32, 17, 51] if headers[0] == 'Label / API path' else {2: [31, 69], 3: [28, 30, 42], 4: [14, 23, 25, 38]}[len(headers)]
    columns = '<colgroup>' + ''.join(f'<col style="width:{width}%">' for width in widths) + '</colgroup>'
    return '<table>' + columns + '<thead><tr>' + ''.join(f'<th>{escape(x)}</th>' for x in headers) + '</tr></thead><tbody>' + ''.join('<tr>' + ''.join(f'<td>{cell}</td>' for cell in row) + '</tr>' for row in rows) + '</tbody></table>'


section('Scope and ownership', paragraph('This reference defines the next content migration for the existing React/Vite/Mantine storefront. It is a schema and import package, not a completed CMS connection. Importing it creates editing structures; it does not populate records, change the React UI or enable checkout.') +
    table(['Owner', 'Content / responsibility'], [
        ['WordPress + ACF Free', 'Pages, services, assets, FAQs, reusable content blocks, navigation and public site copy.'],
        ['Native WordPress fields', 'Titles, slugs, publication status, long-form content, post excerpts, categories, dates and featured media where supported.'],
        ['WooCommerce', 'Product catalog, prices, stock, reviews, coupons, customers and orders. Product extras in this package require a later API mapping.'],
        ['React on Vercel', 'Layout, gradients, icons, responsive breakpoints, route handling, interactive state and loading/error behavior.'],
        ['Firebase / server integration later', 'Public media integration and protected fulfillment. Purchased file references, credentials, customer data and webhook secrets are excluded from this public import.'],
    ]) + paragraph(f'<strong>Package:</strong> {len(GROUPS)} field groups, {len(CPTS)} custom post types, one taxonomy and {len(FIELDS)} field definitions including structural Group fields. Designed for current ACF Free 6.1+ post-type support and WooCommerce. No Repeater, Flexible Content, Clone, Gallery or Pro Options Pages are used. [1–4]'))

section('Inventory and migration decisions', table(['Current source', 'Target / decision'], [
    ['HomePage.jsx', 'Structured hero and section copy; related blocks for benefits/statistics; real WooCommerce products and native WordPress posts for collections.'],
    ['Nav.jsx; HomePage.jsx footer', 'Public Site Settings + Navigation Links. Service and asset-category dropdowns derive their entries from their content records.'],
    ['ServicesPage.jsx; Nav.jsx; ContactPage.jsx', 'One shared Services collection replaces the repeated lists, menu summaries and form service choices.'],
    ['DomainsPage.jsx', 'Assets and Asset Categories replace sample listings and hardcoded filters. Verify domain ownership/availability before adding records.'],
    ['AboutPage.jsx; FAQPage.jsx', 'Page copy + Content Blocks for story cards; separate FAQ records for questions/answers.'],
    ['PrivacyPage.jsx; TermsPage.jsx; RefundPage.jsx', 'Native page editor for full approved policy content; ACF for the effective date and optional callout. Existing January 2024 dates and Payhip statements require review.'],
    ['constants/data.js BLOG_POSTS; BlogPage.jsx', 'Native posts, excerpts, dates, categories and images. Full articles and a working article route still need implementation; current Read More controls have no handler.'],
    ['ContactPage.jsx; DEFAULT_CONTACT; api/chat.js', 'Consolidate conflicting support emails into one approved Site Settings value. Keep inquiries/subscriber records out of public ACF fields.'],
    ['NewsletterPopup.jsx; AIChat.jsx; api/chat.js', 'Move only public interface copy into settings. Subscription delivery, chatbot grounding and server-owned instructions remain implementation work.'],
    ['ProductPage.jsx; ProductCard.jsx; catalog.js', 'Reuse WooCommerce data. Add only includes, level, duration, compatibility and public license copy.'],
]) + paragraph('Do not automatically migrate sample revenue claims, ratings, customer totals, guarantees, payment methods, coupon promises, domain inventory or dated policies. Populate approved content; keep unsupported statistics and unconfigured promotions absent.'))

section('WordPress content structure', table(['Screen / type key', 'REST collection under /wp-json/wp/v2/', 'Native content'], [
    ['Pages / page', '<code>pages</code>', 'One entry per route below; title and editor content as applicable.'],
    ['Posts / post', '<code>posts</code>', 'Articles: title, content, excerpt, date, categories, tags, featured image.'],
    *[[f'{escape(plural)}<br><code>{name}</code>', f'<code>{rest}</code>', escape(purpose)] for name, plural, _, rest, purpose, _, _ in CPT_DEFS],
    ['Asset Categories / lld_asset_cat', '<code>lld-asset-categories</code>', 'Name, slug, description; attached to Assets.'],
]) + paragraph('Custom content types are editable in WordPress and exposed through REST, with WordPress public permalink rendering disabled. Their published content remains public through the API. This setting is not privacy protection. Create exactly one published Site Settings record with slug <code>storefront</code>. [2, 5]') +
    paragraph('Use WordPress Order (menu_order) on services, assets, FAQs, blocks and navigation where available. Sort fetched records by menu_order then ID in React. Relationship selections have their own explicit order. Fetch all REST pages before sorting; do not assume the first API page is the full collection.'))

section('Page keys and storefront routes', paragraph('Create the following WordPress Pages. Keep WordPress slugs stable and set the matching <code>lld_page_key</code>. The homepage record uses slug <code>home</code>; its React route remains <code>/</code>. WordPress front-page/theme settings do not control the React layout.') +
    table(['Page key', 'WordPress slug', 'React route', 'Current component'], [[f'<code>{key}</code>', f'<code>{"home" if key == "home" else route[1:]}</code>', f'<code>{route}</code>', escape(component)] for key, route, component in PAGE_ROUTES]) +
    paragraph('The page-key selector controls which structured fields appear; it does not create routes. Uniqueness of page keys and the settings singleton is a publishing convention in this package, not a database constraint. Validate these during migration. Leave duplicate or unfinished entries in Draft.'))

section('Field conventions and validation', bullets([
    'API paths in the following tables are relative to the response <code>acf</code> object. Group fields nest their children. Field group keys are stable import identifiers; never rename a field name/key after integration without a migration.',
    'Required means ACF requires the field when its conditional editor controls are visible. Optional blank values omit the corresponding presentation, or use the documented fallback. ACF conditionals affect the editor; React must also respect the page key, pricing mode and block kind.',
    'Text is plain text. Textarea is plain text unless specified otherwise. WYSIWYG/native editor content must be sanitized by the application before HTML rendering. No raw scripts, HTML icons, CSS snippets or React components belong in text fields.',
    'Relationship fields return ordered ID arrays; Post Object fields return an ID or an empty value. Resolve only published, accessible records and preserve the chosen order. Do not use WordPress permalink URLs as React navigation destinations.',
    'The read contract uses <code>acf_format=light</code>. Image fields return attachment IDs; retrieve public media details from the WordPress media endpoint. Explicit public image URLs override attachments. Never put private object paths or signed/tokenized delivery URLs in image fields. [2]',
    'Destination text fields deliberately accept relative storefront paths. The future consumer must allow only local paths and explicitly allowed HTTPS/mailto/tel links, and reject other schemes. ACF Text alone does not validate this rule.',
    'Defaults are editor conveniences, not migrated or approved content. The import deliberately contains no product/post IDs, actual policy content, real coupon offers, domain inventory or customer statistics.',
    'All imported field groups have REST visibility enabled and contain public copy only. Conditional hiding, noindex, and publicly_queryable=false do not make a field confidential.',
]))

FIELD_BY_KEY = {f['key']: (f, path) for f, path in FIELDS}


def rules(item):
    bits = []
    if item.get('instructions'):
        bits.append(escape(item['instructions']))
    if item.get('choices'):
        bits.append('Choices: ' + '; '.join(f'<code>{escape(k)}</code> = {escape(v)}' for k, v in item['choices'].items()) + '.')
    default = item.get('default_value')
    if default not in (None, '', []):
        bits.append('Default: <code>' + escape(str(default)) + '</code>.')
    for key, title in [('maxlength', 'Max characters'), ('min', 'Minimum'), ('max', 'Maximum'), ('step', 'Increment')]:
        if key in item:
            bits.append(f'{title}: {item[key]}.')
    if item.get('post_type'):
        bits.append('Records: ' + ', '.join(f'<code>{x}</code>' for x in item['post_type']) + '.')
    if item['type'] == 'date_picker':
        bits.append('REST light format: <code>Ymd</code> (for example 20260917). Configured standard return format: <code>Y-m-d</code>. Normalize in the content mapper before display.')
    elif item.get('return_format'):
        bits.append('Returns: <code>' + item['return_format'] + '</code>.')
    if item.get('conditional_logic'):
        tests = []
        for conditions in item['conditional_logic']:
            tests.append(' AND '.join(f"{FIELD_BY_KEY[c['field']][1]} = {c['value']}" for c in conditions))
        bits.append('Show when: <code>' + escape(' OR '.join(tests)) + '</code>.')
    if item['type'] == 'image':
        bits.append('Public image: JPG, PNG, WebP or AVIF; max 5 MB. Server image support still applies.')
    return '<br>'.join(bits) or 'Optional presentation value.'


def field_table(items, parent=''):
    return table(['Label / API path', 'Type / required', 'Definition and rules'], [
        [f"<strong>{escape(item['label'])}</strong><br><code>{escape(path)}</code>",
         f"{item['type']}<br>{'Required' if item['required'] else 'Optional'}",
         rules(item)] for item, path in walk(items, parent) if item['type'] != 'group'])


for entry in GROUPS:
    title = entry['title'].split(' | ')[1]
    locations = ' OR '.join(f"{rule[0]['param']} = {rule[0]['value']}" for rule in entry['location'])
    intro = paragraph(f"<code>{entry['key']}</code> · Location: <code>{locations}</code> · Public REST: enabled.") + paragraph(escape(PURPOSES[entry['key']]))
    # Keep each ACF field group together as a chapter; nested Group fields are subsections.
    simple = [f for f in entry['fields'] if f['type'] != 'group']
    nested = [f for f in entry['fields'] if f['type'] == 'group']
    body = intro + (field_table(simple) if simple else '')
    for item in nested:
        leaf_count = sum(child['type'] != 'group' for child, _ in walk(item['sub_fields']))
        css_class = 'field-subsection compact' if leaf_count <= 5 else 'field-subsection'
        body += f'<div class="{css_class}"><h3>{escape(item["label"])}</h3>' + paragraph(f"Public object: <code>acf.{item['name']}</code>. Child fields inherit this group's visibility conditions.") + paragraph(rules(item)) + field_table(item['sub_fields'], item['name']) + '</div>'
    section(title, body)

section('Native fields: avoid duplicate editing', table(['Content', 'Use native WordPress / WooCommerce', 'ACF additions'], [
    ['Articles', 'Title, content, excerpt, published date, categories/tags and featured image. Native sticky flag or Home selected-post list for curation.', 'SEO overrides only. Derive reading time from content if added later.'],
    ['FAQs', 'Title = question; content = answer; Order = display order.', 'Topic placement only.'],
    ['Policy pages', 'Title and full approved text in the page editor.', 'Policy date, callout and shared page/SEO metadata.'],
    ['Products / courses', 'Catalog text, price/sale dates/currency, stock, sold-individually rules, categories, tags, images, reviews and featured flag.', 'Includes, level, duration, compatibility and license summary only.'],
    ['Services / assets', 'Title, excerpt, extended content, optional featured media, publication status and Order.', 'Offer-specific display details and optional WooCommerce product relationship.'],
    ['Site links', 'Native record title and excerpt supply link label and description.', 'Destination, area, parent/source and new-tab choice.'],
]) + paragraph('For service/asset entries using a linked WooCommerce product, resolve price and purchasing eligibility from that product. Editorial quote fields and monthly wording do not implement payments, subscriptions, stock locks or ownership transfers.'))

section('Import and first content entry', bullets([
    '<strong>1. Import the package.</strong> In staging WordPress, open <strong>ACF → Tools → Import Field Groups</strong> (the import screen may also mention post types/taxonomies). Select <code>Longlife-Digital-ACF-Import.json</code> and click Import JSON. The file contains all 17 structures, with types before field groups. ACF can identify mixed exports by their keys. [3, 4]',
    '<strong>2. Confirm the structures.</strong> Expect six custom post types, Asset Categories, and ten Longlife Digital field groups. The import adds definitions only; no Pages, service records or settings values are created.',
    '<strong>3. Create shared settings.</strong> Under Site Settings, add a record titled Storefront with slug <code>storefront</code>. Set the confirmed support email and public website URL. Populate brand/social/footer copy. Enable announcements and signup copy only as their corresponding features are ready.',
    '<strong>4. Create the pages.</strong> Use the route table. On each page select its Storefront page key. Add approved title/introduction and applicable sections. Use the native editor for policy text. Publish only content intended for the public staging feed.',
    '<strong>5. Populate collections.</strong> Add approved services, FAQ records, content blocks, verified assets/categories and full blog posts. Add the navigation records below. Then select those records in the Home/About relationships.',
    '<strong>6. Check REST output.</strong> Open the sample public endpoints on the next page and confirm the <code>acf</code> object exists. Draft/private content requires authenticated preview work and will not be shown by the planned public content feed.',
    '<strong>7. Connect React.</strong> The storefront still needs content API services, mapping, loading states and component changes. This package does not activate those connections automatically.',
]) + paragraph('Re-importing uses the same stable ACF keys and updates these definitions. Export any locally edited Longlife Digital groups first if you want to retain those changes; use this generator as the maintained source of truth. Import behavior has been checked against ACF’s documented format and source; live import into your WordPress site has not been performed.'))

section('Initial navigation and public endpoints', table(['Area', 'Label', 'Destination / children'], [
    ['Header', 'Home', '/'], ['Header', 'Services', '/services · children_source=services'],
    ['Header', 'Courses', '/courses'], ['Header', 'Domains', '/domains · children_source=asset_categories'],
    ['Header', 'Digital Products', '/products'], ['Header', 'About', '/about'], ['Header', 'Contact', '/contact'],
    ['Footer: Company', 'About / Blog / Shop', '/about / /blog / /products; one record per link'],
    ['Footer: Support', 'FAQ / Refund Policy / Privacy Policy / Terms / Contact', '/faq / /refund-policy / /privacy-policy / /terms-of-service / /contact; one record per link'],
    ['Footer: Legal', 'Refund Policy / Privacy Policy / Terms', 'Same policy routes; separate records allow their own order.'],
]) + paragraph('Use the existing staging origin with these read-only paths. Namespace paths below are examples, not credentials. [2, 5]') +
    table(['Purpose', 'GET path'], [
        ['Homepage content', '<code>/wp-json/wp/v2/pages?slug=home&amp;acf_format=light</code>'],
        ['Public shared settings', '<code>/wp-json/wp/v2/lld-settings?slug=storefront&amp;acf_format=light</code>'],
        ['Services / FAQs / blocks', '<code>/wp-json/wp/v2/lld-services?per_page=100</code><br><code>/wp-json/wp/v2/lld-faqs?per_page=100</code><br><code>/wp-json/wp/v2/lld-blocks?per_page=100</code>'],
        ['Assets / categories / navigation', '<code>/wp-json/wp/v2/lld-assets?per_page=100</code><br><code>/wp-json/wp/v2/lld-asset-categories?per_page=100</code><br><code>/wp-json/wp/v2/lld-navigation?per_page=100</code>'],
        ['Articles', '<code>/wp-json/wp/v2/posts?per_page=3&amp;_embed</code>'],
        ['Existing product catalog', '<code>/wp-json/wc/store/v1/products</code> · Different API namespace; product extras need a Store API extension/allowlisted backend mapping. [6]'],
    ]))

section('Integration contract and acceptance', bullets([
    'Build a same-origin read-only content endpoint alongside /api/catalog, allowlisting resources and query parameters. Use TanStack Query for separate content queries with background refresh, cached success data, first-load skeletons and error/empty states.',
    'Fetch pages by stable slug; confirm page keys agree. Read one storefront settings record. Keep settings missing/error states distinct from intentionally empty optional fields; do not quietly insert old sample claims.',
    'Normalize ACF light-format scalar/ID values, resolve public media/relationships, follow pagination headers, sanitize HTML and validate link schemes. Never trust ACF required-field/UI settings as server authorization.',
    'Convert native WordPress links to approved storefront routes. Implement /blog/:slug and any desired service/asset detail routes before rendering links to them; these routes are not present in the current app.',
    'Map only the named public product extras into the WooCommerce Store API or a verified allowlisted backend response. ACF Show in REST API alone does not extend /wc/store/v1/products. Never expose arbitrary product meta or private download data. [6]',
    'Apply SEO fields to actual document metadata and sharing/prerender output. WordPress field entry alone does not change React page metadata. Configure staging noindex separately; noindex does not protect drafts.',
    'Editorial checks: approved support email, real service prices and asset ownership, genuine published articles, active coupon claims, accurate delivery wording, current approved policy dates and substantiated statistics.',
    'Migration checks: saving public content updates the correct React section; native policy lists/links retain formatting; field absence does not break layouts; hidden/deleted records disappear; keyboard/mobile navigation works; public responses contain no secrets or private fulfillment metadata.',
]) + paragraph('Out of this package: customer accounts, contact/newsletter storage, form delivery, orders/payments/refunds, protected Firebase files, subscriber/customer PII, internal chatbot instructions and automatic domain transfer. Public copy for those features must describe what the implemented system actually supports.'))

section('Sources and document maintenance', paragraph('Project-specific field names, grouping and defaults are design decisions based on the current codebase, not requirements imposed by ACF. References were checked for this edition; the package targets ACF Free with built-in post-type/taxonomy support.') +
    bullets([
        '[1] ACF Free features and download: <a href="https://www.advancedcustomfields.com/download/">advancedcustomfields.com/download</a>',
        '[2] ACF REST integration and response formats: <a href="https://www.advancedcustomfields.com/resources/wp-rest-api-integration/">ACF REST documentation</a>',
        '[3] ACF import/export overview: <a href="https://www.advancedcustomfields.com/resources/frequently-asked-questions/">ACF frequently asked questions</a>',
        '[4] ACF import/post-type/taxonomy implementation: <a href="https://github.com/AdvancedCustomFields/acf/tree/master/includes">Official ACF source</a>',
        '[5] WordPress Pages REST reference: <a href="https://developer.wordpress.org/rest-api/reference/pages/">WordPress Pages API</a>',
        '[6] WooCommerce Store API extension: <a href="https://developer.woocommerce.com/docs/apis/store-api/extending-store-api/extend-store-api-add-data/">Extending Store API responses</a>',
        'Local planning basis: docs/Longlife-Digital-CMS-Integration-Plan.md and the source components named in the inventory. This document does not treat source sample content as approved client content.',
    ]) + paragraph('Maintain definitions in <code>scripts/generate-acf-reference.py</code>. Run it to regenerate the import JSON, editable Markdown and print HTML, then run <code>node scripts/render-acf-reference.mjs</code> to regenerate the PDF. Stable field names are the contract for the subsequent React integration.') +
    paragraph('Revision 1.0 — initial field model and import package. No live WordPress configuration or storefront behavior has been changed by generating this reference.'))

CSS = '''
@page { size: A4; margin: 18mm 17mm 19mm; }
* { box-sizing: border-box; }
body { font: 10pt/1.5 Arial, sans-serif; color: #292035; margin: 0; }
h1 { font-size: 34pt; line-height: 1.12; margin: 10mm 0 6mm; color: #291340; }
h2 { font-size: 20pt; line-height: 1.2; color: #442059; margin: 0 0 5mm; }
h3 { font-size: 12pt; color: #442059; margin: 6mm 0 3mm; }
h2, h3 { break-after: avoid; }
.field-subsection > p { break-after: avoid; }
.field-subsection.compact { break-inside: avoid; }
p { margin: 0 0 4mm; }
li { margin-bottom: 3mm; }
ul { padding-left: 5mm; }
section { break-before: page; }
table { border-collapse: collapse; width: 100%; table-layout: fixed; font-size: 8.3pt; margin: 4mm 0; }
th { background: #442059; color: #fff; text-align: left; font-size: 8.4pt; padding: 2.6mm; }
td { border-bottom: 1px solid #dfd5e6; padding: 2.6mm; vertical-align: top; overflow-wrap: anywhere; }
tr { break-inside: avoid; }
thead { display: table-header-group; }
tbody tr:nth-child(even) { background: #f6f1f9; }
code { font: 8pt/1.45 Menlo, monospace; overflow-wrap: anywhere; color: #5b336e; }
strong { font-weight: 700; }
a { color: #653087; text-decoration: none; }
.cover { min-height: 235mm; padding-top: 22mm; }
.eyebrow { color: #835896; text-transform: uppercase; letter-spacing: .15em; font-size: 10pt; }
.line { width: 28mm; height: 1.5mm; background: #c69e54; margin: 8mm 0; }
.subtitle { font-size: 15pt; color: #766182; max-width: 145mm; }
.cover-card { margin-top: 20mm; padding: 8mm; border: 1px solid #d9c8e5; border-radius: 3mm; background: #f7f2fa; }
.meta { margin-top: 12mm; font-size: 9pt; color: #756780; }
.toc li { margin-bottom: 2mm; }
.toc ol { columns: 2; column-gap: 12mm; padding-left: 6mm; font-size: 9pt; }
.toc li { break-inside: avoid; }
'''
cover = f'''<div class="cover"><div class="eyebrow">Longlife Digital LLC · CMS reference</div>
<h1>Content model &amp;<br>ACF field definitions</h1><div class="line"></div>
<p class="subtitle">A practical WordPress setup guide and field dictionary for the headless storefront.</p>
<div class="cover-card"><strong>Step 2 · Content migration</strong><p>WordPress + WooCommerce · ACF Free · React on Vercel</p>
<p>{len(GROUPS)} field groups · {len(CPTS)} custom content types · 1 taxonomy</p>
<p>Includes the companion <code>Longlife-Digital-ACF-Import.json</code> package, editor instructions, ownership boundaries and the API contract.</p></div>
<p class="meta">Version {VERSION} · {DATE}<br>Prepared from the current project source and integration plan.</p></div>'''
toc = '<section class="toc"><h2>Reference contents</h2><ol>' + ''.join(f'<li><a href="#section-{i}">{escape(title)}</a></li>' for i, (title, _) in enumerate(SECTIONS)) + '</ol></section>'
content = ''.join(f'<section id="section-{i}"><h2>{escape(title)}</h2>{body}</section>' for i, (title, body) in enumerate(SECTIONS))
html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Longlife Digital — ACF Field Definitions</title><style>' + CSS + '</style></head><body>' + cover + toc + content + '</body></html>'
(OUT / 'Longlife-Digital-ACF-Field-Definitions.html').write_text(html)

# Markdown retains the HTML tables so every definition stays editable and identical to print.
md = f'# Longlife Digital LLC\n\n# ACF Field Definitions\n\nVersion {VERSION} · {DATE}\n\n'
for title, body in SECTIONS:
    md += f'## {title}\n\n{body}\n\n'
(OUT / 'Longlife-Digital-ACF-Field-Definitions.md').write_text(md)
print(f'Generated {len(GROUPS)} groups, {len(CPTS)} post types, {len(TAXONOMIES)} taxonomy, {len(FIELDS)} fields and {len(SECTIONS)} reference sections.')
