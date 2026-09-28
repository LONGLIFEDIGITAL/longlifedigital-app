import { useEffect, useRef, useState } from 'react';
import { Button, Container, NativeSelect, TextInput } from '@mantine/core';
import { Link, useLocation, useSearchParams } from 'react-router';
import useContent from '../hooks/useContent';
import useCatalog from '../hooks/useCatalog';
import { wordpressApiUrl } from '../services/siteSettings';
import { ContentState, PageCta } from '../components/ContentPage';
import ContentButton from '../components/ContentButton';
import ArrowIcon from '../components/ArrowIcon';
import PageMetadata from '../components/PageMetadata';
import CmsFaqs from '../components/CmsFaqs';
import RichText from '../components/RichText';
import { collectionButton } from '../utils/collectionCopy';
import classes from './DomainsPage.module.css';

function money(amount, currency = 'USD') {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return null;
  }
}

function ListingOffer({ item, products, sameCms }) {
  const available = !item.availability || item.availability === 'available';
  const pricing = item.pricing || {};
  const product =
    pricing.mode === 'product' && sameCms
      ? products.find((product) => product.id === pricing.productId)
      : null;
  const price =
    pricing.mode === 'estimate' && Number.isFinite(pricing.amount)
      ? money(pricing.amount, pricing.currency)
      : product && Number.isFinite(product.price)
        ? money(product.price, product.currency)
        : null;
  return (
    <div className={classes.offer}>
      <div>
        <span className={classes.priceLabel}>
          {price ? (pricing.mode === 'estimate' ? 'Starting at' : 'Listed price') : 'Let’s talk'}
        </span>
        <p className={classes.price}>
          {price || 'Price on request'}
          {price && pricing.mode === 'estimate' && ['month', 'year'].includes(pricing.period) && (
            <small> / {pricing.period}</small>
          )}
        </p>
      </div>
      {available ? (
        product && price ? (
          <Button
            component={Link}
            to={`/products/${product.id}`}
            radius="xl"
            rightSection={<ArrowIcon />}
          >
            View product
          </Button>
        ) : (
          <ContentButton
            radius="xl"
            arrow="up-right"
            button={collectionButton(item.cta, 'Inquire now', '/contact')}
          />
        )
      ) : (
        <span className={classes.unavailable}>Not currently available</span>
      )}
    </div>
  );
}

export default function DomainsPage() {
  const content = useContent('page', 'domains');
  const records = useContent('assets');
  const categories = useContent('asset-categories');
  const { products } = useCatalog();
  const storeUrl = import.meta.env.VITE_WOOCOMMERCE_STORE_API_URL;
  const sameCms = Boolean(
    storeUrl && wordpressApiUrl && new URL(storeUrl).origin === new URL(wordpressApiUrl).origin,
  );
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const selected = params.get('category') || '';
  const category = categories.data?.find((item) => item.slug === selected);
  const assets = records.data || [];
  const items = assets.filter(
    (item) =>
      (!selected || (category && item.categories?.includes(category.id))) &&
      `${item.title} ${item.description || ''}`.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const copy = content.data?.collection || {};
  const available = assets.filter(
    (item) => !item.availability || item.availability === 'available',
  );
  const featured = available.find((item) => item.id === copy.featuredAsset) || available[0];
  const location = useLocation();
  const scrolledTarget = useRef('');
  useEffect(() => {
    const key = `${location.key}:${location.hash}`;
    if (!location.hash || scrolledTarget.current === key) return;
    let id;
    try {
      id = decodeURIComponent(location.hash.slice(1));
    } catch {
      return;
    }
    const frame = requestAnimationFrame(() => {
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ block: 'start' });
        scrolledTarget.current = key;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [location.key, location.hash, records.data, selected, search]);

  return (
    <div className={classes.page}>
      <PageMetadata content={content.data} title="Domains & websites" path="/domains" />
      <section className={classes.hero} aria-labelledby="domains-heading">
        <Container className={classes.heroGrid}>
          <div>
            <p className={classes.eyebrow}>
              {content.data?.eyebrow || 'An address for your ambition'}
            </p>
            <h1 id="domains-heading">
              {content.data?.heading || (
                <>
                  Your next big idea.
                  <br />
                  <em>Starts here.</em>
                </>
              )}
            </h1>
            <p className={classes.intro}>
              {content.data?.intro ||
                'A name people remember. A place to make it happen. Explore domains and websites ready for their next chapter—yours.'}
            </p>
            <div className={classes.actions}>
              {copy.primary?.label && copy.primary?.destination ? (
                <ContentButton button={copy.primary} radius="xl" arrow="up-right" />
              ) : (
                <Button
                  component="a"
                  href="#domain-collection"
                  radius="xl"
                  rightSection={<ArrowIcon />}
                >
                  Explore the collection
                </Button>
              )}
              <ContentButton
                variant="subtle"
                radius="xl"
                arrow="right"
                button={collectionButton(copy.secondary, 'Let’s find your fit', '/contact')}
              />
            </div>
            <p className={classes.heroNote}>
              <span aria-hidden="true">✦</span>{' '}
              {copy.hero_note || 'Make your first impression a lasting one.'}
            </p>
          </div>
          <div className={classes.showcase}>
            <div className={classes.orbit} aria-hidden="true" />
            <div className={classes.browser}>
              <div className={classes.browserBar}>
                <span aria-hidden="true">● ● ●</span>
                <span>Your next online address</span>
                <ArrowIcon />
              </div>
              <div className={classes.browserContent}>
                <span className={classes.heroBadge}>
                  {featured
                    ? featured.assetType === 'website'
                      ? 'Website for sale'
                      : 'Domain for sale'
                    : 'Room for your next idea'}
                </span>
                <span className={classes.star} aria-hidden="true">
                  ✦
                </span>
                <h2>{featured?.title || 'Make a name.\nBuild something.'}</h2>
                <p>{featured?.description || 'Every great venture needs somewhere to begin.'}</p>
                {featured ? (
                  <Link
                    className={classes.showcaseLink}
                    to={`/domains#${encodeURIComponent(featured.slug)}`}
                    onClick={() => setSearch('')}
                  >
                    Discover this listing <ArrowIcon />
                  </Link>
                ) : (
                  <span className={classes.showcaseLink}>Your story starts with an idea.</span>
                )}
              </div>
            </div>
          </div>
        </Container>
      </section>
      <Container className={classes.library}>
        {content.status === 'error' && <ContentState {...content} />}
        {content.data?.body && (
          <div className={classes.editorial}>
            <RichText html={content.data.body} />
          </div>
        )}
        <section
          id="domain-collection"
          className={classes.collection}
          aria-labelledby="domain-library-heading"
        >
          <div className={classes.sectionHeading}>
            <div>
              <p className={classes.eyebrow}>{copy.collection_eyebrow || 'The address book'}</p>
              <h2 id="domain-library-heading">
                {copy.collection_heading || 'Find a name. Make it yours.'}
              </h2>
            </div>
            <p className={classes.count} role="status">
              {records.status === 'ready' || records.status === 'empty'
                ? `${items.length} listing${items.length === 1 ? '' : 's'} to explore`
                : 'Discover the collection'}
            </p>
          </div>
          <div className={classes.toolbar}>
            <TextInput
              label="Search domains & websites"
              placeholder="A name, an idea, a possibility…"
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
            />
            <NativeSelect
              label="Category"
              value={selected}
              onChange={(event) =>
                setParams((current) => {
                  const next = new URLSearchParams(current);
                  if (event.currentTarget.value) next.set('category', event.currentTarget.value);
                  else next.delete('category');
                  return next;
                })
              }
              data={[
                { value: '', label: 'All categories' },
                ...(selected && !category ? [{ value: selected, label: 'Unknown category' }] : []),
                ...(categories.data || []).map((item) => ({ value: item.slug, label: item.title })),
              ]}
            />
          </div>
          {categories.status === 'error' && <ContentState {...categories} />}
          <ContentState
            {...records}
            status={records.status === 'empty' ? 'ready' : records.status}
          />
          {['ready', 'empty'].includes(records.status) && !items.length && (
            <div className={classes.empty}>
              <span aria-hidden="true">✦</span>
              <h3>
                {assets.length
                  ? 'Your next possibility is a search away.'
                  : 'New possibilities are on the horizon.'}
              </h3>
              <p>
                {assets.length
                  ? 'Try a different name or explore all categories.'
                  : 'Our next listings are being prepared. Get in touch to tell us what you have in mind.'}
              </p>
              {assets.length ? (
                <Button
                  variant="light"
                  onClick={() => {
                    setSearch('');
                    setParams({});
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button component={Link} to="/contact" variant="light">
                  Let’s talk
                </Button>
              )}
            </div>
          )}
          <div className={classes.grid}>
            {items.map((item) => (
              <article id={item.slug} key={item.id} className={classes.card}>
                <div className={classes.cardVisual}>
                  <div className={classes.cardTop}>
                    <span>{item.assetType === 'website' ? 'Website' : 'Domain name'}</span>
                    <span className={classes.status} data-status={item.availability || 'available'}>
                      <i aria-hidden="true" />
                      {item.availability || 'available'}
                    </span>
                  </div>
                  <span className={classes.cardSpark} aria-hidden="true">
                    ✦
                  </span>
                  <h3>{item.title}</h3>
                  <div className={classes.tags}>
                    {item.badge && <span>{item.badge}</span>}
                    {(categories.data || [])
                      .filter((cat) => item.categories?.includes(cat.id))
                      .map((cat) => (
                        <span key={cat.id}>{cat.title}</span>
                      ))}
                  </div>
                </div>
                <div className={classes.cardBody}>
                  {item.description && <p className={classes.description}>{item.description}</p>}
                  {item.body && (
                    <details className={classes.details}>
                      <summary>
                        About this {item.assetType === 'website' ? 'website' : 'domain'}
                      </summary>
                      <RichText html={item.body} />
                    </details>
                  )}
                  <ListingOffer item={item} products={products} sameCms={sameCms} />
                  {item.demoUrl && (
                    <a
                      className={classes.preview}
                      href={item.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Preview website <ArrowIcon />
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
        <aside className={classes.closing}>
          <span className={classes.closingSpark} aria-hidden="true">
            ✦
          </span>
          <div>
            <p className={classes.eyebrow}>
              {copy.closing_eyebrow || 'From a name to what’s next'}
            </p>
            <h2>{copy.closing_heading || 'An address is just the beginning.'}</h2>
            <p>
              {copy.closing_body ||
                'Have a vision for your new domain? Explore our digital services and take the next step toward bringing it to life.'}
            </p>
          </div>
          <ContentButton
            radius="xl"
            arrow="up-right"
            button={collectionButton(copy.closing, 'Explore our services', '/services')}
          />
        </aside>
        <CmsFaqs topic="domains" optional />
        <PageCta cta={content.data?.cta} />
      </Container>
    </div>
  );
}
