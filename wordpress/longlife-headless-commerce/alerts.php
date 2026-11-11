<?php
if (!defined('ABSPATH')) { exit; }

function lld_checkout_alert_types() {
    return array(
        'checkout_configuration' => 'Checkout configuration is blocking purchases',
        'store_unavailable' => 'The storefront cannot reach the commerce service',
        'checkout_processing' => 'Checkout encountered a server failure',
        'payment_verification' => 'A payment result could not be verified',
        'bridge_authentication' => 'The storefront commerce connection was rejected',
        'fraud_configuration' => 'Checkout browser fraud verification could not be configured',
        'stripe_service' => 'Stripe reported a service or account connection failure',
    );
}

function lld_checkout_issue_labels() {
    return array(
        'stripe_version' => 'Stripe Gateway version needs a compatibility review',
        'woocommerce_version' => 'WooCommerce version needs a compatibility review',
        'stripe_gateway' => 'Stripe UPE gateway is unavailable',
        'stripe_payment_api' => 'Required Stripe payment or verification methods are unavailable',
        'stripe_order_api' => 'Required Stripe order verification bookkeeping is unavailable',
        'woocommerce_store_api' => 'WooCommerce Store API checkout is unavailable',
        'woocommerce_order_api' => 'Required WooCommerce order or download methods are unavailable',
        'billing_api' => 'WooCommerce billing country APIs are unavailable',
        'stripe_mode' => 'Stripe mode does not match the gateway configuration',
        'card_payments' => 'Card payments are disabled',
        'guest_checkout' => 'Guest checkout is disabled',
        'stripe_enabled' => 'Stripe payments are disabled',
        'automatic_capture' => 'Automatic capture is disabled',
        'publishable_key' => 'Publishable key is missing or does not match the selected mode',
        'secret_key' => 'Secret key is missing or does not match the selected mode',
        'configuration_unavailable' => 'Checkout configuration could not be read',
    );
}

// Fixed categories and allowlisted diagnostics only: never email raw exceptions,
// request bodies, customer details, credentials, or payment intent secrets.
function lld_checkout_critical_alert($type, $details = array()) {
    $types = lld_checkout_alert_types();
    if (!is_string($type) || !isset($types[$type])) return false;
    $cooldown = 'lld_alert_' . $type;
    $lock = $cooldown . '_lock';
    $acquired = false;
    try {
        if (get_transient($cooldown)) return true;
        $expires = get_option($lock);
        if ($expires && (int) $expires < time()) delete_option($lock);
        // add_option uses a unique database key; concurrent requests cannot both send.
        $acquired = add_option($lock, time() + 300, '', false);
        if (!$acquired) return true;
        if (get_transient($cooldown)) return true;
        $body = array($types[$type], '', 'Site: ' . home_url('/'), 'Time (UTC): ' . gmdate('Y-m-d H:i:s'), 'Category: ' . $type);
        foreach (array('WC_VERSION' => 'WooCommerce', 'WC_STRIPE_VERSION' => 'Stripe Gateway') as $constant => $label) {
            $version = defined($constant) ? constant($constant) : 'unavailable';
            if (is_string($version) && preg_match('/^[A-Za-z0-9.\-]{1,40}$/D', $version)) $body[] = $label . ': ' . $version;
        }
        $settings = get_option('woocommerce_stripe_settings', array());
        $body[] = 'Stripe mode: ' . (($settings['testmode'] ?? '') === 'yes' ? 'test' : 'live');
        foreach (lld_checkout_issue_labels() as $code => $label) {
            if (in_array($code, $details['issues'] ?? array(), true)) $body[] = $code . ': ' . $label;
        }
        $status = $details['status'] ?? null;
        if (is_int($status) && $status >= 400 && $status <= 599) $body[] = 'HTTP status: ' . $status;
        $action = $details['action'] ?? '';
        if (in_array($action, array('config', 'fraud-config', 'cart', 'add', 'update', 'remove', 'clear', 'customer', 'apply-coupon', 'remove-coupon', 'checkout', 'order'), true)) $body[] = 'Storefront operation: ' . $action;
        $body[] = '';
        $body[] = 'Check WooCommerce > Status > Logs and the checkout configuration: ' . rest_url('lld-headless/v1/config');
        $body[] = 'Check the WooCommerce order and Stripe payment before retrying any payment with an uncertain outcome.';
        $body[] = 'Repeated alerts in this category are suppressed for six hours.';
        $sent = wp_mail('admin@longlifedigital.com', '[Longlife Digital] Critical checkout alert: ' . $types[$type], implode("\n", $body), array('Content-Type: text/plain; charset=UTF-8'));
        // Failed mail is retried on a later observation, with a short backoff.
        set_transient($cooldown, true, $sent ? 6 * HOUR_IN_SECONDS : 5 * MINUTE_IN_SECONDS);
        if (!$sent) error_log('Longlife checkout alert mail transport failed: ' . $type);
        return (bool) $sent;
    } catch (Throwable $error) {
        // An alert failure must never change checkout or payment results.
        try { set_transient($cooldown, true, 5 * MINUTE_IN_SECONDS); } catch (Throwable $ignored) {}
        error_log('Longlife checkout alert could not be delivered: ' . $type);
        return false;
    } finally {
        if ($acquired) delete_option($lock);
    }
}

function lld_checkout_health_check() {
    try {
        $config = lld_configuration();
    } catch (Throwable $error) {
        $config = array('enabled' => false, 'configurationIssues' => array('configuration_unavailable'));
    }
    // Intentionally switching off React checkout is not an incident.
    if (get_option('lld_checkout_enabled') === '1' && empty($config['enabled'])) {
        lld_checkout_critical_alert('checkout_configuration', array('issues' => $config['configurationIssues'] ?? array()));
    }
    return $config;
}

function lld_checkout_admin_notice() {
    if (!current_user_can('manage_woocommerce') && !current_user_can('manage_options')) return;
    if (get_option('lld_checkout_enabled') !== '1') return;
    try { $config = lld_configuration(); } catch (Throwable $error) { return; }
    if (empty($config['compatibilityWarnings'])) return;
    $versions = 'Stripe Gateway ' . ($config['gatewayVersion'] ?? 'unknown') . '; WooCommerce ' . ($config['woocommerceVersion'] ?? 'unknown');
    echo '<div class="notice notice-warning"><p><strong>Longlife checkout compatibility review:</strong> ' . esc_html($versions) . '. These versions have not been reviewed for this bridge. ';
    echo !empty($config['enabled']) ? 'Checkout remains enabled because its required APIs and payment settings are available. ' : 'Checkout has a separate configuration or API issue that must be resolved. ';
    echo 'Test cart, payment, confirmation and downloads on staging before updating production.</p></div>';
}
add_action('admin_notices', 'lld_checkout_admin_notice');

function lld_checkout_alert_endpoint($request) {
    $type = $request->get_param('type');
    if (!is_string($type) || !isset(lld_checkout_alert_types()[$type])) return lld_error('Invalid alert category.');
    // Endpoint authentication is the existing signed bridge permission callback.
    $sent = lld_checkout_critical_alert($type, array('status' => $request->get_param('status'), 'action' => $request->get_param('action')));
    return lld_response(array('ok' => $sent), $sent ? 200 : 503);
}

// Observe only infrastructure/account failures from the official gateway's HTTP
// transport. Card declines (402), invalid fields (400), and 3DS are not incidents.
function lld_checkout_stripe_http_alert($response, $context, $transport, $args, $url) {
    if ($context !== 'response' || get_option('lld_checkout_enabled') !== '1') return;
    $parts = wp_parse_url($url);
    if (($parts['scheme'] ?? '') !== 'https' || ($parts['host'] ?? '') !== 'api.stripe.com') return;
    $status = is_wp_error($response) ? 0 : (int) wp_remote_retrieve_response_code($response);
    if (is_wp_error($response) || in_array($status, array(401, 403, 429), true) || $status >= 500) {
        lld_checkout_critical_alert('stripe_service', array('status' => $status));
    }
}
add_action('http_api_debug', 'lld_checkout_stripe_http_alert', 10, 5);
add_action('lld_checkout_health_check', 'lld_checkout_health_check');
add_action('init', function () {
    if (!wp_next_scheduled('lld_checkout_health_check')) wp_schedule_event(time() + 60, 'hourly', 'lld_checkout_health_check');
});
