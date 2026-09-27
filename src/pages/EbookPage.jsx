import { useState } from 'react';
import { Button, Container, NativeSelect, TextInput } from '@mantine/core';
import { Link } from 'react-router';
import useContent from '../hooks/useContent';
import { ContentState, PageCta } from '../components/ContentPage';
import PageMetadata from '../components/PageMetadata';
import RichText from '../components/RichText';
import ProductCollection from '../components/ProductCollection';
import CatalogStatus from '../components/CatalogStatus';
import ProductGridSkeleton from '../components/skeletons/ProductGridSkeleton';
import classes from './EbookPage.module.css';

// Membership comes from merchandising metadata, never a guess based on the title.
function isEbook(product) {
  const terms = [
    product.cat,
    ...(product.categoryIds || []),
    ...(product.categories || []).flatMap((term) => [term.id, term.label]),
    ...(product.tags || []).flatMap((term) => [term.id, term.label]),
  ];
  return terms.some((term) => /(^|[^a-z0-9])e[\s-]?books?($|[^a-z0-9])/i.test(term || ''));
}

export default function EbookPage({ products, catalogStatus, retryCatalog, ...cardProps }) {
  const content = useContent('page', 'ebook');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('featured');
  const ebooks = products.filter(isEbook);
  const results = ebooks
    .filter((product) =>
      `${product.name} ${product.summary || ''}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
    )
    .sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort.startsWith('price')) {
        // Products without a price remain at the end in either direction.
        if (a.price == null) return b.price == null ? 0 : 1;
        if (b.price == null) return -1;
        return sort === 'price-asc' ? a.price - b.price : b.price - a.price;
      }
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    });

  return (
    <div className={classes.page}>
      <PageMetadata content={content.data} title="E-books" path="/ebook" />
      <section className={classes.hero} aria-labelledby="ebook-heading">
        <Container className={classes.heroGrid}>
          <div className={classes.heroCopy}>
            <p className={classes.eyebrow}>{content.data?.eyebrow || 'The digital bookshelf'}</p>
            <h1 id="ebook-heading">
              {content.data?.heading || (
                <>
                  Small books.
                  <br />
                  <span>Big possibilities.</span>
                </>
              )}
            </h1>
            <p className={classes.intro}>
              {content.data?.intro ||
                'Discover ebooks for curious minds and ambitious next steps. Find a fresh perspective, explore an idea, and make it your own.'}
            </p>
            <div className={classes.actions}>
              <Button component="a" href="#ebook-library" color="brand" radius="xl">
                Explore the library <span aria-hidden="true">&nbsp;↗</span>
              </Button>
              <Link className={classes.textLink} to="/products">
                All digital products <span aria-hidden="true">→</span>
              </Link>
            </div>
            <p className={classes.heroNote}>
              <span aria-hidden="true">✦</span> A new chapter, on your terms.
            </p>
          </div>
          <div className={classes.bookshelf} aria-hidden="true">
            <div className={classes.orbit} />
            <span className={classes.spark}>✦</span>
            <div className={`${classes.book} ${classes.backBook}`}>
              <span>STAY CURIOUS</span>
            </div>
            <div className={`${classes.book} ${classes.frontBook}`}>
              <span className={classes.bookLabel}>LONGLIFE DIGITAL / E-BOOKS</span>
              <div className={classes.bookTitle}>
                Read.
                <br />
                Think.
                <br />
                <em>Grow.</em>
              </div>
              <div className={classes.bookMark}>✦</div>
              <span className={classes.bookFoot}>GOOD IDEAS GO WITH YOU.</span>
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
          id="ebook-library"
          className={classes.collection}
          aria-labelledby="library-heading"
        >
          <div className={classes.sectionHeading}>
            <div>
              <p className={classes.eyebrow}>Browse the collection</p>
              <h2 id="library-heading">Find your next read.</h2>
            </div>
            <p className={classes.count} role="status">
              {catalogStatus === 'ready'
                ? `${results.length} e-book${results.length === 1 ? '' : 's'}${search.trim() ? ' found' : ' to explore'}`
                : catalogStatus === 'error'
                  ? 'Collection temporarily unavailable'
                  : 'Loading your bookshelf…'}
            </p>
          </div>
          <div className={classes.toolbar}>
            <TextInput
              label="Search e-books"
              placeholder="Find your next idea…"
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              disabled={catalogStatus !== 'ready'}
            />
            <NativeSelect
              label="Sort e-books"
              value={sort}
              onChange={(event) => setSort(event.currentTarget.value)}
              disabled={catalogStatus !== 'ready'}
              data={[
                { value: 'featured', label: 'Featured first' },
                { value: 'name', label: 'Title: A–Z' },
                { value: 'price-asc', label: 'Price: Low to high' },
                { value: 'price-desc', label: 'Price: High to low' },
              ]}
            />
          </div>
          {catalogStatus !== 'ready' ? (
            <CatalogStatus
              status={catalogStatus}
              retry={retryCatalog}
              loading={<ProductGridSkeleton label="Loading e-books" mobilePeek />}
            />
          ) : results.length ? (
            <ProductCollection
              products={results}
              label="E-book collection"
              mobilePeek
              minColWidth={280}
              {...cardProps}
            />
          ) : (
            <div className={classes.empty}>
              <span aria-hidden="true">📖</span>
              <h3>
                {ebooks.length
                  ? 'A different search, a new possibility.'
                  : 'The next chapter is on its way.'}
              </h3>
              <p>
                {ebooks.length
                  ? 'Try another title or clear your search to see the full collection.'
                  : 'Our ebook collection is coming together. Explore our other digital products in the meantime.'}
              </p>
              {ebooks.length ? (
                <Button variant="light" onClick={() => setSearch('')}>
                  Clear search
                </Button>
              ) : (
                <Button component={Link} to="/products" variant="light">
                  Explore all products
                </Button>
              )}
            </div>
          )}
        </section>
        <aside className={classes.closing}>
          <div>
            <p className={classes.eyebrow}>Keep your curiosity going</p>
            <h2>There’s always more to discover.</h2>
            <p>Explore fresh perspectives and practical ideas in our journal.</p>
          </div>
          <Link className={classes.textLink} to="/blog">
            Visit the journal <span aria-hidden="true">↗</span>
          </Link>
        </aside>
        <PageCta cta={content.data?.cta} />
      </Container>
    </div>
  );
}
