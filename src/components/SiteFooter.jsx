import { Container } from '@mantine/core';
import useSiteSettings from '../hooks/useSiteSettings';
import useNavigationContent from '../hooks/useNavigationContent';
import ContentLink from './ContentLink';
import LDLogo from './LDLogo';
import useCatalog from '../hooks/useCatalog';
import CategorySkeleton from './skeletons/CategorySkeleton';
import classes from './SiteFooter.module.css';
export default function SiteFooter({ setPage, setFilterCat }) {
  const { settings } = useSiteSettings();
  const navigation = useNavigationContent();
  const catalog = useCatalog();
  const { brand, footer, contact, social } = settings;
  return (
    <footer className={classes.footer}>
      <Container>
        <div className={classes.grid} style={{ marginTop: '2rem' }}>
          <div style={{ marginTop: '-2.4rem' }}>
            <LDLogo src={brand.logo.src} alt={brand.logo.alt} />
            <h2>{brand.name}</h2>
            <p>{footer.description}</p>
            <div className={classes.links}>
              {Object.entries(social)
                .filter(([, href]) => href)
                .map(([platform, href]) => (
                  <a href={href} key={platform} target="_blank" rel="noopener noreferrer">
                    {platform}
                  </a>
                ))}
            </div>
          </div>
          <nav aria-label="Footer product categories">
            <h3>Products</h3>
            {catalog.status === 'loading' ? (
              <CategorySkeleton variant="links" label="Loading footer categories" />
            ) : (
              <div className={classes.links}>
                {catalog.categories
                  .filter((category) => category.id !== 'all')
                  .map((category) => (
                    <button
                      type="button"
                      key={category.id}
                      onClick={() => {
                        setFilterCat(category.id);
                        setPage('shop');
                      }}
                    >
                      {category.label}
                    </button>
                  ))}
              </div>
            )}
          </nav>
          {['company', 'support'].map((area) => (
            <nav key={area} aria-label={`Footer ${area}`}>
              <h3>{footer[`${area}Heading`] || (area === 'company' ? 'Company' : 'Support')}</h3>
              <div className={classes.links}>
                {navigation[`footer_${area}`].map((item) => (
                  <ContentLink key={item.id} item={item} website={brand.website} />
                ))}
              </div>
            </nav>
          ))}
          <div>
            <h3>{footer.contactHeading || 'Contact'}</h3>
            {contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>}
            {contact.hours && <p>{contact.hours}</p>}
          </div>
        </div>
        <div className={classes.bottom}>
          <span>
            © {new Date().getFullYear()} {footer.copyrightName || brand.name}
          </span>
          <nav aria-label="Footer legal" className={classes.legal}>
            {navigation.footer_legal.map((item) => (
              <ContentLink key={item.id} item={item} website={brand.website} />
            ))}
          </nav>
        </div>
      </Container>
    </footer>
  );
}
