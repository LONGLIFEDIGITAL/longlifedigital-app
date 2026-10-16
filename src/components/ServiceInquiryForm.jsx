import useServiceInquiry from '../hooks/useServiceInquiry';
import { Alert, Button, Textarea, TextInput } from '@mantine/core';
import { Link } from 'react-router';
import ArrowIcon from './ArrowIcon';
import classes from '../pages/ServicesPage.module.css';

export default function ServiceInquiryForm({ service }) {
  const { busy, error, sent, notice, submit: sendInquiry } = useServiceInquiry();
  function submit(event) {
    event.preventDefault();
    sendInquiry({
      ...Object.fromEntries(new FormData(event.currentTarget)),
      serviceId: service.id,
    });
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
