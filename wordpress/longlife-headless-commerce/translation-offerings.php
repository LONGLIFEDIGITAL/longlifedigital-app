<?php
/** Editable ACF Free document catalog. No uploaded documents are stored here. */
if (!defined('ABSPATH')) { exit; }

function lld_translation_offerings_decode($value) {
    if (!is_string($value) || strlen($value) > 100000) return null;
    $rows = json_decode($value, true);
    // Require a JSON list, including an intentionally empty list.
    if (!is_array($rows) || substr(ltrim($value), 0, 1) !== '[' || count($rows) > 50) return null;
    $seen = array();
    foreach ($rows as &$row) {
        if (!is_array($row) || !is_string($row['id'] ?? null) || !preg_match('/^[a-z][a-z0-9_-]{0,63}$/D', $row['id']) || isset($seen[$row['id']])
            || !is_string($row['title'] ?? null) || trim($row['title']) === '' || mb_strlen($row['title']) > 160
            || !is_string($row['note'] ?? null) || mb_strlen($row['note']) > 600
            || !in_array($row['unit'] ?? null, array('document', 'page', 'package'), true)
            || !is_bool($row['enabled'] ?? null) || !array_key_exists('price', $row)
            || ($row['price'] !== null && ((!is_int($row['price']) && !is_float($row['price'])) || !is_finite((float) $row['price']) || $row['price'] < 0 || $row['price'] > 10000))
            || !is_int($row['documents'] ?? null) || $row['documents'] < 1 || $row['documents'] > 200) return null;
        $seen[$row['id']] = true;
        // Missing choices preserve catalogs saved before the dependent dropdown.
        $choices = array_key_exists('documentTypes', $row) ? $row['documentTypes'] : array();
        if (!is_array($choices) || count($choices) > 50 || ($choices && array_keys($choices) !== range(0, count($choices) - 1))) return null;
        $seen_choices = array();
        $row['documentTypes'] = array();
        foreach ($choices as $name) {
            if (!is_string($name) || trim($name) === '' || mb_strlen($name) > 160 || preg_match('/[\r\n\x00]/', $name)) return null;
            $label = trim($name);
            $key = mb_strtolower($label);
            if (isset($seen_choices[$key])) return null;
            $seen_choices[$key] = true;
            $row['documentTypes'][] = $label;
        }
    }
    unset($row);
    return $rows;
}

function lld_translation_offerings_load($value, $post_id) {
    // Never reinstate defaults after an editor saved/hid/removed offerings.
    if (metadata_exists('post', $post_id, 'lld_translation_offerings')) return $value;
    if (get_post_meta($post_id, 'lld_service_layout', true) !== 'translation') return '[]';
    // Compatibility with the initial release. Import content supplies this field
    // for new services; legacy services get starter rows with their SAVED rates.
    $rows = json_decode(file_get_contents(__DIR__ . '/translation-starter.json'), true);
    foreach ($rows as &$row) {
        $key = 'lld_translation_prices_' . $row['id'];
        if (metadata_exists('post', $post_id, $key)) {
            $rate = get_post_meta($post_id, $key, true);
            $row['price'] = is_numeric($rate) && (float) $rate >= 0 && (float) $rate <= 10000 ? (float) $rate : null;
        } else {
            $row['price'] = null;
        }
    }
    unset($row);
    return wp_json_encode($rows);
}
add_filter('acf/load_value/name=lld_translation_offerings', 'lld_translation_offerings_load', 10, 2);

function lld_translation_offerings_validate($valid, $value) {
    if ($valid !== true) return $valid;
    // ACF's admin AJAX validation forwards WordPress-slashed $_POST values.
    // Unslash that transport layer only when the input is not already JSON.
    // Stored JSON and unslashed REST values must keep their legitimate escapes.
    if (is_string($value)) {
        json_decode($value);
        if (json_last_error() !== JSON_ERROR_NONE) $value = wp_unslash($value);
    }
    return lld_translation_offerings_decode($value) !== null ? true
        : 'Check Documents and packages offered: use unique entries, a name, a billing unit, prices from 0 to 10,000 (or blank), and package counts from 1 to 200. Up to 50 entries are supported. Document choices must be unique within each group, one per line, with up to 50 choices of 160 characters each.';
}
add_filter('acf/validate_value/name=lld_translation_offerings', 'lld_translation_offerings_validate', 10, 2);

add_action('acf/input/admin_enqueue_scripts', function () {
    $screen = get_current_screen();
    if (!$screen || $screen->post_type !== 'lld_service') return;
    wp_enqueue_script('lld-translation-offerings', plugins_url('translation-offerings-admin.js', __FILE__), array('acf-input'), '0.6.3', true);
    wp_enqueue_style('lld-translation-offerings', plugins_url('translation-offerings-admin.css', __FILE__), array(), '0.6.1');
});
