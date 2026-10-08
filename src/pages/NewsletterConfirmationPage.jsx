import { Button, Container, Stack } from '@mantine/core';
import { Link } from 'react-router';
import PageMetadata from '../components/PageMetadata';
import classes from '../components/ContentPage.module.css';

export default function NewsletterConfirmationPage() {
  return (
    <>
      <PageMetadata title="Subscription confirmed" content={{ seo: { noindex: true } }} />
      <Container size="sm" className={classes.body}>
        <Stack gap="lg" py="xl">
          <div>
            <p className={classes.eyebrow}>Welcome to the community</p>
            <h1 className={classes.heading}>You're on the list.</h1>
            <p className={classes.intro}>
              Your newsletter subscription is confirmed. Thanks for joining Longlife Digital. Look
              out for tips, resources, and updates in your inbox.
            </p>
          </div>
          <div className={classes.actions}>
            <Button component={Link} to="/products">
              Explore products
            </Button>
            <Button component={Link} to="/" variant="light">
              Back to home
            </Button>
          </div>
        </Stack>
      </Container>
    </>
  );
}
