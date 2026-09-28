import { Button } from '@mantine/core';
import { useNavigate } from 'react-router';
import ArrowIcon from './ArrowIcon';

export default function ContentButton({ button, website, arrow, ...props }) {
  const navigate = useNavigate();
  if (!button?.label || !button?.destination) return null;
  let destination = button.destination;
  if (website && destination.startsWith('https://')) {
    const url = new URL(destination);
    if (url.origin === new URL(website).origin) destination = url.pathname + url.search + url.hash;
  }
  return (
    <Button
      className="btn-h"
      color="brand"
      px="lg"
      rightSection={arrow ? <ArrowIcon direction={arrow} /> : undefined}
      {...props}
      {...(destination.startsWith('/')
        ? {
            type: 'button',
            onClick: () => {
              if (destination !== location.pathname + location.search + location.hash)
                navigate(destination, { flushSync: true });
            },
          }
        : { component: 'a', href: destination })}
    >
      {/* Replace legacy CMS arrow suffixes when an SVG arrow is requested. */}
      {arrow ? button.label.replace(/\s*[↗→][\uFE0E\uFE0F]?\s*$/u, '') : button.label}
    </Button>
  );
}
