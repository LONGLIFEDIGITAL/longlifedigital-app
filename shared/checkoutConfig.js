// Keep the browser and API on the same Stripe mode/key contract.
export function stripeKeyMatchesMode(key, testMode) {
  return (
    typeof testMode === 'boolean' &&
    typeof key === 'string' &&
    (testMode ? /^pk_test_[A-Za-z0-9]+$/ : /^pk_live_[A-Za-z0-9]+$/).test(key)
  );
}

export function checkoutConfigured(config) {
  return (
    config?.enabled === true &&
    ['11.0.0', '11.0.1'].includes(config.gatewayVersion) &&
    ['11.1.2', '11.2.0'].includes(config.woocommerceVersion) &&
    stripeKeyMatchesMode(config.publishableKey, config.testMode)
  );
}
