const paths = {
  search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0M6 12l3-3 3 2 3-5',
  web: 'M3 7h18M6 4h.01M9 4h.01M9 11l-3 3 3 3m6-6 3 3-3 3M13 10l-2 8M3 1h18v21H3z',
  automation: 'M12 3v5m-7 5v5m14-5v5M5 13v-3h14v3M9 2h6v6H9zM2 18h6v5H2zM16 18h6v5h-6z',
  advertising: 'M3 10v7h5l12 4V6L8 10H3zM8 17l2 6H6l-2-6M23 9v9M8 10v7M15 2l2-2',
  launch: 'M4 21V8h16v13M2 21h20M8 21v-5h8v5M8 11h.01M12 11h.01M16 11h.01M8 8V3h8v5',
};
export default function ServiceMark({ kind = 'web' }) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 26 26"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[kind] || paths.web} />
    </svg>
  );
}
