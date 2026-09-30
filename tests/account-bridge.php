<?php
// Run with PHP 8+. WordPress/Woo primitives are stubbed; bridge logic runs unchanged.
require __DIR__ . '/commerce-bridge.php';
if (!defined('DAY_IN_SECONDS')) define('DAY_IN_SECONDS', 86400);
class WP_User {
    function __construct(public $ID, public $user_email, public $display_name, public $roles = array('customer'), public $user_login = 'reader', public $password = 'original-password') {}
}
class AccountDB extends DB {
    function query($statement) {
        if (strpos($statement[0], 'INSERT INTO') === 0) {
            $key = $statement[1][0]; $this->rows[$key] = (string) ((int) ($this->rows[$key] ?? 0) + 1); return 1;
        }
        return parent::query($statement);
    }
}
$wpdb = new AccountDB();
$users = array(7 => new WP_User(7, 'reader@example.test', 'Reader'), 8 => new WP_User(8, 'admin@example.test', 'Admin', array('administrator'), 'admin'));
$user_meta = array(); $auth_tokens = array(); $reset_keys = array(); $sent_messages = array();
function user_can($user, $cap) { return in_array('administrator', $user->roles, true); }
function get_user_by($field, $value) { global $users; foreach ($users as $user) { if (($field === 'id' && $user->ID === $value) || ($field === 'email' && $user->user_email === $value) || ($field === 'login' && $user->user_login === $value)) return $user; } return false; }
function get_user_meta($id, $key, $single) { global $user_meta; return $user_meta[$id][$key] ?? ''; }
function update_user_meta($id, $key, $value) { global $user_meta; $user_meta[$id][$key] = $value; }
function delete_user_meta($id, $key) { global $user_meta; unset($user_meta[$id][$key]); }
function wp_validate_auth_cookie($token, $scheme) { global $auth_tokens; return $scheme === 'logged_in' ? ($auth_tokens[$token] ?? false) : false; }
function wp_generate_auth_cookie($id, $expires, $scheme) { global $auth_tokens; $token = 'token-' . $id . '-' . bin2hex(random_bytes(8)); $auth_tokens[$token] = $id; return $token; }
function wp_parse_auth_cookie($token, $scheme) { return array('token' => $token); }
class WP_Session_Tokens {
    function __construct(public $id) {} static function get_instance($id) { return new self($id); }
    function destroy($token) { global $auth_tokens; unset($auth_tokens[$token]); }
    function destroy_all() { global $auth_tokens; foreach ($auth_tokens as $token => $id) if ($this->id === $id) unset($auth_tokens[$token]); }
}
function wp_authenticate($email, $password) { $user = get_user_by('email', $email); return $user && $user->password === $password ? $user : lld_error('Wrong credentials.', 401); }
function do_action($name, ...$args) { global $hooks; if (isset($hooks[$name])) $hooks[$name](...$args); }
function remove_filter($name, $callback, ...$args) { global $hooks; unset($hooks[$name]); }
function wp_parse_url($url) { return parse_url($url); }
function is_email($email) { return filter_var($email, FILTER_VALIDATE_EMAIL); }
function email_exists($email) { $user = get_user_by('email', $email); return $user ? $user->ID : false; }
function wp_generate_password(...$args) { return 'random-inaccessible-password'; }
function sanitize_text_field($value) { return strip_tags($value); }
function wc_create_new_customer($email, $username, $password, $args) { global $users; $id = count($users) + 10; $users[$id] = new WP_User($id, $email, $args['display_name'], array('customer'), 'customer-' . $id, $password); return $id; }
function get_password_reset_key($user) { global $reset_keys; $key = bin2hex(random_bytes(12)); $reset_keys[$user->user_login] = $key; return $key; }
function esc_url($url) { return htmlspecialchars($url, ENT_QUOTES); }
$mail_accepted = true; $mail_recipients = array(); $mail_errors = array(); $mail_events = array();
class WC_Emails {
    static function instance() { return new self(); }
    function wrap_message($heading, $message) { return '<h1>' . $heading . '</h1>' . $message; }
    function send($to, $subject, $message) {
        global $sent_messages, $mail_accepted, $mail_recipients;
        $sent_messages[] = $message; $mail_recipients[] = $to;
        return $mail_accepted;
    }
}
class AccountLogger {
    function error($message, $context) { global $mail_errors; $mail_errors[] = array($message, $context); }
    function info($message, $context) { global $mail_events; $mail_events[] = array($message, $context); }
}
function wc_get_logger() { return new AccountLogger(); }
function check_password_reset_key($key, $login) { global $reset_keys; return isset($reset_keys[$login]) && hash_equals($reset_keys[$login], $key) ? get_user_by('login', $login) : lld_error('Invalid reset key.'); }
function reset_password($user, $password) { global $reset_keys; $user->password = $password; unset($reset_keys[$user->user_login]); do_action('after_password_reset', $user); }
function wc_get_order_statuses() { return array('wc-completed' => 'Completed'); }
function wc_get_order_status_name($status) { return ucfirst($status); }
class AccountOrder extends Order {
    function __construct(public $owner) {} function get_customer_id() { return $this->owner; } function get_date_created() { return null; }
}
function wc_get_orders($args) { check($args['customer_id'] === 7, 'orders query is scoped to authenticated customer'); return (object) array('orders' => array(new AccountOrder(7), new AccountOrder(99)), 'max_num_pages' => 1); }
function account_call($action, $data = array()) {
    $payload = array_merge(array('action' => $action, 'client' => str_repeat('b', 64)), $data);
    $request = new Request('/lld-headless/v1/account', json_encode($payload));
    $auth = lld_authenticate_bridge($request);
    return is_wp_error($auth) ? $auth : lld_account($request);
}
check(is_wp_error(lld_account_user('')), 'empty token cannot use ambient authentication');
check(is_wp_error(account_call('session', array('token' => 'invalid', 'customer_id' => 7))), 'client customer ID does not authorize session');
check(account_call('login', array('email' => 'admin@example.test', 'password' => 'original-password'))->data['status'] === 401, 'admin credentials cannot open a storefront customer session');
check(account_call('login', array('email' => 'reader@example.test', 'password' => 'wrong'))->data['status'] === 401, 'wrong password rejected');
$login = account_call('login', array('email' => 'reader@example.test', 'password' => 'original-password'));
$token = $login->data['token'];
check($login->data['user']['id'] === 7, 'valid customer gets a session');
check(account_call('session', array('token' => $token, 'customer_id' => 99))->data['user']['id'] === 7, 'session uses only validated WordPress token');
check(count(account_call('orders', array('token' => $token, 'page' => 1))->data['orders']) === 1, 'orders belonging to another customer are excluded');
$checkout = new Request('/wc/store/v1/checkout', json_encode(array('_lld_account' => $token, 'customer_id' => 99)));
check($hooks['rest_pre_dispatch'](null, null, $checkout) === null, 'authenticated customer can dispatch checkout');
$order = new Order();
$hooks['woocommerce_store_api_checkout_update_order_meta']($order);
check($order->customer_id === 7, 'checkout assigns verified customer, ignoring supplied customer ID');
unset($GLOBALS['lld_checkout_context']);
account_call('logout', array('token' => $token));
check(is_wp_error(lld_account_user($token)), 'logout revokes the WordPress session');
$expired = new Request('/wc/store/v1/checkout', json_encode(array('_lld_account' => $token)));
check($hooks['rest_pre_dispatch'](null, null, $expired)->data['status'] === 401, 'expired account cannot submit an authenticated checkout');
$options['woocommerce_enable_myaccount_registration'] = 'no';
check(account_call('register', array('email' => 'new@example.test', 'name' => 'New', 'resetUrl' => 'https://shop.example.test/reset-password'))->data['status'] === 403, 'Woo registration setting is honored');
$options['woocommerce_enable_myaccount_registration'] = 'yes';
$r = account_call('register', array('email' => 'new@example.test', 'name' => 'New', 'resetUrl' => 'https://shop.example.test/reset-password'));
check($r->data['ok'] === true && !isset($r->data['token']), 'registration issues no usable session before email verification');
$new = get_user_by('email', 'new@example.test');
check((bool)get_user_meta($new->ID, '_lld_email_pending', true), 'new account awaits email verification');
check(strpos(end($sent_messages), '/reset-password#key=') !== false, 'email reset credentials are in the URL fragment');
check(end($mail_recipients) === $new->user_email, 'Woo mailer receives the actual customer email');
check($hooks['woocommerce_allow_send_queued_transactional_email'](true, 'woocommerce_created_customer', array($new->ID)) === false, 'deferred welcome cannot replace the storefront reset key');
check($hooks['woocommerce_allow_send_queued_transactional_email'](true, 'woocommerce_created_customer', array(7)) === true, 'ordinary Woo customer emails remain enabled');
check($hooks['woocommerce_allow_send_queued_transactional_email'](true, 'woocommerce_order_status_completed', array($new->ID)) === true, 'order emails are unaffected');
check(account_call('login', array('email' => $new->user_email, 'password' => $new->password))->data['status'] === 401, 'unverified account cannot log in even with a password');
$key = $reset_keys[$new->user_login];
$r = account_call('reset', array('login' => $new->user_login, 'key' => $key, 'password' => 'a-new-long-password'));
check($r->data['ok'] && !get_user_meta($new->ID, '_lld_email_pending', true), 'valid reset proves email and sets password');
check(is_wp_error(account_call('reset', array('login' => $new->user_login, 'key' => $key, 'password' => 'another-long-password'))), 'used reset key cannot be replayed');
check(account_call('login', array('email' => $new->user_email, 'password' => 'a-new-long-password'))->data['user']['id'] === $new->ID, 'verified customer can log in');
$before = count($sent_messages);
check(account_call('forgot', array('email' => 'missing@example.test', 'resetUrl' => 'https://shop.example.test/reset-password'))->data['ok'], 'forgot password does not expose missing accounts');
check(count($sent_messages) === $before, 'unknown email receives no reset credentials');
$wpdb = new AccountDB();
$mail_accepted = false;
$retry = array('email' => 'retry@example.test', 'name' => 'Retry', 'resetUrl' => 'https://shop.example.test/reset-password');
check(account_call('register', $retry)->data['status'] === 503, 'mail transport failure is not reported as successful registration');
$pending = get_user_by('email', $retry['email']);
check((bool) get_user_meta($pending->ID, '_lld_email_pending', true), 'failed email leaves customer unverified');
check(count($mail_errors) === 1 && $mail_errors[0][1]['source'] === 'lld-accounts', 'mail failure is logged for the store owner');
check(strpos(json_encode($mail_errors), $reset_keys[$pending->user_login]) === false, 'mail logs contain no reset key');
$mail_accepted = true;
$before = count($sent_messages); $user_count = count($users);
check(account_call('register', $retry)->data['ok'] && count($sent_messages) === $before + 1, 'retry registration resends email to unverified customer');
check(count($users) === $user_count, 'retry registration creates no duplicate customer');
$before = count($sent_messages);
check(account_call('register', array('email' => 'reader@example.test', 'name' => 'Reader', 'resetUrl' => $retry['resetUrl']))->data['ok'] && count($sent_messages) === $before, 'registration does not reset verified accounts');
check(end($mail_events)[0] === 'registration_skipped_existing_customer_use_forgot_password', 'existing customer skip explains how to obtain a password email');
check(account_call('register', array('email' => 'admin@example.test', 'name' => 'Admin', 'resetUrl' => $retry['resetUrl']))->data['ok'] && count($sent_messages) === $before, 'admin registration remains private and sends no storefront email');
check(end($mail_events)[0] === 'registration_skipped_non_customer_account', 'admin registration skip is visible in private logs');
check(account_call('forgot', array('email' => 'admin@example.test', 'resetUrl' => $retry['resetUrl']))->data['ok'] && count($sent_messages) === $before, 'admin password recovery remains in WordPress');
check(end($mail_events)[0] === 'forgot_skipped_non_customer_account', 'admin recovery skip is diagnosed');
check(account_call('forgot', array('email' => 'reader@example.test', 'resetUrl' => $retry['resetUrl']))->data['ok'] && count($sent_messages) === $before + 1, 'existing customers can request email through the Woo mailer');
check(end($mail_events)[0] === 'password_email_transport_accepted', 'accepted mail has a diagnostic event without claiming inbox delivery');
check(strpos(json_encode($mail_events), '@') === false && strpos(json_encode($mail_events), 'reset-password') === false, 'diagnostic logs contain neither email addresses nor reset URLs');
foreach ($reset_keys as $private_key) check(strpos(json_encode($mail_events), $private_key) === false, 'diagnostic logs never include reset credentials');
$mail_accepted = false;
check(account_call('forgot', array('email' => 'reader@example.test', 'resetUrl' => $retry['resetUrl']))->data['status'] === 503, 'password email transport errors propagate');
$mail_accepted = true;
$wpdb = new AccountDB();
for ($i = 0; $i < 10; $i++) $r = account_call('login', array('email' => 'reader@example.test', 'password' => 'wrong'));
check(account_call('login', array('email' => 'reader@example.test', 'password' => 'wrong'))->data['status'] === 429, 'repeated login attempts are rate limited');
echo "Account bridge checks complete.\n";
