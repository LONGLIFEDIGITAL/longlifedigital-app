import { Link } from 'react-router';
export default function ContentLink({ item, website, children, ...props }) {
  let href = item.destination;
  if (website && href?.startsWith('https://')) {
    const url = new URL(href);
    if (url.origin === new URL(website).origin) href = url.pathname + url.search + url.hash;
  }
  const external = href && !href.startsWith('/');
  const target = item.newTab ? '_blank' : undefined;
  return external ? (
    <a {...props} href={href} target={target} rel={target ? 'noopener noreferrer' : undefined}>
      {children || item.title}
    </a>
  ) : (
    <Link
      {...props}
      to={href || '/'}
      target={target}
      rel={target ? 'noopener noreferrer' : undefined}
    >
      {children || item.title}
    </Link>
  );
}
