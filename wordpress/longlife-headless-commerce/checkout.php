<?php
if (!defined('ABSPATH')) { exit; }
function lld_configuration() {
    $settings = get_option('woocommerce_stripe_settings', array());
    $gateway = class_exists('WC_Stripe') ? WC_Stripe::get_instance()->get_main_stripe_gateway() : null;
    $upe = $gateway instanceof WC_Stripe_UPE_Payment_Gateway;
    $card = $upe && isset($gateway->payment_methods['card']) ? $gateway->payment_methods['card'] : null;
    $version = defined('WC_STRIPE_VERSION') ? WC_STRIPE_VERSION : '';
    $woo_version = defined('WC_VERSION') ? WC_VERSION : '';
    $test = ($settings['testmode'] ?? '') === 'yes' && $upe && $gateway->testmode === true;
    $key = $settings['test_publishable_key'] ?? '';
    $compatible = $version === '11.0.0' && $woo_version === '11.1.2' && $upe && $test && $card && $card->is_enabled()
        && get_option('woocommerce_enable_guest_checkout') === 'yes'
        && ($settings['enabled'] ?? '') === 'yes' && ($settings['capture'] ?? 'yes') === 'yes' && is_string($key) && strpos($key, 'pk_test_') === 0 && $key === $gateway->publishable_key;
    $billing_fields = array();
    if (function_exists('WC') && WC()->countries) {
        foreach (WC()->countries->get_allowed_countries() as $country => $name) {
            foreach (WC()->countries->get_address_fields($country, 'billing_') as $field_key => $field) {
                $billing_fields[$country][substr($field_key, 8)] = array(
                    'required' => !empty($field['required']) && empty($field['hidden']),
                    'hidden' => !empty($field['hidden']),
                );
            }
        }
    }
    return array(
        'gatewayVersion' => $version, 'woocommerceVersion' => $woo_version, 'testMode' => $test,
        'enabled' => $compatible && get_option('lld_checkout_enabled') === '1',
        'publishableKey' => $compatible ? $key : null,
        'countries' => function_exists('WC') && WC()->countries ? WC()->countries->get_allowed_countries() : array(),
        'states' => function_exists('WC') && WC()->countries ? WC()->countries->get_states() : array(),
        'billingFields' => $billing_fields,
    );
}
// Only authenticated integration checkout requests receive our correlation and deduplication.
// Ordinary WooCommerce checkout and the gateway's Stripe webhooks are left in place.
add_filter('rest_pre_dispatch', function ($result, $server, $request) {
    if ($result !== null || $request->get_route() !== '/wc/store/v1/checkout' || $request->get_method() !== 'POST' || !$request->get_header('x-lld-signature')) return $result;
    $auth = lld_authenticate_bridge($request);
    if (is_wp_error($auth)) return $auth;
    if (!lld_configuration()['enabled']) return lld_error('React test checkout is not enabled for this gateway configuration.', 503);
    if (!$request->get_header('cart-token')) return lld_error('Cart session required.', 403);
    $identity = lld_request_identity($request);
    $hash = hash('sha256', $request->get_body());
    $existing = lld_record($identity['key']);
    if ($existing) {
        if (($existing['hash'] ?? '') !== $hash) return lld_error('This checkout attempt has different details.', 409);
        if (isset($existing['response'])) return lld_response($existing['response'], $existing['status']);
        return lld_error('This checkout is already processing. Check the order status before trying again.', 409);
    }
    if (!lld_insert($identity['lock'], 'lock', array('attempt' => $identity['attempt']))) return lld_error('A previous checkout is still processing. Check its order status.', 409);
    if (!lld_insert($identity['key'], 'attempt', array('hash' => $hash, 'order' => 0, 'session' => $identity['session']))) return lld_error('Checkout is already processing.', 409);
    $GLOBALS['lld_checkout_context'] = $identity;
    return $result;
}, 5, 3);
add_action('woocommerce_store_api_checkout_update_order_meta', function ($order) {
    $identity = $GLOBALS['lld_checkout_context'] ?? null;
    if (!$identity) return;
    $record = lld_record($identity['key']);
    $record['order'] = $order->get_id();
    lld_save($identity['key'], $record);
    $order->update_meta_data('_lld_checkout_session', $identity['session']);
    $order->update_meta_data('_lld_checkout_attempt', $identity['attempt']);
});
add_filter('rest_post_dispatch', function ($response, $server, $request) {
    $identity = $GLOBALS['lld_checkout_context'] ?? null;
    if (!$identity || $request->get_route() !== '/wc/store/v1/checkout') return $response;
    unset($GLOBALS['lld_checkout_context']);
    $record = lld_record($identity['key']);
    $record['response'] = $response->get_data();
    $record['status'] = $response->get_status();
    lld_save($identity['key'], $record);
    $order = !empty($record['order']) ? wc_get_order($record['order']) : null;
    // Never expire a lock simply because a network response is late.
    if ((!$order && $record['status'] >= 400) || ($order && ($order->is_paid() || $order->has_status(array('failed', 'cancelled', 'checkout-draft'))))) lld_delete($identity['lock']);
    $response->header('Cache-Control', 'no-store, private');
    return $response;
}, 10, 3);
function lld_order_status($request) {
    $identity = lld_request_identity($request);
    $record = lld_record($identity['key']);
    if ($record && empty($record['order']) && ($record['status'] ?? 0) >= 400) return lld_response(array('number' => null, 'status' => 'failed', 'paid' => false, 'items' => array(), 'downloads' => array()));
    if (!$record || empty($record['order'])) return lld_error('No order is available for this checkout attempt yet.', 404);
    $order = wc_get_order($record['order']);
    if (!$order || $order->get_meta('_lld_checkout_session') !== $identity['session'] || $order->get_meta('_lld_checkout_attempt') !== $identity['attempt']) return lld_error('Order not available.', 404);
    // Explicitly requested after Stripe authentication. The gateway retrieves its own intent;
    // neither an arbitrary intent ID nor a client-reported payment status is accepted.
    if ($request->get_param('confirm') === true && lld_configuration()['enabled'] && $order->get_payment_method() === 'stripe' && $order->has_status(array('pending', 'failed'))) {
        if (null === WC()->cart) wc_load_cart();
        WC_Stripe::get_instance()->get_main_stripe_gateway()->verify_intent_after_checkout($order);
        $order = wc_get_order($record['order']);
    }
    $paid = $order->is_paid() && (bool) $order->get_date_paid();
    // Woo 11.1.2 changes a draft to pending before invoking any payment gateway.
    // A recorded 4xx rejection while it is still a draft is a pre-payment failure.
    // An unresolved draft alone is NOT proof of failure (it may still be processing).
    $rejected = !$paid && $order->has_status('checkout-draft')
        && ($record['status'] ?? 0) >= 400 && ($record['status'] ?? 0) < 500
        && !$order->get_meta('_stripe_intent_id') && !$order->get_meta('_stripe_setup_intent')
        && !$order->get_transaction_id();
    if ($paid && $order->get_payment_method() === 'stripe' && $order->get_meta('_stripe_upe_waiting_for_redirect') && class_exists('WC_Stripe_Order_Helper')) {
        // Mirror the gateway's redirect bookkeeping after its own verifier completed payment.
        $helper = WC_Stripe_Order_Helper::get_instance();
        $helper->update_stripe_upe_redirect_processed($order, true);
        $helper->delete_stripe_upe_waiting_for_redirect($order);
        $order->save();
    }
    if ($paid || $rejected || $order->has_status(array('failed', 'cancelled', 'refunded'))) {
        $lock = lld_record($identity['lock']);
        if (($lock['attempt'] ?? '') === $identity['attempt']) lld_delete($identity['lock']);
    }
    $downloads = array();
    if ($paid && $order->is_download_permitted()) {
        foreach ($order->get_downloadable_items() as $item) {
            $remaining = $item['downloads_remaining'] ?? '';
            // Use the order permission's expiry, not today's product setting.
            $expires = $item['access_expires'] ?? null;
            if ($expires instanceof DateTimeInterface) {
                $expiry_timestamp = $expires->getTimestamp();
                $expires = $expires->format(DATE_ATOM);
            } elseif ($expires) {
                $expiry_timestamp = strtotime($expires);
                if ($expiry_timestamp === false) continue;
                $expires = gmdate(DATE_ATOM, $expiry_timestamp);
            } else {
                $expiry_timestamp = null;
                $expires = null;
            }
            if ($remaining !== '' && (int) $remaining <= 0) continue;
            if ($expiry_timestamp !== null && $expiry_timestamp < time()) continue;
            $downloads[] = array(
                'productId' => (int) $item['product_id'],
                'productName' => $item['product_name'],
                'downloadId' => $item['download_id'],
                'name' => $item['download_name'],
                'url' => $item['download_url'],
                'remaining' => $remaining,
                'expires' => $expires,
            );
        }
    }
    $items = array();
    foreach ($order->get_items() as $item) $items[] = array('id' => $item->get_variation_id() ?: $item->get_product_id(), 'name' => $item->get_name(), 'quantity' => $item->get_quantity(), 'total' => $item->get_total());
    $authentication = null;
    $redirect = $record['response']['payment_result']['redirect_url'] ?? '';
    if (!$paid && $order->has_status('pending') && preg_match('/^#wc-stripe-confirm-(pi|si):(\d+):((?:pi|seti)_[A-Za-z0-9]+_secret_[A-Za-z0-9]+):[A-Za-z0-9]+$/D', $redirect, $match) && (int)$match[2] === $order->get_id()) {
        $authentication = array('type' => $match[1], 'clientSecret' => $match[3]);
    }
    return lld_response(array('number' => $order->get_order_number(), 'status' => $rejected ? 'failed' : $order->get_status(), 'failureReason' => $rejected ? 'checkout_validation' : null, 'paid' => $paid, 'total' => $order->get_total(), 'currency' => $order->get_currency(), 'items' => $items, 'downloads' => $downloads, 'authentication' => $authentication));
}
