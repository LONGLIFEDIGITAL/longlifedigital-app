<?php
define('ABSPATH', __DIR__);
define('HOUR_IN_SECONDS', 3600);
define('MINUTE_IN_SECONDS', 60);
define('WC_VERSION', '11.3.0-rc.2');
define('WC_STRIPE_VERSION', '11.1.1');
$hooks = $options = $transients = $mail = array();
$mail_ok = true;
$config = array('enabled' => true, 'configurationIssues' => array());
function add_action($name, $callback, ...$args) { $GLOBALS['hooks'][$name] = $callback; }
function get_option($name, $default = false) { return $GLOBALS['options'][$name] ?? $default; }
function add_option($name, $value, ...$args) { if (isset($GLOBALS['options'][$name])) return false; $GLOBALS['options'][$name] = $value; return true; }
function delete_option($name) { unset($GLOBALS['options'][$name]); }
function get_transient($name) { return $GLOBALS['transients'][$name][0] ?? false; }
function set_transient($name, $value, $ttl) { $GLOBALS['transients'][$name] = array($value, $ttl); }
function wp_mail(...$args) { $GLOBALS['mail'][] = $args; if ($GLOBALS['mail_ok'] === 'throw') throw new Exception('private mail credentials'); return $GLOBALS['mail_ok']; }
function home_url($path) { return 'https://wp.example.test' . $path; }
function rest_url($path) { return home_url('/wp-json/' . $path); }
function wp_parse_url($url) { return parse_url($url); }
class WP_Error {}
function is_wp_error($v) { return $v instanceof WP_Error; }
function wp_remote_retrieve_response_code($v) { return $v['response']['code']; }
function lld_configuration() { if ($GLOBALS['config'] === 'throw') throw new Exception('private gateway credentials'); return $GLOBALS['config']; }
function lld_error($message) { return new WP_Error; }
function lld_response($data, $status = 200) { return array('data' => $data, 'status' => $status); }
function wp_next_scheduled($name) { return $GLOBALS['scheduled'][$name] ?? false; }
function wp_schedule_event($time, $interval, $name) { $GLOBALS['scheduled'][$name] = $interval; }
function current_user_can($capability) { return $GLOBALS['admin_allowed'] ?? true; }
function esc_html($value) { return htmlspecialchars($value, ENT_QUOTES); }
class Request { function __construct(public $params) {} function get_param($name) { return $this->params[$name] ?? null; } }
require __DIR__ . '/../wordpress/longlife-headless-commerce/alerts.php';
$count = 0;
function check($ok, $label) { if (!$ok) throw new Exception('FAIL: ' . $label); echo 'ok ' . ++$GLOBALS['count'] . ' - ' . $label . "\n"; }
function reset_alerts() {
    $GLOBALS['transients'] = $GLOBALS['mail'] = array();
    $GLOBALS['options'] = array('lld_checkout_enabled' => '1', 'woocommerce_stripe_settings' => array('testmode' => 'no', 'secret_key' => 'sk_live_NEVER_EMAIL'));
    $GLOBALS['mail_ok'] = true;
}
reset_alerts();
check(lld_checkout_health_check()['enabled'] && !$mail, 'healthy checkout does not email');
$config = array('enabled' => true, 'configurationIssues' => array(), 'compatibilityWarnings' => array('stripe_version_unreviewed'), 'gatewayVersion' => '12.0.0', 'woocommerceVersion' => '12.0.0');
check(lld_checkout_health_check()['enabled'] && !$mail, 'version warnings do not disable checkout or send critical email');
ob_start(); lld_checkout_admin_notice(); $notice = ob_get_clean();
check(str_contains($notice, '12.0.0') && str_contains($notice, 'Checkout remains enabled') && !$mail, 'administrator sees actionable nonblocking compatibility warning');
$admin_allowed = false;
ob_start(); lld_checkout_admin_notice(); $notice = ob_get_clean();
check($notice === '', 'non-admin users do not see compatibility notices');
$admin_allowed = true;
$config = array('enabled' => false, 'configurationIssues' => array('stripe_version', 'woocommerce_version', 'sk_live_NEVER_EMAIL'));
check(!lld_checkout_health_check()['enabled'] && count($mail) === 1, 'configuration failure emails admin');
check($mail[0][0] === 'admin@longlifedigital.com', 'exact requested recipient');
check(str_contains($mail[0][2], 'stripe_version') && str_contains($mail[0][2], '11.3.0-rc.2'), 'diagnostic codes and installed versions included');
check(!str_contains(json_encode($mail), 'sk_live_NEVER_EMAIL'), 'secrets and arbitrary issue strings excluded');
lld_checkout_health_check();
check(count($mail) === 1 && $transients['lld_alert_checkout_configuration'][1] === 21600, 'repeat configuration emails suppressed for six hours');
unset($transients['lld_alert_checkout_configuration']);
lld_checkout_health_check();
check(count($mail) === 2, 'continuing outage can notify after cooldown expires');
reset_alerts(); $options['lld_checkout_enabled'] = '0';
lld_checkout_health_check();
check(!$mail, 'intentional disablement does not alert');
reset_alerts(); $config = 'throw';
check(lld_checkout_health_check()['configurationIssues'] === array('configuration_unavailable'), 'gateway exception becomes a disabled configuration');
check(count($mail) === 1 && !str_contains(json_encode($mail), 'private gateway'), 'gateway exception sends safe alert');
reset_alerts();
foreach (array(200, 400, 402, 404, 409, 422) as $status) lld_checkout_stripe_http_alert(array('response' => array('code' => $status)), 'response', '', array(), 'https://api.stripe.com/v1/payment_intents');
check(!$mail, 'ordinary Stripe declines and invalid requests never email');
foreach (array(401, 403, 429, 500, 503) as $status) {
    reset_alerts();
    lld_checkout_stripe_http_alert(array('response' => array('code' => $status)), 'response', '', array('headers' => 'secret'), 'https://api.stripe.com/v1/payment_intents');
    check(count($mail) === 1 && str_contains($mail[0][2], 'HTTP status: ' . $status), 'critical Stripe HTTP ' . $status . ' emails');
}
reset_alerts();
lld_checkout_stripe_http_alert(new WP_Error, 'response', '', array(), 'https://api.stripe.com/v1/payment_intents');
check(count($mail) === 1, 'Stripe network failures email');
reset_alerts();
lld_checkout_stripe_http_alert(new WP_Error, 'response', '', array(), 'https://unrelated.example.test');
check(!$mail, 'unrelated network errors do not email');
check(!lld_checkout_critical_alert('card_declined') && !$mail, 'unrecognized categories rejected');
$options['lld_alert_checkout_processing_lock'] = time() + 60;
check(lld_checkout_critical_alert('checkout_processing') && !$mail, 'concurrent alert sender does not duplicate email');
$options['lld_alert_checkout_processing_lock'] = time() - 1;
check(lld_checkout_critical_alert('checkout_processing') && count($mail) === 1, 'expired sender lock recovers');
reset_alerts(); $mail_ok = false;
check(!lld_checkout_critical_alert('checkout_processing'), 'rejected mail reported');
check($transients['lld_alert_checkout_processing'][1] === 300, 'failed mail backs off for five minutes');
check(!isset($options['lld_alert_checkout_processing_lock']), 'mail failure releases sender lock');
unset($transients['lld_alert_checkout_processing']); $mail_ok = true;
check(lld_checkout_critical_alert('checkout_processing') && count($mail) === 2, 'failed mail can be retried');
reset_alerts(); $mail_ok = 'throw';
check(!lld_checkout_critical_alert('checkout_processing'), 'mail exception cannot break checkout');
check($transients['lld_alert_checkout_processing'][1] === 300, 'thrown mail failures also back off');
check(!isset($options['lld_alert_checkout_processing_lock']), 'mail exception releases lock');
reset_alerts();
$r = lld_checkout_alert_endpoint(new Request(array('type' => 'payment_verification', 'action' => 'order', 'status' => 502, 'message' => 'private credentials')));
check($r['status'] === 200 && count($mail) === 1, 'signed endpoint callback sends fixed diagnostic alert');
check(!str_contains(json_encode($mail), 'private credentials'), 'arbitrary signed request fields are not emailed');
check(is_wp_error(lld_checkout_alert_endpoint(new Request(array('type' => 'anything')))), 'alert endpoint rejects unknown category');
$hooks['init'](); $hooks['init']();
check($scheduled === array('lld_checkout_health_check' => 'hourly'), 'hourly health check scheduled once');
