import { commerce } from './checkout';

let preparation;
const scripts = new Map();
const usedSessions = new Set();

function deadline(promise, milliseconds) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('timeout')), milliseconds);
    }),
  ]).finally(() => clearTimeout(timer));
}

function loadScript(url) {
  if (scripts.has(url)) return scripts.get(url);
  const promise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => {
      script.remove();
      scripts.delete(url);
      reject(new Error('sdk_unavailable'));
    };
    document.head.append(script);
  });
  scripts.set(url, promise);
  return promise;
}

export function prepareCheckoutFraud() {
  if (!preparation) {
    preparation = (async () => {
      const bootstrap = await commerce('fraud-config');
      if (bootstrap.enabled === false) return null;
      if (bootstrap.enabled !== true || !Array.isArray(bootstrap.scripts) || !bootstrap.config)
        throw new Error('sdk_unavailable');
      // These URLs and the public configuration come from the installed Woo
      // loader and are restricted by our server. No inline JS is evaluated.
      window.wcFraudProtection = { config: bootstrap.config };
      for (const url of bootstrap.scripts) await deadline(loadScript(url), 5000);
      if (typeof window.wcFraudProtection?.acquireSessionId !== 'function')
        throw new Error('sdk_unavailable');
      return window.wcFraudProtection;
    })().catch(() => {
      preparation = undefined; // A later attempt can recover from a transient load failure.
      return undefined;
    });
  }
  return preparation;
}

export async function acquireCheckoutFraud() {
  try {
    return await deadline(
      (async () => {
        const fraud = await prepareCheckoutFraud();
        if (fraud === null) return undefined; // Woo Fraud Protection is not installed.
        if (!fraud) return { sessionId: '', error: 'sdk_unavailable' };
        // Collect immediately before submitting, not when the checkout page opens.
        const sessionId = await fraud.acquireSessionId();
        if (typeof sessionId !== 'string' || !sessionId || usedSessions.has(sessionId))
          return { sessionId: '', error: 'sdk_error' };
        usedSessions.add(sessionId);
        return { sessionId };
      })(),
      6000,
    );
  } catch (error) {
    // Missing browser signals are reported truthfully. Woo still verifies and
    // decides; an SDK/content-blocker problem never invents an allow verdict.
    return { sessionId: '', error: error.message === 'timeout' ? 'timeout' : 'sdk_error' };
  }
}

export function resetCheckoutFraud() {
  try {
    window.wcFraudProtection?.reset?.();
  } catch {
    /* The next attempt can still report unavailable browser signals. */
  }
}
