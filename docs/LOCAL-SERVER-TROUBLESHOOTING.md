# Local server restart failure

## Diagnosed September 30, 2026: recurring API 502 responses

The running `vite --host` process stayed alive on port 5173 and returned HTTP 200
for HTML and JavaScript. The repeat failure was upstream: direct WordPress reads
returned HTTP 429, and the content handler reported the exhausted request as 502.
One probe captured `CMS returned HTTP 429 for posts`; subsequent reads recovered.
This is separate from the September 29 listener race below.

The repair adds a shared public-read queue per WordPress origin: at most two
in-flight fetches, at least 200ms between starts, and a shared cooldown when any
read receives 429. Retry-After is respected with a minimum 1.5-second pause and
only one retry, all within the original deadline. Aborted queued reads are removed.
Content and catalog handlers share successful requests for five seconds in memory,
including local/preview requests; browser preview responses remain `no-store`.
Navigation reuses the current 15-second query instead of refetching every mount.
The local catalog now uses the same handler as deployment instead of an unpaced
direct proxy. Public API deadlines are 12 seconds and browser deadlines 15 seconds.
Account, inquiry and payment writes are not part of this queue or retry mechanism.

Existing content remains visible when a later refresh fails. Persistent CMS
throttling or downtime still returns an error; this is not a guarantee of WordPress
availability. The queue is process-local, so it does not impose a site-wide limit
across multiple Vercel instances. Investigate WordPress hosting/rate limits if
errors continue under normal production traffic.

Focused regression coverage: `node --test tests/wordpress-request.test.mjs
tests/content-bootstrap.test.mjs`. The existing lifecycle test covers restarts.

## Diagnosed September 29, 2026

The affected process was `vite --host` (the development server), not a production
preview. One Node process had HTTP listeners on both ports 5173 and 5174. Port
5173 returned the homepage HTML but responded with **504 Outdated Request** for
`/src/main.jsx`, `/@vite/client`, and `/@react-refresh`. Port 5174 served working
JavaScript. The old browser address therefore appeared broken even though Node
had not exited.

A controlled reproduction with Vite 8.0.13 confirmed that restarting during an
asynchronous `buildStart` hook can leave the original pending HTTP listener
alive. The CMS preload prolonged this startup window. A normal restart after
startup does not require that race.

## Repair

- `server/devServerLifecycle.js` queues restarts until the initial HTTP listener
  is ready, so Vite can close it before starting its replacement.
- `vite.config.js` pins the development server to port 5173 with `strictPort`.
  If another process owns the port, startup fails clearly instead of choosing a
  different port behind the browser's back.
- `server/contentBootstrap.js` reuses a valid saved snapshot from the same CMS
  during local startup. Normal browser content refreshes still fetch updates.
  Production builds continue fetching current published content.

Regression coverage in `tests/dev-server-lifecycle.test.mjs` exercises a restart
during deliberately delayed startup, verifies the old listener closes, and checks
HTML and JavaScript responses across subsequent restarts. The bootstrap tests
verify warm development startup and fresh production reads separately.

## Running locally

Use `npm run dev -- --host` for development, including access from another device
on the local network. Use `npm run build` followed by `npm run preview -- --host`
to inspect the built frontend. Preview is a different server and does not provide
the development-only API middleware.

If port 5173 is already in use, stop the earlier project server with Ctrl+C in its
terminal before starting another copy. Restarting the process once is necessary
to clear stale listeners left behind before this fix.
