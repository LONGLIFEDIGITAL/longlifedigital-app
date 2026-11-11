<?php
if (!defined('ABSPATH')) { exit; }

// Use Woo's public script loader in a frontend context: it intentionally refuses
// REST requests. Export its installed scripts/config, rather than pinning a copy
// of the SDK or calling private fraud services. There is no shopper data here.
function lld_fraud_bootstrap() {
    $class = 'Automattic\\WooCommerce\\FraudProtection\\BlackboxScriptHandler';
    if (!class_exists($class) && !defined('WC_FRAUD_PROTECTION_VERSION')) return array('enabled' => false);
    try {
        if (!class_exists($class) || !function_exists('wc_get_container')) throw new RuntimeException();
        $loader = wc_get_container()->get($class);
        if (!is_callable(array($loader, 'request_scripts')) || !$loader->request_scripts()) throw new RuntimeException();
        $scripts = wp_scripts();
        $init = $scripts->registered['wc-fraud-protection-blackbox-init'] ?? null;
        $localized = $init ? $scripts->get_data('wc-fraud-protection-blackbox-init', 'data') : '';
        // wp_localize_script emits a JSON literal. Never execute/eval this text.
        if (!is_string($localized) || !preg_match('/^\s*var wcFraudProtection = (\{.*\});\s*$/sD', $localized, $match)) throw new RuntimeException();
        $bootstrap = json_decode($match[1], true);
        $config = $bootstrap['config'] ?? null;
        if (!is_array($config) || !is_string($config['apiKey'] ?? null) || !preg_match('/^woo:[1-9][0-9]*$/D', $config['apiKey'])
            || ($config['identityCookie']['name'] ?? '') !== 'wfp_id') throw new RuntimeException();
        // The SDK executes on the React storefront, whose origin/path can differ
        // from WordPress. Its identity must be readable by that storefront's BFF.
        $config['identityCookie']['domain'] = '';
        $config['identityCookie']['path'] = '/';
        $urls = array();
        foreach (array('wc-fraud-protection-blackbox', 'wc-fraud-protection-blackbox-init') as $handle) {
            $script = $scripts->registered[$handle] ?? null;
            if (!$script || !is_string($script->src) || !$script->src) throw new RuntimeException();
            $src = $script->src;
            if (str_starts_with($src, '//')) $src = 'https:' . $src;
            elseif (str_starts_with($src, '/')) $src = rtrim($scripts->base_url, '/') . $src;
            if (is_string($script->ver) && $script->ver !== '') $src = add_query_arg('ver', $script->ver, $src);
            $urls[] = $src;
        }
        return array('enabled' => true, 'scripts' => $urls, 'config' => $config);
    } catch (Throwable $error) {
        lld_checkout_critical_alert('fraud_configuration');
        return lld_error('Checkout browser verification could not be configured.', 503);
    }
}
add_action('template_redirect', function () {
    if (($_GET['lld_checkout_fraud_bootstrap'] ?? '') !== '1') return;
    nocache_headers();
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') wp_send_json(array('message' => 'Method not allowed.'), 405);
    $data = lld_fraud_bootstrap();
    if (is_wp_error($data)) wp_send_json(array('message' => $data->get_error_message()), 503);
    wp_send_json($data);
}, 0);

// Called ONLY after the bridge signature and checkout deduplication succeed.
// Vercel supplies the IP; shoppers cannot provide an IP in their JSON payload.
function lld_checkout_shopper_context($request) {
    $context = $request->get_param('_lld_shopper');
    if (!is_array($context)) return;
    $GLOBALS['lld_shopper_original'] = array('server' => array(), 'identity' => $_COOKIE['wfp_id'] ?? null);
    $server = array();
    $ip = $context['ip'] ?? null;
    if (is_string($ip) && filter_var($ip, FILTER_VALIDATE_IP)) {
        $server['REMOTE_ADDR'] = $ip; // Woo Fraud Protection reads this directly.
        $server['HTTP_X_REAL_IP'] = $ip;
        $server['HTTP_X_FORWARDED_FOR'] = $ip; // Woo order IP / geolocation.
    }
    $agent = $context['userAgent'] ?? null;
    if (is_string($agent) && strlen($agent) <= 512 && !preg_match('/[\x00-\x1f\x7f]/', $agent)) $server['HTTP_USER_AGENT'] = $agent;
    foreach ($server as $key => $value) {
        $GLOBALS['lld_shopper_original']['server'][$key] = $_SERVER[$key] ?? null;
        $_SERVER[$key] = $value;
    }
    $identity = $context['identity'] ?? null;
    if (is_string($identity) && preg_match('/^[a-f0-9]{32}$/D', $identity)) $_COOKIE['wfp_id'] = $identity;
}
function lld_restore_shopper_context() {
    $original = $GLOBALS['lld_shopper_original'] ?? null;
    if (!$original) return;
    foreach ($original['server'] as $key => $value) {
        if ($value === null) unset($_SERVER[$key]);
        else $_SERVER[$key] = $value;
    }
    if ($original['identity'] === null) unset($_COOKIE['wfp_id']);
    else $_COOKIE['wfp_id'] = $original['identity'];
    unset($GLOBALS['lld_shopper_original']);
}
