<?php
if (!defined('ABSPATH')) { exit; }

// The headless cart remains token-based. Carry a verified account alongside it
// for coupon eligibility, without switching or merging WooCommerce cart sessions.
function lld_coupon_cart_context($result, $server, $request) {
    if ($result !== null || !preg_match('#^/wc/store/v1/cart(?:/|$)#', $request->get_route())) return $result;
    unset($GLOBALS['lld_coupon_customer']);
    if (!$request->get_header('x-lld-signature')) return $result;
    $auth = lld_authenticate_bridge($request);
    if (is_wp_error($auth)) return $auth;
    $customer = lld_account_user($request->get_header('x-lld-account'));
    if (is_wp_error($customer)) return $customer;
    $GLOBALS['lld_coupon_customer'] = $customer;
    return $result;
}
add_filter('rest_pre_dispatch', 'lld_coupon_cart_context', 4, 3);
add_filter('rest_request_after_callbacks', function ($response, $handler, $request) {
    if (preg_match('#^/wc/store/v1/(?:cart(?:/|$)|checkout$)#', $request->get_route())) {
        unset($GLOBALS['lld_coupon_customer']);
    }
    return $response;
}, 10, 3);

function lld_validate_newsletter_coupon($valid, $coupon) {
    if (!$valid || strtolower(trim($coupon->get_code())) !== 'welcome10') return $valid;
    $customer = array_key_exists('lld_coupon_customer', $GLOBALS)
        ? $GLOBALS['lld_coupon_customer'] : wp_get_current_user();
    if (!lld_customer_allowed($customer) || get_user_meta($customer->ID, '_lld_email_pending', true)) {
        throw new Exception('Log in with your newsletter email to use WELCOME10.');
    }

    // Check the account email, not an editable checkout email or a browser flag.
    $list_id = (int) get_option('lld_newsletter_list_id', 0);
    if (!$list_id || !class_exists('MailPoet\\API\\API')) {
        throw new Exception('Newsletter discounts are temporarily unavailable. Please try again later.');
    }
    try {
        $subscriber = \MailPoet\API\API::MP('v1')->getSubscriber($customer->user_email);
    } catch (\MailPoet\API\MP\v1\APIException $error) {
        if ((int) $error->getCode() !== 4) {
            throw new Exception('Unable to verify your newsletter subscription. Please try again later.');
        }
        $subscriber = null;
    } catch (Throwable $error) {
        throw new Exception('Unable to verify your newsletter subscription. Please try again later.');
    }
    $subscribed = false;
    if (is_array($subscriber) && empty($subscriber['deleted_at']) && ($subscriber['status'] ?? '') === 'subscribed') {
        foreach ($subscriber['subscriptions'] ?? array() as $subscription) {
            if ((int) ($subscription['segment_id'] ?? 0) === $list_id && ($subscription['status'] ?? '') === 'subscribed') {
                $subscribed = true;
                break;
            }
        }
    }
    if (!$subscribed) {
        throw new Exception('WELCOME10 is for confirmed newsletter subscribers. Subscribe and confirm using your account email, then try again.');
    }

    // Core cart validation sees a guest with Cart-Token requests. Use Woo's own
    // usage records (including held uses) with our verified account ID as well.
    $limit = (int) $coupon->get_usage_limit_per_user();
    if ($limit > 0) {
        $store = $coupon->get_data_store();
        // Include uses made as a guest before this account was created.
        $uses = $store->get_usage_by_user_id($coupon, $customer->ID)
            + $store->get_usage_by_email($coupon, strtolower($customer->user_email));
        if ($uses >= $limit) {
            throw new Exception('You have already used WELCOME10, or it is reserved for a pending order.');
        }
    }
    return $valid;
}
// Woo runs this validation when applying coupons and when validating checkout,
// including its native checkout. Expiry, discount amount and other rules stay in Woo.
add_filter('woocommerce_coupon_is_valid', 'lld_validate_newsletter_coupon', 10, 2);
