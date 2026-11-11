<?php
require __DIR__ . '/commerce-bridge.php';

check(lld_fraud_bootstrap() === array('enabled' => false), 'stores without Woo Fraud Protection need no SDK');
class FraudScriptLoader {
    function request_scripts() { return $GLOBALS['fraud_loader_available']; }
}
class_alias('FraudScriptLoader', 'Automattic\\WooCommerce\\FraudProtection\\BlackboxScriptHandler');
function wc_get_container() { return new class {
    function get($class) { return new $class(); }
}; }
function wp_scripts() { return $GLOBALS['fraud_scripts']; }
function add_query_arg($key, $value, $url) { return $url . '?' . urlencode($key) . '=' . urlencode($value); }
$fraud_loader_available = true;
$fraud_scripts = new class {
    public $registered; public $base_url = 'https://wp.test'; public $data;
    function get_data($handle, $key) { return $this->data; }
};
$fraud_scripts->registered = array(
    'wc-fraud-protection-blackbox' => (object) array('src' => 'https://blackbox-api.wp.com/v1/dist/v.js', 'ver' => null),
    'wc-fraud-protection-blackbox-init' => (object) array('src' => '/wp-content/plugins/fraud/assets/js/blackbox-init.js', 'ver' => '0.1.9'),
);
$fraud_scripts->data = 'var wcFraudProtection = ' . json_encode(array('config' => array('apiKey' => 'woo:123', 'identityCookie' => array('name' => 'wfp_id', 'domain' => 'wp.test', 'path' => '/wordpress/'), 'timeout' => 3000, 'futureNativeSetting' => true))) . ';';
$bootstrap = lld_fraud_bootstrap();
check($bootstrap['enabled'] && $bootstrap['scripts'][1] === 'https://wp.test/wp-content/plugins/fraud/assets/js/blackbox-init.js?ver=0.1.9', 'installed native script URL and version come from the public loader');
check($bootstrap['config']['identityCookie'] === array('name' => 'wfp_id', 'domain' => '', 'path' => '/'), 'identity cookie belongs to the React storefront origin');
check($bootstrap['config']['futureNativeSetting'], 'native configuration additions are preserved without a version allowlist');

// Keep these configuration-failure alerts in memory; never send email in tests.
function get_transient($key) { return true; }
$fraud_scripts->data .= ' malicious();';
check(lld_fraud_bootstrap() instanceof WP_Error, 'non-JSON bootstrap code is rejected without executing it');
$fraud_loader_available = false;
check(lld_fraud_bootstrap() instanceof WP_Error, 'installed loader failure is observable and cannot silently disable fraud checks');

$shopper = array('ip' => '203.0.113.10', 'userAgent' => 'Test browser', 'identity' => str_repeat('c', 32));
$body = json_encode(array('_lld_shopper' => $shopper, 'extensions' => array('woocommerce/fraud-protection' => array('blackbox_session_id' => 'sdk-session'))));
$_SERVER['REMOTE_ADDR'] = '192.0.2.1';
$_SERVER['HTTP_USER_AGENT'] = 'server-fetch';
$_COOKIE['wfp_id'] = str_repeat('d', 32);
unset($GLOBALS['lld_checkout_context']);
$bad = new Request('/wc/store/v1/checkout', $body, str_repeat('e', 64));
$bad->headers['x-lld-signature'] = str_repeat('0', 64);
check($pre(null, null, $bad) instanceof WP_Error && $_SERVER['REMOTE_ADDR'] === '192.0.2.1' && $_COOKIE['wfp_id'] === str_repeat('d', 32), 'forged bridge body cannot change shopper context');
$unsigned = new Request('/wc/store/v1/checkout', $body, str_repeat('e', 64));
unset($unsigned->headers['x-lld-signature']);
check($pre(null, null, $unsigned) === null && $_SERVER['REMOTE_ADDR'] === '192.0.2.1', 'ordinary checkout does not trust headless shopper fields');
$signed = new Request('/wc/store/v1/checkout', $body, str_repeat('e', 64));
check($pre(null, null, $signed) === null && $_SERVER['REMOTE_ADDR'] === $shopper['ip'], 'valid signed checkout supplies the actual shopper IP to the native fraud resolver');
check($_SERVER['HTTP_USER_AGENT'] === $shopper['userAgent'] && $_COOKIE['wfp_id'] === $shopper['identity'], 'browser agent and SDK identity reach native fraud verification together');
check($signed->get_param('extensions')['woocommerce/fraud-protection']['blackbox_session_id'] === 'sdk-session', 'native Store API extension survives bridge dispatch');
$fraud_block = new WP_REST_Response(array('code' => 'woocommerce_rest_checkout_error'), 403);
$returned = $post($fraud_block, null, $signed);
check($returned->get_status() === 403, 'native fraud block is preserved even with valid shopper context');
check($_SERVER['REMOTE_ADDR'] === '192.0.2.1' && $_SERVER['HTTP_USER_AGENT'] === 'server-fetch' && $_COOKIE['wfp_id'] === str_repeat('d', 32), 'shopper overrides are restored after checkout');
check(!isset($_SERVER['HTTP_X_REAL_IP']) && !isset($_SERVER['HTTP_X_FORWARDED_FOR']), 'temporary forwarded headers cannot leak to another REST operation');
$invalid_context = new Request('/wc/store/v1/checkout', json_encode(array('_lld_shopper' => array('ip' => 'invalid', 'userAgent' => "bad\r\nheader", 'identity' => 'invalid'))), str_repeat('f', 64));
check($pre(null, null, $invalid_context) === null && $_SERVER['REMOTE_ADDR'] === '192.0.2.1' && $_SERVER['HTTP_USER_AGENT'] === 'server-fetch', 'malformed context is not installed even in an authenticated request');
$post(new WP_REST_Response(array('code' => 'woocommerce_rest_checkout_error'), 403), null, $invalid_context);
echo "Passed $count bridge and fraud integration checks.\n";
