<?php
namespace MailPoet\API\MP\v1 { class APIException extends \Exception {} }
namespace MailPoet\API { class API { static function MP($version) { return $GLOBALS['coupon_mailpoet']; } } }
namespace {
require __DIR__ . '/account-bridge.php';
function wp_get_current_user() { return $GLOBALS['native_user'] ?? false; }
class CouponRequest extends Request {
    public $method = 'POST';
    function get_method() { return $this->method; }
    function sign() {
        $h = $this->headers;
        $parts = array($this->method, $this->route, $h['x-lld-session'], $h['x-lld-attempt'], $h['x-lld-timestamp'], $h['x-lld-nonce'], $h['cart-token'], $this->body);
        if (!empty($h['x-lld-account'])) $parts[] = $h['x-lld-account'];
        $this->headers['x-lld-signature'] = hash_hmac('sha256', implode("\n", $parts), get_option('lld_bridge_secret'));
    }
}
class NewsletterCoupon {
    function __construct(public $code = 'WELCOME10', public $limit = 1) {}
    function get_code() { return $this->code; }
    function get_usage_limit_per_user() { return $this->limit; }
    function get_data_store() {
        return new class {
            function get_usage_by_user_id($coupon, $id) {
                check($id === 7, 'coupon usage checks the verified customer ID');
                return $GLOBALS['coupon_usage'];
            }
            function get_usage_by_email($coupon, $email) {
                check($email === 'reader@example.test', 'previous guest uses check the account email');
                return $GLOBALS['coupon_email_usage'];
            }
        };
    }
}
$options['lld_newsletter_list_id'] = 7;
$coupon_usage = 0;
$coupon_email_usage = 0;
$coupon_mailpoet = new class {
    public $status = 'subscribed', $list_status = 'subscribed', $list = 7, $deleted = null, $error = null;
    function getSubscriber($email) {
        check($email === 'reader@example.test', 'newsletter lookup uses account email');
        if ($this->error) throw $this->error;
        return array('id' => 1, 'status' => $this->status, 'deleted_at' => $this->deleted, 'subscriptions' => array(array('segment_id' => $this->list, 'status' => $this->list_status)));
    }
};
function denied_coupon($expected) {
    try { lld_validate_newsletter_coupon(true, new NewsletterCoupon()); }
    catch (\Exception $e) { check(str_contains($e->getMessage(), $expected), 'coupon denied: ' . $expected); return; }
    throw new \Exception('Coupon should be denied: ' . $expected);
}
unset($GLOBALS['lld_coupon_customer']);
denied_coupon('Log in');
check(lld_validate_newsletter_coupon(true, new NewsletterCoupon('SUMMER')), 'other coupons remain available to guests');
check(!lld_validate_newsletter_coupon(false, new NewsletterCoupon()), 'existing Woo rejection is never overridden');
// A browser-supplied credential cannot authenticate an unsigned cart request.
$token = wp_generate_auth_cookie(7, time() + 1000, 'logged_in');
$request = new CouponRequest('/wc/store/v1/cart/apply-coupon', json_encode(array('_lld_account' => $token, 'customer_id' => 7)));
unset($request->headers['x-lld-signature']);
check(lld_coupon_cart_context(null, null, $request) === null, 'ordinary cart API remains available');
denied_coupon('Log in');
foreach (array('POST', 'GET') as $method) {
    $request = new CouponRequest($method === 'GET' ? '/wc/store/v1/cart' : '/wc/store/v1/cart/apply-coupon', $method === 'GET' ? '' : '{"code":"WELCOME10"}');
    $request->method = $method;
    $request->headers['x-lld-account'] = $token;
    $request->sign();
    check(lld_coupon_cart_context(null, null, $request) === null, 'signed ' . $method . ' cart request accepted');
    check(lld_validate_newsletter_coupon(true, new NewsletterCoupon('welcome10')), 'confirmed subscriber can use coupon');
}
$coupon_usage = 1;
denied_coupon('already used');
$coupon_usage = 0;
$coupon_email_usage = 1;
denied_coupon('already used');
$coupon_email_usage = 0;
foreach (array('unconfirmed', 'unsubscribed', 'bounced') as $status) {
    $coupon_mailpoet->status = $status;
    denied_coupon('confirmed newsletter subscribers');
}
$coupon_mailpoet->status = 'subscribed';
$coupon_mailpoet->list_status = 'unsubscribed';
denied_coupon('confirmed newsletter subscribers');
$coupon_mailpoet->list_status = 'subscribed';
$coupon_mailpoet->list = 8;
denied_coupon('confirmed newsletter subscribers');
$coupon_mailpoet->list = 7;
$coupon_mailpoet->deleted = '2026-01-01';
denied_coupon('confirmed newsletter subscribers');
$coupon_mailpoet->deleted = null;
$coupon_mailpoet->error = new \MailPoet\API\MP\v1\APIException('missing', 4);
denied_coupon('confirmed newsletter subscribers');
$coupon_mailpoet->error = new \RuntimeException('private database details');
denied_coupon('Unable to verify');
$coupon_mailpoet->error = null;
$options['lld_newsletter_list_id'] = 0;
denied_coupon('temporarily unavailable');
$options['lld_newsletter_list_id'] = 7;
$request = new CouponRequest('/wc/store/v1/cart');
$request->headers['x-lld-account'] = $token;
$request->sign();
$request->headers['x-lld-account'] = 'tampered';
check(lld_coupon_cart_context(null, null, $request)->data['status'] === 403, 'account header is signature protected');
$request = new CouponRequest('/wc/store/v1/cart');
$request->headers['x-lld-account'] = $token;
$request->sign();
unset($auth_tokens[$token]);
check(lld_coupon_cart_context(null, null, $request)->data['status'] === 401, 'revoked account session rejected');
// A discounted cart cannot retain its former customer's eligibility after logout.
$GLOBALS['lld_coupon_customer'] = $users[7];
$guest_checkout = new Request('/wc/store/v1/checkout', '{}', str_repeat('c', 64), '22222222-2222-4222-8222-222222222222');
check($hooks['rest_pre_dispatch'](null, null, $guest_checkout) === null, 'guest checkout still dispatches normally');
denied_coupon('Log in');
unset($GLOBALS['lld_coupon_customer']);
$native_user = $users[7];
check(lld_validate_newsletter_coupon(true, new NewsletterCoupon()), 'native Woo account also receives subscriber validation');
echo "Newsletter coupon checks passed.\n";
}
