import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Textarea, TextInput } from '@mantine/core';
import { Link } from 'react-router';
import ArrowIcon from './ArrowIcon';
import classes from '../pages/ServicesPage.module.css';

function inquiryId() {
  // getRandomValues also works when previewing over a local HTTP LAN address.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export default function ServiceInquiryForm({ service }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const active = useRef(null);
  const attempt = useRef(null);
  const notice = useRef(null);
  useEffect(() => () => active.current?.abort(), []);
  async function submit(event) {
    event.preventDefault();
    if (active.current) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const payload = { ...values, serviceId: service.id };
    const fingerprint = JSON.stringify(payload);
    if (attempt.current?.fingerprint !== fingerprint)
      attempt.current = { fingerprint, id: inquiryId() };
    const controller = new AbortController();
    active.current = controller;
    const timer = setTimeout(
      () => controller.abort(new DOMException('Timed out', 'TimeoutError')),
      25000,
    );
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-LLD-Commerce': '1' },
        signal: controller.signal,
        body: JSON.stringify({ ...payload, requestId: attempt.current.id }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.ok !== true)
        throw new Error(
          data?.error ||
            'We couldn’t send your inquiry. Please try again or email info@longlifedigital.co.',
        );
      setSent(true);
    } catch (failure) {
      if (controller.signal.aborted && controller.signal.reason?.name !== 'TimeoutError') return;
      setError(
        controller.signal.aborted
          ? 'We couldn’t confirm your inquiry. Please try again or email info@longlifedigital.co.'
          : failure instanceof TypeError
            ? 'We couldn’t connect. Check your connection and try again.'
            : failure.message,
      );
    } finally {
      clearTimeout(timer);
      active.current = null;
      setBusy(false);
      requestAnimationFrame(() => notice.current?.focus());
    }
  }
  return (
    <section className={classes.inquiry} id="service-inquiry" aria-labelledby="inquiry-heading">
      <p className={classes.eyebrow}>Let’s make it happen</p>
      <h2 id="inquiry-heading">{service.inquiryTitle || 'Tell us about your next step.'}</h2>
      <p className={classes.formIntro}>
        {service.inquiryIntro ||
          'Share a few details and we’ll get back to you to discuss your project and a tailored quote.'}
      </p>
      <p className={classes.servicePill}>{service.title}</p>
      {sent ? (
        <Alert
          color="green"
          role="status"
          tabIndex={-1}
          ref={notice}
          title="Thank you for reaching out."
        >
          Your inquiry has been sent. We’ll get back to you using the contact details you provided.
        </Alert>
      ) : (
        <form onSubmit={submit}>
          {error && (
            <Alert color="red" role="alert" ref={notice} tabIndex={-1} mb="md">
              {error}
            </Alert>
          )}
          <fieldset disabled={busy} className={classes.formFields}>
            <div className={classes.nameFields}>
              <TextInput
                label="First name"
                name="firstName"
                autoComplete="given-name"
                required
                maxLength={100}
              />
              <TextInput
                label="Last name"
                name="lastName"
                autoComplete="family-name"
                required
                maxLength={100}
              />
            </div>
            <TextInput
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
            />
            <TextInput
              label="Business name (optional)"
              name="businessName"
              autoComplete="organization"
              maxLength={160}
            />
            <TextInput
              label="Telephone number"
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              minLength={7}
              maxLength={40}
              description="Include your country or area code."
            />
            <Textarea
              label="What do you have in mind? (optional)"
              name="message"
              minRows={3}
              maxLength={3000}
              autosize
            />
            <div hidden aria-hidden="true">
              <input
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-label="Leave this field empty"
              />
            </div>
            <p className={classes.privacyNote}>
              We’ll use these details to respond to your inquiry.{' '}
              <Link to="/privacy-policy">Privacy policy</Link>
            </p>
            <Button type="submit" radius="xl" loading={busy} fullWidth rightSection={<ArrowIcon />}>
              Send inquiry
            </Button>
          </fieldset>
        </form>
      )}
      <a className={classes.emailLink} href="mailto:info@longlifedigital.co">
        Prefer email? info@longlifedigital.co
      </a>
    </section>
  );
}
