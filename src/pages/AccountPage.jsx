import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ActionIcon, Alert, Button, Container, Group, Loader, Menu } from '@mantine/core';
import { Link, Navigate, useSearchParams } from 'react-router';
import { accountRequest } from '../services/account';
import PageMetadata from '../components/PageMetadata';
import LDLogo from '../components/LDLogo';
import Icon from '../components/DashboardIcon';
import classes from './AccountDashboard.module.css';

const sections = [
  ['home', 'Home'],
  ['products', 'My Products'],
  ['services', 'My Services'],
  ['domains', 'My Domains'],
  ['orders', 'Orders'],
  ['downloads', 'Downloads'],
  ['account', 'Account'],
];
const destination = (view) => (view === 'home' ? '/account' : `/account?view=${view}`);
function DownloadProductName({ file }) {
  const name = file.productName || file.name;
  let productId;
  try {
    // WooCommerce includes the product ID in its permission-checked download URL.
    // Use only that ID for navigation, never the download's private query values.
    productId = new URL(file.url).searchParams.get('download_file');
  } catch {
    return name;
  }
  if (!/^[1-9]\d*$/.test(productId || '') || !Number.isSafeInteger(Number(productId))) return name;
  return (
    <Link className={classes.downloadProductLink} to={`/products/${productId}`}>
      {name}
    </Link>
  );
}
function Resource({ query, label, children }) {
  if (query.isPending)
    return (
      <div className={classes.loading} role="status">
        <Loader size="sm" /> Loading {label}…
      </div>
    );
  if (query.isError)
    return (
      <Alert color="yellow" title={`${label} are temporarily unavailable`}>
        <p>{query.error.message}</p>
        <Button mt="sm" variant="light" onClick={() => query.refetch()}>
          Try again
        </Button>
      </Alert>
    );
  return children;
}
function Empty({ title, children, to = '/products', label = 'Browse products', icon = 'box' }) {
  return (
    <div className={classes.empty}>
      <Icon name={icon} />
      <h3>{title}</h3>
      <p>{children}</p>
      <Link className={classes.textLink} to={to}>
        {label}
        <Icon name="arrow" />
      </Link>
    </div>
  );
}
function Dashboard({ auth, brand }) {
  const client = useQueryClient();
  const [params, setParams] = useSearchParams();
  const view = sections.some(([key]) => key === params.get('view')) ? params.get('view') : 'home';
  const requestedPage = Number(params.get('page') || 1);
  const page =
    ['orders', 'products'].includes(view) &&
    Number.isSafeInteger(requestedPage) &&
    requestedPage > 0 &&
    requestedPage <= 1000
      ? requestedPage
      : 1;
  const setPage = (next) => setParams({ view, page: String(next) });
  const [error, setError] = useState('');
  const logout = async () => {
    setError('');
    try {
      await auth.submit('logout', {});
    } catch (err) {
      setError(err.message);
    }
  };
  const ordersQuery = useQuery({
    queryKey: ['customer', 'orders', auth.user.id, page],
    queryFn: () => accountRequest('orders', undefined, page),
    retry: false,
    networkMode: 'always',
    staleTime: 0,
    gcTime: 0,
  });
  const downloadsQuery = useQuery({
    queryKey: ['customer', 'downloads', auth.user.id],
    queryFn: () => accountRequest('downloads'),
    retry: false,
    networkMode: 'always',
    staleTime: 0,
    gcTime: 0,
  });
  useEffect(() => {
    if ([ordersQuery.error, downloadsQuery.error].some((failure) => failure?.status === 401)) {
      client.setQueryData(['customer', 'session'], { user: null });
      client.removeQueries({ queryKey: ['customer', 'orders'] });
      client.removeQueries({ queryKey: ['customer', 'downloads'] });
    }
  }, [client, ordersQuery.error, downloadsQuery.error]);
  const orders = ordersQuery.data?.orders || [];
  const downloads = downloadsQuery.data?.downloads || [];
  const totalOrders = ordersQuery.isSuccess
    ? (ordersQuery.data.totalOrders ??
      (ordersQuery.data.hasMore ? `${orders.length}+` : orders.length))
    : '—';
  const totalDownloads = downloadsQuery.isSuccess ? downloads.length : '—';
  const heading =
    view === 'home'
      ? `Hello, ${auth.user.name || 'there'}`
      : sections.find(([key]) => key === view)[1];
  const money = (order) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency: order.currency }).format(
      Number(order.total),
    );
  const date = (value) =>
    value
      ? new Date(value).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : '';
  const pagination = (page > 1 || ordersQuery.data?.hasMore) && (
    <Group mt="lg" justify="center">
      <Button variant="light" disabled={page === 1} onClick={() => setPage(page - 1)}>
        Previous
      </Button>
      <span>Page {page}</span>
      <Button
        variant="light"
        disabled={!ordersQuery.data?.hasMore}
        onClick={() => setPage(page + 1)}
      >
        Next
      </Button>
    </Group>
  );
  const orderList = (recent = false) => (
    <Resource query={ordersQuery} label="Orders">
      {orders.length ? (
        <>
          <div className={classes.orders}>
            {(recent ? orders.slice(0, 3) : orders).map((order) => (
              <article className={classes.order} key={order.number}>
                <div className={classes.orderTop}>
                  <h3>Order #{order.number}</h3>
                  <span className={classes.status}>{order.status}</span>
                </div>
                <p className={classes.muted}>{date(order.date)}</p>
                <ul>
                  {order.items.map((item, index) => (
                    <li key={index}>
                      {item.name} <span>× {item.quantity}</span>
                    </li>
                  ))}
                </ul>
                <strong>{money(order)}</strong>
              </article>
            ))}
          </div>
          {!recent && pagination}
        </>
      ) : (
        <Empty title="Your next chapter is waiting.">
          Orders placed while logged in will appear here.
        </Empty>
      )}
    </Resource>
  );
  return (
    <div className={classes.page}>
      <PageMetadata title="My account" content={{ seo: { noindex: true } }} />
      <div className={classes.shell}>
        <aside className={classes.sidebar}>
          <Link to="/" className={classes.sidebarBrand}>
            <LDLogo size={62} src={brand?.logo?.src} alt={brand?.logo?.alt} />
            <strong>{brand?.name || 'Longlife Digital'}</strong>
            <span>Build. Grow. Own digital.</span>
          </Link>
          <nav className={classes.navigation} aria-label="Account navigation">
            {sections.map(([key, label]) => (
              <Link
                key={key}
                to={destination(key)}
                aria-current={view === key ? 'page' : undefined}
              >
                <Icon name={key} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
          <div className={classes.sidebarBottom}>
            <Link to="/contact">
              <Icon name="help" />
              Help & support
            </Link>
            <button type="button" disabled={auth.busy} onClick={logout}>
              <Icon name="logout" />
              {auth.busy ? 'Logging out…' : 'Log out'}
            </button>
          </div>
        </aside>
        <div className={classes.content}>
          <div className={view === 'home' ? classes.overviewIntro : undefined}>
            <header className={classes.header}>
              <div className={classes.headerCopy}>
                <p className={classes.eyebrow}>
                  Your account / {view === 'home' ? 'Overview' : heading}
                </p>
                <h1>{heading}</h1>
                <p className={classes.intro}>
                  {view === 'home'
                    ? 'Your purchases, new possibilities. All in one place.'
                    : 'A little less admin. More room for what’s next.'}
                </p>
              </div>
              <Link className={classes.browse} to="/products">
                Browse products
                <Icon name="arrow" />
              </Link>
              <div className={classes.mobileMenu}>
                <Menu
                  position="bottom-end"
                  width="min(17rem, calc(100vw - 2rem))"
                  withinPortal
                  shadow="md"
                  radius="md"
                >
                  <Menu.Target>
                    <ActionIcon
                      className={classes.menuToggle}
                      variant="subtle"
                      size={44}
                      aria-label="Account menu"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <circle cx="12" cy="5" r="1.8" />
                        <circle cx="12" cy="12" r="1.8" />
                        <circle cx="12" cy="19" r="1.8" />
                      </svg>
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown className={classes.accountMenuDropdown}>
                    <Menu.Label>Your account</Menu.Label>
                    {sections.map(([key, label]) => (
                      <Menu.Item
                        key={key}
                        component={Link}
                        to={destination(key)}
                        leftSection={<Icon name={key} />}
                        className={classes.accountMenuItem}
                        aria-current={view === key ? 'page' : undefined}
                      >
                        {label}
                      </Menu.Item>
                    ))}
                    <Menu.Divider />
                    <Menu.Item
                      component={Link}
                      to="/products"
                      leftSection={<Icon name="box" />}
                      className={classes.accountMenuItem}
                    >
                      Browse products
                    </Menu.Item>
                    <Menu.Item
                      component={Link}
                      to="/contact"
                      leftSection={<Icon name="help" />}
                      className={classes.accountMenuItem}
                    >
                      Help & support
                    </Menu.Item>
                    <Menu.Item
                      onClick={logout}
                      disabled={auth.busy}
                      leftSection={<Icon name="logout" />}
                      className={classes.accountMenuItem}
                    >
                      {auth.busy ? 'Logging out…' : 'Log out'}
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </div>
            </header>
            {error && (
              <Alert color="red" role="alert" mb="lg">
                {error}
              </Alert>
            )}
            {view === 'home' && (
              <section className={classes.hero} aria-label="Your digital business hub">
                <div className={classes.heroCopy}>
                  <span className={classes.heroBadge}>Build. Grow. Own digital.</span>
                  <h2>
                    Your Digital
                    <br />
                    <em>Business</em> Hub
                  </h2>
                  <p>
                    Access your purchases, find your next idea, and turn possibility into progress.
                  </p>
                  <Link to={destination('products')} className={classes.heroLink}>
                    Explore your purchases
                    <Icon name="arrow" />
                  </Link>
                </div>
                <div className={classes.heroArt} aria-hidden="true">
                  <div className={classes.orbit} />
                  <span className={classes.spark}>✦</span>
                  <div className={classes.laptop}>
                    <div className={classes.screen}>
                      <div className={classes.browserBar}>
                        <i />
                        <i />
                        <i />
                        <span>YOUR NEXT CHAPTER</span>
                      </div>
                      <div className={classes.screenBody}>
                        <span className={classes.miniLabel}>LONGLIFE DIGITAL</span>
                        <strong>
                          Good ideas.
                          <br />
                          <em>Bigger possibilities.</em>
                        </strong>
                        <div className={classes.screenCards}>
                          <span>
                            <Icon name="products" />
                            Read.
                          </span>
                          <span>
                            <Icon name="services" />
                            Build.
                          </span>
                          <span>
                            <Icon name="domains" />
                            Grow.
                          </span>
                        </div>
                        <span className={classes.miniButton}>
                          Make it yours <Icon name="arrow" />
                        </span>
                      </div>
                    </div>
                    <div className={classes.laptopBase} />
                  </div>
                  <div className={classes.floatingTile}>
                    <Icon name="box" />
                    <span>
                      Made for
                      <br />
                      <strong>your next move.</strong>
                    </span>
                  </div>
                </div>
              </section>
            )}
          </div>
          {view === 'home' && (
            <>
              <div className={classes.stats}>
                {[
                  {
                    icon: 'box',
                    title: 'Total orders',
                    value: totalOrders,
                    link: 'View orders',
                    view: 'orders',
                  },
                  {
                    icon: 'downloads',
                    title: 'Available downloads',
                    value: totalDownloads,
                    link: 'View downloads',
                    view: 'downloads',
                    gold: true,
                  },
                  {
                    icon: 'services',
                    title: 'Digital services',
                    value: 'Let’s build',
                    link: 'Explore services',
                    view: 'services',
                  },
                  {
                    icon: 'domains',
                    title: 'Your next domain',
                    value: 'Find your name',
                    link: 'Explore domains',
                    view: 'domains',
                    gold: true,
                  },
                ].map((stat) => (
                  <Link key={stat.view} to={destination(stat.view)} className={classes.stat}>
                    <div className={classes.statTop}>
                      <span className={`${classes.statIcon} ${stat.gold ? classes.goldIcon : ''}`}>
                        <Icon name={stat.icon} />
                      </span>
                      <div>
                        <span className={classes.statLabel}>{stat.title}</span>
                        <strong
                          className={
                            typeof stat.value === 'string' && stat.value.length > 5
                              ? classes.statWords
                              : ''
                          }
                        >
                          {stat.value}
                        </strong>
                      </div>
                    </div>
                    <span className={classes.statLink}>
                      {stat.link}
                      <Icon name="arrow" />
                    </span>
                  </Link>
                ))}
              </div>
              <div className={classes.lowerGrid}>
                <section>
                  <div className={classes.sectionHeading}>
                    <h2>Recent orders</h2>
                    <Link className={classes.textLink} to={destination('orders')}>
                      View all
                      <Icon name="arrow" />
                    </Link>
                  </div>
                  {orderList(true)}
                </section>
                <aside className={classes.helpCard}>
                  <span className={classes.helpIcon}>
                    <Icon name="help" />
                  </span>
                  <h2>
                    A little guidance
                    <br />
                    goes a long way.
                  </h2>
                  <p>
                    Questions about an order, a project, or your next big idea? We’re here to help.
                  </p>
                  <Link className={classes.textLink} to="/contact">
                    Let’s talk
                    <Icon name="arrow" />
                  </Link>
                </aside>
              </div>
            </>
          )}
          {view === 'orders' && orderList()}
          {view === 'products' && (
            <Resource query={ordersQuery} label="Purchases">
              <p className={classes.sectionIntro}>
                Products from your orders. Ready-to-use files are in Downloads.
              </p>
              {orders.length ? (
                <>
                  <div className={classes.productGrid}>
                    {orders.flatMap((order) =>
                      order.items.map((item, index) => (
                        <article className={classes.product} key={`${order.number}-${index}`}>
                          <span className={classes.statIcon}>
                            <Icon name="products" />
                          </span>
                          <span className={classes.muted}>
                            Order #{order.number} · {order.status}
                          </span>
                          <h2>{item.name}</h2>
                          <p>Quantity: {item.quantity}</p>
                          <Link className={classes.textLink} to={destination('downloads')}>
                            Check downloads
                            <Icon name="arrow" />
                          </Link>
                        </article>
                      )),
                    )}
                  </div>
                  {pagination}
                </>
              ) : (
                <Empty title="Make room for your next great idea.">
                  Your purchased products will appear here after you place an order while logged in.
                </Empty>
              )}
            </Resource>
          )}
          {view === 'downloads' && (
            <Resource query={downloadsQuery} label="Downloads">
              {downloads.length ? (
                <>
                  <p className={classes.sectionIntro}>Your purchased files, ready to download.</p>
                  <div className={classes.downloadTableWrap}>
                    <table className={classes.downloadTable} aria-label="Available downloads">
                      <thead>
                        <tr>
                          <th scope="col">Product</th>
                          <th scope="col">Expires</th>
                          <th scope="col" aria-label="Download">
                            <Icon name="downloads" />
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {downloads.map((file) => (
                          <tr key={file.id}>
                            <th scope="row">
                              <DownloadProductName file={file} />
                            </th>
                            <td>
                              {file.expires ? (
                                <time dateTime={file.expires}>{date(file.expires)}</time>
                              ) : (
                                'No expiry'
                              )}
                            </td>
                            <td>
                              <a
                                className={classes.downloadButton}
                                href={file.url}
                                referrerPolicy="no-referrer"
                                aria-label={`Download ${file.productName || file.name}${file.productName && file.name !== file.productName ? ` — ${file.name}` : ''}`}
                                title={`Download ${file.name}${file.remaining === '' ? '' : ` (${file.remaining} remaining)`}`}
                              >
                                <Icon name="downloads" />
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <Empty title="Your library is ready to grow." icon="downloads">
                  Available files from eligible purchases made with this account will appear here.
                </Empty>
              )}
            </Resource>
          )}
          {(view === 'services' || view === 'domains') && (
            <section className={classes.explorePanel}>
              <span className={classes.statIcon}>
                <Icon name={view} />
              </span>
              <p className={classes.eyebrow}>
                {view === 'services' ? 'Expertise for your next step' : 'A name to make your own'}
              </p>
              <h2>
                {view === 'services'
                  ? 'Big ambitions. A little expert help.'
                  : 'Every great idea needs an address.'}
              </h2>
              <p>
                {view === 'services'
                  ? 'From a better website to smarter automation, find the right support for your business. For an existing project or quote, contact our team for an update.'
                  : 'Discover a domain that feels like your business. For a domain you’ve purchased, contact our team for transfer details and support.'}
              </p>
              <div className={classes.exploreLinks}>
                <Link className={classes.browse} to={`/${view}`}>
                  Browse {view}
                  <Icon name="arrow" />
                </Link>
                <Link className={classes.textLink} to="/contact">
                  Contact our team
                  <Icon name="arrow" />
                </Link>
              </div>
            </section>
          )}
          {view === 'account' && (
            <div className={classes.detailsGrid}>
              <section className={classes.details}>
                <span className={classes.avatar}>
                  {(auth.user.name || auth.user.email).slice(0, 1).toUpperCase()}
                </span>
                <h2>Account details</h2>
                <dl>
                  <dt>Name</dt>
                  <dd>{auth.user.name || 'Not provided'}</dd>
                  <dt>Email address</dt>
                  <dd>{auth.user.email}</dd>
                </dl>
                <Link className={classes.textLink} to="/contact">
                  Need to update your details?
                  <Icon name="arrow" />
                </Link>
              </section>
              <section className={classes.details}>
                <span className={classes.statIcon}>
                  <Icon name="account" />
                </span>
                <h2>Keep your account secure.</h2>
                <p>Request a secure email link to choose a new password.</p>
                <Button component={Link} to="/forgot-password" variant="light">
                  Reset password
                </Button>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default function AccountPage({ auth, brand }) {
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
  return <Dashboard key={auth.user.id} auth={auth} brand={brand} />;
}
