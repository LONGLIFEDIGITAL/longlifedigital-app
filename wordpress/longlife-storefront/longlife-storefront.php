<?php
/**
 * Plugin Name: Longlife Storefront Product Content
 * Description: Publishes only the approved ACF product display fields through WooCommerce's public Store API.
 * Version: 1.2.0
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
            $button_label = $read('lld_button_product_label');
            $result['button_product_label'] = in_array($button_label, array('spreadsheet', 'ebook', 'template', 'course'), true) ? $button_label : 'product';
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
            // Publish only the two dedicated sample images, never product downloads.
            $result['ebook_preview_pages'] = array();
            foreach (array('lld_ebook_preview_page_1', 'lld_ebook_preview_page_2') as $field) {
                $sample = $read($field);
                if (!is_array($sample)) { continue; }
                $attachment_id = (int) ($sample['attachment'] ?? 0);
                $attachment = wp_attachment_is_image($attachment_id) ? wp_get_attachment_image_src($attachment_id, 'full') : false;
                $external = isset($sample['public_url']) && is_string($sample['public_url']) ? trim($sample['public_url']) : '';
                $src = esc_url_raw($external ?: ($attachment[0] ?? ''), array('https'));
                if (!$src || wp_parse_url($src, PHP_URL_SCHEME) !== 'https') { continue; }
                $alt = !empty($sample['alt']) ? $sample['alt'] : get_post_meta($attachment_id, '_wp_attachment_image_alt', true);
                $result['ebook_preview_pages'][] = array(
                    'src' => $src,
                    'alt' => is_string($alt) ? sanitize_text_field($alt) : '',
                    'width' => !$external && $attachment ? (int) $attachment[1] : 0,
                    'height' => !$external && $attachment ? (int) $attachment[2] : 0,
                );
            }
            return $result;
        },
        'schema_callback' => function () {
            $schema = array();
            foreach (array('level', 'duration', 'compatibility', 'license_summary', 'includes', 'seo_title', 'meta_description', 'share_image') as $field) {
                $schema[$field] = array('description' => 'Public storefront ' . $field, 'type' => 'string', 'readonly' => true, 'context' => array('view'));
            }
            $schema['noindex'] = array('description' => 'Search indexing preference', 'type' => 'boolean', 'readonly' => true, 'context' => array('view'));
            $schema['button_product_label'] = array(
                'description' => 'Short product noun for the homepage hero button.',
                'type' => 'string',
                'enum' => array('product', 'spreadsheet', 'ebook', 'template', 'course'),
                'readonly' => true,
                'context' => array('view'),
            );
            $schema['ebook_preview_pages'] = array(
                'description' => 'Up to two public ebook sample page images, separate from purchased files.',
                'type' => 'array',
                'maxItems' => 2,
                'readonly' => true,
                'context' => array('view'),
                'items' => array(
                    'type' => 'object',
                    'properties' => array(
                        'src' => array('type' => 'string', 'format' => 'uri'),
                        'alt' => array('type' => 'string'),
                        'width' => array('type' => 'integer'),
                        'height' => array('type' => 'integer'),
                    ),
                ),
            );
            return $schema;
        },
        'schema_type' => ARRAY_A,
    ));
});
