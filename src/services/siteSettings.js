export const wordpressApiUrl = import.meta.env.VITE_WORDPRESS_API_URL?.trim() || '';

export const DEMO_SITE_SETTINGS = {
  brand: {
    name: 'Longlife Digital',
    legalName: 'Longlife Digital LLC',
    tagline: 'Premium Digital Store',
    website: 'https://longlifedigital.co',
    websiteLabel: 'longlifedigital.co',
    logo: { src: '/logo.png', alt: 'Longlife Digital' },
  },
  contact: {
    email: 'support@lldhome.com',
    social: '@longlifedigital',
    website: 'longlifedigital.co',
    responseNote: 'We respond within 24 hours — let us know how we can help',
    hours: 'We reply to all messages within 24 hours, Monday through Saturday.',
  },
  social: { instagram: 'https://instagram.com/longlifedigital' },
  announcement: {
    enabled: true,
    message: '🎉 Get 10% off your first order',
    couponCode: 'WELCOME10',
    deliveryNote: '⚡ Instant Digital Delivery',
    cta: { label: '', destination: '' },
  },
  footer: {
    description:
      'Premium digital products for entrepreneurs, creators and learners. Excellence in every product.',
    companyHeading: 'Company',
    supportHeading: 'Support',
    contactHeading: 'Contact',
    copyrightName: 'Longlife Digital',
  },
};

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

export async function fetchSiteSettings(signal) {
  const response = await fetch('/api/content?resource=settings', {
    cache: 'no-store',
    signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]),
    credentials: 'omit',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error('Site settings could not be loaded.');
  const settings = await response.json();
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
