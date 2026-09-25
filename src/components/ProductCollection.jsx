import { useId, useState } from 'react';
import { ActionIcon, SimpleGrid, useMantineTheme } from '@mantine/core';
import { Carousel } from '@mantine/carousel';
import { useMediaQuery, useReducedMotion } from '@mantine/hooks';
import ProductCard from './ProductCard';
import ProductGridSkeleton from './skeletons/ProductGridSkeleton';
import classes from './ProductCollection.module.css';

const PAGE_SIZE = 4;

function PageArrow({ previous = false }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={previous ? 'M19 12H5m7-7-7 7 7 7' : 'M5 12h14m-7-7 7 7-7 7'} />
    </svg>
  );
}

function MobileProductPages({ products, label, mobilePeek = false, ...cardProps }) {
  const id = useId();
  const [embla, setEmbla] = useState(null);
  const [selected, setSelected] = useState(0);
  const reducedMotion = useReducedMotion();
  const pageSize = mobilePeek ? 1 : PAGE_SIZE;
  const pages = Array.from({ length: Math.ceil(products.length / pageSize) }, (_, index) =>
    products.slice(index * pageSize, (index + 1) * pageSize),
  );

  return (
    <div className={classes.mobile} data-peek={mobilePeek || undefined}>
      <Carousel
        id={id}
        aria-label={label}
        tabIndex={pages.length > 1 ? 0 : undefined}
        slideSize={mobilePeek ? 'calc((100% - 12px) / 1.25)' : '100%'}
        includeGapInSize={!mobilePeek}
        slideGap={12}
        withControls={false}
        getEmblaApi={setEmbla}
        onSlideChange={setSelected}
        emblaOptions={{
          align: 'start',
          loop: false,
          duration: reducedMotion ? 0 : 25,
          ...(mobilePeek ? { containScroll: false } : {}),
        }}
        classNames={{ viewport: classes.viewport, slide: classes.slide }}
      >
        {pages.map((items, index) => (
          <Carousel.Slide
            key={items[0].id}
            aria-label={`Product page ${index + 1} of ${pages.length}`}
            aria-hidden={index !== selected && !(mobilePeek && index === selected + 1)}
            inert={index !== selected && !(mobilePeek && index === selected + 1)}
          >
            <div className={mobilePeek ? classes.singleCard : classes.pageGrid}>
              {items.map((product) => (
                <ProductCard
                  key={product.id}
                  p={product}
                  compact={!mobilePeek}
                  peek={mobilePeek}
                  {...cardProps}
                />
              ))}
            </div>
          </Carousel.Slide>
        ))}
      </Carousel>
      {pages.length > 1 && (
        <div className={classes.pagination}>
          <ActionIcon
            variant="light"
            color="brand"
            size={44}
            radius="xl"
            aria-label={`Previous products in ${label}`}
            aria-controls={id}
            disabled={selected === 0}
            onClick={() => embla?.scrollPrev()}
          >
            <PageArrow previous />
          </ActionIcon>
          <span className={classes.range}>
            {mobilePeek
              ? selected + 1
              : `${selected * PAGE_SIZE + 1}–${Math.min((selected + 1) * PAGE_SIZE, products.length)}`}{' '}
            of {products.length}
          </span>
          <ActionIcon
            variant="light"
            color="brand"
            size={44}
            radius="xl"
            aria-label={`Next products in ${label}`}
            aria-controls={id}
            disabled={selected === pages.length - 1}
            onClick={() => embla?.scrollNext()}
          >
            <PageArrow />
          </ActionIcon>
        </div>
      )}
    </div>
  );
}

export default function ProductCollection({
  products,
  label,
  desktopLimit,
  minColWidth = 250,
  loading = false,
  mobilePeek = false,
  horizontal = false,
  ...cardProps
}) {
  const theme = useMantineTheme();
  const desktop = useMediaQuery(`(min-width: ${theme.breakpoints.sm})`, undefined, {
    getInitialValueInEffect: false,
  });
  if (loading)
    return (
      <ProductGridSkeleton
        label={`Loading ${label}`}
        minColWidth={minColWidth}
        mobilePeek={mobilePeek}
      />
    );
  if (products.length === 0) return null;

  if (desktop && horizontal) return (
    <div className={classes.horizontalRow} role="region" aria-label={label} tabIndex={0}>
      {products.map((product) => (
        <ProductCard key={product.id} p={product} {...cardProps} />
      ))}
    </div>
  );

  return desktop ? (
    <SimpleGrid
      minColWidth={`min(100%, ${minColWidth}px)`}
      spacing={20}
      aria-label={label}
      role="region"
    >
      {products.slice(0, desktopLimit ?? products.length).map((product) => (
        <ProductCard key={product.id} p={product} {...cardProps} />
      ))}
    </SimpleGrid>
  ) : (
    // Reset to the first page when filtering or sorting changes the ordered results.
    <MobileProductPages
      key={products.map((product) => product.id).join(',')}
      products={products}
      label={label}
      mobilePeek={mobilePeek}
      {...cardProps}
    />
  );
}
