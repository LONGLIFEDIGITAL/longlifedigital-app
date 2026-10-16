<?php
// Isolated mail boundary tests: no WordPress connection, SMTP or real documents.
define('ABSPATH', __DIR__);
define('DAY_IN_SECONDS', 86400);
class WP_Error { function __construct(public $message, public $status = 400) {} }
function lld_error($message, $status = 400) { return new WP_Error($message, $status); }
function is_wp_error($v) { return $v instanceof WP_Error; }
function lld_response($v) { return $v; }
function get_field($name, $id) { return $GLOBALS['layout']; }
function add_action(...$args) {}
function add_filter(...$args) {}
function metadata_exists($type, $id, $key) { return array_key_exists($key, $GLOBALS['meta']); }
function get_post_meta($id, $key, $single) { return $GLOBALS['meta'][$key] ?? ''; }
function get_post($id) { return $id === 43 ? (object) array('post_type' => 'lld_service', 'post_status' => $GLOBALS['published'] ? 'publish' : 'draft', 'post_password' => '', 'post_title' => 'Document Translation') : null; }
function sanitize_text_field($v) { return strip_tags($v); }
function sanitize_textarea_field($v) { return strip_tags($v); }
function is_email($v) { return filter_var($v, FILTER_VALIDATE_EMAIL); }
function wp_json_encode($v) { return json_encode($v); }
function wp_unslash($v) { return stripslashes($v); }
function wp_salt($v) { return 'translation-test-salt'; }
function wp_strip_all_tags($v) { return strip_tags($v); }
function esc_html($v) { return htmlspecialchars($v, ENT_QUOTES); }
function lld_record($key) { return $GLOBALS['records'][$key] ?? null; }
function lld_insert($key, $kind, $value) { if (isset($GLOBALS['records'][$key])) return false; $GLOBALS['records'][$key] = $value; return true; }
function lld_save($key, $value) { $GLOBALS['records'][$key] = $value; }
function lld_delete($key) { unset($GLOBALS['records'][$key]); }
function wc_get_logger() { return new class { function error(...$args) { $GLOBALS['logs'][] = $args; } }; }
class WC_Emails {
    static function instance() { return new self; }
    function wrap_message($subject, $message) { return $message; }
    function send(...$args) { $GLOBALS['mail'][] = $args; return $GLOBALS['mail_ok']; }
}
class Request { function __construct(public $data) {} function get_param($key) { return $this->data[$key] ?? null; } }
$wpdb = new class { public $prefix = 'wp_'; function prepare($query, ...$args) { return $query; } function query($query) { return 1; } };
require __DIR__ . '/../wordpress/longlife-headless-commerce/translation-offerings.php';
require __DIR__ . '/../wordpress/longlife-headless-commerce/translation-inquiry.php';
require __DIR__ . '/../wordpress/longlife-headless-commerce/inquiry.php';
function check($condition, $message) { if (!$condition) throw new RuntimeException($message); }
function reset_state() { $GLOBALS['meta'] = ['lld_translation_offerings' => file_get_contents(__DIR__ . '/../wordpress/longlife-headless-commerce/translation-starter.json')]; $GLOBALS['layout'] = 'translation'; $GLOBALS['published'] = true; $GLOBALS['records'] = []; $GLOBALS['mail'] = []; $GLOBALS['logs'] = []; $GLOBALS['mail_ok'] = true; }
function request($patch = [], $translation = []) {
    return new Request(array_merge(array('serviceId' => 43, 'requestId' => '6b030225-d7f1-4695-9e62-8dd372379a41', 'firstName' => 'Alex', 'lastName' => 'River', 'email' => 'alex@example.test', 'phone' => '+1 555 123 4567', 'client' => str_repeat('a', 64), 'message' => 'Private document text', 'recipient' => 'other@example.test', 'subject' => 'Untrusted subject', 'translation' => array_merge(array('type' => 'certified', 'source' => 'French', 'target' => 'English', 'service' => 'certificate', 'documents' => 1, 'pages' => 1, 'rush' => false, 'notarized' => false, 'delivery' => 'digital', 'consent' => true, 'fileUrl' => 'https://private.example.test/file', 'total' => 1), $translation)), $patch));
}
reset_state();
check(lld_service_inquiry(request()) === ['ok' => true], 'quote accepted');
check(count($mail) === 1 && $mail[0][0] === 'info@longlifedigital.co', 'fixed info recipient');
check($mail[0][1] === 'Document Translation Inquiry', 'server title controls subject');
check(str_contains($mail[0][3], 'Reply-To: alex@example.test'), 'reply to visitor');
check(str_contains($mail[0][2], 'French') && str_contains($mail[0][2], 'Original language'), 'structured translation fields emailed');
check(!str_contains($mail[0][2], 'Private document text') && !str_contains($mail[0][2], 'private.example.test'), 'no document contents or file URLs');
check(!str_contains(json_encode($records), 'alex@example.test'), 'no personal details persisted in replay records');
check(lld_service_inquiry(request()) === ['ok' => true] && count($mail) === 1, 'unchanged retry does not resend');
check(lld_service_inquiry(request([], ['rush' => true]))->status === 409, 'changed metadata cannot reuse accepted inquiry id');
reset_state(); $mail_ok = false;
check(lld_service_inquiry(request())->status === 503 && !$records, 'mail failure remains retryable');
reset_state(); $published = false;
check(lld_service_inquiry(request())->status === 404 && !$mail, 'draft service cannot receive inquiry');
foreach ([['source' => 'French', 'target' => 'Spanish'], ['target' => 'French'], ['documents' => 0], ['pages' => 1.5], ['documents' => 2], ['service' => 'family'], ['consent' => false], ['rush' => 'true'], ['delivery' => 'fake'], ['source' => "French\r\nBcc:other@example.test"]] as $patch) {
    reset_state();
    check(lld_service_inquiry(request([], $patch))->status === 400 && !$mail, 'invalid metadata rejected before email');
}
reset_state();
check(lld_service_inquiry(request(['translation' => null]))->status === 400, 'translation form fields required');
reset_state(); $layout = 'standard';
check(lld_service_inquiry(request())->status === 404, 'translation fields rejected for generic service');
check(lld_service_inquiry(request(['translation' => null, 'message' => 'Website project'])) === ['ok' => true], 'ordinary inquiries still work');
check(str_contains($mail[0][2], 'Website project'), 'ordinary project description retained');
echo "Translation and ordinary inquiry mail boundary checks passed.\n";

reset_state();
$rows = [['id' => 'passport', 'title' => 'Passports', 'note' => '', 'unit' => 'document', 'price' => 22, 'documents' => 1, 'enabled' => true], ['id' => 'study', 'title' => 'Study bundle', 'note' => '', 'unit' => 'package', 'price' => 90, 'documents' => 5, 'enabled' => true]];
$meta['lld_translation_offerings'] = json_encode($rows);
check(lld_service_inquiry(request([], ['service' => 'passport', 'title' => 'Fake title'])) === ['ok' => true], 'new document accepted without code changes');
check(str_contains($mail[0][2], 'Passports') && !str_contains($mail[0][2], 'Fake title'), 'saved document name controls email');
check(lld_service_inquiry(request([], ['service' => 'medical']))->status === 422, 'removed document rejected');
$rows[0]['enabled'] = false; $meta['lld_translation_offerings'] = json_encode($rows);
check(lld_service_inquiry(request([], ['service' => 'passport']))->status === 422, 'hidden document rejected');
check(lld_service_inquiry(request([], ['service' => 'study', 'documents' => 3, 'pages' => 3]))->status === 400, 'package validates current count');
check(is_array(lld_translation_inquiry_fields(request([], ['service' => 'study', 'documents' => 5, 'pages' => 5]), 43)), 'custom package size accepted');
$meta = ['lld_service_layout' => 'translation', 'lld_translation_prices_certificate' => '63.50', 'lld_translation_prices_diploma' => '', 'lld_translation_prices_medical' => '0'];
$migrated = lld_translation_offerings_decode(lld_translation_offerings_load(null, 43));
check($migrated[0]['price'] === 63.5 && $migrated[1]['price'] === null && $migrated[4]['price'] === 0, 'upgrade preserves edited, blank and zero prices');
$meta['lld_translation_offerings'] = '[]';
check(lld_translation_offerings_load('[]', 43) === '[]', 'empty catalog never restores defaults');
check(lld_service_inquiry(request())->status === 422, 'empty catalog accepts no document inquiry');
check(lld_translation_offerings_validate(true, json_encode([$rows[0], $rows[0]])) !== true, 'duplicate IDs rejected when saving');
check(lld_translation_offerings_validate(true, '[]') === true, 'removing all entries is allowed');
echo "Editable translation offerings and upgrade checks passed.\n";

// WordPress applies magic quotes to POST before ACF's AJAX validation passes
// each value to acf/validate_value. Exercise that boundary, not just stored JSON.
$saved_rows = json_decode(file_get_contents(__DIR__ . '/../wordpress/longlife-headless-commerce/translation-starter.json'), true);
foreach ($saved_rows as &$saved_row) { $saved_row['documentTypes'] = array(); }
unset($saved_row);
$saved_rows[0]['documentTypes'] = array('Birth certificate', 'Child\'s "diplôme"');
$saved_rows[6]['enabled'] = false;
$saved_rows[0]['title'] = 'Child\'s "certified" document';
$saved_rows[0]['note'] = "Keep C:\\documents\\original and quoted \"names\".\nSecond line: diplôme.";
$saved_rows[1]['price'] = null;
$saved_rows[2]['price'] = 0;
$json = json_encode($saved_rows);
$posted = addslashes($json);
check(lld_translation_offerings_validate(true, $posted) === true, 'ACF save accepts WordPress-escaped valid JSON, including hidden entries');
check(lld_translation_offerings_validate(true, $json) === true, 'already decoded REST/programmatic input is accepted without stripping its content');
check(lld_translation_offerings_decode($posted) === null, 'stored-value reader stays strict and does not unslash content');
check(lld_translation_offerings_decode(wp_unslash($posted)) === $saved_rows, 'normal WordPress storage unescaping preserves quotes, apostrophes, backslashes and newlines');
foreach ([array_merge($saved_rows, [$saved_rows[0]]), [array_merge($saved_rows[0], ['title' => ''])], [array_merge($saved_rows[0], ['price' => -1])], [array_merge($saved_rows[0], ['documents' => 0])], [array_merge($saved_rows[0], ['enabled' => 'false'])]] as $invalid_rows) {
    check(lld_translation_offerings_validate(true, addslashes(json_encode($invalid_rows))) !== true, 'escaped invalid rows still rejected');
}
check(lld_translation_offerings_validate('Earlier field error', $posted) === 'Earlier field error', 'earlier ACF validation failure preserved');
check(lld_translation_offerings_validate(true, 'not JSON') !== true, 'malformed JSON still rejected');
check(lld_translation_offerings_validate(true, null) !== true, 'missing non-string value still rejected');
echo "WordPress/ACF escaped submission checks passed.\n";

// Membership is checked against the latest WordPress group, not client labels.
reset_state();
$rows = json_decode($meta['lld_translation_offerings'], true);
$rows[0]['documentTypes'] = array('Birth certificate', 'Marriage certificate', 'Death certificate');
$meta['lld_translation_offerings'] = json_encode($rows);
check(lld_service_inquiry(request([], ['document' => 'Birth certificate'])) === ['ok' => true], 'specific document accepted');
check(str_contains($mail[0][2], 'Birth, marriage &amp; death certificates') && str_contains($mail[0][2], '>Document</th>') && str_contains($mail[0][2], '>Birth certificate</td>'), 'email includes distinct service group and document rows');
check(lld_service_inquiry(request([], ['document' => 'Birth certificate'])) === ['ok' => true] && count($mail) === 1, 'same document retry remains idempotent');
check(lld_service_inquiry(request([], ['document' => 'Marriage certificate']))->status === 409, 'changing document changes replay fingerprint');
foreach ([[], ['document' => 'Passport'], ['service' => 'diploma', 'document' => 'Birth certificate']] as $patch) {
    check(lld_service_inquiry(request([], $patch))->status === 422 && count($mail) === 1, 'missing or mismatched document rejected before email');
}
foreach ([null, [], str_repeat('x', 161), "Birth\ncertificate"] as $invalid) {
    check(lld_service_inquiry(request([], ['document' => $invalid]))->status === 400, 'invalid document shape rejected');
}
$rows[0]['documentTypes'] = array('Death certificate');
$meta['lld_translation_offerings'] = json_encode($rows);
check(lld_service_inquiry(request([], ['document' => 'Birth certificate']))->status === 422 && count($mail) === 1, 'removed document rejected from stale form');
$rows[0]['documentTypes'] = array();
$meta['lld_translation_offerings'] = json_encode($rows);
check(lld_translation_inquiry_fields(request(), 43)['document'] === '', 'blank choice lists preserve legacy group-only requests');
check(lld_translation_inquiry_fields(request([], ['document' => 'Birth certificate']), 43)->status === 422, 'cleared list never reintroduces old choices');
foreach ([null, 'Birth certificate', ['Birth certificate', ' birth CERTIFICATE '], [''], [123], [str_repeat('x', 161)], ["Birth\ncertificate"], range(1, 51)] as $invalid_choices) {
    $rows[0]['documentTypes'] = $invalid_choices;
    check(lld_translation_offerings_validate(true, addslashes(json_encode($rows))) !== true, 'invalid document choice lists rejected during WordPress save');
}
echo "Document dropdown membership and email checks passed.\n";
