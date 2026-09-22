import useContent from './useContent';
import { CONTENT_PAGES } from '../contentPages';

// Essential route links keep the storefront usable before its menu is published.
const defaults = {
  header: ['home', 'services', 'courses', 'domains', 'shop', 'about', 'blog', 'contact'],
  footer_company: ['about', 'blog', 'shop'],
  footer_support: ['faq', 'contact'],
  footer_legal: ['refund', 'privacy', 'terms'],
};
const labels = {
  home: 'Home',
  shop: 'Digital Products',
  services: 'Services',
  domains: 'Domains',
  about: 'About',
  contact: 'Contact',
  faq: 'FAQ',
};
export default function useNavigationContent() {
  const navigation = useContent('navigation');
  const services = useContent('services');
  const categories = useContent('asset-categories');
  const records = navigation.data || [];
  const areas = {};
  for (const [area, routes] of Object.entries(defaults)) {
    const items = records.filter(
      (item) => item.area === area && !item.parentId && item.destination,
    );
    areas[area] = items.length
      ? items.map((item) => {
          let children = [];
          if (item.childrenSource === 'manual')
            children = records.filter(
              (child) =>
                child.parentId === item.id &&
                child.area === area &&
                child.destination &&
                child.id !== item.id,
            );
          if (item.childrenSource === 'services')
            children = (services.data || []).map((service) => ({
              id: `service-${service.id}`,
              title: service.navLabel || service.title,
              description: service.navSummary,
              icon: service.icon,
              destination: `/services#${encodeURIComponent(service.slug)}`,
            }));
          if (item.childrenSource === 'asset_categories')
            children = (categories.data || []).map((category) => ({
              ...category,
              destination: `/domains?category=${encodeURIComponent(category.slug)}`,
            }));
          return { ...item, children };
        })
      : routes.map((key) => ({
          id: key,
          title: labels[key] || CONTENT_PAGES[key].title,
          destination: CONTENT_PAGES[key].path,
          children: [],
        }));
  }
  return { ...areas, status: navigation.status };
}
