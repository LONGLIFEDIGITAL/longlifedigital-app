import { Alert, Button, Text, Title } from '@mantine/core';
import { useNavigate } from 'react-router';
import useHomeHero from '../hooks/useHomeHero';
import HomeHeroSkeleton from './skeletons/HomeHeroSkeleton';
import classes from './HomeHeroContent.module.css';

function HeroButton({ button, secondary, website }) {
  const navigate = useNavigate();
  if (!button.label || !button.destination) return null;
  let destination = button.destination;
  if (website && destination.startsWith('https://')) {
    const url = new URL(destination);
    if (url.origin === new URL(website).origin) destination = url.pathname + url.search + url.hash;
  }
  const internal = destination.startsWith('/');
  return (
    <Button
      className={`btn-h ${classes.button} ${secondary ? classes.secondary : ''}`}
      {...(internal
        ? {
            type: 'button',
            onClick: () => {
              if (destination !== location.pathname + location.search + location.hash)
                navigate(destination, { flushSync: true });
            },
          }
        : { component: 'a', href: destination })}
      variant={secondary ? 'transparent' : 'gradient'}
      gradient={{ from: '#C9963F', to: '#E8C97A', deg: 135 }}
    >
      {button.label}
    </Button>
  );
}

export default function HomeHeroContent({ website }) {
  const { hero, status, retry } = useHomeHero();
  if (status === 'loading') return <HomeHeroSkeleton />;
  if (status === 'error' || status === 'empty') {
    return (
      <Alert color="yellow" title="Homepage introduction is unavailable" role="alert">
        You can still explore the products below.
        <Button variant="light" mt="sm" onClick={() => retry()}>
          Retry homepage content
        </Button>
      </Alert>
    );
  }
  const segments = [hero.prefix, hero.highlight, hero.suffix];
  return (
    <div className={classes.content}>
      {hero.eyebrow && (
        <Text component="p" className={classes.badge}>
          <span aria-hidden="true">✦ </span>
          {hero.eyebrow}
        </Text>
      )}
      <Title order={1} className={classes.heading}>
        {segments.some(Boolean)
          ? segments.map((segment, index) =>
              segment ? (
                <span key={index} className={index === 1 ? classes.highlight : classes.line}>
                  {segment}{' '}
                </span>
              ) : null,
            )
          : hero.heading}
      </Title>
      {hero.intro && (
        <Text component="p" className={classes.intro}>
          {hero.intro}
        </Text>
      )}
      <div className={classes.actions}>
        <HeroButton button={hero.primaryCta} website={website} />
        <HeroButton button={hero.secondaryCta} website={website} secondary />
      </div>
    </div>
  );
}
