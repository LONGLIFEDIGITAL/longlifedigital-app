export const wordpressApiUrl = import.meta.env.VITE_WORDPRESS_API_URL?.trim() || '';

// Configured CMS failures must not resurrect stale promotions or contact details.
export const EMPTY_SITE_SETTINGS = {
  brand: {
    name: '',
    legalName: '',
    tagline: '',
    website: '',
    websiteLabel: '',
    logo: { src: '', alt: '' },
  },
  contact: { email: '', social: '', website: '', responseNote: '', hours: '' },
  social: {},
  announcement: {
    enabled: false,
    message: '',
    couponCode: '',
    deliveryNote: '',
    cta: { label: '', destination: '' },
  },
  footer: {
    description: '',
    companyHeading: '',
    supportHeading: '',
    contactHeading: '',
    copyrightName: '',
  },
};

export function normalizeSiteSettings(settings) {
  if (
    !settings?.brand?.name ||
    !settings.contact?.email ||
    !settings.announcement ||
    !settings.footer
  ) {
    throw new Error('Invalid site settings.');
  }
  return settings;
}
