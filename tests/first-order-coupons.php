<?php
// PHP 8+ unit harness: actual policy/hooks, stubbed WordPress and Woo data stores.
namespace Automattic\WooCommerce\StoreApi\Exceptions {
    class RouteException extends \Exception {
        function __construct(public $error_code, $message, $status) { parent::__construct($message, $status); }
    }
}
namespace {
define('ABSPATH', '/test/');
$hooks = array(); $count = 0;
function add_action($name, $callback, ...$args) { $GLOBALS['hooks'][$name] = $callback; }
function add_filter($name, $callback, ...$args) { add_action($name, $callback); }
function wp_json_encode($value) { return json_encode($value); }
function is_email($email) { return filter_var($email, FILTER_VALIDATE_EMAIL); }
function current_user_can(...$args) { return $GLOBALS['can_edit']; }
function get_current_user_id() { return $GLOBALS['current_id']; }
function get_user_by($field, $value) {
    foreach ($GLOBALS['users'] as $user) {
        if (($field === 'id' && $user->ID === $value) || ($field === 'email' && strtolower($user->user_email) === strtolower($value))) return $user;
    }
    return false;
}
function woocommerce_wp_checkbox($options) { $GLOBALS['checkbox'] = $options; }
function wc_add_notice($message, $type) { $GLOBALS['notices'][] = array($message, $type); }
class DB {
    public $prefix = 'wp_'; public $last_error = ''; public $rows = array(); public $unavailable = false;
    function prepare($sql, ...$args) { return array($sql, $args); }
    function query($statement) {
        $args = $statement[1];
        if ($this->unavailable || isset($this->rows[$args[0]])) return 0;
        $this->rows[$args[0]] = $args[2]; return 1;
    }
    function get_var($statement) { return $this->rows[$statement[1][0]] ?? null; }
    function delete($table, $where) {
        if (($this->rows[$where['record_key']] ?? null) === $where['payload']) unset($this->rows[$where['record_key']]);
    }
}
class WC_Coupon {
    function __construct(public $code) {}
    function get_meta($key, ...$args) { return $GLOBALS['coupon_meta'][$this->code][$key] ?? ''; }
    function update_meta_data($key, $value) { $GLOBALS['coupon_meta'][$this->code][$key] = $value; }
    function save_meta_data() {}
}
class WC_Order {
    public $coupons = array('WELCOME10'); public $meta = array(); public $hash = 'cart';
    public $paid = false; public $transaction = '';
    function __construct(public $id, public $email = 'new@example.test', public $customer_id = 0, public $status = 'checkout-draft') {}
    function get_id() { return $this->id; }
    function get_billing_email() { return $this->email; }
    function get_customer_id() { return $this->customer_id; }
    function get_coupon_codes() { return $this->coupons; }
    function has_status($statuses) { return in_array($this->status, (array) $statuses, true); }
    function has_cart_hash($hash) { return $this->hash === $hash; }
    function get_date_paid() { return $this->paid; }
    function get_transaction_id() { return $this->transaction; }
    function get_meta($key) { return $this->meta[$key] ?? ''; }
}
class Customer { public $email = 'new@example.test'; function get_billing_email() { return $this->email; } }
class Session { public $data = array(); function get($key, $default) { return $this->data[$key] ?? $default; } }
class Cart { function get_cart_hash() { return 'cart'; } }
class Discounts { function __construct(public $object = null) {} function get_object() { return $this->object; } }
class Request { function __construct(public $method = 'POST') {} function get_method() { return $this->method; } }
function WC() { return $GLOBALS['woo']; }
function wc_get_order($id) { return $GLOBALS['orders'][$id] ?? null; }
function wc_get_orders($args) {
    $GLOBALS['queries'][] = $args;
    check($args['limit'] === 1 && $args['return'] === 'ids' && $args['type'] === 'shop_order', 'history query is bounded and uses Woo order API');
    foreach ($GLOBALS['orders'] as $order) {
        if (in_array($order->id, $args['exclude'], true) || !in_array('wc-' . $order->status, $args['status'], true)) continue;
        if (isset($args['billing_email']) && strtolower($order->email) !== $args['billing_email']) continue;
        if (isset($args['customer_id']) && $order->customer_id !== $args['customer_id']) continue;
        return array($order->id);
    }
    return array();
}
function reset_case() {
    $GLOBALS['wpdb'] = new DB(); $GLOBALS['orders'] = array(); $GLOBALS['queries'] = array();
    $GLOBALS['users'] = array((object) array('ID' => 7, 'user_email' => 'account@example.test'));
    $GLOBALS['woo'] = (object) array('customer' => new Customer(), 'session' => new Session(), 'cart' => new Cart());
    $GLOBALS['current_id'] = 0; $GLOBALS['can_edit'] = true;
    $GLOBALS['notices'] = array();
    $GLOBALS['coupon_meta'] = array('WELCOME10' => array('_lld_first_order_only' => 'yes'));
    unset($GLOBALS['lld_checkout_context'], $GLOBALS['lld_first_order_claims']); $_POST = array();
}
function check($ok, $label) { if (!$ok) throw new \Exception('FAIL: ' . $label); $GLOBALS['count']++; }
function rejects($callback, $message, $label) {
    try { $callback(); } catch (\Exception $error) {
        check(str_contains($error->getMessage(), $message), $label . ': ' . $error->getMessage()); return $error;
    }
    throw new \Exception('FAIL: accepted ' . $label);
}
require __DIR__ . '/../wordpress/longlife-headless-commerce/security.php';
require __DIR__ . '/../wordpress/longlife-headless-commerce/first-order-coupons.php';
reset_case();
$filter = $hooks['woocommerce_coupon_is_valid']; $coupon = new WC_Coupon('WELCOME10'); $discounts = new Discounts();
$hooks['woocommerce_coupon_options_usage_restriction'](1, $coupon);
check($checkbox['label'] === 'First order only' && $checkbox['value'] === 'yes', 'admin displays saved restriction');
$hooks['woocommerce_coupon_options_save'](1, $coupon);
check($coupon->get_meta('_lld_first_order_only') === 'no', 'unchecking saves no');
$_POST['_lld_first_order_only'] = 'yes'; $hooks['woocommerce_coupon_options_save'](1, $coupon);
check($coupon->get_meta('_lld_first_order_only') === 'yes', 'checking saves yes');
$can_edit = false; $_POST = array(); $hooks['woocommerce_coupon_options_save'](1, $coupon);
check($coupon->get_meta('_lld_first_order_only') === 'yes', 'unprivileged save is ignored');
check($filter(true, $coupon, $discounts) === true, 'first-time guest does not need an account or MailPoet');
check($filter(false, $coupon, $discounts) === false, 'other Woo restrictions are never overridden');
WC()->customer->email = '';
check($filter(true, new WC_Coupon('PUBLIC20'), $discounts) === true, 'unmarked coupons bypass all identity checks');
rejects(fn() => $filter(true, $coupon, $discounts), 'valid billing email', 'missing email fails clearly');
foreach (array('pending', 'on-hold', 'processing', 'completed', 'refunded') as $status) {
    reset_case(); WC()->customer->email = ' NEW@example.test ';
    $orders[1] = new WC_Order(1, 'new@example.test', 0, $status);
    rejects(fn() => $filter(true, $coupon, $discounts), 'first orders only', $status . ' history rejects repeat customer');
}
foreach (array('failed', 'cancelled', 'checkout-draft') as $status) {
    reset_case(); $orders[1] = new WC_Order(1, 'new@example.test', 0, $status);
    check($filter(true, $coupon, $discounts), $status . ' does not consume first-order eligibility');
}
reset_case(); $current_id = 7; $orders[1] = new WC_Order(1, 'old-address@example.test', 7, 'completed');
rejects(fn() => $filter(true, $coupon, $discounts), 'first orders only', 'signed-in customer cannot change billing email to bypass history');
$current_id = 0; $GLOBALS['lld_checkout_context'] = array('customer_id' => 7);
rejects(fn() => $filter(true, $coupon, $discounts), 'first orders only', 'verified headless account is checked');
unset($GLOBALS['lld_checkout_context']); WC()->customer->email = 'account@example.test';
rejects(fn() => $filter(true, $coupon, $discounts), 'first orders only', 'guest billing email also checks matching account history');
reset_case(); $current_id = 7; $orders[1] = new WC_Order(1, 'account@example.test', 0, 'completed');
rejects(fn() => $filter(true, $coupon, $discounts), 'first orders only', 'account email catches earlier guest purchase');
reset_case(); $orders[1] = new WC_Order(1, 'new@example.test', 0, 'pending');
WC()->session->data['store_api_draft_order'] = 1;
check($filter(true, $coupon, $discounts), 'same pending checkout can retry');
$orders[1]->hash = 'other-cart';
rejects(fn() => $filter(true, $coupon, $discounts), 'first orders only', 'different pending cart counts as history');
$orders[1]->hash = 'cart'; $orders[1]->status = 'completed';
rejects(fn() => $filter(true, $coupon, $discounts), 'first orders only', 'paid order is not excluded by stale session');
reset_case(); $order = $orders[11] = new WC_Order(11);
$store_checkout = $hooks['woocommerce_store_api_checkout_update_order_from_request'];
$store_checkout($order, new Request());
check(count($wpdb->rows) === 1, 'Store API reserves eligible guest at submission');
$store_checkout($order, new Request());
check(count($wpdb->rows) === 1, 'same order retry is idempotent');
$other = $orders[12] = new WC_Order(12); $other->coupons = array('ANOTHER-FIRST');
$coupon_meta['ANOTHER-FIRST']['_lld_first_order_only'] = 'yes';
$error = rejects(fn() => $store_checkout($other, new Request()), 'reserved', 'separate concurrent checkout cannot claim another first-order coupon');
check($error->getCode() === 400 && $error->error_code === 'lld_first_order_only', 'Store API returns clear 400 before payment');
$hooks['shutdown']();
check(count($wpdb->rows) === 0, 'pre-payment draft failure releases acquired reservation');
$store_checkout($other, new Request()); $other->status = 'pending';
$hooks['shutdown'](); check(count($wpdb->rows) === 1, 'pending payment reservation is kept');
$other->status = 'cancelled'; $store_checkout($order, new Request());
check(json_decode(reset($wpdb->rows), true)['order'] === 11, 'cancelled unpaid order permits another first order');
reset_case(); $order = $orders[11] = new WC_Order(11);
$store_checkout($order, new Request('PATCH'));
check(count($wpdb->rows) === 0, 'reviewing checkout does not reserve');
check($filter(true, $coupon, $discounts), 'coupon initially eligible');
$orders[2] = new WC_Order(2, 'returning@example.test', 0, 'completed');
$order->email = 'returning@example.test';
rejects(fn() => $store_checkout($order, new Request()), 'first orders only', 'final order email is rechecked after coupon application');
reset_case(); $order = $orders[11] = new WC_Order(11, 'new@example.test', 7);
$orders[2] = new WC_Order(2, 'other@example.test', 7, 'completed');
rejects(fn() => $store_checkout($order, new Request()), 'first orders only', 'final order ownership is checked');
reset_case(); $wpdb->last_error = 'database unavailable';
rejects(fn() => $filter(true, $coupon, $discounts), 'could not verify', 'history database error fails closed');
reset_case(); $order = $orders[11] = new WC_Order(11); $wpdb->unavailable = true;
rejects(fn() => $store_checkout($order, new Request()), 'could not verify', 'failed reservation storage never permits payment');
reset_case(); $order = $orders[11] = new WC_Order(11, 'new@example.test', 7, 'pending');
$hooks['woocommerce_checkout_create_order']($order);
check(count($wpdb->rows) === 0, 'classic pre-save validation does not reserve an unsaved order');
$hooks['woocommerce_checkout_order_created']($order);
check(count($wpdb->rows) === 3, 'classic checkout reserves billing email, account email and account id');
$hooks['woocommerce_before_pay_action']($order);
check(count($wpdb->rows) === 3, 'order-pay retries same order');
$orders[2] = new WC_Order(2, 'new@example.test', 0, 'completed');
$hooks['woocommerce_before_pay_action']($order);
check(count($notices) === 1 && $notices[0][1] === 'error' && str_contains($notices[0][0], 'first orders only'), 'order-pay blocks ineligible retry with a notice, not an uncaught exception');
reset_case(); $order = $orders[11] = new WC_Order(11); $store_checkout($order, new Request());
$order->meta['_stripe_intent_id'] = 'pi_ambiguous'; $hooks['shutdown']();
check(count($wpdb->rows) === 1, 'ambiguous payment is never released automatically');
echo "First-order coupon checks passed: $count assertions.\n";
}
