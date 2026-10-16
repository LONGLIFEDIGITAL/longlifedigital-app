<?php
if (!defined('ABSPATH')) { exit; }

// Validate again at the mail boundary. Neither a public client nor its forwarded
// payload decides the recipient, subject, certification claims or payment price.
function lld_translation_inquiry_fields($request, $service_id) {
    $value = $request->get_param('translation');
    $enabled = function_exists('get_field') && get_field('lld_service_layout', $service_id) === 'translation';
    if (!$enabled) return $value === null ? array() : lld_error('Translation service unavailable.', 404);
    if (!is_array($value)) return lld_error('Translation details are required.');
    $languages = array('English', 'Haitian Creole', 'French', 'Spanish');
    $services = array();
    $catalog = lld_translation_offerings_load(get_post_meta($service_id, 'lld_translation_offerings', true), $service_id);
    foreach (lld_translation_offerings_decode($catalog) ?? array() as $row) {
        if ($row['enabled']) $services[$row['id']] = $row;
    }
    $delivery = array('digital' => 'Digital delivery', 'mail_standard' => 'USPS with tracking', 'mail_overnight' => 'Overnight hard copy');
    foreach (array('type', 'source', 'target', 'service', 'delivery') as $field) {
        if (!isset($value[$field]) || !is_string($value[$field])) return lld_error('Invalid translation details.');
    }
    if (!isset($services[$value['service']])) return lld_error('Document service unavailable. Please reload the form and choose a current option.', 422);
    $document = array_key_exists('document', $value) ? $value['document'] : '';
    if (!is_string($document) || mb_strlen($document) > 160 || preg_match('/[\r\n\x00]/', $document)) return lld_error('Invalid document selection.');
    $choices = $services[$value['service']]['documentTypes'];
    if (($choices || $document !== '') && !in_array($document, $choices, true)) return lld_error('Document choice unavailable. Please reload the form and choose a current document.', 422);
    if (!in_array($value['type'], array('certified', 'standard'), true)
        || !in_array($value['source'], $languages, true) || !in_array($value['target'], $languages, true)
        || $value['source'] === $value['target'] || ($value['source'] !== 'English' && $value['target'] !== 'English')
        || !isset($services[$value['service']]) || !isset($delivery[$value['delivery']])) return lld_error('Invalid translation selection.');
    foreach (array('documents', 'pages') as $field) {
        if (!isset($value[$field]) || !is_int($value[$field]) || $value[$field] < 1 || $value[$field] > 200) return lld_error('Invalid document or page count.');
    }
    if ($value['pages'] < $value['documents']
        || ($services[$value['service']]['unit'] === 'package' && $value['documents'] !== $services[$value['service']]['documents'])
        || !isset($value['rush'], $value['notarized']) || !is_bool($value['rush']) || !is_bool($value['notarized'])
        || ($value['consent'] ?? null) !== true) return lld_error('Invalid translation options or consent.');
    return array(
        'translationType' => $value['type'] === 'certified' ? 'Certified translation' : 'Standard translation (custom quote)',
        'sourceLanguage' => $value['source'], 'targetLanguage' => $value['target'],
        'documentService' => sanitize_text_field($services[$value['service']]['title']), 'documents' => (string) $value['documents'], 'pages' => (string) $value['pages'],
        'document' => sanitize_text_field($document),
        'rush' => $value['rush'] ? '24-hour rush requested; confirm availability and surcharge' : 'Standard; confirm turnaround',
        'notarized' => $value['notarized'] ? 'Requested; confirm per-document fee' : 'Not requested',
        'delivery' => $delivery[$value['delivery']], 'consent' => 'Agreed to privacy policy, service terms and inquiry follow-up',
    );
}
