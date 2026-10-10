// Keep the browser and API on the same Stripe mode/key contract.
export function stripeKeyMatchesMode(key, testMode) {
  return (
    typeof testMode === 'boolean' &&
    typeof key === 'string' &&
    (testMode ? /^pk_test_[A-Za-z0-9]+$/ : /^pk_live_[A-Za-z0-9]+$/).test(key)
  );
}

function stableVersionInRange(version, minimum, maximum) {
  if (typeof version !== 'string') return false;
  const match = version.match(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
  if (!match || match[0] !== version) return false;
  const parts = match.slice(1).map(Number);
  if (!parts.every(Number.isSafeInteger)) return false;
  const compare = (bound) => {
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] !== bound[i]) return parts[i] - bound[i];
    }
    return 0;
  };
  return compare(minimum) >= 0 && compare(maximum) < 0;
}

export function checkoutConfigured(config) {
  // Accept stable patches in reviewed minor releases. Review new minors/majors
  // before widening these ranges; keep them aligned with checkout.php.
  return (
    config?.enabled === true &&
    stableVersionInRange(config.gatewayVersion, [11, 0, 0], [11, 1, 0]) &&
    stableVersionInRange(config.woocommerceVersion, [11, 1, 2], [11, 3, 0]) &&
    stripeKeyMatchesMode(config.publishableKey, config.testMode)
  );
}
