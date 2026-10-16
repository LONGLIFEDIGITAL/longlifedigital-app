import { useRef, useState } from 'react';
import { Alert, Button, Checkbox, NativeSelect, TextInput } from '@mantine/core';
import { Link, useLocation } from 'react-router';
import useServiceInquiry from '../hooks/useServiceInquiry';
import {
  TRANSLATION_LANGUAGES,
  translationPairAllowed,
  translationRequestError,
  translationPriceBreakdown,
} from '../../shared/translation';
import ArrowIcon from './ArrowIcon';
import classes from '../pages/TranslationServicePage.module.css';

const money = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);

export default function TranslationRequest({ service }) {
  const config = service.translation;
  const options = config.offerings || [];
  const { search } = useLocation();
  const selected = new URLSearchParams(search).get('service');
  const initialOption = options.find(({ id }) => id === selected) || options[0];
  const [details, setDetails] = useState({
    type: 'certified',
    source: '',
    target: 'English',
    service: initialOption?.id || '',
    document: '',
    documents: initialOption?.documents || 1,
    pages: initialOption?.documents || 1,
    rush: false,
    notarized: false,
    delivery: 'digital',
    consent: false,
  });
  const [contact, setContact] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    website: '',
  });
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const heading = useRef(null);
  const { busy, error: deliveryError, sent, notice, submit: sendInquiry } = useServiceInquiry();
  const selectedOption = options.find(({ id }) => id === details.service);
  const breakdown = translationPriceBreakdown({ ...details, consent: true }, config);
  const estimate = breakdown?.total ?? null;
  const price = (key, suffix = '') =>
    config.prices[key] == null ? 'Quoted on request' : `${money(config.prices[key])}${suffix}`;
  const update = (name, value) => setDetails((prev) => ({ ...prev, [name]: value }));
  const goStep = (next) => {
    setStep(next);
    setError('');
    requestAnimationFrame(() => heading.current?.focus());
  };
  async function submit(event) {
    event.preventDefault();
    const validation = translationRequestError(
      {
        ...details,
        consent: step === 0 ? true : details.consent,
      },
      options,
    );
    if (validation) {
      setError(validation);
      return;
    }
    if (step === 0) {
      goStep(1);
      return;
    }
    setError('');
    await sendInquiry({ ...contact, serviceId: service.id, translation: details });
  }
  if (!options.length)
    return (
      <Alert title="Contact us about your translation" color="violet">
        Please <a href="mailto:info@longlifedigital.co">email info@longlifedigital.co</a> to check
        which documents we can help with. Please don’t attach private documents.
      </Alert>
    );
  if (sent)
    return (
      <section className={classes.success}>
        <span className={classes.successMark} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="m5 12 4 4L19 6" />
          </svg>
        </span>
        <div role="status" tabIndex={-1} ref={notice}>
          <p className={classes.eyebrow}>Request received</p>
          <h2>Your next chapter is in motion.</h2>
          <p>
            We’ll reply to <strong>{contact.email}</strong> with the next steps and a quote. No
            payment has been taken.
          </p>
        </div>
        {config.secureFormUrl ? (
          <div className={classes.nextStep}>
            <h3>Next: share your documents securely</h3>
            <p>
              Continue to our document form to upload your files. Any payment requested there is
              handled separately from this inquiry.
            </p>
            <Button
              component="a"
              href={config.secureFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
              rightSection={<ArrowIcon />}
              radius="xl"
            >
              Open document form
            </Button>
          </div>
        ) : (
          <p className={classes.notice}>
            We’ll arrange secure document submission when we reply. Please don’t send personal,
            medical or legal documents by email.
          </p>
        )}
        <Link to={`/services/${encodeURIComponent(service.slug)}`}>
          Back to translation services
        </Link>
      </section>
    );
  return (
    <div className={classes.requestGrid}>
      <section className={classes.formPanel}>
        <ol className={classes.steps} aria-label="Quote request progress">
          {['Translation details', 'Contact & review'].map((label, index) => (
            <li key={label} aria-current={step === index ? 'step' : undefined}>
              <span>{index + 1}</span>
              {label}
            </li>
          ))}
        </ol>
        <h2 ref={heading} tabIndex={-1}>
          {step === 0 ? 'What would you like translated?' : 'Where should we send your quote?'}
        </h2>
        <p className={classes.muted}>
          {step === 0
            ? 'A few details help us give you an accurate quote. You’ll share documents securely after this request.'
            : 'Review your translation details, then send your free quote request.'}
        </p>
        <form onSubmit={submit}>
          {(error || deliveryError) && (
            <Alert color="red" role="alert" ref={notice} tabIndex={-1} mb="lg">
              {error || deliveryError}
            </Alert>
          )}
          <fieldset disabled={busy} className={classes.fields}>
            {step === 0 ? (
              <>
                <fieldset className={classes.typePicker}>
                  <legend>Translation type</legend>
                  {[
                    [
                      'certified',
                      'Certified translation',
                      'For official documents and applications',
                    ],
                    [
                      'standard',
                      'Standard translation',
                      'For everyday or personal use · custom quote',
                    ],
                  ].map(([value, label, note]) => (
                    <label key={value} data-selected={details.type === value}>
                      <input
                        type="radio"
                        name="translationType"
                        value={value}
                        checked={details.type === value}
                        onChange={() => update('type', value)}
                      />
                      <span>
                        <strong>{label}</strong>
                        <small>{note}</small>
                      </span>
                    </label>
                  ))}
                </fieldset>
                <div className={classes.twoColumns}>
                  <NativeSelect
                    label="Original language"
                    required
                    value={details.source}
                    data={[{ value: '', label: 'Select a language' }, ...TRANSLATION_LANGUAGES]}
                    onChange={(event) => {
                      const source = event.target.value;
                      setDetails((prev) => ({
                        ...prev,
                        source,
                        target:
                          source && source !== 'English'
                            ? 'English'
                            : prev.target === 'English'
                              ? ''
                              : prev.target,
                      }));
                    }}
                  />
                  <NativeSelect
                    label="Translate into"
                    required
                    value={details.target}
                    data={[
                      { value: '', label: 'Select a language' },
                      ...TRANSLATION_LANGUAGES.filter(
                        (language) =>
                          !details.source || translationPairAllowed(details.source, language),
                      ),
                    ]}
                    onChange={(event) => update('target', event.target.value)}
                  />
                </div>
                <NativeSelect
                  label="Document service"
                  value={details.service}
                  data={options.map(({ id, title }) => ({ value: id, label: title }))}
                  onChange={(event) => {
                    const value = event.target.value;
                    const count = options.find(({ id }) => id === value)?.documents || 1;
                    setDetails((prev) => ({
                      ...prev,
                      service: value,
                      document: '',
                      documents: count,
                      pages: count,
                    }));
                  }}
                />
                {selectedOption?.documentTypes?.length > 0 && (
                  <NativeSelect
                    label="Document"
                    required
                    value={details.document}
                    data={[
                      { value: '', label: 'Select a document' },
                      ...selectedOption.documentTypes,
                    ]}
                    onChange={(event) => update('document', event.target.value)}
                  />
                )}
                <div className={classes.twoColumns}>
                  <TextInput
                    type="number"
                    label="Number of documents"
                    min={1}
                    max={200}
                    step={1}
                    required
                    value={details.documents}
                    readOnly={selectedOption?.unit === 'package'}
                    description={
                      selectedOption?.unit === 'package'
                        ? `${selectedOption.documents} documents in this package.`
                        : undefined
                    }
                    onChange={(event) =>
                      update(
                        'documents',
                        event.target.value === '' ? '' : Number(event.target.value),
                      )
                    }
                  />
                  <TextInput
                    type="number"
                    label="Total pages"
                    min={1}
                    max={200}
                    step={1}
                    required
                    value={details.pages}
                    onChange={(event) =>
                      update('pages', event.target.value === '' ? '' : Number(event.target.value))
                    }
                  />
                </div>
                <p className={classes.small}>
                  {selectedOption?.note} We’ll confirm page counts and any additional-page charges
                  with your quote.
                </p>
                <fieldset className={classes.extras}>
                  <legend>Timing & extras</legend>
                  <Checkbox
                    label={`Request a 24-hour rush · ${config.prices.rush_percent == null ? 'quoted on request' : `+${config.prices.rush_percent}%`}`}
                    description="Applies to translation and extra-page charges. Subject to availability and document review."
                    checked={details.rush}
                    onChange={(event) => update('rush', event.target.checked)}
                  />
                  <Checkbox
                    label={`Notarized translation · ${price('notarization', ' per document')}`}
                    checked={details.notarized}
                    onChange={(event) => update('notarized', event.target.checked)}
                  />
                  <NativeSelect
                    label="Delivery"
                    value={details.delivery}
                    data={[
                      { value: 'digital', label: 'Digital delivery' },
                      {
                        value: 'mail_standard',
                        label: `Mailed hard copy · ${price('mail_standard')} (USPS with tracking)`,
                      },
                      {
                        value: 'mail_overnight',
                        label: `Overnight hard copy · ${price('mail_overnight')}`,
                      },
                    ]}
                    onChange={(event) => update('delivery', event.target.value)}
                  />
                </fieldset>
                <Button type="submit" radius="xl" rightSection={<ArrowIcon direction="right" />}>
                  Continue
                </Button>
              </>
            ) : (
              <>
                <div className={classes.twoColumns}>
                  {[
                    ['firstName', 'First name', 'given-name'],
                    ['lastName', 'Last name', 'family-name'],
                  ].map(([name, label, autoComplete]) => (
                    <TextInput
                      key={name}
                      label={label}
                      autoComplete={autoComplete}
                      required
                      maxLength={100}
                      value={contact[name]}
                      onChange={(event) =>
                        setContact((prev) => ({ ...prev, [name]: event.target.value }))
                      }
                    />
                  ))}
                </div>
                <TextInput
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={contact.email}
                  onChange={(event) =>
                    setContact((prev) => ({ ...prev, email: event.target.value }))
                  }
                />
                <TextInput
                  label="Phone number"
                  type="tel"
                  autoComplete="tel"
                  required
                  minLength={7}
                  maxLength={40}
                  description="Include your country or area code."
                  value={contact.phone}
                  onChange={(event) =>
                    setContact((prev) => ({ ...prev, phone: event.target.value }))
                  }
                />
                <div hidden aria-hidden="true">
                  <input
                    aria-label="Leave this field empty"
                    tabIndex={-1}
                    autoComplete="off"
                    value={contact.website}
                    onChange={(event) =>
                      setContact((prev) => ({ ...prev, website: event.target.value }))
                    }
                  />
                </div>
                {config.terms && <p className={classes.notice}>{config.terms}</p>}
                <Checkbox
                  required
                  checked={details.consent}
                  onChange={(event) => update('consent', event.target.checked)}
                  label={
                    <span>
                      I agree to the{' '}
                      <Link to="/privacy-policy" target="_blank" rel="noopener noreferrer">
                        privacy policy
                      </Link>{' '}
                      and{' '}
                      <Link to="/terms-of-service" target="_blank" rel="noopener noreferrer">
                        terms of service
                      </Link>
                      , and to being contacted about this request.
                    </span>
                  }
                />
                <div className={classes.actions}>
                  <Button variant="default" radius="xl" onClick={() => goStep(0)}>
                    Back
                  </Button>
                  <Button
                    type="submit"
                    loading={busy}
                    radius="xl"
                    rightSection={<ArrowIcon direction="right" />}
                  >
                    Request my free quote
                  </Button>
                </div>
              </>
            )}
          </fieldset>
        </form>
      </section>
      <aside className={classes.summary} aria-label="Your translation request">
        <p className={classes.eyebrow}>Your translation</p>
        <h2>{selectedOption?.title || 'Select a document service'}</h2>
        <p className={classes.languageSummary}>
          {details.source || 'Original language'} <ArrowIcon direction="right" />{' '}
          {details.target || 'Target language'}
        </p>
        <dl>
          {selectedOption?.documentTypes?.length > 0 && (
            <div>
              <dt>Document</dt>
              <dd>{details.document || 'Select a document'}</dd>
            </div>
          )}
          <div>
            <dt>Type</dt>
            <dd>{details.type === 'certified' ? 'Certified' : 'Standard'}</dd>
          </div>
          <div>
            <dt>Documents / pages</dt>
            <dd>
              {details.documents || '—'} / {details.pages || '—'}
            </dd>
          </div>
          <div>
            <dt>Turnaround</dt>
            <dd>
              {details.rush
                ? '24-hour rush requested'
                : config.turnaround || 'Confirmed with your quote'}
            </dd>
          </div>
        </dl>
        <div aria-live="polite" aria-atomic="true">
          {breakdown && (
            <dl className={classes.costBreakdown} aria-label="Estimate breakdown">
              {breakdown.items.map(({ id, label, amount }) => (
                <div key={id}>
                  <dt>{label}</dt>
                  <dd>{amount === null ? 'Quoted on request' : money(amount)}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className={classes.estimate} aria-label="Estimated total">
            <span>Estimated total</span>
            <strong>{estimate === null ? 'Custom quote' : money(estimate)}</strong>
          </div>
        </div>
        <p className={classes.small}>
          {estimate === null
            ? 'We’ll confirm the total, including your selected extras, with your quote.'
            : 'USD. Includes your selected extras. Rush applies to translation charges only.'}{' '}
          We’ll confirm the scope, final price and delivery before any payment. Longer documents can
          receive a per-word quote.
        </p>
        <div className={classes.summaryHelp}>
          <strong>Need a hand?</strong>
          <a href="mailto:info@longlifedigital.co">info@longlifedigital.co</a>
          <p className={classes.small}>
            For questions only. Please wait for secure upload instructions before sharing documents.
          </p>
        </div>
      </aside>
    </div>
  );
}
