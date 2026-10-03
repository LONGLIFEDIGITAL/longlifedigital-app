const paths = {
  home: 'm3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9',
  products: 'M5 3h14v18H5zM9 7h6M9 11h6M9 15h4',
  services:
    'm12 3 2 3 4-.2.2 4 2.8 2.2-2.8 2.2-.2 4-4-.2-2 3-2-3-4 .2-.2-4L3 12l2.8-2.2.2-4 4 .2 2-3M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  domains: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18',
  orders: 'M5 7h14l2 14H3L5 7M8 8V6a4 4 0 0 1 8 0v2',
  downloads: 'M12 3v12m-5-5 5 5 5-5M4 15v6h16v-6',
  account: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 21v-2a8 8 0 0 1 16 0v2',
  logout: 'M9 3H4v18h5M10 12h11m-4-4 4 4-4 4',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  box: 'm12 3 9 5-9 5-9-5 9-5M3 8v9l9 5 9-5V8M12 13v9',
  help: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M9 9a3 3 0 1 1 5 2c-1 1-2 1-2 3m0 3h.01',
};
export default function DashboardIcon({ name, ...props }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d={paths[name] || paths.box} />
    </svg>
  );
}
