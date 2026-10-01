import { Button, Container } from '@mantine/core';
import { Link, useNavigate } from 'react-router';
import useContent from '../hooks/useContent';
import { ContentState } from '../components/ContentPage';
import RichText from '../components/RichText';
import PageMetadata from '../components/PageMetadata';
import ServiceMark from '../components/ServiceMark';
import ServiceInquiryForm from '../components/ServiceInquiryForm';
import ArrowIcon from '../components/ArrowIcon';
import NotFoundPage from './NotFoundPage';
import classes from './ServicesPage.module.css';

export default function ServiceDetailPage({ slug }) {
  const navigate = useNavigate();
  const records = useContent('services');
  const service = records.data?.find((item) => item.slug === slug);
  if (!service) {
    if (['empty', 'ready'].includes(records.status))
      return <NotFoundPage setPage={() => navigate('/')} />;
    return (
      <Container className={classes.content}>
        <ContentState {...records} />
      </Container>
    );
  }
  return (
    <div className={classes.page}>
      <PageMetadata
        content={{ ...service, intro: service.description }}
        title={service.title}
        path={`/services/${encodeURIComponent(slug)}`}
      />
      <section className={`${classes.hero} ${classes.detailHero}`} data-tone={service.visual}>
        <Container>
          <nav className={classes.breadcrumb} aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <Link to="/services">Services</Link>
            <span>/</span>
            <span aria-current="page">{service.title}</span>
          </nav>
          <div className={classes.detailHeading}>
            <div>
              <p className={classes.eyebrow}>Digital services</p>
              <h1>{service.title}</h1>
              {service.description && <p className={classes.intro}>{service.description}</p>}
              <Button
                component="a"
                href="#service-inquiry"
                radius="xl"
                rightSection={<ArrowIcon />}
              >
                Request a quote
              </Button>
            </div>
            <div className={classes.detailArtwork} aria-hidden="true">
              <span>✦</span>
              <ServiceMark kind={service.visual} />
              <span>✦</span>
            </div>
          </div>
        </Container>
      </section>
      <Container className={classes.detailGrid}>
        <div className={classes.details}>
          {service.image?.src && (
            <img
              className={classes.serviceImage}
              src={service.image.src}
              alt={service.image.alt || ''}
            />
          )}
          {service.body && <RichText html={service.body} />}
          {!!service.specialties?.length && (
            <section className={classes.detailSection}>
              <p className={classes.eyebrow}>Made for your next move</p>
              <h2>How we can help</h2>
              <ul className={classes.scope}>
                {service.specialties.map((text) => (
                  <li key={text}>
                    <span aria-hidden="true">✦</span>
                    {text}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {service.packageDetails && (
            <section className={classes.detailSection}>
              <h2>What we can work on</h2>
              <RichText html={service.packageDetails} />
            </section>
          )}
          {service.process && (
            <section className={classes.detailSection}>
              <h2>What happens next</h2>
              <RichText html={service.process} />
            </section>
          )}
          <Link to="/services" className={classes.backLink}>
            Explore all services <ArrowIcon direction="right" />
          </Link>
        </div>
        <ServiceInquiryForm service={service} />
      </Container>
    </div>
  );
}
