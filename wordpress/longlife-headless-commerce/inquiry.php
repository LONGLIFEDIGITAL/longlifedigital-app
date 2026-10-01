<?php
if (!defined('ABSPATH')) { exit; }

function lld_inquiry_rate($client, $email) {
    global $wpdb;
    if (!is_string($client) || !preg_match('/^[a-f0-9]{64}$/D', $client)) return lld_error('Invalid inquiry.', 403);
    foreach (array(array('client:' . $client, 10), array('email:' . strtolower($email), 5)) as $bucket) {
        $key = hash_hmac('sha256', 'inquiry-rate:' . floor(time() / 900) . ':' . $bucket[0], wp_salt('auth'));
        $saved = $wpdb->query($wpdb->prepare(
            "INSERT INTO {$wpdb->prefix}lld_commerce (record_key,kind,payload,created) VALUES (%s,'inquiry_rate','1',%d) ON DUPLICATE KEY UPDATE payload = CAST(payload AS UNSIGNED) + 1",
            $key, time()
        ));
        if ($saved === false) return lld_error('Inquiries unavailable.', 503);
        if ((int) lld_record($key) > $bucket[1]) return lld_error('Too many inquiries.', 429);
    }
    $wpdb->query($wpdb->prepare("DELETE FROM {$wpdb->prefix}lld_commerce WHERE kind = 'inquiry_rate' AND created < %d LIMIT 100", time() - 1800));
    $wpdb->query($wpdb->prepare("DELETE FROM {$wpdb->prefix}lld_commerce WHERE kind = 'inquiry' AND created < %d LIMIT 100", time() - DAY_IN_SECONDS));
    return true;
}

function lld_service_inquiry($request) {
    $service_id = $request->get_param('serviceId');
    $service = is_int($service_id) && $service_id > 0 ? get_post($service_id) : null;
    if (!$service || $service->post_type !== 'lld_service' || $service->post_status !== 'publish' || $service->post_password !== '') return lld_error('Service unavailable.', 404);
    $fields = array();
    foreach (array('firstName' => 100, 'lastName' => 100, 'email' => 254, 'businessName' => 160, 'phone' => 40, 'message' => 3000) as $name => $max) {
        $value = $request->get_param($name) ?? '';
        if (!is_string($value) || mb_strlen($value) > $max || strpos($value, "\0") !== false || ($name !== 'message' && preg_match('/[\r\n]/', $value))) return lld_error('Invalid contact details.');
        $fields[$name] = $name === 'message' ? sanitize_textarea_field($value) : sanitize_text_field($value);
        if (!in_array($name, array('businessName', 'message'), true) && $fields[$name] === '') return lld_error('Missing contact details.');
    }
    $digits = preg_replace('/\D/', '', $fields['phone']);
    if (!is_email($fields['email']) || !preg_match('/^[+\d().\s-]+$/D', $fields['phone']) || strlen($digits) < 7 || strlen($digits) > 20) return lld_error('Invalid contact details.');
    $request_id = $request->get_param('requestId');
    if (!is_string($request_id) || !preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/iD', $request_id)) return lld_error('Invalid inquiry.');
    // Retain only a keyed fingerprint/status, never the visitor's contact details.
    $key = hash('sha256', 'inquiry:' . $request_id);
    $fingerprint = hash_hmac('sha256', wp_json_encode(array($service_id, $fields)), wp_salt('auth'));
    $existing = lld_record($key);
    if ($existing) {
        if (!hash_equals($existing['fingerprint'] ?? '', $fingerprint)) return lld_error('Inquiry changed. Please start again.', 409);
        return ($existing['status'] ?? '') === 'accepted' ? lld_response(array('ok' => true)) : lld_error('Inquiry processing.', 409);
    }
    $rate = lld_inquiry_rate($request->get_param('client'), $fields['email']);
    if (is_wp_error($rate)) return $rate;
    if (!lld_insert($key, 'inquiry', array('fingerprint' => $fingerprint, 'status' => 'sending'))) return lld_error('Inquiry processing.', 409);

    $title = sanitize_text_field(html_entity_decode(wp_strip_all_tags($service->post_title), ENT_QUOTES, 'UTF-8'));
    $subject = $title . ' Inquiry';
    $message = '<p>A new service inquiry has been submitted through Longlife Digital.</p><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;border-collapse:collapse">';
    $fields['service'] = $title;
    $labels = array('service' => 'Service', 'firstName' => 'First name', 'lastName' => 'Last name', 'email' => 'Email address', 'businessName' => 'Business name', 'phone' => 'Telephone number', 'message' => 'Project description');
    foreach ($labels as $name => $label) {
        $message .= '<tr><th scope="row" align="left" valign="top" style="padding:8px 16px 8px 0;text-align:left;vertical-align:top;line-height:1.5">' . esc_html($label) . '</th><td align="left" valign="top" style="padding:8px 0;text-align:left;vertical-align:top;line-height:1.5;overflow-wrap:anywhere">' . nl2br(esc_html($fields[$name] ?: 'Not provided')) . '</td></tr>';
    }
    $message .= '</table><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;border-collapse:collapse"><tr><td style="padding:24px 0 0"><p style="margin:0">Reply to this email to contact the visitor.</p></td></tr></table>';
    $mailer = WC_Emails::instance();
    // Keep WooCommerce/FluentSMTP's authenticated sender. The visitor is Reply-To only.
    $sent = $mailer->send('info@longlifedigital.co', $subject, $mailer->wrap_message($subject, $message), "Content-Type: text/html; charset=UTF-8\r\nReply-To: " . $fields['email'] . "\r\n");
    if (!$sent) {
        lld_delete($key);
        wc_get_logger()->error('Service inquiry was not accepted by the mail transport.', array('source' => 'lld-inquiries', 'service_id' => $service_id));
        return lld_error('Unable to send inquiry.', 503);
    }
    lld_save($key, array('fingerprint' => $fingerprint, 'status' => 'accepted'));
    return lld_response(array('ok' => true));
}
