// Keep the browser and API on the same Stripe mode/key contract.
export function stripeKeyMatchesMode(key, testMode) {
  return (
    typeof testMode === 'boolean' &&
    typeof key === 'string' &&
    (testMode ? /^pk_test_[A-Za-z0-9]+$/ : /^pk_live_[A-Za-z0-9]+$/).test(key)
  );
}

export function checkoutConfigured(config) {
  // WordPress checks the actual gateway/Woo APIs and payment configuration.
  // Plugin release numbers are diagnostic metadata, not an availability switch.
  return config?.enabled === true && stripeKeyMatchesMode(config.publishableKey, config.testMode);
}
