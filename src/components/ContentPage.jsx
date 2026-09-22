import { Alert, Button, Container, Skeleton } from '@mantine/core';
import { CONTENT_PAGES } from '../contentPages';
import ContentButton from './ContentButton';
import RichText from './RichText';
import PageMetadata from './PageMetadata';
import classes from './ContentPage.module.css';

export function ContentState({
  status,
  retry,
  message = 'This content is being prepared. Please check back soon.',
}) {
  if (status === 'loading')
    return (
      <div role="status" aria-label="Loading page content">
        <Skeleton height={24} mb={16} />
        <Skeleton height={100} />
      </div>
    );
  if (status === 'error')
    return (
      <Alert color="yellow" title="Content is temporarily unavailable">
        <Button onClick={() => retry()} variant="light" mt="sm">
          Retry content
        </Button>
      </Alert>
    );
  if (status === 'empty') return <p className={classes.empty}>{message}</p>;
  return null;
}

export function PageHeader({ pageKey, content }) {
  const page = CONTENT_PAGES[pageKey];
  return (
    <>
      <PageMetadata content={content} title={content?.heading || page.title} path={page.path} />
      <header className={classes.header}>
        <Container>
          {content?.eyebrow && <p className={classes.eyebrow}>{content.eyebrow}</p>}
          <h1 className={classes.heading}>{content?.heading || page.title}</h1>
          {content?.intro && <p className={classes.intro}>{content.intro}</p>}
        </Container>
      </header>
    </>
  );
}

export function PageBody({ query, children, showEmpty = true }) {
  return (
    <Container className={classes.body}>
      <ContentState
        {...query}
        status={query.status === 'empty' && !showEmpty ? 'ready' : query.status}
      />
      {query.data?.body && <RichText html={query.data.body} />}
      {children}
      <PageCta cta={query.data?.cta} />
    </Container>
  );
}

export function PageCta({ cta }) {
  if (!cta || !(cta.heading || cta.body || (cta.label && cta.destination))) return null;
  return (
    <section className={classes.section}>
      {cta.heading && <h2>{cta.heading}</h2>}
      {cta.body && <p className={classes.intro}>{cta.body}</p>}
      <div className={classes.actions}>
        <ContentButton button={cta} />
      </div>
    </section>
  );
}
