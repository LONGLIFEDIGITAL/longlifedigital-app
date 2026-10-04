<?php
// WordPress/Woo primitives are stubbed; existing checkout/account checks run too.
require __DIR__ . '/account-bridge.php';
class NewsletterCoupon {
    function __construct(public $code) {}
    function get_code() { return $this->code; }
}
$validate = $hooks['woocommerce_coupon_is_valid'];
foreach (array('WELCOME10', 'welcome10', ' Welcome10 ') as $code) {
    $rejected = false;
    try { $validate(true, new NewsletterCoupon($code)); }
    catch (Exception $error) { $rejected = str_contains($error->getMessage(), 'retired'); }
    check($rejected, 'shared welcome code is retired, including saved cart validation');
}
// No account, subscriber lookup, or login helper is needed for personal coupons.
foreach (array('PERSONAL-8X7Q', 'SUMMER20') as $code) {
    check($validate(true, new NewsletterCoupon($code)), 'Woo-approved coupon remains usable by a guest');
    check(!$validate(false, new NewsletterCoupon($code)), 'Woo email/expiry/usage rejection stays rejected');
}
echo "Guest coupon bridge checks passed.\n";
