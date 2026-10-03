<?php
if (!defined('ABSPATH')) { exit; }

function lld_form_fields($request, $limits, $optional = array()) {
    $fields = array();
    foreach ($limits as $name => $max) {
        $value = $request->get_param($name) ?? '';
        if (!is_string($value) || mb_strlen($value) > $max || strpos($value, "\0") !== false
            || ($name !== 'message' && preg_match('/[\r\n]/', $value))) return lld_error('Invalid form details.');
        $fields[$name] = trim($name === 'message' ? sanitize_textarea_field($value) : sanitize_text_field($value));
        if (!in_array($name, $optional, true) && $fields[$name] === '') return lld_error('Missing form details.');
    }
    if (!is_email($fields['email'])) return lld_error('Invalid email address.');
    $fields['email'] = strtolower($fields['email']);
    return $fields;
}

// The existing inquiry table/rate limiter stores only hashes, not message bodies.
function lld_begin_public_form($request, $kind, $fields) {
    $request_id = $request->get_param('requestId');
    if (!is_string($request_id) || !preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/iD', $request_id)) return lld_error('Invalid form request.');
    $key = hash('sha256', $kind . ':' . $request_id);
    $fingerprint = hash_hmac('sha256', wp_json_encode($fields), wp_salt('auth'));
    $existing = lld_record($key);
    if ($existing) {
        if (!hash_equals($existing['fingerprint'] ?? '', $fingerprint)) return lld_error('Request changed. Please start again.', 409);
        if (($existing['status'] ?? '') !== 'accepted') return lld_error('Request processing.', 409);
        return array('key' => $key, 'fingerprint' => $fingerprint, 'accepted' => true);
    }
    $rate = lld_inquiry_rate($request->get_param('client'), $fields['email']);
    if (is_wp_error($rate)) return $rate;
    if (!lld_insert($key, 'inquiry', array('fingerprint' => $fingerprint, 'status' => 'sending'))) return lld_error('Request processing.', 409);
    return array('key' => $key, 'fingerprint' => $fingerprint, 'accepted' => false);
}

function lld_accept_public_form($attempt) {
    lld_save($attempt['key'], array('fingerprint' => $attempt['fingerprint'], 'status' => 'accepted'));
    return lld_response(array('ok' => true));
}

function lld_contact_form($request) {
    $fields = lld_form_fields($request, array('name' => 100, 'email' => 254, 'service' => 200, 'message' => 5000), array('service'));
    if (is_wp_error($fields)) return $fields;
    $attempt = lld_begin_public_form($request, 'contact', $fields);
    if (is_wp_error($attempt)) return $attempt;
    if ($attempt['accepted']) return lld_response(array('ok' => true));
    try {
        $subject = 'Longlife Digital Contact Inquiry';
        $body = '<p>A new message has been submitted through Longlife Digital.</p><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;border-collapse:collapse">';
        foreach (array('name' => 'Name', 'email' => 'Email address', 'service' => 'Service interested in', 'message' => 'Message') as $name => $label) {
            $body .= '<tr><th scope="row" align="left" valign="top" style="padding:8px 16px 8px 0;text-align:left;vertical-align:top;line-height:1.5">' . esc_html($label) . '</th><td align="left" valign="top" style="padding:8px 0;text-align:left;vertical-align:top;line-height:1.5;overflow-wrap:anywhere">' . nl2br(esc_html($fields[$name] ?: 'Not provided')) . '</td></tr>';
        }
        $body .= '</table><table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td style="padding:24px 0 0"><p style="margin:0">Reply to this email to contact the visitor.</p></td></tr></table>';
        $mailer = WC_Emails::instance();
        $sent = $mailer->send('support@longlifedigital.co', $subject, $mailer->wrap_message($subject, $body), "Content-Type: text/html; charset=UTF-8\r\nReply-To: " . $fields['email'] . "\r\n");
        if (!$sent) throw new RuntimeException('Mail transport rejected contact message.');
    } catch (Throwable $error) {
        lld_delete($attempt['key']);
        wc_get_logger()->error('Contact message could not be accepted by the mail transport.', array('source' => 'lld-forms'));
        return lld_error('Unable to send message.', 503);
    }
    return lld_accept_public_form($attempt);
}

function lld_mailpoet_lists() {
    if (!class_exists('MailPoet\\API\\API')) throw new RuntimeException('MailPoet is not active.');
    return array_values(array_filter(\MailPoet\API\API::MP('v1')->getLists(), function ($list) {
        return ($list['type'] ?? '') === 'default' && empty($list['deleted_at']);
    }));
}

add_action('admin_init', function () {
    register_setting('general', 'lld_newsletter_list_id', array('type' => 'integer', 'default' => 0, 'sanitize_callback' => function ($value) {
        $id = absint($value);
        if ($id === 0) return 0;
        try {
            foreach (lld_mailpoet_lists() as $list) if ((int) $list['id'] === $id) return $id;
        } catch (Throwable $error) { /* Show a settings error instead of saving an invalid destination. */ }
        add_settings_error('lld_newsletter_list_id', 'lld_invalid_newsletter_list', 'Select an active MailPoet newsletter list.');
        return (int) get_option('lld_newsletter_list_id', 0);
    }));
    add_settings_field('lld_newsletter_list_id', 'Longlife storefront newsletter', function () {
        try {
            $lists = lld_mailpoet_lists();
            $selected = (int) get_option('lld_newsletter_list_id', 0);
            echo '<select name="lld_newsletter_list_id" aria-label="Storefront newsletter list"><option value="0">Disabled — select a list</option>';
            foreach ($lists as $list) echo '<option value="' . esc_attr($list['id']) . '" ' . selected($selected, (int) $list['id'], false) . '>' . esc_html($list['name']) . '</option>';
            echo '</select><p>Home and popup signup forms use this MailPoet list. Configure sending and signup confirmation in MailPoet settings. Create a regular list under MailPoet → Lists if none appears here.</p>';
        } catch (Throwable $error) {
            echo '<p>Activate MailPoet and create a newsletter list to enable storefront signup.</p>';
        }
    }, 'general');
});

function lld_newsletter_signup($request) {
    if ($request->get_param('consent') !== true) return lld_error('Newsletter consent is required.');
    $fields = lld_form_fields($request, array('name' => 100, 'email' => 150));
    if (is_wp_error($fields)) return $fields;
    $fields['list'] = (int) get_option('lld_newsletter_list_id', 0);
    try {
        if (!$fields['list'] || !in_array($fields['list'], array_map(function ($list) { return (int) $list['id']; }, lld_mailpoet_lists()), true)) {
            return lld_error('Newsletter is not configured.', 503);
        }
    } catch (Throwable $error) { return lld_error('Newsletter is not available.', 503); }
    $attempt = lld_begin_public_form($request, 'newsletter', $fields);
    if (is_wp_error($attempt)) return $attempt;
    if ($attempt['accepted']) return lld_response(array('ok' => true));
    try {
        $api = \MailPoet\API\API::MP('v1');
        $subscriber = null;
        try { $subscriber = $api->getSubscriber($fields['email']); }
        catch (\MailPoet\API\MP\v1\APIException $error) {
            if ((int) $error->getCode() !== 4) throw $error;
        }
        $options = array('send_confirmation_email' => true, 'schedule_welcome_email' => true, 'skip_subscriber_notification' => false);
        if (!$subscriber) {
            $subscriber = $api->addSubscriber(array('email' => $fields['email'], 'first_name' => $fields['name']), array($fields['list']), $options);
        } else {
            // Never overwrite existing profiles or reactivate suppressed/trashed contacts.
            if (!empty($subscriber['deleted_at']) || !in_array($subscriber['status'] ?? '', array('subscribed', 'unconfirmed', 'unsubscribed'), true)) {
                throw new RuntimeException('Subscriber cannot be subscribed through this form.');
            }
            $already_subscribed = false;
            foreach ($subscriber['subscriptions'] ?? array() as $subscription) {
                if ((int) $subscription['segment_id'] === $fields['list'] && $subscription['status'] === 'subscribed' && $subscriber['status'] === 'subscribed') $already_subscribed = true;
            }
            if (!$already_subscribed) $subscriber = $api->subscribeToList($fields['email'], $fields['list'], $options);
        }
        if (!is_array($subscriber) || empty($subscriber['id']) || !in_array($subscriber['status'] ?? '', array('subscribed', 'unconfirmed'), true)) throw new RuntimeException('Subscription not accepted.');
    } catch (Throwable $error) {
        lld_delete($attempt['key']);
        // API codes aid setup diagnostics without logging subscriber details or tokens.
        wc_get_logger()->error('MailPoet signup failed (code ' . (int) $error->getCode() . '). Check the selected list and MailPoet sending settings.', array('source' => 'lld-forms'));
        return lld_error('Unable to complete newsletter signup.', 503);
    }
    return lld_accept_public_form($attempt);
}
