import { matchPath, useLocation, useMatch, useNavigate } from 'react-router';

export const PAGE_PATHS = {
  home: '/',
  login: '/login',
  register: '/register',
  'forgot-password': '/forgot-password',
  'reset-password': '/reset-password',
  account: '/account',
  checkout: '/checkout',
  'order-confirmation': '/order-confirmation',
  'newsletter-confirmed': '/newsletter-confirmed',
  shop: '/products',
  about: '/about',
  blog: '/blog',
  services: '/services',
  courses: '/courses',
  domains: '/domains',
  contact: '/contact',
  faq: '/faq',
  refund: '/refund-policy',
  privacy: '/privacy-policy',
  terms: '/terms-of-service',
  ebook: '/ebook',
};

export default function useAppNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const postMatch = useMatch('/blog/:postSlug');
  const productMatch = useMatch('/products/:productId');
  const serviceMatch = useMatch('/services/:serviceSlug');
  const page = productMatch
    ? 'product'
    : serviceMatch
      ? 'service'
      : postMatch
        ? 'post'
        : Object.keys(PAGE_PATHS).find((id) => matchPath(PAGE_PATHS[id], location.pathname)) ||
          'not-found';

  const visit = (path) => {
    // Searches can request the shop on every keystroke. Only actual page changes
    // should add a history entry; clicking the current page must not trap Back.
    if (path && !matchPath(path, window.location.pathname)) {
      navigate(path, { flushSync: true });
    }
  };

  return {
    page,
    setPage: (id) => visit(PAGE_PATHS[id]),
    postSlug: postMatch?.params.postSlug,
    productId: productMatch?.params.productId,
    serviceSlug: serviceMatch?.params.serviceSlug,
    goProduct: (product) => visit(`/products/${encodeURIComponent(product.id)}`),
  };
}
