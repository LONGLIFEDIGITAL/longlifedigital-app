<?php
if (!defined('ABSPATH')) { exit; }

function lld_customer_allowed($user) {
    return $user instanceof WP_User && !empty($user->roles)
        && !array_diff($user->roles, array('customer', 'subscriber'))
        && !user_can($user, 'manage_options') && !user_can($user, 'manage_woocommerce');
}
function lld_customer_profile($user) {
    return array('id' => (int) $user->ID, 'email' => $user->user_email, 'name' => $user->display_name);
}
function lld_account_email_log($event, $user = null) {
    // Admin-only diagnostics: never log addresses, passwords, URLs or reset keys.
    wc_get_logger()->info($event, array('source' => 'lld-accounts', 'bridge_version' => '0.3.2', 'customer_id' => $user instanceof WP_User ? (int) $user->ID : 0));
}
function lld_account_user($token) {
    // Never fall back to ambient WordPress cookies or a client-provided customer ID.
    if (!is_string($token) || !$token || strlen($token) > 2048) return lld_error('Please log in again.', 401);
    $id = wp_validate_auth_cookie($token, 'logged_in');
    $user = $id ? get_user_by('id', $id) : null;
    if (!lld_customer_allowed($user) || get_user_meta($id, '_lld_email_pending', true)) return lld_error('Please log in again.', 401);
    return $user;
}
function lld_account_rate($client, $identity) {
    global $wpdb;
    if (!is_string($client) || !preg_match('/^[a-f0-9]{64}$/D', $client)) return lld_error('Request not authorized.', 403);
    // Atomic, shared counters work across PHP workers and serverless instances.
    foreach (array(array('client:' . $client, 40), array('identity:' . strtolower($identity), 10)) as $bucket) {
        $key = hash('sha256', 'account-rate:' . floor(time() / 900) . ':' . $bucket[0]);
        $saved = $wpdb->query($wpdb->prepare(
            "INSERT INTO {$wpdb->prefix}lld_commerce (record_key,kind,payload,created) VALUES (%s,'account_rate','1',%d) ON DUPLICATE KEY UPDATE payload = CAST(payload AS UNSIGNED) + 1",
            $key, time()
        ));
        if ($saved === false) return lld_error('Accounts unavailable.', 503);
        if ((int) lld_record($key) > $bucket[1]) return lld_error('Too many attempts.', 429);
    }
    $wpdb->query($wpdb->prepare("DELETE FROM {$wpdb->prefix}lld_commerce WHERE kind = 'account_rate' AND created < %d LIMIT 100", time() - 1800));
    return true;
}
function lld_send_password_link($user, $url) {
    $parts = wp_parse_url($url);
    $local = in_array($parts['host'] ?? '', array('localhost', '127.0.0.1'), true);
    if (($parts['scheme'] ?? '') !== 'https' && !(($parts['scheme'] ?? '') === 'http' && $local)) return lld_error('Invalid return address.', 400);
    if (($parts['path'] ?? '') !== '/reset-password' || isset($parts['user']) || isset($parts['pass']) || isset($parts['query']) || isset($parts['fragment'])) return lld_error('Invalid return address.', 400);
    // Use WP's expiring, single-use keys and Woo's sender/mail pipeline. FluentSMTP
    // still delivers via wp_mail, with the same From address as Woo test emails.
    $key = get_password_reset_key($user);
    if (is_wp_error($key)) {
        lld_account_email_log('password_email_key_failed', $user);
        return lld_error('Unable to prepare account email.', 503);
    }
    // This URL comes only from the signed bridge after checking the storefront origin.
    // Fragments keep reset credentials out of HTTP access logs and referrer headers.
    $link = $url . '#key=' . rawurlencode($key) . '&login=' . rawurlencode($user->user_login);
    $mailer = WC_Emails::instance();
    $subject = 'Set your Longlife Digital password';
    $message = '<p>Choose your password to access your Longlife Digital account.</p>'
        . '<p><a href="' . esc_url($link) . '">Set your password</a></p>'
        . '<p>If you did not request this email, you can ignore it.</p>';
    lld_account_email_log('password_email_send_attempt', $user);
    $sent = $mailer->send($user->user_email, $subject, $mailer->wrap_message($subject, $message));
    if (!$sent) {
        // No addresses, passwords, reset keys or provider credentials in our log.
        wc_get_logger()->error('Account password email was not accepted by the mail transport.', array('source' => 'lld-accounts', 'customer_id' => $user->ID));
        return lld_error('Unable to send account email.', 503);
    }
    lld_account_email_log('password_email_transport_accepted', $user);
    return true;
}
add_action('after_password_reset', function ($user) {
    delete_user_meta($user->ID, '_lld_email_pending');
    WP_Session_Tokens::get_instance($user->ID)->destroy_all();
});
// Deferred Woo welcome emails generate another reset key before checking whether
// the email is enabled. Skip that queued notification for bridge-created users.
add_filter('woocommerce_allow_send_queued_transactional_email', function ($allow, $filter, $args) {
    if ($filter === 'woocommerce_created_customer' && !empty($args[0])
        && get_user_meta((int) $args[0], '_lld_storefront_account', true)) return false;
    return $allow;
}, 10, 3);
function lld_account($request) {
    $action = $request->get_param('action');
    if (in_array($action, array('register', 'forgot'), true)) lld_account_email_log($action . '_request_received');
    if (in_array($action, array('session', 'orders', 'logout'), true)) {
        $token = $request->get_param('token');
        $user = lld_account_user($token);
        if (is_wp_error($user)) return $user;
        if ($action === 'logout') {
            $cookie = wp_parse_auth_cookie($token, 'logged_in');
            WP_Session_Tokens::get_instance($user->ID)->destroy($cookie['token']);
            return lld_response(array('ok' => true));
        }
        if ($action === 'session') return lld_response(array('user' => lld_customer_profile($user)));
        $page = $request->get_param('page');
        if (!is_int($page) || $page < 1 || $page > 1000) return lld_error('Invalid page.');
        $result = wc_get_orders(array('customer_id' => $user->ID, 'limit' => 10, 'page' => $page, 'paginate' => true, 'orderby' => 'date', 'order' => 'DESC', 'status' => array_keys(wc_get_order_statuses())));
        $orders = array();
        foreach ($result->orders as $order) {
            if ((int) $order->get_customer_id() !== (int) $user->ID) continue;
            $items = array();
            foreach ($order->get_items() as $item) $items[] = array('name' => $item->get_name(), 'quantity' => $item->get_quantity());
            $orders[] = array('number' => $order->get_order_number(), 'date' => $order->get_date_created() ? $order->get_date_created()->date(DATE_ATOM) : null,
                'status' => wc_get_order_status_name($order->get_status()), 'total' => $order->get_total(), 'currency' => $order->get_currency(), 'items' => $items);
        }
        return lld_response(array('orders' => $orders, 'hasMore' => $page < $result->max_num_pages));
    }
    if (!in_array($action, array('login', 'register', 'forgot', 'reset'), true)) return lld_error('Unknown account operation.', 404);
    $email = $request->get_param('email');
    $login = $request->get_param('login');
    $identity = $action === 'reset' ? $login : $email;
    if (!is_string($identity) || strlen($identity) > 254 || !$identity) return lld_error('Invalid account details.');
    $rate = lld_account_rate($request->get_param('client'), $identity);
    if (is_wp_error($rate)) return $rate;
    if ($action !== 'reset' && !is_email($email)) return lld_error('Invalid email.');
    if (in_array($action, array('login', 'reset'), true)) {
        $password = $request->get_param('password');
        if (!is_string($password) || strlen($password) > 512 || strlen($password) < ($action === 'reset' ? 12 : 1)) return lld_error('Invalid password.');
    }
    if ($action === 'login') {
        $user = wp_authenticate($email, $password);
        if (is_wp_error($user) || !lld_customer_allowed($user) || get_user_meta($user->ID, '_lld_email_pending', true)) return lld_error('Invalid login.', 401);
        $expires = time() + 7 * DAY_IN_SECONDS;
        $token = wp_generate_auth_cookie($user->ID, $expires, 'logged_in');
        do_action('wp_login', $user->user_login, $user);
        return lld_response(array('user' => lld_customer_profile($user), 'token' => $token, 'expires' => $expires * 1000));
    }
    if ($action === 'reset') {
        $key = $request->get_param('key');
        if (!is_string($key) || !$key || strlen($key) > 128) return lld_error('Invalid reset link.');
        $user = check_password_reset_key($key, $login);
        if (is_wp_error($user) || !lld_customer_allowed($user)) return lld_error('Invalid reset link.');
        reset_password($user, $password);
        return lld_response(array('ok' => true));
    }
    $url = $request->get_param('resetUrl');
    if (!is_string($url) || strlen($url) > 500) return lld_error('Invalid return address.');
    if ($action === 'register') {
        if (get_option('woocommerce_enable_myaccount_registration') !== 'yes') return lld_error('Account registration is not enabled.', 403);
        $name = $request->get_param('name');
        if (!is_string($name) || !$name || strlen($name) > 400) return lld_error('Invalid name.');
        $existing = get_user_by('email', $email);
        if ($existing) {
            // A failed first delivery must not strand the customer on retry.
            if (lld_customer_allowed($existing) && get_user_meta($existing->ID, '_lld_email_pending', true)) {
                lld_account_email_log('registration_resending_pending_customer', $existing);
                $sent = lld_send_password_link($existing, $url);
                if (is_wp_error($sent)) return $sent;
            } else {
                lld_account_email_log(lld_customer_allowed($existing) ? 'registration_skipped_existing_customer_use_forgot_password' : 'registration_skipped_non_customer_account', $existing);
            }
            return lld_response(array('ok' => true));
        }
        // No usable password/session is issued until the customer proves mailbox access.
        add_filter('woocommerce_email_enabled_customer_new_account', '__return_false');
        try { $id = wc_create_new_customer($email, '', wp_generate_password(48, true, true), array('display_name' => sanitize_text_field($name))); }
        finally { remove_filter('woocommerce_email_enabled_customer_new_account', '__return_false'); }
        if (is_wp_error($id)) return lld_error('Unable to create account.', 409);
        update_user_meta($id, '_lld_storefront_account', 1);
        update_user_meta($id, '_lld_email_pending', 1);
        lld_account_email_log('registration_customer_created', get_user_by('id', $id));
        $sent = lld_send_password_link(get_user_by('id', $id), $url);
        if (is_wp_error($sent)) return $sent;
        return lld_response(array('ok' => true));
    }
    $user = get_user_by('email', $email);
    if (lld_customer_allowed($user)) {
        $sent = lld_send_password_link($user, $url);
        if (is_wp_error($sent)) return $sent;
    } else {
        lld_account_email_log($user ? 'forgot_skipped_non_customer_account' : 'forgot_skipped_unknown_account', $user);
    }
    // Do not disclose whether an email exists or belongs to an administrative account.
    return lld_response(array('ok' => true));
}
