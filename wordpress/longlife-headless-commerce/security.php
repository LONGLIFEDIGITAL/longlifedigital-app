<?php
if (!defined('ABSPATH')) { exit; }
function lld_response($data, $status = 200) {
    $response = new WP_REST_Response($data, $status);
    $response->header('Cache-Control', 'no-store, private');
    return $response;
}
function lld_error($message, $status = 400) { return new WP_Error('lld_checkout', $message, array('status' => $status)); }
function lld_record($key) {
    global $wpdb;
    $value = $wpdb->get_var($wpdb->prepare("SELECT payload FROM {$wpdb->prefix}lld_commerce WHERE record_key = %s", $key));
    return $value ? json_decode($value, true) : null;
}
function lld_insert($key, $kind, $value) {
    global $wpdb;
    return $wpdb->query($wpdb->prepare("INSERT IGNORE INTO {$wpdb->prefix}lld_commerce (record_key, kind, payload, created) VALUES (%s,%s,%s,%d)", $key, $kind, wp_json_encode($value), time())) === 1;
}
function lld_save($key, $value) {
    global $wpdb;
    if ($wpdb->update($wpdb->prefix . 'lld_commerce', array('payload' => wp_json_encode($value)), array('record_key' => $key)) === false) {
        throw new RuntimeException('Could not persist checkout state.');
    }
}
function lld_delete($key) { global $wpdb; $wpdb->delete($wpdb->prefix . 'lld_commerce', array('record_key' => $key)); }
function lld_request_identity($request) {
    $session = $request->get_header('x-lld-session');
    $attempt = $request->get_header('x-lld-attempt');
    if (!preg_match('/^[a-f0-9]{64}$/D', $session) || !preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/D', $attempt)) return null;
    return array('session' => $session, 'attempt' => $attempt, 'key' => hash('sha256', 'attempt:' . $session . ':' . $attempt), 'lock' => hash('sha256', 'lock:' . $session));
}
function lld_authenticate_bridge($request) {
    global $wpdb;
    $secret = get_option('lld_bridge_secret');
    $identity = lld_request_identity($request);
    $stamp = $request->get_header('x-lld-timestamp');
    $nonce = $request->get_header('x-lld-nonce');
    $signature = $request->get_header('x-lld-signature');
    if (!$identity || !is_string($secret) || strlen($secret) < 32 || !ctype_digit($stamp) || abs(time() - (int) $stamp) > 120 || !preg_match('/^[a-f0-9]{32}$/D', $nonce)) return lld_error('Request not authorized.', 403);
    $canonical = implode("\n", array($request->get_method(), $request->get_route(), $identity['session'], $identity['attempt'], $stamp, $nonce, $request->get_header('cart-token'), $request->get_body()));
    if (!hash_equals(hash_hmac('sha256', $canonical, $secret), $signature)) return lld_error('Request not authorized.', 403);
    if (!lld_insert(hash('sha256', 'nonce:' . $nonce), 'nonce', array())) return lld_error('Request already received.', 409);
    // Nonces are short-lived; attempts/locks are intentionally durable for ambiguous payments.
    $wpdb->query($wpdb->prepare("DELETE FROM {$wpdb->prefix}lld_commerce WHERE kind = 'nonce' AND created < %d LIMIT 100", time() - 300));
    return true;
}
