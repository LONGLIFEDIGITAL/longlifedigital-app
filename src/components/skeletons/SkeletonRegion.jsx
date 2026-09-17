import { VisuallyHidden } from '@mantine/core';

export default function SkeletonRegion({ label, className, children }) {
  return (
    <div role="status" aria-label={label} aria-busy="true" className={className}>
      <VisuallyHidden>{label}</VisuallyHidden>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}
