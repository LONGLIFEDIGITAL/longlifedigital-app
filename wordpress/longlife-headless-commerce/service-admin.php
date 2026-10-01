<?php
/** Storefront URL controls for the headless Service post type. */
if (!defined('ABSPATH')) { exit; }

add_action('enqueue_block_editor_assets', function () {
    $screen = get_current_screen();
    if (!$screen || $screen->post_type !== 'lld_service') return;
    wp_enqueue_script('lld-service-address', plugins_url('service-admin.js', __FILE__), array('wp-data', 'wp-editor'), '0.4.2', true);
});

add_action('add_meta_boxes_lld_service', function ($post) {
    add_meta_box(
        'lld-service-address',
        'Service page address',
        'lld_service_address_fields',
        'lld_service',
        'normal',
        'high',
        array('__block_editor_compatible_meta_box' => true)
    );
});

function lld_service_address_fields($post) {
    wp_nonce_field('lld_service_address_' . $post->ID, 'lld_service_address_nonce');
    echo '<p><label for="lld-service-slug"><strong>Service slug</strong></label></p>';
    echo '<input type="text" id="lld-service-slug" name="lld_service_slug" class="widefat" value="' . esc_attr($post->post_name) . '" placeholder="portfolio-management" autocomplete="off" spellcheck="false" aria-describedby="lld-service-slug-help">';
    echo '<p id="lld-service-slug-help">Enter only the last part of the address, for example <code>portfolio-management</code>. Save or update the service to apply it. Leave blank to keep the current slug, or let WordPress generate one from the title for a new service.</p>';
    if ($post->post_name !== '') {
        echo '<p>Saved storefront path: <code>' . esc_html('/services/' . $post->post_name) . '</code></p>';
    }
    echo '<p>WordPress may add a number if the slug is already in use. Reload after saving to see the final address. Changing a published slug changes its storefront URL; existing links to the old address will need updating.</p>';
}

function lld_save_service_address($post_id, $post) {
    if ($post->post_type !== 'lld_service'
        || (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE)
        || wp_is_post_revision($post_id)
        || !current_user_can('edit_post', $post_id)) return;

    $nonce = $_POST['lld_service_address_nonce'] ?? null;
    $submitted = $_POST['lld_service_slug'] ?? null;
    if (!is_string($nonce) || !is_string($submitted)
        || !wp_verify_nonce(wp_unslash($nonce), 'lld_service_address_' . $post_id)) return;

    $slug = sanitize_title(wp_unslash($submitted));
    if ($slug === '' || $slug === $post->post_name) return;

    // Use WordPress's native slug sanitization/uniqueness rules without re-entering this hook.
    remove_action('save_post_lld_service', 'lld_save_service_address', 10);
    try {
        wp_update_post(array('ID' => $post_id, 'post_name' => $slug));
    } finally {
        add_action('save_post_lld_service', 'lld_save_service_address', 10, 2);
    }
}
add_action('save_post_lld_service', 'lld_save_service_address', 10, 2);
