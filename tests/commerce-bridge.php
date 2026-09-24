<?php
// Unit harness for authorization, duplicate requests, and entitlement projection.
// Real Woo/Stripe integration is tested separately on the configured WordPress site.
define('ABSPATH', '/test/'); define('WC_VERSION', '11.1.2'); define('WC_STRIPE_VERSION', '11.0.0');
$hooks = array();
function add_filter($name, $callback, ...$args) { global $hooks; $hooks[$name] = $callback; }
function add_action($name, $callback, ...$args) { add_filter($name, $callback); }
function register_activation_hook($file, $callback) {}
function wp_json_encode($v) { return json_encode($v); }
function is_wp_error($v) { return $v instanceof WP_Error; }
class WP_Error { public function __construct(public $code, public $message, public $data) {} }
class WP_REST_Response {
    public function __construct(public $data, public $status = 200) {}
    function get_data() { return $this->data; } function get_status() { return $this->status; }
    function header($k, $v) {}
}
class DB {
    public $prefix = 'wp_'; public $rows = array();
    function prepare($sql, ...$args) { return array($sql, $args); }
    function query($statement) {
        [$sql, $args] = $statement;
        if (strpos($sql, 'INSERT') === 0) {
            if (isset($this->rows[$args[0]])) return 0;
            $this->rows[$args[0]] = $args[2]; return 1;
        }
        return 0;
    }
    function get_var($statement) { return $this->rows[$statement[1][0]] ?? null; }
    function update($table, $data, $where) { $this->rows[$where['record_key']] = $data['payload']; return 1; }
    function delete($table, $where) { unset($this->rows[$where['record_key']]); }
}
$wpdb = new DB();
$options = array('lld_bridge_secret' => str_repeat('s', 64), 'lld_checkout_enabled' => '1', 'woocommerce_enable_guest_checkout' => 'yes', 'woocommerce_stripe_settings' => array('enabled' => 'yes', 'testmode' => 'yes', 'capture' => 'yes', 'test_publishable_key' => 'pk_test_example'));
function get_option($key, $default = false) { global $options; return $options[$key] ?? $default; }
class WC_Stripe_UPE_Payment_Gateway {
    public $testmode = true; public $publishable_key = 'pk_test_example';
    public $payment_methods;
    function __construct() { $this->payment_methods = array('card' => new class { function is_enabled() { return true; } }); }
    function verify_intent_after_checkout($order) { $order->verified = true; }
}
class WC_Stripe_Order_Helper {
    static function get_instance() { return new self; }
    function update_stripe_upe_redirect_processed($order, $v) { $order->meta["redirect_processed"] = $v; }
    function delete_stripe_upe_waiting_for_redirect($order) { unset($order->meta["_stripe_upe_waiting_for_redirect"]); }
}
class WC_Stripe {
    static function get_instance() { return new self; }
    function get_main_stripe_gateway() { return new WC_Stripe_UPE_Payment_Gateway; }
}
class Countries {
    function get_allowed_countries() { return array('US' => 'United States', 'AE' => 'United Arab Emirates'); }
    function get_states() { return array(); }
    function get_address_fields($country, $type) { return array($type . 'postcode' => array('required' => $country === 'US', 'hidden' => $country === 'AE')); }
}
function WC() { return (object) array('countries' => new Countries, 'cart' => true); }
$orders = array();
function wc_get_order($id) { global $orders; return $orders[$id] ?? null; }
class Order {
    public $meta = array(); public $status = 'pending'; public $paidDate = false; public $downloads = array(); public $verified = false;
    function save() {}
    function get_id() { return 12; } function get_meta($k) { return $this->meta[$k] ?? ''; }
    function update_meta_data($k, $v) { $this->meta[$k] = $v; }
    function is_paid() { return in_array($this->status, array('processing', 'completed'), true); }
    function get_date_paid() { return $this->paidDate; }
    function has_status($values) { return in_array($this->status, (array) $values, true); }
    function get_payment_method() { return 'stripe'; }
    function get_order_number() { return '12'; } function get_status() { return $this->status; }
    function get_transaction_id() { return ''; }
    function get_total() { return '13.99'; } function get_currency() { return 'USD'; }
    function get_items() { return array(); } function is_download_permitted() { return true; }
    function get_downloadable_items() { return $this->downloads; }
}
class Request {
    public $headers = array(); public $route; public $body;
    function __construct($route, $body = '{}', $session = null, $attempt = null) {
        $this->route = $route; $this->body = $body;
        $this->headers = array('x-lld-session' => $session ?? str_repeat('a',64), 'x-lld-attempt' => $attempt ?? '11111111-1111-4111-8111-111111111111', 'x-lld-timestamp' => (string)time(), 'x-lld-nonce' => bin2hex(random_bytes(16)), 'cart-token' => $route === '/wc/store/v1/checkout' ? 'cart-token' : '');
        $this->sign();
    }
    function sign() {
        $h = $this->headers;
        $this->headers['x-lld-signature'] = hash_hmac('sha256', implode("\n", array('POST', $this->route, $h['x-lld-session'], $h['x-lld-attempt'], $h['x-lld-timestamp'], $h['x-lld-nonce'], $h['cart-token'], $this->body)), get_option('lld_bridge_secret'));
    }
    function get_header($k) { return $this->headers[$k] ?? ''; } function get_method() { return 'POST'; }
    function get_route() { return $this->route; } function get_body() { return $this->body; }
    function get_param($k) { return json_decode($this->body, true)[$k] ?? null; }
}
require __DIR__ . '/../wordpress/longlife-headless-commerce/longlife-headless-commerce.php';
$count = 0;
function check($value, $message) { global $count; if (!$value) throw new Exception('FAIL: ' . $message); $count++; echo 'ok ' . $count . ' - ' . $message . "\n"; }
$r = new Request('/lld-headless/v1/order');
check(lld_authenticate_bridge($r) === true, 'signed request accepted');
check(lld_authenticate_bridge($r)->data['status'] === 409, 'nonce replay rejected');
$r = new Request('/lld-headless/v1/order'); $r->body = '{"confirm":true}';
check(lld_authenticate_bridge($r)->data['status'] === 403, 'modified request body rejected');
$r = new Request('/lld-headless/v1/order'); $r->headers['x-lld-timestamp'] = (string)(time()-121); $r->sign();
check(lld_authenticate_bridge($r)->data['status'] === 403, 'expired signature rejected');
check(lld_configuration()['enabled'], 'exact test gateway configuration enabled');
check(lld_configuration()['publishableKey'] === 'pk_test_example', 'billing field iteration preserves the configured Stripe publishable key');
check(lld_configuration()['billingFields']['US']['postcode']['required'], 'Woo required postal code exposed');
check(!lld_configuration()['billingFields']['AE']['postcode']['required'] && lld_configuration()['billingFields']['AE']['postcode']['hidden'], 'Woo hidden postal code not required');
$options['woocommerce_stripe_settings']['testmode'] = 'no';
check(!lld_configuration()['enabled'], 'live payments rejected');
$options['woocommerce_stripe_settings']['testmode'] = 'yes';
$options['woocommerce_enable_guest_checkout'] = 'no';
check(!lld_configuration()['enabled'], 'account-required configuration rejected');
$options['woocommerce_enable_guest_checkout'] = 'yes';
$pre = $hooks['rest_pre_dispatch']; $post = $hooks['rest_post_dispatch'];
$r = new Request('/wc/store/v1/checkout', '{"expected_total":"1399"}');
check($pre(null, null, $r) === null, 'first checkout dispatch allowed');
$identity = lld_request_identity($r);
$other = new Request('/wc/store/v1/checkout', '{"expected_total":"1399"}', null, '22222222-2222-4222-8222-222222222222');
check($pre(null, null, $other)->data['status'] === 409, 'parallel attempt for same session blocked');
$duplicate = new Request('/wc/store/v1/checkout', $r->body);
check($pre(null, null, $duplicate)->data['status'] === 409, 'duplicate while processing blocked');
$order = new Order(); $orders[12] = $order;
$hooks['woocommerce_store_api_checkout_update_order_meta']($order);
check(lld_record($identity['key'])['order'] === 12, 'order associated durably before payment');
$post(new WP_REST_Response(array('order_id'=>12, 'payment_result'=>array('payment_status'=>'success'))), null, $r);
$duplicate = new Request('/wc/store/v1/checkout', $r->body);
check($pre(null, null, $duplicate)->get_data()['order_id'] === 12, 'completed duplicate returns same result without reprocessing');
$changed = new Request('/wc/store/v1/checkout', '{"expected_total":"1"}');
check($pre(null, null, $changed)->data['status'] === 409, 'same attempt with changed details rejected');
$owned = new Request('/lld-headless/v1/order');
$record = lld_record($identity['key']);
$record['response']['payment_result']['redirect_url'] = '#wc-stripe-confirm-pi:12:pi_abc_secret_xyz:nonce';
lld_save($identity['key'], $record);
check(lld_order_status($owned)->data['authentication']['clientSecret'] === 'pi_abc_secret_xyz', 'owned pending order can resume authentication');
$order->downloads = array(array('product_id'=>318, 'product_name'=>'Small Business AI Prompt Pack', 'download_id'=>'pack', 'download_name'=>'Private file','download_url'=>'https://woo.test/?download_file=318','downloads_remaining'=>'','access_expires'=>'','file'=>array('file'=>'secret-source')));
check(count(lld_order_status($owned)->data['downloads']) === 0, 'pending order has no downloads');
$stolen = new Request('/lld-headless/v1/order', '{}', str_repeat('b',64));
check(lld_order_status($stolen)->data['status'] === 404, 'different session cannot read order');
$order->status = 'completed'; $order->paidDate = true;
$order->meta['_stripe_upe_waiting_for_redirect'] = true;
$response = lld_order_status($owned)->data;
check($response['paid'] && count($response['downloads']) === 1, 'verified paid order exposes permission URL');
check($response['authentication'] === null, 'paid order cannot start authentication again');
check($response['downloads'][0]['productId'] === 318 && $response['downloads'][0]['productName'] === 'Small Business AI Prompt Pack', 'download retains product identity');
check($response['downloads'][0]['expires'] === null, 'unlimited permission has explicit null expiry');
$order->downloads[0]['access_expires'] = new DateTimeImmutable('2099-03-12T00:00:00+05:30');
$order->downloads[] = array('product_id'=>320, 'product_name'=>'Another product', 'download_id'=>'another', 'download_name'=>'Another file', 'download_url'=>'https://woo.test/?download_file=320', 'downloads_remaining'=>'', 'access_expires'=>null);
$files = lld_order_status($owned)->data['downloads'];
check($files[0]['expires'] === '2099-03-12T00:00:00+05:30', 'Woo DateTime expiry serializes with its timezone');
check($files[1]['productId'] === 320 && $files[1]['expires'] === null && $files[1]['downloadId'] === 'another', 'multiple products retain their own file and expiry');
array_pop($order->downloads);
$order->downloads[0]['access_expires'] = new DateTimeImmutable('2000-01-01T00:00:00+00:00');
check(count(lld_order_status($owned)->data['downloads']) === 0, 'expired Woo DateTime permission excluded');
$order->downloads[0]['access_expires'] = null;

check($order->meta['redirect_processed'] === true && !$order->get_meta('_stripe_upe_waiting_for_redirect'), 'verified authentication clears gateway redirect bookkeeping');
check(!str_contains(json_encode($response), 'secret-source'), 'source file path is never exposed');
check(lld_record($identity['lock']) === null, 'paid order releases session checkout lock');
$order->downloads[0]['downloads_remaining'] = '0';
check(count(lld_order_status($owned)->data['downloads']) === 0, 'exhausted permissions excluded');
$order->downloads[0]['downloads_remaining'] = ''; $order->downloads[0]['access_expires'] = '2000-01-01';
check(count(lld_order_status($owned)->data['downloads']) === 0, 'expired permissions excluded');
$order->status = 'refunded'; $order->downloads[0]['access_expires'] = '';
check(!lld_order_status($owned)->data['paid'] && count(lld_order_status($owned)->data['downloads']) === 0, 'refund removes download eligibility');
$order->status = 'pending';
$confirm = new Request('/lld-headless/v1/order', '{"confirm":true}'); lld_order_status($confirm);
check($order->verified && !lld_order_status($owned)->data['paid'], 'gateway verification does not trust a client success claim');
$order->status = 'checkout-draft';
$record = lld_record($identity['key']);
$record['status'] = 400;
lld_save($identity['key'], $record);
check(lld_order_status($owned)->data['status'] === 'failed', 'recorded pre-payment rejection resolves a draft as failed');
check(lld_order_status($owned)->data['failureReason'] === 'checkout_validation', 'pre-payment failure suggests correcting checkout details');
$order->meta['_stripe_intent_id'] = 'pi_unresolved';
check(lld_order_status($owned)->data['status'] === 'checkout-draft', 'draft with payment evidence must not be declared failed');
unset($order->meta['_stripe_intent_id']);
$record['status'] = 200;
lld_save($identity['key'], $record);
check(lld_order_status($owned)->data['status'] === 'checkout-draft', 'unresolved draft without a recorded rejection remains unconfirmed');
echo "Passed $count bridge checks.\n";
