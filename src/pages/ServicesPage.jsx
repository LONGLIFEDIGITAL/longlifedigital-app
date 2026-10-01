import { Button, Container } from '@mantine/core';
import { Link, Navigate, useLocation } from 'react-router';
import useContent from '../hooks/useContent';
import { ContentState, PageCta } from '../components/ContentPage';
import PageMetadata from '../components/PageMetadata';
import RichText from '../components/RichText';
import CmsFaqs from '../components/CmsFaqs';
import ArrowIcon from '../components/ArrowIcon';
import ServiceMark from '../components/ServiceMark';
import classes from './ServicesPage.module.css';

export default function ServicesPage() {
  const page = useContent('page', 'services');
  const records = useContent('services');
  const location = useLocation();
  const services = records.data || [];
  // Preserve previously shared service links and manually authored menu links.
  const legacy = services.find((item) => `#${encodeURIComponent(item.slug)}` === location.hash);
  if (legacy) return <Navigate replace to={`/services/${encodeURIComponent(legacy.slug)}`} />;
  return (
    <div className={classes.page}>
      <PageMetadata content={page.data} title="Digital services" path="/services" />
      <section className={classes.hero}>
        <Container className={classes.heroGrid}>
          <div>
            <p className={classes.eyebrow}>
              {page.data?.eyebrow || 'Digital services · Human ambition'}
            </p>
            <h1>
              {page.data?.heading || (
                <>
                  Your next chapter.
                  <br />
                  <em>Built together.</em>
                </>
              )}
            </h1>
            <p className={classes.intro}>
              {page.data?.intro ||
                'From your first business idea to your next stage of growth. Find the digital expertise to move forward with purpose.'}
            </p>
            <Button component="a" href="#services-list" radius="xl" rightSection={<ArrowIcon />}>
              Explore our services
            </Button>
          </div>
          <div className={classes.studio} aria-hidden="true">
            <span className={classes.orbit} />
            <span className={classes.spark}>✦</span>
            <div className={classes.studioCard}>
              <span className={classes.studioLabel}>The next step starts here</span>
              <span className={classes.studioTitle}>
                A little vision.
                <br />
                <em>A lot of possibility.</em>
              </span>
              <div className={classes.studioIcons}>
                {['search', 'web', 'automation', 'advertising', 'launch'].map((kind) => (
                  <span key={kind}>
                    <ServiceMark kind={kind} />
                  </span>
                ))}
              </div>
              <span className={classes.studioFooter}>
                Longlife Digital <ArrowIcon />
              </span>
            </div>
          </div>
        </Container>
      </section>
      <Container className={classes.content}>
        {page.status === 'error' && <ContentState {...page} />}
        {page.data?.body && <RichText className={classes.editorial} html={page.data.body} />}
        <section
          id="services-list"
          className={classes.collection}
          aria-labelledby="services-heading"
        >
          <div className={classes.sectionHeading}>
            <div>
              <p className={classes.eyebrow}>Digital services</p>
              <h2 id="services-heading">
                {page.data?.services?.heading || 'Where would you like to go next?'}
              </h2>
            </div>
            <span className={classes.sectionNote}>
              {page.data?.services?.intro || 'Explore a service. Tell us what you have in mind.'}
            </span>
          </div>
          <ContentState
            {...records}
            message="Our services are being updated. Contact us to discuss your project."
          />
          <div className={classes.cards}>
            {services.map((service, index) => (
              <Link
                key={service.id}
                to={`/services/${encodeURIComponent(service.slug)}`}
                className={classes.card}
                data-tone={service.visual}
              >
                <div className={classes.cardTop}>
                  <span className={classes.mark}>
                    <ServiceMark kind={service.visual} />
                  </span>
                  <span className={classes.number}>{String(index + 1).padStart(2, '0')}</span>
                </div>
                <h3>{service.title}</h3>
                {service.description && <p>{service.description}</p>}
                {!!service.specialties?.length && (
                  <ul className={classes.specialties}>
                    {service.specialties.map((text) => (
                      <li key={text}>{text}</li>
                    ))}
                  </ul>
                )}
                <span className={classes.cardLink}>
                  Explore service <ArrowIcon />
                </span>
              </Link>
            ))}
          </div>
        </section>
        <CmsFaqs topic="services" optional />
        <PageCta cta={page.data?.cta} />
      </Container>
    </div>
  );
}
