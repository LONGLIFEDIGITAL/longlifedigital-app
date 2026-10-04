<?php
if (!defined('ABSPATH')) { exit; }

// MailPoet issues personal, email-restricted, single-use welcome coupons.
// Retire the shared code on all checkout routes, even if it remains published
// or is already in a saved cart. Other coupons retain WooCommerce's validation.
function lld_retire_shared_welcome_coupon($valid, $coupon) {
    if (strtolower(trim($coupon->get_code())) === 'welcome10') {
        throw new Exception('WELCOME10 has been retired. Please use the personal discount code from your newsletter welcome email.');
    }
    return $valid;
}
add_filter('woocommerce_coupon_is_valid', 'lld_retire_shared_welcome_coupon', 10, 2);
