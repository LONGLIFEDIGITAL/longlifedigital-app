<?php
if (!defined('ABSPATH')) { exit; }

function lld_email_storefront_url() {
    if (!function_exists('get_field')) return '';
    $settings = get_posts(array('post_type' => 'lld_settings', 'name' => 'storefront', 'post_status' => 'publish', 'numberposts' => 1));
    if (!$settings) return '';
    $brand = get_field('lld_brand', $settings[0]->ID);
    $url = is_array($brand) && is_string($brand['website'] ?? null) ? rtrim(trim($brand['website']), '/') : '';
    $parts = wp_parse_url($url);
    // The React routes live at the origin root. Never take this address from a request.
    if (!$parts || ($parts['scheme'] ?? '') !== 'https' || empty($parts['host'])
        || !filter_var($url, FILTER_VALIDATE_URL) || !empty($parts['path'])
        || isset($parts['user']) || isset($parts['pass']) || isset($parts['query']) || isset($parts['fragment'])) return '';
    return $url;
}

// Match the actual configured Woo pages/endpoints, including plain permalinks.
// Only remove query parameters that are part of the base URL itself.
function lld_email_url_query($url, $base) {
    $parts = wp_parse_url($url);
    $target = wp_parse_url($base);
    if (!$parts || !$target || empty($parts['host']) || empty($target['host'])
        || !in_array($parts['scheme'] ?? '', array('https', 'http'), true)
        || isset($parts['user']) || isset($parts['pass']) || isset($parts['fragment'])
        || strtolower($parts['host']) !== strtolower($target['host'])
        || ($parts['port'] ?? null) !== ($target['port'] ?? null)
        || rtrim($parts['path'] ?? '', '/') !== rtrim($target['path'] ?? '', '/')) return null;
    parse_str($parts['query'] ?? '', $query);
    parse_str($target['query'] ?? '', $required);
    foreach ($required as $key => $value) {
        if (!array_key_exists($key, $query) || $query[$key] !== $value) return null;
        unset($query[$key]);
    }
    return $query;
}

function lld_email_link_url($url, $storefront, $routes) {
    foreach ($routes as $route) {
        $query = lld_email_url_query($url, $route[0]);
        if ($query === null) continue;
        if ($route[1] !== 'password' && $route[1] !== 'login') {
            // Download permissions, payment actions and third-party confirmation
            // tokens must continue reaching the WordPress handler that owns them.
            if (!$query) return $storefront . $route[1];
            continue;
        }
        if (array_diff(array_keys($query), array('action', 'key', 'login', 'id', 'wp_lang'))) continue;
        foreach ($query as $value) { if (!is_string($value)) continue 2; }
        $action = $query['action'] ?? '';
        if (!empty($query['key'])) {
            if (!in_array($action, array('', 'rp', 'resetpass', 'newaccount'), true)) continue;
            $user = !empty($query['login']) ? get_user_by('login', $query['login']) : false;
            // Some Woo templates encode the login before adding query arguments.
            if (!$user && !empty($query['login'])) $user = get_user_by('login', rawurldecode($query['login']));
            if (!$user && empty($query['login']) && !empty($query['id']) && ctype_digit($query['id'])) $user = get_user_by('id', (int) $query['id']);
            if (!lld_customer_allowed($user) || (isset($query['id']) && (string) $user->ID !== $query['id'])) continue;
            // Reuse the original single-use key; generating another would invalidate the email.
            return $storefront . '/reset-password#key=' . rawurlencode($query['key']) . '&login=' . rawurlencode($user->user_login);
        }
        if (isset($query['key']) || isset($query['login']) || isset($query['id'])) continue;
        if (in_array($action, array('lostpassword', 'retrievepassword'), true)
            || ($route[1] === 'password' && $action === '')) return $storefront . '/forgot-password';
        if ($route[1] === 'login' && $action === '') return $storefront . '/login';
    }
    return $url;
}

function lld_email_frontend_links($message) {
    if (!is_string($message) || !$message) return $message;
    $storefront = lld_email_storefront_url();
    if (!$storefront) return $message;
    $routes = array(
        array(network_site_url('wp-login.php', 'login'), 'login'),
        array(site_url('wp-login.php', 'login'), 'login'),
        array(wc_get_account_endpoint_url('lost-password'), 'password'),
        array(wc_get_account_endpoint_url('orders'), '/account?view=orders'),
        array(wc_get_account_endpoint_url('downloads'), '/account?view=downloads'),
        array(wc_get_page_permalink('myaccount'), '/account'),
        array(home_url('/'), '/'),
        array(site_url('/'), '/'),
    );
    $html = (bool) preg_match('/<[a-z][a-z0-9]*(?:\s[^>]*)?>/i', $message);
    return preg_replace_callback('~https?://[^\s<>"\']+~i', function ($match) use ($storefront, $routes, $html) {
        $original = $match[0];
        // Plain-text sentences can end immediately after the URL.
        $token = $html ? $original : rtrim($original, '.,!)]}');
        $url = html_entity_decode($token, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $rewritten = lld_email_link_url($url, $storefront, $routes);
        if ($rewritten === $url) return $original;
        return ($html ? esc_url($rewritten) : $rewritten) . substr($original, strlen($token));
    }, $message);
}

// Includes Woo's normal HTML/plain emails and the bridge's wrapped account email.
add_filter('woocommerce_mail_content', 'lld_email_frontend_links', 20);
// Woo builds the multipart text alternative later, in phpmailer_init. Scope this
// callback to that send and clean up even if another plugin short-circuits wp_mail.
function lld_email_multipart_links($mailer) {
    $mailer->AltBody = lld_email_frontend_links($mailer->AltBody);
    remove_action('phpmailer_init', 'lld_email_multipart_links', 20);
}
add_filter('woocommerce_mail_callback_params', function ($params, $email) {
    if ($email->get_email_type() === 'multipart') add_action('phpmailer_init', 'lld_email_multipart_links', 20);
    return $params;
}, 20, 2);
add_action('woocommerce_email_sent', function () {
    remove_action('phpmailer_init', 'lld_email_multipart_links', 20);
});
add_filter('woocommerce_email_header_image_url', function ($url) {
    return $url ? (lld_email_storefront_url() ?: $url) : $url;
}, 20);

// WordPress-created customers use the same frontend reset flow. Staff recovery
// stays in wp-admin; these filters never rewrite unrelated wp_mail messages.
add_filter('retrieve_password_notification_email', function ($email, $key, $login, $user) {
    if (lld_customer_allowed($user)) $email['message'] = lld_email_frontend_links($email['message']);
    return $email;
}, 20, 4);
add_filter('wp_new_user_notification_email', function ($email, $user) {
    if (lld_customer_allowed($user)) $email['message'] = lld_email_frontend_links($email['message']);
    return $email;
}, 20, 2);
