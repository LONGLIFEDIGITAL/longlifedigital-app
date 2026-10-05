<?php
if (!defined('ABSPATH')) { exit; }

// Coupon policy belongs to WooCommerce; no code, amount or subscription is special.
add_action('woocommerce_coupon_options_usage_restriction', function ($id, $coupon) {
    woocommerce_wp_checkbox(array(
        'id' => '_lld_first_order_only',
        'label' => 'First order only',
        'description' => 'Require no previous orders for this account or billing email. Guests are eligible. Pending, on-hold, paid and refunded orders count; failed/cancelled attempts do not.',
        'value' => $coupon->get_meta('_lld_first_order_only', true),
    ));
}, 10, 2);
add_action('woocommerce_coupon_options_save', function ($id, $coupon) {
    // Woo's coupon editor has already checked its save nonce and permissions.
    if (!current_user_can('edit_post', $id)) return;
    $coupon->update_meta_data('_lld_first_order_only', ($_POST['_lld_first_order_only'] ?? '') === 'yes' ? 'yes' : 'no');
    $coupon->save_meta_data();
}, 10, 2);

function lld_first_order_identity($email, $customer_id = 0) {
    $email = strtolower(trim((string) $email));
    if (!is_email($email)) throw new Exception('Enter a valid billing email address before using a first-order discount.');
    $emails = array($email);
    $ids = array();
    if ($customer_id > 0) {
        $ids[] = (int) $customer_id;
        $user = get_user_by('id', $customer_id);
        if ($user && is_email($user->user_email)) $emails[] = strtolower(trim($user->user_email));
    }
    // Also catches a registered customer's previous orders when checking out as a guest.
    // This lookup does not authenticate anyone or assign ownership of the order.
    foreach (array_unique($emails) as $address) {
        $user = get_user_by('email', $address);
        if ($user) $ids[] = (int) $user->ID;
    }
    return array('emails' => array_values(array_unique($emails)), 'ids' => array_values(array_unique($ids)));
}

function lld_assert_first_order($identity, $exclude_order = 0) {
    global $wpdb;
    $base = array(
        'type' => 'shop_order', 'limit' => 1, 'return' => 'ids',
        'status' => array('wc-pending', 'wc-on-hold', 'wc-processing', 'wc-completed', 'wc-refunded'),
        'exclude' => $exclude_order ? array((int) $exclude_order) : array(),
    );
    // Woo's order API works with both HPOS and legacy order storage.
    foreach (array('billing_email' => $identity['emails'], 'customer_id' => $identity['ids']) as $field => $values) {
        foreach ($values as $value) {
            $orders = wc_get_orders(array_merge($base, array($field => $value)));
            if (!empty($wpdb->last_error)) throw new Exception('We could not verify this discount. Please try again shortly.');
            if ($orders) throw new Exception('This discount is available for first orders only. Remove it to continue with your order.');
        }
    }
}

function lld_first_order_cart_exclusion() {
    if (!WC()->session || !WC()->cart) return 0;
    foreach (array('store_api_draft_order', 'order_awaiting_payment') as $key) {
        $order = wc_get_order(WC()->session->get($key, 0));
        if ($order && $order->has_status(array('pending', 'failed', 'checkout-draft'))
            && $order->has_cart_hash(WC()->cart->get_cart_hash())) return $order->get_id();
    }
    return 0;
}

add_filter('woocommerce_coupon_is_valid', function ($valid, $coupon, $discounts) {
    if (!$valid || $coupon->get_meta('_lld_first_order_only', true) !== 'yes') return $valid;
    $object = $discounts->get_object();
    if ($object instanceof WC_Order) {
        $identity = lld_first_order_identity($object->get_billing_email(), $object->get_customer_id());
        $exclude = $object->get_id();
    } else {
        $customer = WC()->customer;
        $customer_id = $GLOBALS['lld_checkout_context']['customer_id'] ?? get_current_user_id();
        $identity = lld_first_order_identity($customer ? $customer->get_billing_email() : '', $customer_id);
        $exclude = lld_first_order_cart_exclusion();
    }
    lld_assert_first_order($identity, $exclude);
    return $valid;
}, 20, 3);

function lld_first_order_release_claim($key, $record) {
    global $wpdb;
    // Compare payload as well as key so an old request cannot delete a new claim.
    $wpdb->delete($wpdb->prefix . 'lld_commerce', array('record_key' => $key, 'payload' => wp_json_encode($record)));
}

function lld_first_order_claim($identity, $order) {
    $keys = array();
    foreach ($identity['emails'] as $email) $keys[] = hash('sha256', 'first-order:email:' . $email);
    foreach ($identity['ids'] as $id) $keys[] = hash('sha256', 'first-order:account:' . $id);
    sort($keys);
    $record = array('order' => $order->get_id());
    $acquired = array();
    try {
        foreach ($keys as $key) {
            if (!lld_insert($key, 'first-order', $record)) {
                $existing = lld_record($key);
                if (!$existing) throw new Exception('We could not verify this discount. Please try again shortly.');
                if (($existing['order'] ?? 0) === $order->get_id()) continue;
                $previous = !empty($existing['order']) ? wc_get_order($existing['order']) : null;
                // Never expire an ambiguous payment merely because time has passed.
                if ($previous && $previous->has_status(array('failed', 'cancelled')) && !$previous->get_date_paid()) {
                    lld_first_order_release_claim($key, $existing);
                    if (lld_insert($key, 'first-order', $record)) {
                        $acquired[] = $key;
                        continue;
                    }
                }
                throw new Exception('This first-order offer is already used or reserved by another checkout. Complete or cancel that order before trying again.');
            }
            $acquired[] = $key;
        }
    } catch (Exception $error) {
        foreach ($acquired as $key) lld_first_order_release_claim($key, $record);
        throw $error;
    }
    foreach ($acquired as $key) $GLOBALS['lld_first_order_claims'][$key] = $record;
}

function lld_validate_first_order_checkout($order, $reserve = true) {
    foreach ($order->get_coupon_codes() as $code) {
        $coupon = new WC_Coupon($code);
        if ($coupon->get_meta('_lld_first_order_only', true) !== 'yes') continue;
        // The bridge assigns the verified account ID before this hook runs.
        $identity = lld_first_order_identity($order->get_billing_email(), $order->get_customer_id());
        lld_assert_first_order($identity, $order->get_id());
        if ($reserve) lld_first_order_claim($identity, $order);
        break; // Eligibility is for the customer's first order, across all marked coupons.
    }
}

add_action('woocommerce_store_api_checkout_update_order_from_request', function ($order, $request) {
    if ($request->get_method() !== 'POST') return;
    try {
        lld_validate_first_order_checkout($order);
    } catch (Exception $error) {
        // A 4xx response gives the React checkout the actual validation message.
        throw new Automattic\WooCommerce\StoreApi\Exceptions\RouteException('lld_first_order_only', $error->getMessage(), 400);
    }
}, 20, 2);
add_action('woocommerce_checkout_create_order', function ($order) {
    lld_validate_first_order_checkout($order, false);
}, 20);
add_action('woocommerce_checkout_order_created', 'lld_validate_first_order_checkout', 20);
add_action('woocommerce_before_pay_action', function ($order) {
    // This hook runs outside Woo's payment try/catch. Notices prevent payment.
    try {
        lld_validate_first_order_checkout($order);
    } catch (Exception $error) {
        wc_add_notice($error->getMessage(), 'error');
    }
}, 20);

add_action('shutdown', function () {
    foreach ($GLOBALS['lld_first_order_claims'] ?? array() as $key => $record) {
        $order = wc_get_order($record['order']);
        // Release pre-payment validation failures. Keep pending/paid/ambiguous orders reserved.
        if ($order && $order->has_status(array('checkout-draft', 'failed', 'cancelled'))
            && !$order->get_date_paid() && !$order->get_transaction_id()
            && !$order->get_meta('_stripe_intent_id') && !$order->get_meta('_stripe_setup_intent')) {
            lld_first_order_release_claim($key, $record);
        }
    }
});
