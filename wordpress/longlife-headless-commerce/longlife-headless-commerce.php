<?php
/**
 * Plugin Name: Longlife Headless Commerce
 * Description: Authenticated React checkout bridge for WooCommerce Store API and Stripe card payments.
 * Version: 0.6.5
 * Requires Plugins: woocommerce
 * Requires PHP: 8.0
 */
if (!defined('ABSPATH')) { exit; }
require_once __DIR__ . '/security.php';
require_once __DIR__ . '/alerts.php';
require_once __DIR__ . '/account.php';
require_once __DIR__ . '/email-links.php';
require_once __DIR__ . '/translation-offerings.php';
require_once __DIR__ . '/translation-inquiry.php';
require_once __DIR__ . '/inquiry.php';
require_once __DIR__ . '/forms.php';
require_once __DIR__ . '/newsletter-confirmation.php';
require_once __DIR__ . '/service-admin.php';
require_once __DIR__ . '/checkout.php';
require_once __DIR__ . '/first-order-coupons.php';

register_activation_hook(__FILE__, function () {
    global $wpdb;
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    $table = $wpdb->prefix . 'lld_commerce';
    dbDelta("CREATE TABLE $table (
        record_key varchar(64) NOT NULL,
        kind varchar(16) NOT NULL,
        payload longtext NOT NULL,
        created bigint unsigned NOT NULL,
        PRIMARY KEY  (record_key)
    ) " . $wpdb->get_charset_collate() . ';');
    add_option('lld_bridge_secret', bin2hex(random_bytes(32)), '', false);
    add_option('lld_checkout_enabled', '0', '', false);
});
add_action('admin_init', function () {
    register_setting('general', 'lld_checkout_enabled', array('sanitize_callback' => function ($v) { return $v === '1' ? '1' : '0'; }));
    add_settings_field('lld_headless_checkout', 'Longlife headless checkout', function () {
        echo '<input type="hidden" name="lld_checkout_enabled" value="0">';
        echo '<label><input type="checkbox" name="lld_checkout_enabled" value="1" ' . checked(get_option('lld_checkout_enabled'), '1', false) . '> Enable React checkout</label>';
        echo '<p>Checkout checks the required WooCommerce and Stripe payment, verification and download APIs. New plugin versions produce an administrator warning rather than disabling purchases solely because of their version. Cards, automatic capture, guest checkout and matching Stripe credentials are still required. Uses the Stripe mode selected in WooCommerce: live mode charges real payments. Test updates on staging before production.</p>';
        echo '<p>Critical checkout alerts go to admin@longlifedigital.com, at most once per category every six hours. Ordinary card declines and customer validation errors do not send alerts.</p>';
        echo '<p>Copy this integration secret into the server-only LLD_COMMERCE_BRIDGE_SECRET environment variable. Do not place it in a VITE_ setting or share it publicly.</p>';
        echo '<input id="lld-integration-secret" type="password" readonly class="large-text" autocomplete="off" spellcheck="false" aria-label="Longlife integration secret" aria-describedby="lld-secret-status" value="' . esc_attr(get_option('lld_bridge_secret')) . '">';
        echo '<p><button id="lld-secret-toggle" type="button" class="button" aria-controls="lld-integration-secret" aria-label="Show integration secret" aria-pressed="false">Show</button> ';
        echo '<button id="lld-secret-copy" type="button" class="button">Copy secret</button></p>';
        echo '<p id="lld-secret-status" role="status" aria-live="polite">Use Show to reveal the secret or Copy secret to copy it.</p>';
    }, 'general');
});
add_action('admin_enqueue_scripts', function ($hook) {
    if ($hook === 'options-general.php' && current_user_can('manage_options')) {
        wp_enqueue_script('lld-commerce-settings', plugins_url('admin-settings.js', __FILE__), array(), '0.2.1', true);
    }
});
add_action('before_woocommerce_init', function () {
    if (class_exists('Automattic\\WooCommerce\\Utilities\\FeaturesUtil')) {
        Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('custom_order_tables', __FILE__, true);
    }
});
add_action('rest_api_init', function () {
    register_rest_route('lld-headless/v1', '/config', array(
        'methods' => 'GET', 'permission_callback' => '__return_true',
        'callback' => function () { return lld_response(lld_checkout_health_check()); },
    ));
    register_rest_route('lld-headless/v1', '/alert', array(
        'methods' => 'POST', 'permission_callback' => 'lld_authenticate_bridge', 'callback' => 'lld_checkout_alert_endpoint',
    ));
    register_rest_route('lld-headless/v1', '/account', array(
        'methods' => 'POST', 'permission_callback' => 'lld_authenticate_bridge', 'callback' => 'lld_account',
    ));
    register_rest_route('lld-headless/v1', '/inquiry', array(
        'methods' => 'POST', 'permission_callback' => 'lld_authenticate_bridge', 'callback' => 'lld_service_inquiry',
    ));
    register_rest_route('lld-headless/v1', '/contact', array(
        'methods' => 'POST', 'permission_callback' => 'lld_authenticate_bridge', 'callback' => 'lld_contact_form',
    ));
    register_rest_route('lld-headless/v1', '/newsletter', array(
        'methods' => 'POST', 'permission_callback' => 'lld_authenticate_bridge', 'callback' => 'lld_newsletter_signup',
    ));
    register_rest_route('lld-headless/v1', '/order', array(
        'methods' => 'POST', 'permission_callback' => 'lld_authenticate_bridge', 'callback' => 'lld_order_status',
    ));
});
