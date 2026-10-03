# Local server restart failure

## Diagnosed October 2, 2026: missing local modules and slow builds

`ERR_EMPTY_RESPONSE` followed by `ERR_CONNECTION_REFUSED` on port 5173 means
the browser lost the local development server, including its JavaScript/CSS
requests. It is different from an HTTP 502 returned by the CMS proxy. The original
Vite process was no longer present during investigation; its exit reason was not
captured. The terminal also showed a full-page reload caused by a generated HTML
file under `docs/cms`. A monitored replacement then reproduced repeated restart
events for dozens of unchanged configuration dependencies and environment files.

The project lives under iCloud Drive. `ls -lO` reported `dataless` on the Vite
configuration, source files, lockfile, CMS snapshots, optimized dependency metadata,
and Mantine CSS. Cloud-only files can stall local reads until downloaded. Keep the
project folder downloaded in Finder (right-click → **Keep Downloaded**), or use a
working checkout outside iCloud Drive. Do not delete the existing checkout before
preserving its uncommitted changes and local environment files.

Code changes:

- Ignore documentation, WordPress plugin exports, and browser reports in Vite's
  watcher, so generated HTML does not reload the storefront.
- When the working directory is inside macOS iCloud Drive, poll timestamps every
  750ms instead of using filesystem notifications. This avoids metadata-only
  notifications triggering restarts. Polling adds some local CPU work and can
  delay detection of edits by up to the polling interval; other workspaces keep
  Vite's default watcher. The development dependency cache is also kept under
  the OS temporary directory, scoped to this checkout, outside iCloud Drive.
- Local startup never waits for WordPress. Give a saved CMS snapshot up to 150ms
  to load, then finish restoring it in the background. Normal browser requests
  fetch current public content and save it for subsequent starts.
- Share the published page listing between page projections: once per build and
  for five seconds at runtime. Failed requests are never cached. Fetch homepage
  and blog index concurrently within the existing upstream rate-limit queue.
- Production builds still fetch published CMS content and retain their existing
  required-content validation. `cssCodeSplit: false` is unchanged.

The `PLUGIN_TIMINGS` line is a performance warning, not a build failure. Measured
healthy local responses were about 30ms for HTML, 1ms for a warm JS module, and
1.3s for catalog data. These are point-in-time local measurements, not a production
latency guarantee. A successful verification build still took 3m 48s while files
were offloaded; the filesystem issue needs the Finder step above.

After initial dependency optimization, a Chrome check reached the interactive
homepage in 1.3s with no failed requests or JavaScript errors. Twelve repeated
HTML/module reads succeeded, and creating a temporary documentation HTML file
caused no full-page reload. The startup/content regression suite passed 13 tests.
The monitored server showed no further restart storm with the polling watcher.

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
