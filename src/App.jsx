import SiteFooter from './components/SiteFooter';
import { ContentState } from './components/ContentPage';
import { Alert, Box, Button } from '@mantine/core';
import { useState, useEffect, useLayoutEffect, lazy, Suspense } from 'react';
import { ScrollRestoration } from 'react-router';
import useCart from './hooks/useCart';
import useCustomer from './hooks/useCustomer';
// Login and registration must open immediately, even while CMS/session requests run.
import AuthPage from './pages/AuthPage';
const AccountPage = lazy(() => import('./pages/AccountPage'));
import { headlessEnabled } from './services/checkout';
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage'));
import useCatalog from './hooks/useCatalog';
import useSiteSettings from './hooks/useSiteSettings';
import useNewsletterPopup from './hooks/useNewsletterPopup';
import usePublicForm from './hooks/usePublicForm';
import useAppNavigation from './hooks/useAppNavigation';
import CatalogStatus from './components/CatalogStatus';
import ProductDetailsSkeleton from './components/skeletons/ProductDetailsSkeleton';
import { matchesCategory } from './services/catalog';
import { getItemQuantity, getQuantityLimits } from './utils/cart';
import Nav from './components/Nav';
import Toast from './components/Toast';
import AIChat from './components/AIChat';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';
import NewsletterPopup from './components/NewsletterPopup';
import NewsletterConfirmationPage from './pages/NewsletterConfirmationPage';
import CartDrawer from './components/CartDrawer';
const ShopPage = lazy(() => import('./pages/ShopPage'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const ServiceDetailPage = lazy(() => import('./pages/ServiceDetailPage'));
const CoursesPage = lazy(() => import('./pages/CoursesPage'));
const EbookPage = lazy(() => import('./pages/EbookPage'));
const DomainsPage = lazy(() => import('./pages/DomainsPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const RefundPage = lazy(() => import('./pages/RefundPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
export default function App() {
  useLayoutEffect(() => {
    document.getElementById('initial-content')?.remove();
  }, []);
  const { page, setPage, productId, postSlug, serviceSlug, goProduct } = useAppNavigation();
  const auth = useCustomer();
  const { products, status: catalogStatus, retry: retryCatalog, categories } = useCatalog();
  const { settings, status: settingsStatus, retry: retrySettings } = useSiteSettings();
  const selProduct = products.find((product) => String(product.id) === productId);
  const cartState = useCart(products);
  const { cart, busy: leaving } = cartState;
  const [showCart, setShowCart] = useState(false);
  const [filterCat, setFilterCat] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [annBarHidden, setAnnBarHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const newsletterRequest = usePublicForm('newsletter');
  const [subName, setSubName] = useState('');
  const [subEmail, setSubEmail] = useState('');
  const [subConsent, setSubConsent] = useState(false);
  const [popupName, setPopupName] = useState('');
  const [popupEmail, setPopupEmail] = useState('');
  const [popupConsent, setPopupConsent] = useState(false);
  const contact = settings.contact;
  const [activeDropdown, setActiveDropdown] = useState(null);
  const { showPopup, setShowPopup, popupDone, setPopupDone } = useNewsletterPopup({
    subscribed: subscribed || page === 'newsletter-confirmed',
    delaySeconds: settings.newsletter?.popupDelay,
    blocked:
      !settings.newsletter?.enabled ||
      !settings.newsletter?.popupEnabled ||
      showCart ||
      leaving ||
      page === 'checkout' ||
      page === 'order-confirmation',
  });
  useEffect(() => {
    let lastY = 0;
    const fn = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 10);
      setAnnBarHidden(currentY > lastY && currentY > 60);
      lastY = currentY;
    };
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);
  useEffect(() => {
    const closeNavigationOverlays = () => {
      setMenuOpen(false);
      setActiveDropdown(null);
      setShowCart(false);
    };
    window.addEventListener('popstate', closeNavigationOverlays);
    return () => window.removeEventListener('popstate', closeNavigationOverlays);
  }, []);
  const fire = (msg, type = 'ok') => {
    setToast({
      msg,
      type,
    });
    setTimeout(() => setToast(null), 3000);
  };
  const addCart = async (p) => {
    if (p.canAddToCart === false) {
      fire(p.availability || 'This product is currently unavailable.', 'info');
      return;
    }
    if (cart.some((item) => (item.currency || 'USD') !== (p.currency || 'USD'))) {
      fire('Please use separate carts for different currencies.', 'info');
      return;
    }
    const existing = cart.find((item) => item.id === p.id);
    if (existing && getItemQuantity(existing) >= getQuantityLimits(existing).maximum) {
      fire('The maximum quantity is already in your cart.', 'info');
      return;
    }
    try {
      await cartState.add(p);
      fire(existing ? `Quantity updated for "${p.name}".` : `"${p.name}" added to cart!`);
    } catch (error) {
      fire(error.message, 'err');
    }
  };
  const rmCart = (id) => cartState.remove(id).catch((error) => fire(error.message, 'err'));
  const changeCartQuantity = (id, direction) =>
    cartState.change(id, direction).catch((error) => fire(error.message, 'err'));
  const openCheckout = async (product) => {
    if (!headlessEnabled) {
      fire('Checkout is being configured.', 'info');
      return;
    }
    try {
      if (product) await cartState.add(product);
      setShowCart(false);
      setPage('checkout');
    } catch (error) {
      fire(error.message, 'err');
    }
  };

  const filtered = products
    .filter((p) => matchesCategory(p, filterCat))
    .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) =>
      sortBy === 'price-asc'
        ? a.price - b.price
        : sortBy === 'price-desc'
          ? b.price - a.price
          : sortBy === 'name'
            ? a.name.localeCompare(b.name)
            : Number(b.featured) - Number(a.featured),
    );
  return (
    <Box c="#111827" bg="#fff" ff="'Inter',sans-serif" mih="100vh">
      <Toast toast={toast} />
      <Nav
        customer={auth.user}
        settings={settings}
        settingsStatus={settingsStatus}
        page={page}
        setPage={setPage}
        annBarHidden={annBarHidden}
        scrolled={scrolled}
        search={search}
        setSearch={setSearch}
        setFilterCat={setFilterCat}
        cart={cart}
        setShowCart={setShowCart}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        activeDropdown={activeDropdown}
        setActiveDropdown={setActiveDropdown}
      />
      <Suspense
        fallback={
          <Box p="xl">
            <ContentState status="loading" />
          </Box>
        }
      >
        <Box component="main" id="main-content" bg="#fff" mih="100vh">
          {settingsStatus === 'error' && (
            <Alert title="Site details could not be loaded" color="yellow" m="md">
              You can still browse products while we reconnect.
              <Button variant="light" size="xs" ml="sm" onClick={() => retrySettings()}>
                Retry site details
              </Button>
            </Alert>
          )}
          {['login', 'register', 'forgot-password', 'reset-password'].includes(page) && (
            <AuthPage key={page} mode={page} auth={auth} />
          )}
          {page === 'account' && <AccountPage auth={auth} brand={settings.brand} />}
          {page === 'checkout' && <CheckoutPage cartState={cartState} customer={auth.user} />}
          {page === 'order-confirmation' && <OrderConfirmationPage reloadCart={cartState.reload} />}
          {page === 'newsletter-confirmed' && <NewsletterConfirmationPage />}
          {page === 'home' && (
            <HomePage
              openCheckout={openCheckout}
              settings={settings}
              products={products}
              categories={categories}
              catalogStatus={catalogStatus}
              retryCatalog={retryCatalog}
              setPage={setPage}
              setFilterCat={setFilterCat}
              goProduct={goProduct}
              addCart={addCart}
              fire={fire}
              subName={subName}
              setSubName={setSubName}
              subEmail={subEmail}
              setSubEmail={setSubEmail}
              subConsent={subConsent}
              setSubConsent={setSubConsent}
              subscribed={subscribed}
              setSubscribed={setSubscribed}
              newsletterRequest={newsletterRequest}
              contact={contact}
            />
          )}
          {page === 'shop' && (
            <ShopPage
              openCheckout={openCheckout}
              products={products}
              categories={categories}
              catalogStatus={catalogStatus}
              retryCatalog={retryCatalog}
              filtered={filtered}
              filterCat={filterCat}
              setFilterCat={setFilterCat}
              sortBy={sortBy}
              setSortBy={setSortBy}
              addCart={addCart}
              goProduct={goProduct}
              fire={fire}
            />
          )}
          {page === 'product' && catalogStatus !== 'ready' && (
            <CatalogStatus
              status={catalogStatus}
              retry={retryCatalog}
              loading={<ProductDetailsSkeleton />}
            />
          )}
          {page === 'product' && catalogStatus === 'ready' && !selProduct && (
            <NotFoundPage product setPage={setPage} />
          )}
          {page === 'product' && selProduct && (
            <ProductPage
              selProduct={selProduct}
              onBrowseCategory={(category) => {
                setFilterCat(category);
                setSearch('');
                setPage('shop');
              }}
              openCheckout={openCheckout}
              checkoutLoading={leaving}
              products={products}
              addCart={addCart}
              fire={fire}
              goProduct={goProduct}
            />
          )}
          {page === 'about' && <AboutPage brand={settings.brand} contact={contact} />}
          {page === 'blog' && <BlogPage />}
          {page === 'post' && <BlogPostPage key={postSlug} slug={postSlug} />}
          {page === 'services' && <ServicesPage />}
          {page === 'service' && <ServiceDetailPage key={serviceSlug} slug={serviceSlug} />}
          {page === 'courses' && (
            <CoursesPage
              openCheckout={openCheckout}
              products={products}
              catalogStatus={catalogStatus}
              retryCatalog={retryCatalog}
              addCart={addCart}
              goProduct={goProduct}
              fire={fire}
            />
          )}
          {page === 'ebook' && (
            <EbookPage
              products={products}
              catalogStatus={catalogStatus}
              retryCatalog={retryCatalog}
              addCart={addCart}
              openCheckout={openCheckout}
              goProduct={goProduct}
            />
          )}
          {page === 'domains' && <DomainsPage setPage={setPage} />}
          {page === 'contact' && <ContactPage fire={fire} contact={contact} settings={settings} />}
          {page === 'faq' && <FAQPage setPage={setPage} />}
          {page === 'refund' && <RefundPage />}
          {page === 'privacy' && <PrivacyPage />}
          {page === 'terms' && <TermsPage />}
          {page === 'not-found' && <NotFoundPage setPage={setPage} />}
        </Box>
      </Suspense>
      <SiteFooter setPage={setPage} setFilterCat={setFilterCat} />
      <Suspense fallback={null}>
        {showCart && (
          <CartDrawer
            cart={cart}
            setShowCart={setShowCart}
            rmCart={rmCart}
            changeCartQuantity={changeCartQuantity}
            setPage={setPage}
            openCheckout={openCheckout}
            checkoutLoading={leaving}
            checkoutEnabled={headlessEnabled && !!cartState.data}
            clearCart={() => cartState.clear().catch((error) => fire(error.message, 'err'))}
            serverTotals={cartState.data?.totals}
            cartError={cartState.error}
          />
        )}
        {showPopup && !popupDone && (
          <NewsletterPopup
            newsletter={settings.newsletter}
            fire={fire}
            popupConsent={popupConsent}
            popupEmail={popupEmail}
            popupName={popupName}
            setPopupConsent={setPopupConsent}
            setPopupDone={setPopupDone}
            setPopupEmail={setPopupEmail}
            setPopupName={setPopupName}
            setShowPopup={setShowPopup}
            setSubscribed={setSubscribed}
            newsletterRequest={newsletterRequest}
          />
        )}
      </Suspense>
      {page !== 'checkout' && page !== 'order-confirmation' && <AIChat settings={settings} />}
      <ScrollRestoration />
    </Box>
  );
}
