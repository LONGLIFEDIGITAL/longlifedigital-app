import { Accordion, Button, Container } from '@mantine/core';
import { Link, useLocation } from 'react-router';
import PageMetadata from '../components/PageMetadata';
import ServiceMark from '../components/ServiceMark';
import ArrowIcon from '../components/ArrowIcon';
import TranslationRequest from '../components/TranslationRequest';
import useCatalog from '../hooks/useCatalog';
import classes from './TranslationServicePage.module.css';

const money = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);

export default function TranslationServicePage({ service, request }) {
  const config = service.translation;
  const documents = (config.offerings || []).filter((option) => option.unit !== 'package');
  const packages = (config.offerings || []).filter((option) => option.unit === 'package');
  const { products } = useCatalog();
  const book = products.find((product) => product.id === config.bookId);
  const { search } = useLocation();
  const path = `/services/${encodeURIComponent(service.slug)}`;
  const requestPath = `${path}/request`;
  const price = (key, suffix = '') =>
    config.prices[key] == null ? 'Request a quote' : `${money(config.prices[key])}${suffix}`;
  const extras = [
    [
      'Additional pages',
      price('additional_page', ' / page'),
      'For additional pages in document-based services. Final scope is confirmed in your quote.',
    ],
    [
      '24-hour rush',
      config.prices.rush_percent == null ? 'Request a quote' : `+${config.prices.rush_percent}%`,
      'Applies to translation and extra-page charges. Subject to availability and document review.',
    ],
    [
      'Notarization',
      price('notarization', ' / document'),
      'Available when a notarized translation is needed.',
    ],
    [
      'Mailed hard copy',
      price('mail_standard'),
      `USPS with tracking. Overnight delivery: ${price('mail_overnight')}.`,
    ],
  ];
  return (
    <div className={classes.page}>
      <PageMetadata
        content={
          request
            ? {
                intro: 'Request a free document translation quote from Longlife Digital.',
                seo: { noindex: true },
              }
            : { ...service, intro: config.intro || service.description }
        }
        title={request ? 'Request a translation quote' : service.title}
        path={request ? requestPath : path}
      />
      <section className={request ? classes.requestHero : classes.hero}>
        <Container>
          <nav className={classes.breadcrumb} aria-label="Breadcrumb">
            <Link to="/services">Services</Link>
            <span>/</span>
            {request ? (
              <>
                <Link to={path}>Translation</Link>
                <span>/</span>
                <span aria-current="page">Request a quote</span>
              </>
            ) : (
              <span aria-current="page">Translation</span>
            )}
          </nav>
          {request ? (
            <div className={classes.requestHeading}>
              <p className={classes.eyebrow}>A little clarity starts here</p>
              <h1>Let’s bring your words across.</h1>
              <p>Tell us what you need. We’ll take care of the next steps with a personal quote.</p>
            </div>
          ) : (
            <div className={classes.heroGrid}>
              <div className={classes.heroText}>
                <p className={classes.eyebrow}>
                  <ServiceMark kind="translation" /> Document translation
                </p>
                <h1>
                  {config.heading || (
                    <>
                      Your words.
                      <br />A world of <em>possibility.</em>
                    </>
                  )}
                </h1>
                <p className={classes.intro}>{config.intro || service.description}</p>
                {service.specialties?.length > 0 && (
                  <ul className={classes.specialties} aria-label="Service specialties">
                    {service.specialties.map((specialty, index) => (
                      <li key={index}>{specialty}</li>
                    ))}
                  </ul>
                )}
                <div className={classes.actions}>
                  <Button
                    component={Link}
                    to={requestPath}
                    size="lg"
                    radius="xl"
                    rightSection={<ArrowIcon direction="right" />}
                  >
                    Get a free quote
                  </Button>
                  <a className={classes.textLink} href="#translation-pricing">
                    Explore pricing <ArrowIcon direction="right" />
                  </a>
                </div>
                <p className={classes.heroNote}>
                  Certified & standard translations · A quote before you commit
                </p>
              </div>
              <div className={classes.artwork} aria-hidden="true">
                <span className={classes.artOrbit} />
                <div className={classes.languageTag}>
                  Bonjou <span>·</span> Bonjour <span>·</span> Hola
                </div>
                <div className={classes.documentBack}>
                  <span>Every word matters.</span>
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
                <div className={classes.documentFront}>
                  <span className={classes.documentLabel}>Longlife Digital / Translation</span>
                  <strong>
                    Hello,
                    <br />
                    <em>possibility.</em>
                  </strong>
                  <div className={classes.documentLines}>
                    <i />
                    <i />
                    <i />
                  </div>
                  <div className={classes.documentFoot}>
                    <ServiceMark kind="translation" />
                    <span>
                      Care in every word.
                      <br />
                      Clarity on every page.
                    </span>
                  </div>
                </div>
                <div className={classes.artSeal}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 3 20 6v6c0 5-8 9-8 9s-8-4-8-9V6zM8 12l3 3 5-6" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </Container>
      </section>
      {request ? (
        <Container className={classes.requestContent}>
          <TranslationRequest key={`${service.id}:${search}`} service={service} />
        </Container>
      ) : (
        <>
          <div className={classes.languageStrip}>
            <Container>
              <span>Bringing languages together</span>
              {['Haitian Creole', 'French', 'Spanish'].map((language) => (
                <div key={language}>
                  {language}
                  <svg
                    width="23"
                    height="18"
                    viewBox="0 0 24 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    aria-hidden="true"
                  >
                    <path d="M3 6h17m-4-4 4 4-4 4M21 14H4m4-4-4 4 4 4" />
                  </svg>
                  English
                </div>
              ))}
            </Container>
          </div>
          <Container className={classes.section} id="translation-pricing">
            <div className={classes.sectionHeading}>
              <div>
                <p className={classes.eyebrow}>Clear words. Clear pricing.</p>
                <h2>
                  For the documents
                  <br />
                  that move life forward.
                </h2>
              </div>
              <p>
                Certified translation rates in USD. Standard translations and larger projects
                receive a custom quote.
              </p>
            </div>
            <div className={classes.priceGrid}>
              {documents.map((option, index) => (
                <article className={classes.priceCard} key={option.id}>
                  <div className={classes.cardTop}>
                    <span className={classes.cardNumber}>{String(index + 1).padStart(2, '0')}</span>
                    <ServiceMark kind="translation" />
                  </div>
                  <h3>{option.title}</h3>
                  <p>{option.note}</p>
                  <div className={classes.cardPrice}>
                    <strong>
                      {option.price == null ? 'Request a quote' : money(option.price)}
                    </strong>
                    {option.price != null && <span>per {option.unit}</span>}
                  </div>
                  <Link
                    to={`${requestPath}?service=${option.id}`}
                    aria-label={`Start your order: ${option.title}`}
                  >
                    Start your order <ArrowIcon direction="right" />
                  </Link>
                </article>
              ))}
              <article className={`${classes.priceCard} ${classes.customCard}`}>
                <p className={classes.eyebrow}>Something more?</p>
                <h3>
                  A bigger file.
                  <br />A tailored quote.
                </h3>
                <p>
                  Longer documents can be quoted per word, with the price agreed before we begin.
                </p>
                <div className={classes.cardPrice}>
                  <strong>{price('legal_word')}</strong>
                  {config.prices.legal_word != null && <span>per word</span>}
                </div>
                <Link to={requestPath}>
                  Let’s talk about it <ArrowIcon direction="right" />
                </Link>
              </article>
            </div>
            <div className={classes.packages}>
              {packages.map((option) => (
                <article className={classes.package} key={option.id}>
                  <div>
                    <p className={classes.eyebrow}>Better together</p>
                    <h3>{option.title}</h3>
                    <p>{option.note}</p>
                  </div>
                  <div className={classes.packageAction}>
                    <strong>
                      {option.price == null ? 'Request a quote' : money(option.price)}
                    </strong>
                    <Link
                      to={`${requestPath}?service=${option.id}`}
                      aria-label={`Start your order: ${option.title}`}
                    >
                      <ArrowIcon direction="right" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
            <div className={classes.extrasGrid}>
              {extras.map(([title, amount, note]) => (
                <div key={title}>
                  <h3>{title}</h3>
                  <strong>{amount}</strong>
                  <p>{note}</p>
                </div>
              ))}
            </div>
          </Container>
          <section className={classes.process}>
            <Container>
              <div className={classes.sectionHeading}>
                <div>
                  <p className={classes.eyebrow}>From your first hello to your final document</p>
                  <h2>Three steps. One less worry.</h2>
                </div>
                <p>
                  Start with a free quote. We’ll confirm your scope, price and timing before work
                  begins.
                </p>
              </div>
              <div className={classes.processGrid}>
                {[
                  [
                    '01',
                    'Share your documents',
                    'Request a quote, then submit your files through the secure document process we arrange with you.',
                  ],
                  [
                    '02',
                    'We translate & certify',
                    'After you approve the quote and arrange payment, we translate your documents. Certified work includes a certification statement.',
                  ],
                  [
                    '03',
                    'Receive your translation',
                    'Receive your completed translation digitally, with optional mailed or overnight hard copies.',
                  ],
                ].map(([number, title, body]) => (
                  <article key={number}>
                    <span>{number}</span>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </article>
                ))}
              </div>
            </Container>
          </section>
          <Container className={classes.section}>
            <div className={classes.trustGrid}>
              <div>
                <p className={classes.eyebrow}>Personal documents. Personal care.</p>
                <h2>
                  Handled with care,
                  <br />
                  from start to finish.
                </h2>
              </div>
              <div>
                <p className={classes.trustIntro}>
                  {config.confidentiality ||
                    'Your documents deserve a thoughtful, confidential process. We’ll explain how to share your files securely when we respond to your inquiry.'}
                </p>
                <p className={classes.small}>
                  Please keep personal, medical and legal document content out of email inquiries.
                  We’ll arrange secure submission.
                </p>
                {config.credentials?.length > 0 && (
                  <div className={classes.credentials} aria-label="Translator credentials">
                    {config.credentials.map((credential) => (
                      <article key={credential.kind}>
                        <h3>
                          {credential.kind === 'hipaa'
                            ? 'HIPAA training & credentials'
                            : 'Translator credentials'}
                        </h3>
                        <p>{credential.description}</p>
                        {credential.url && (
                          <a href={credential.url} target="_blank" rel="noopener noreferrer">
                            View credential <ArrowIcon />
                          </a>
                        )}
                      </article>
                    ))}
                  </div>
                )}
                <p className={classes.small}>
                  <Link to="/privacy-policy">Privacy policy</Link> ·{' '}
                  <Link to="/terms-of-service">Terms of service</Link>
                </p>
              </div>
            </div>
            {config.faqs.length > 0 && (
              <section className={classes.faqs} aria-labelledby="translation-faq-heading">
                <div>
                  <p className={classes.eyebrow}>A little more clarity</p>
                  <h2 id="translation-faq-heading">Your questions, answered.</h2>
                </div>
                <Accordion variant="separated">
                  {config.faqs.map((faq, index) => (
                    <Accordion.Item key={index} value={String(index)}>
                      <Accordion.Control>{faq.question}</Accordion.Control>
                      <Accordion.Panel>
                        <p>{faq.answer}</p>
                      </Accordion.Panel>
                    </Accordion.Item>
                  ))}
                </Accordion>
              </section>
            )}
            {book && (
              <aside className={classes.bookCallout}>
                <div>
                  <p className={classes.eyebrow}>Keep the conversation going</p>
                  <h3>{book.name}</h3>
                  <p>Explore our Haitian Creole translation book.</p>
                </div>
                <Button
                  component={Link}
                  to={`/products/${book.id}`}
                  variant="light"
                  radius="xl"
                  rightSection={<ArrowIcon direction="right" />}
                >
                  Explore the book
                </Button>
              </aside>
            )}
            <section className={classes.closing}>
              <p className={classes.eyebrow}>Your next step, made clearer</p>
              <h2>Let’s bring your words across.</h2>
              <p>Tell us what you need translated. We’ll take it from there.</p>
              <Button
                component={Link}
                to={requestPath}
                size="lg"
                radius="xl"
                rightSection={<ArrowIcon direction="right" />}
              >
                Get a free quote
              </Button>
              <a href="mailto:info@longlifedigital.co">Questions? info@longlifedigital.co</a>
            </section>
          </Container>
        </>
      )}
    </div>
  );
}
