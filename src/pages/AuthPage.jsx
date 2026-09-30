import { useEffect, useState } from 'react';
import { Alert, Button, Checkbox, Container, PasswordInput, Stack, TextInput } from '@mantine/core';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import PageMetadata from '../components/PageMetadata';
import ArrowIcon from '../components/ArrowIcon';
import classes from './AccountPage.module.css';

const copy = {
  login: {
    eyebrow: 'Your digital home',
    title: 'Welcome back.',
    intro: 'Log in to your Longlife Digital account and pick up where you left off.',
    button: 'Log in',
  },
  register: {
    eyebrow: 'Make yourself at home',
    title: 'Your next chapter starts here.',
    intro:
      'Create an account to keep your future purchases together. We’ll email you a link to choose your password.',
    button: 'Create account',
  },
  'forgot-password': {
    eyebrow: 'A fresh start',
    title: 'Forgot your password?',
    intro: 'Enter your email and we’ll send you a link to choose a new password.',
    button: 'Send reset link',
  },
  'reset-password': {
    eyebrow: 'Make it yours',
    title: 'Set your password.',
    intro: 'Choose a strong password with at least 12 characters for your account.',
    button: 'Save password',
  },
};
export default function AuthPage({ mode, auth }) {
  const location = useLocation();
  const navigate = useNavigate();
  const next =
    new URLSearchParams(location.search).get('next') === '/checkout' ? '/checkout' : '/account';
  const [credentials, setCredentials] = useState(() => ({
    ...Object.fromEntries(new URLSearchParams(location.hash.slice(1))),
    hash: location.hash,
  }));
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const details = copy[mode];
  const reset = mode === 'reset-password';
  // A second email link can change only the fragment without remounting this page.
  // Keep its credentials after stripping the URL, but reset the form for a new link.
  if (reset && location.hash !== credentials.hash) {
    setCredentials(
      location.hash
        ? {
            ...Object.fromEntries(new URLSearchParams(location.hash.slice(1))),
            hash: location.hash,
          }
        : { ...credentials, hash: '' },
    );
    if (location.hash) {
      setPassword('');
      setConfirmation('');
      setError('');
      setSuccess('');
    }
  }
  useEffect(() => {
    if (reset && location.hash) navigate(location.pathname + location.search, { replace: true });
  }, [reset, location.hash, location.pathname, location.search, navigate]);
  if (auth.user && ['login', 'register'].includes(mode)) return <Navigate to={next} replace />;
  async function submit(event) {
    event.preventDefault();
    if (auth.busy) return;
    setError('');
    setSuccess('');
    if (reset && password !== confirmation) {
      setError('The passwords don’t match. Please try again.');
      return;
    }
    try {
      const action = reset ? 'reset' : mode === 'forgot-password' ? 'forgot' : mode;
      const data = await auth.submit(action, {
        email,
        name,
        password,
        key: credentials.key,
        login: credentials.login,
      });
      setPassword('');
      setConfirmation('');
      if (mode === 'login') navigate(next, { replace: true });
      else setSuccess(reset ? 'Your password is saved. You can now log in.' : data.message);
    } catch (err) {
      setError(
        err.name === 'TimeoutError' || (reset && err.name === 'NetworkError')
          ? reset
            ? 'We could not confirm the password change. Try logging in with your new password. If it does not work, request a new password link.'
            : 'This took too long. Please try again.'
          : err.message || 'Unable to complete your request. Please try again.',
      );
    }
  }
  const missingLink = reset && (!credentials.key || !credentials.login);
  return (
    <div className={classes.authPage}>
      <PageMetadata title={details.button} content={{ seo: { noindex: true } }} />
      <Container className={classes.authGrid}>
        <div className={classes.story}>
          <p className={classes.eyebrow}>{details.eyebrow}</p>
          <h1>{details.title}</h1>
          <p>{details.intro}</p>
          <div className={classes.art} aria-hidden="true">
            <span>✦</span>
            <div>
              Ideas.
              <br />
              Possibilities.
              <br />
              <em>Your next chapter.</em>
            </div>
          </div>
        </div>
        <section className={classes.formCard} aria-label={details.button}>
          <h2>{details.button}</h2>
          {success ? (
            <Stack>
              <Alert color="green" role="status">
                {success}
              </Alert>
              <Button component={Link} to={`/login?next=${encodeURIComponent(next)}`}>
                Back to login
              </Button>
              {!reset && (
                <Link to="/forgot-password">No email yet? Request a new password link</Link>
              )}
            </Stack>
          ) : missingLink ? (
            <Stack>
              <Alert color="yellow">
                This link is missing or incomplete. Request a new password email.
              </Alert>
              <Button component={Link} to="/forgot-password">
                Request a new link
              </Button>
            </Stack>
          ) : (
            <form onSubmit={submit}>
              <Stack gap="md">
                {error && (
                  <Alert color="red" role="alert">
                    {error}
                    {reset && (
                      <div>
                        <Link to="/forgot-password">Request a new link</Link>
                      </div>
                    )}
                  </Alert>
                )}
                {mode === 'register' && (
                  <TextInput
                    label="Your name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.currentTarget.value)}
                    maxLength={100}
                    required
                  />
                )}
                {!reset && (
                  <TextInput
                    label="Email address"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.currentTarget.value)}
                    maxLength={254}
                    required
                  />
                )}
                {(mode === 'login' || reset) && (
                  <PasswordInput
                    label={reset ? 'New password' : 'Password'}
                    autoComplete={reset ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.currentTarget.value)}
                    minLength={reset ? 12 : 1}
                    maxLength={128}
                    required
                  />
                )}
                {reset && (
                  <PasswordInput
                    label="Confirm password"
                    autoComplete="new-password"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.currentTarget.value)}
                    minLength={12}
                    maxLength={128}
                    required
                  />
                )}
                {mode === 'login' && (
                  <Link className={classes.link} to="/forgot-password">
                    Forgot your password?
                  </Link>
                )}
                {mode === 'register' && (
                  <Checkbox
                    required
                    checked={consent}
                    onChange={(e) => setConsent(e.currentTarget.checked)}
                    label={
                      <>
                        I agree to the{' '}
                        <Link to="/terms-of-service" target="_blank" rel="noopener noreferrer">
                          Terms of Service
                        </Link>{' '}
                        and acknowledge the{' '}
                        <Link to="/privacy-policy" target="_blank" rel="noopener noreferrer">
                          Privacy Policy
                        </Link>
                        .
                      </>
                    }
                  />
                )}
                <Button type="submit" loading={auth.busy} radius="xl" rightSection={<ArrowIcon />}>
                  {details.button}
                </Button>
              </Stack>
            </form>
          )}
          {!success && (
            <p className={classes.formNote}>
              {mode === 'login' ? (
                <>
                  New here?{' '}
                  <Link to={`/register?next=${encodeURIComponent(next)}`}>Create an account</Link>
                </>
              ) : (
                <Link to={`/login?next=${encodeURIComponent(next)}`}>
                  Already have an account? Log in
                </Link>
              )}
            </p>
          )}
          <Link className={classes.backLink} to={next === '/checkout' ? '/checkout' : '/products'}>
            {next === '/checkout' ? 'Continue as a guest' : 'Keep exploring the store'}
          </Link>
        </section>
      </Container>
    </div>
  );
}
