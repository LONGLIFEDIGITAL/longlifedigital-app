import useCatalog from '../hooks/useCatalog';
import { wordpressApiUrl } from '../services/siteSettings';
import LoadingImage from './LoadingImage';
import { useEffect, useRef } from 'react';
import { useSearchParams, useLocation, Link } from 'react-router';
import { Select } from '@mantine/core';
import useContent from '../hooks/useContent';
import { PageHeader, PageBody, ContentState } from './ContentPage';
import ContentButton from './ContentButton';
import CmsFaqs from './CmsFaqs';
import RichText from './RichText';
import classes from './ContentPage.module.css';

function Price({ pricing }) {
  if (pricing?.mode !== 'estimate' || pricing.amount === null) return null;
  let value;
  try {
    value = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: pricing.currency,
    }).format(pricing.amount);
  } catch {
    return null;
  }
  return (
    <p className={classes.price}>
      From {value}
      {pricing.period !== 'once' ? ` / ${pricing.period}` : ''}
    </p>
  );
}

export default function CmsListings({ pageKey, resource }) {
  const { products } = useCatalog();
  const storeUrl = import.meta.env.VITE_WOOCOMMERCE_STORE_API_URL;
  const sameCms = Boolean(
    storeUrl && wordpressApiUrl && new URL(storeUrl).origin === new URL(wordpressApiUrl).origin,
  );
  const page = useContent('page', pageKey);
  const records = useContent(resource);
  const location = useLocation();
  const scrolledTarget = useRef('');
  useEffect(() => {
    const targetKey = `${location.key}:${location.hash}`;
    if (!location.hash || scrolledTarget.current === targetKey) return;
    let id;
    try {
      id = decodeURIComponent(location.hash.slice(1));
    } catch {
      return;
    }
    if (!records.data?.some((item) => item.slug === id)) return;
    // A lazy route or CMS response can arrive after router scroll restoration.
    const frame = requestAnimationFrame(() => {
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ block: 'start' });
        scrolledTarget.current = targetKey;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [location.key, location.hash, records.data]);
  const categories = useContent('asset-categories');
  const [search, setSearch] = useSearchParams();
  const selected = search.get('category') || '';
  const category = categories.data?.find((item) => item.slug === selected);
  const items = (records.data || []).filter(
    (item) =>
      resource !== 'assets' || !selected || (category && item.categories.includes(category.id)),
  );
  return (
    <>
      <PageHeader pageKey={pageKey} content={page.data} />
      <PageBody query={page}>
        {resource === 'assets' && (
          <Select
            mb="xl"
            label="Category"
            placeholder="All categories"
            clearable
            value={selected || null}
            data={(categories.data || []).map((item) => ({ value: item.slug, label: item.title }))}
            onChange={(value) =>
              setSearch((current) => {
                const next = new URLSearchParams(current);
                if (value) next.set('category', value);
                else next.delete('category');
                return next;
              })
            }
          />
        )}
        <ContentState
          {...records}
          status={records.status === 'ready' && !items.length ? 'empty' : records.status}
          message={
            resource === 'assets'
              ? 'No listings are available in this category yet.'
              : 'Service details are being prepared. Please contact us for information.'
          }
        />
        <div className={classes.grid}>
          {items.map((item) => (
            <article key={item.id} id={item.slug} className={classes.section}>
              {item.image?.src && (
                <LoadingImage
                  src={item.image.src}
                  alt={item.image.alt || item.title}
                  className={classes.image}
                />
              )}
              {item.badge && <span className={classes.tag}>{item.badge}</span>}
              {item.availability && <span className={classes.tag}>{item.availability}</span>}
              <h2>
                {item.icon && <span aria-hidden="true">{item.icon} </span>}
                {item.title}
              </h2>
              {item.description && <p className={classes.intro}>{item.description}</p>}
              <RichText html={item.body} />
              {item.packageDetails && <RichText html={item.packageDetails} />}
              <Price pricing={item.pricing} />
              {item.pricing.mode === 'contact' && <p>Contact us for pricing.</p>}
              {item.pricing.mode === 'product' &&
                (() => {
                  const product =
                    sameCms && products.find((product) => product.id === item.pricing.productId);
                  return product && Number.isFinite(product.price) ? (
                    <p className={classes.price}>
                      <Link to={`/products/${product.id}`}>
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: product.currency,
                        }).format(product.price)}{' '}
                        — View product
                      </Link>
                    </p>
                  ) : (
                    <p>Contact us for product availability and pricing.</p>
                  );
                })()}
              <div className={classes.actions}>
                {(!item.availability || item.availability === 'available') && (
                  <ContentButton button={item.cta} />
                )}
                {item.demoUrl && (
                  <a href={item.demoUrl} target="_blank" rel="noopener noreferrer">
                    Preview website ↗
                  </a>
                )}
                {!item.cta.destination &&
                  (!item.availability || item.availability === 'available') && (
                    <Link to="/contact">Contact us</Link>
                  )}
              </div>
            </article>
          ))}
        </div>
        <CmsFaqs topic={resource === 'assets' ? 'domains' : 'services'} optional />
      </PageBody>
    </>
  );
}
