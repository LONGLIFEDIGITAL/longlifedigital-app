import { Button } from '@mantine/core';
import { useNavigate } from 'react-router';

export default function ContentButton({ button, website, ...props }) {
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
      {button.label}
    </Button>
  );
}
