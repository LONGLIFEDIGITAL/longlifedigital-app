<?php
/**
 * Plugin Name: Longlife Storefront Product Content
 * Description: Publishes only the approved ACF product display fields through WooCommerce's public Store API.
 * Version: 1.0.0
 * Requires Plugins: woocommerce
 */
if (!defined('ABSPATH')) { exit; }

add_action('woocommerce_blocks_loaded', function () {
    if (!function_exists('woocommerce_store_api_register_endpoint_data')) { return; }
    woocommerce_store_api_register_endpoint_data(array(
        'endpoint' => \Automattic\WooCommerce\StoreApi\Schemas\V1\ProductSchema::IDENTIFIER,
        'namespace' => 'longlife-content',
        'data_callback' => function ($product) {
            if (!function_exists('get_field') || $product->get_status() !== 'publish' || post_password_required($product->get_id())) { return array(); }
            $read = function ($name) use ($product) { return get_field($name, $product->get_id()); };
            $result = array();
            foreach (array('level', 'duration', 'compatibility', 'license_summary', 'seo_title', 'meta_description') as $field) {
                $value = $read('lld_' . $field);
                $result[$field] = is_string($value) ? sanitize_textarea_field($value) : '';
            }
            $includes = $read('lld_includes');
            $result['includes'] = is_string($includes) ? wp_kses_post($includes) : '';
            $result['noindex'] = (bool) $read('lld_noindex');
            $image = $read('lld_share_image');
            $result['share_image'] = '';
            if (is_array($image)) {
                $src = !empty($image['public_url']) ? $image['public_url'] : wp_get_attachment_image_url((int) ($image['attachment'] ?? 0), 'full');
                $result['share_image'] = $src ? esc_url_raw($src, array('https')) : '';
            }
            return $result;
        },
        'schema_callback' => function () {
            $schema = array();
            foreach (array('level', 'duration', 'compatibility', 'license_summary', 'includes', 'seo_title', 'meta_description', 'share_image') as $field) {
                $schema[$field] = array('description' => 'Public storefront ' . $field, 'type' => 'string', 'readonly' => true, 'context' => array('view'));
            }
            $schema['noindex'] = array('description' => 'Search indexing preference', 'type' => 'boolean', 'readonly' => true, 'context' => array('view'));
            return $schema;
        },
        'schema_type' => ARRAY_A,
    ));
});
