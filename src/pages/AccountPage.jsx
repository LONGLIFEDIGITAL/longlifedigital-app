import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Container, Group, Loader, Stack } from '@mantine/core';
import { Link, Navigate } from 'react-router';
import { accountRequest } from '../services/account';
import PageMetadata from '../components/PageMetadata';
import classes from './AccountPage.module.css';

function Orders({ user }) {
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['customer', 'orders', user.id, page],
    queryFn: () => accountRequest('orders', undefined, page),
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
  useEffect(() => {
    if (query.error?.status === 401) {
      client.setQueryData(['customer', 'session'], { user: null });
      client.removeQueries({ queryKey: ['customer', 'orders'] });
    }
  }, [client, query.error]);
  if (query.error?.status === 401)
    return (
      <Alert color="yellow">
        Your session has expired. <Link to="/login">Log in again</Link> to view your orders.
      </Alert>
    );
  if (query.isPending)
    return (
      <div role="status">
        <Loader size="sm" /> Loading orders…
      </div>
    );
  if (query.isError)
    return (
      <Alert color="yellow" title="Orders are temporarily unavailable">
        <Button variant="light" onClick={() => query.refetch()}>
          Try again
        </Button>
      </Alert>
    );
  return (
    <>
      {query.data.orders.length ? (
        <div className={classes.orders}>
          {query.data.orders.map((order) => (
            <article className={classes.order} key={order.number}>
              <Group justify="space-between">
                <h3>Order #{order.number}</h3>
                <span className={classes.status}>{order.status}</span>
              </Group>
              {order.date && (
                <p className={classes.muted}>
                  {new Date(order.date).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              )}
              <ul>
                {order.items.map((item, index) => (
                  <li key={index}>
                    {item.name} <span>× {item.quantity}</span>
                  </li>
                ))}
              </ul>
              <p className={classes.total}>
                {new Intl.NumberFormat(undefined, {
                  style: 'currency',
                  currency: order.currency,
                }).format(Number(order.total))}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <div className={classes.empty}>
          <span aria-hidden="true">✦</span>
          <h3>Your next chapter is waiting.</h3>
          <p>Orders placed while logged in will appear here.</p>
          <Button component={Link} to="/products" radius="xl">
            Explore the store
          </Button>
        </div>
      )}
      {(page > 1 || query.data.hasMore) && (
        <Group mt="lg">
          <Button variant="light" disabled={page === 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span>Page {page}</span>
          <Button variant="light" disabled={!query.data.hasMore} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </Group>
      )}
    </>
  );
}
export default function AccountPage({ auth }) {
  const [error, setError] = useState('');
  if (auth.loading)
    return (
      <Container py="xl">
        <div role="status">
          <Loader /> Loading your account…
        </div>
      </Container>
    );
  if (auth.error && !auth.user)
    return (
      <Container py="xl">
        <Alert color="yellow" title="Your account could not be loaded">
          <Button onClick={() => auth.retry()}>Try again</Button> <Link to="/login">Log in</Link>
        </Alert>
      </Container>
    );
  if (!auth.user) return <Navigate to="/login" replace />;
  return (
    <div className={classes.accountPage}>
      <PageMetadata title="My account" content={{ seo: { noindex: true } }} />
      <Container>
        <header className={classes.accountHeader}>
          <div>
            <p className={classes.eyebrow}>Your digital home</p>
            <h1>Hello, {auth.user.name || 'there'}.</h1>
            <p className={classes.muted}>{auth.user.email}</p>
          </div>
          <Button
            variant="light"
            radius="xl"
            loading={auth.busy}
            onClick={async () => {
              try {
                await auth.submit('logout', {});
              } catch (err) {
                setError(err.message);
              }
            }}
          >
            Log out
          </Button>
        </header>
        {error && <Alert color="red">{error}</Alert>}
        <div className={classes.accountGrid}>
          <section>
            <h2>Your orders</h2>
            <Orders key={auth.user.id} user={auth.user} />
          </section>
          <aside className={classes.formCard}>
            <Stack>
              <h2>Account details</h2>
              <p>Need a new password? We’ll send a secure reset link to your email.</p>
              <Button component={Link} to="/forgot-password" variant="light">
                Reset password
              </Button>
              <p>Questions about a purchase?</p>
              <Link to="/contact">Contact us</Link>
            </Stack>
          </aside>
        </div>
      </Container>
    </div>
  );
}
