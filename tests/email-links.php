<?php
// The real account bridge runs first, then exercise the registered email filters.
require __DIR__ . '/account-bridge.php';
$email_settings = true;
$email_brand = array('website' => 'https://shop.example.test/');
$email_home = 'https://wp.example.test';
$email_site = 'https://wp.example.test';
$email_account = 'https://wp.example.test/my-account/';
$email_lost_slug = 'lost-password';
function get_posts($args) {
    if ($args['post_type'] !== 'lld_settings' || $args['name'] !== 'storefront' || $args['post_status'] !== 'publish') throw new Exception('Email destination must use published storefront settings.');
    return $GLOBALS['email_settings'] ? array((object) array('ID' => 42)) : array();
}
function get_field($name, $id) { return $GLOBALS['email_brand']; }
function home_url($path = '') { return $GLOBALS['email_home'] . $path; }
function site_url($path = '', $scheme = null) { return $GLOBALS['email_site'] . '/' . ltrim($path, '/'); }
function network_site_url($path = '', $scheme = null) { return site_url($path, $scheme); }
function wc_get_page_permalink($page) { return $GLOBALS['email_account']; }
function wc_get_account_endpoint_url($endpoint) {
    $endpoint = $endpoint === 'lost-password' ? $GLOBALS['email_lost_slug'] : $endpoint;
    return str_contains($GLOBALS['email_account'], '?') ? $GLOBALS['email_account'] . '&' . $endpoint . '=' : $GLOBALS['email_account'] . $endpoint . '/';
}
function email_content($message) { return $GLOBALS['hooks']['woocommerce_mail_content']($message); }
function remove_action($name, $callback, ...$args) { remove_filter($name, $callback); }

$customer = $users[7];
$key = get_password_reset_key($customer);
$reset = 'https://shop.example.test/reset-password#key=' . $key . '&login=reader';
$wp_reset = 'https://wp.example.test/wp-login.php?login=reader&key=' . $key . '&action=rp&wp_lang=en_US';
$woo_reset = 'https://wp.example.test/my-account/lost-password/?key=' . $key . '&id=7&login=reader';
$woo_new = 'https://wp.example.test/my-account/lost-password/?action=newaccount&key=' . $key . '&login=reader';
foreach (array($wp_reset, $woo_reset, $woo_new) as $url) {
    check(email_content($url) === $reset, 'native account/password link uses React reset credentials');
    check(email_content('<a href="' . htmlspecialchars($url, ENT_QUOTES) . '">Confirm your account</a>') === '<a href="' . esc_url($reset) . '">Confirm your account</a>', 'HTML account link preserves label and escapes credentials');
}
check(check_password_reset_key($key, 'reader') === $customer, 'rewriting never replaces the original single-use key');
$message = '<a href="https://wp.example.test/"><img src="https://wp.example.test/wp-content/uploads/logo.png"></a>'
    . '<a href="https://wp.example.test/my-account/">My account</a>'
    . '<a href="https://wp.example.test/my-account/orders/">Orders</a>'
    . '<a href="https://wp.example.test/my-account/downloads/">Downloads</a>';
$expected = '<a href="https://shop.example.test/"><img src="https://wp.example.test/wp-content/uploads/logo.png"></a>'
    . '<a href="https://shop.example.test/account">My account</a>'
    . '<a href="https://shop.example.test/account?view=orders">Orders</a>'
    . '<a href="https://shop.example.test/account?view=downloads">Downloads</a>';
check(email_content($message) === $expected, 'logo and account navigation move to React while image sources stay in WordPress');
check(email_content($expected) === $expected, 'already rewritten emails are unchanged');
check($hooks['woocommerce_email_header_image_url']('https://wp.example.test') === 'https://shop.example.test', 'Woo header and preview link use frontend');
check($hooks['woocommerce_email_header_image_url']('') === '', 'intentionally disabled logo links remain disabled');
check(email_content('Log in: https://wp.example.test/wp-login.php.') === 'Log in: https://shop.example.test/login.', 'plain-text login URL preserves sentence punctuation');
check(email_content('https://wp.example.test/wp-login.php?action=lostpassword') === 'https://shop.example.test/forgot-password', 'WordPress recovery form routes to frontend');
check(email_content(wc_get_account_endpoint_url('lost-password')) === 'https://shop.example.test/forgot-password', 'Woo recovery form routes to frontend');

foreach (array(
    'https://wp.example.test/?download_file=12&order=wc_order_test&key=permission',
    'https://wp.example.test/?confirm_account=token',
    'https://wp.example.test/wp-login.php?action=confirm_admin_email&confirm_key=token',
    'https://wp.example.test/my-account/lost-password/?key[]=invalid&login=reader',
    'https://wp.example.test/my-account/lost-password/?key=' . $key . '&login=reader&id=8',
    'https://wp.example.test/my-account/lost-password/?key=' . $key . '&login=missing',
    'https://wp.example.test/my-account/lost-password/?key=' . $key . '&login=admin',
    'https://wp.example.test/wp-admin/post.php?post=12&action=edit',
    'https://wp.example.test/checkout/order-pay/12/?key=wc_order_test',
    'https://wp.example.test/wp-json/lld-headless/v1/account',
    'https://wp.example.test.evil.test/wp-login.php?action=rp&key=token&login=reader',
    'https://external.example.test/wp-login.php?action=rp&key=token&login=reader',
    'https://wp.example.test:8443/wp-login.php?action=rp&key=token&login=reader',
    'https://user@wp.example.test/wp-login.php?action=rp&key=token&login=reader',
    'https://preview.example.test/reset-password#key=' . $key . '&login=reader',
) as $url) check(email_content($url) === $url, 'protected, unknown, staff and external actions retain their original handler');

$notification = array('to' => $customer->user_email, 'subject' => 'Login details', 'message' => "Set password: <$wp_reset>\nhttps://wp.example.test/wp-login.php\n", 'headers' => '');
$new_email = $hooks['wp_new_user_notification_email']($notification, $customer);
check($new_email['message'] === "Set password: <$reset>\nhttps://shop.example.test/login\n", 'WordPress new-user email uses existing React pages');
check(array_diff_key($new_email, array('message' => true)) === array_diff_key($notification, array('message' => true)), 'recipient, subject and delivery headers remain intact');
check($hooks['retrieve_password_notification_email']($notification, $key, 'reader', $customer) === $new_email, 'WordPress password notification receives the same URL handling');
check($hooks['wp_new_user_notification_email']($notification, $users[8]) === $notification, 'administrator welcome emails remain entirely unchanged');
check($hooks['retrieve_password_notification_email']($notification, $key, 'admin', $users[8]) === $notification, 'administrator recovery email remains entirely unchanged');

$multipart = new class { function get_email_type() { return 'multipart'; } };
$params = array('reader@example.test', 'Account', $message);
check($hooks['woocommerce_mail_callback_params']($params, $multipart) === $params, 'multipart setup preserves mail arguments');
$mailer = (object) array('AltBody' => $woo_reset);
$hooks['phpmailer_init']($mailer);
check($mailer->AltBody === $reset && !isset($hooks['phpmailer_init']), 'multipart text alternative is rewritten and callback is removed');
$hooks['woocommerce_mail_callback_params']($params, $multipart);
$hooks['woocommerce_email_sent']();
check(!isset($hooks['phpmailer_init']), 'a short-circuited send does not affect the next unrelated email');

parse_str(parse_url($reset, PHP_URL_FRAGMENT), $credentials);
$wpdb = new AccountDB();
$result = account_call('reset', array_merge($credentials, array('password' => 'password-from-native-email')));
check($result->data['ok'] && $customer->password === 'password-from-native-email', 'rewritten native email credentials work with the actual account reset handler');
check(is_wp_error(account_call('reset', array_merge($credentials, array('password' => 'password-from-native-email')))), 'rewritten native email remains single-use');

$users[30] = new WP_User(30, 'special@example.test', 'Special', array('subscriber'), 'a+b@example.test');
$special = 'https://wp.example.test/my-account/lost-password/?key=existing-key&login=a%2Bb%40example.test';
check(email_content($special) === 'https://shop.example.test/reset-password#key=existing-key&login=a%2Bb%40example.test', 'encoded usernames round-trip through the React fragment');
$email_lost_slug = 'recover';
check(email_content('https://wp.example.test/my-account/recover/?key=' . $key . '&login=reader') === $reset, 'custom Woo recovery endpoint is recognized');
$email_account = 'https://wp.example.test/?page_id=23';
check(email_content($email_account . '&recover=&key=' . $key . '&login=reader') === $reset, 'plain Woo permalinks keep reset credentials');
check(email_content($email_account . '&orders=') === 'https://shop.example.test/account?view=orders', 'plain account permalinks map to the correct dashboard view');
$email_site = 'https://wp.example.test/cms';
check(email_content($email_site . '/wp-login.php?action=rp&key=' . $key . '&login=reader') === $reset, 'WordPress installed in a subdirectory is supported');

foreach (array('', 'http://shop.example.test', 'https://shop.example.test/path', 'https://shop.example.test?key=bad', 'https://shop.example.test/#fragment', 'https://user:pass@shop.example.test', 'javascript:alert(1)') as $invalid) {
    $email_brand['website'] = $invalid;
    check(email_content($message) === $message, 'missing or unsafe frontend configuration leaves mail usable');
}
$email_brand['website'] = 'https://shop.example.test';
$email_settings = false;
check(email_content($message) === $message, 'unpublished storefront settings do not change email URLs');
echo "Email link checks complete.\n";
