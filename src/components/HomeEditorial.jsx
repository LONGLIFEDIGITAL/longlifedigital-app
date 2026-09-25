import { Container, SimpleGrid } from '@mantine/core';
import usePosts from '../hooks/usePosts';
import BlogCards from './BlogCards';
import CatalogStatistics from './CatalogStatistics';
import ContentButton from './ContentButton';
import LDLogo from './LDLogo';
import RichText from './RichText';
import SkeletonBlock from './skeletons/SkeletonBlock';
import SkeletonRegion from './skeletons/SkeletonRegion';
import classes from './HomeEditorial.module.css';

export function EditorialStatistics({ items = [], light = false }) {
  if (!items.length) return null;
  return (
    <div className={classes.statistics} data-light={light || undefined}>
      {items
        .filter((item) => item.value && item.title)
        .map((item) => (
          <div key={item.id}>
            <strong>{item.value}</strong>
            <span>{item.title}</span>
          </div>
        ))}
    </div>
  );
}

export function SectionHeading({ title, intro, cta, website, loading }) {
  if (loading)
    return (
      <SkeletonRegion label="Loading section heading" className={classes.heading}>
        <SkeletonBlock height={32} width="min(100%, 320px)" />
        <SkeletonBlock height={18} width="min(100%, 240px)" mt={12} />
      </SkeletonRegion>
    );
  return (
    <div className={classes.heading}>
      <div>
        {title && <h2>{title}</h2>}
        {intro && <p>{intro}</p>}
      </div>
      <ContentButton button={cta} website={website} variant="outline" />
    </div>
  );
}

export default function HomeEditorial({ content, status, products, catalogStatus, brand }) {
  const blog = content?.blog;
  const showBlog = Boolean(blog && (blog.heading || blog.intro || blog.postIds?.length));
  const posts = usePosts({
    limit: 3,
    include: blog?.postIds || [],
    enabled: status === 'ready' && showBlog,
  });
  const about = content?.about;
  return (
    <>
      {(status === 'loading' || !!content?.trustItems?.length) && (
        <section className={classes.trust} aria-label="Store benefits">
          <Container>
            {status === 'loading' ? (
              <SkeletonRegion label="Loading store benefits">
                <SimpleGrid cols={{ base: 2, md: 6 }}>
                  {[0, 1, 2, 3, 4, 5].map((id) => (
                    <SkeletonBlock key={id} height={100} />
                  ))}
                </SimpleGrid>
              </SkeletonRegion>
            ) : (
              <div className={classes.trustGrid}>
                {content.trustItems.map((item) => (
                  <div key={item.id}>
                    {item.icon && (
                      <span className={classes.icon} aria-hidden="true">
                        {item.icon}
                      </span>
                    )}
                    <h3>{item.title}</h3>
                    {item.description && <p>{item.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </Container>
        </section>
      )}
      {(status === 'loading' || showBlog) && (
        <section className={classes.section}>
          <Container>
            <SectionHeading
              title={blog?.heading}
              intro={blog?.intro}
              cta={blog?.cta}
              website={brand.website}
              loading={status === 'loading'}
            />
            <BlogCards {...posts} mobilePeek />
          </Container>
        </section>
      )}
      <section className={`${classes.section} ${classes.about}`}>
        <Container>
          <div className={classes.aboutGrid}>
            <div className={classes.statsPanel}>
              {brand.logo?.src ? (
                <img
                  className={classes.logo}
                  src={brand.logo.src}
                  alt={brand.logo.alt || brand.name}
                />
              ) : (
                <LDLogo size={80} />
              )}
              <CatalogStatistics products={products} status={catalogStatus} />
              <EditorialStatistics items={about?.stats} />
            </div>
            {status === 'loading' ? (
              <SkeletonRegion label="Loading about preview">
                <SkeletonBlock height={24} width="40%" />
                <SkeletonBlock height={42} mt={18} />
                <SkeletonBlock height={150} mt={24} />
                <SkeletonBlock height={44} width={160} mt={24} />
              </SkeletonRegion>
            ) : (
              about && (
                <div className={classes.aboutCopy}>
                  {about.eyebrow && <p className={classes.eyebrow}>{about.eyebrow}</p>}
                  {about.heading && <h2>{about.heading}</h2>}
                  {about.body && <RichText html={about.body} />}
                  {!!about.benefits?.length && (
                    <ul className={classes.benefits}>
                      {about.benefits.map((item) => (
                        <li key={item.id}>
                          {item.icon && <span aria-hidden="true">{item.icon}</span>}
                          <div>
                            {item.title}
                            {item.description && <p>{item.description}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  <ContentButton button={about.cta} website={brand.website} />
                </div>
              )
            )}
          </div>
        </Container>
      </section>
      {content?.closingCta?.heading && (
        <section className={`${classes.section} ${classes.closing}`}>
          <Container size="sm">
            <h2>{content.closingCta.heading}</h2>
            {content.closingCta.body && <p>{content.closingCta.body}</p>}
            <ContentButton button={content.closingCta} website={brand.website} />
          </Container>
        </section>
      )}
    </>
  );
}
