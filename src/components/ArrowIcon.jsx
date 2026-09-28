export default function ArrowIcon({ direction = 'up-right' }) {
  return (
    <svg
      width="1.15em"
      height="1.15em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <path d={direction === 'right' ? 'M4 12h16m-6-6 6 6-6 6' : 'M5 19 19 5M9 5h10v10'} />
    </svg>
  );
}
