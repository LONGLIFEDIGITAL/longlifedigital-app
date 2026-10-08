<?php
namespace MailPoet\DI {
    class ContainerWrapper {
        static function getInstance() { return new self(); }
        function get($name) {
            if ($GLOBALS['provider_unavailable']) throw new \RuntimeException('Provider unavailable');
            return $GLOBALS['services'][$name];
        }
    }
}
namespace MailPoet\Router {
    class Router {
        public $apiRequest = true, $endpoint = 'subscription', $endpointAction = 'confirm';
        public $data = array('email' => 'reader@example.test', 'token' => 'mailpoet-token');
    }
}
namespace MailPoet\Entities {
    class SubscriberEntity {
        public $status = 'unconfirmed', $email = 'reader@example.test', $deleted = null, $pending = null;
        function getStatus() { return $this->status; }
        function getEmail() { return $this->email; }
        function getDeletedAt() { return $this->deleted; }
        function getUnconfirmedData() { return $this->pending; }
    }
}
namespace MailPoet\Subscribers {
    class SubscribersRepository {
        function findOneBy($query) {
            $subscriber = $GLOBALS['subscriber'];
            return $subscriber && $query['email'] === $subscriber->email ? $subscriber : null;
        }
    }
    class LinkTokens {
        function verifyToken($subscriber, $token) {
            $GLOBALS['verified_tokens']++;
            return $token === 'mailpoet-token';
        }
    }
}
namespace {
    define('ABSPATH', __DIR__);
    $hooks = array();
    function add_action($name, $callback, $priority = 10) { $GLOBALS['hooks'][$name][$priority][] = $callback; }
    function fire($name, ...$args) {
        $callbacks = $GLOBALS['hooks'][$name] ?? array();
        ksort($callbacks);
        foreach ($callbacks as $group) foreach ($group as $callback) $callback(...$args);
    }
    function lld_email_storefront_url() { return $GLOBALS['storefront']; }
    function nocache_headers() { $GLOBALS['no_cache'] = true; }
    class Redirected extends \RuntimeException {}
    function wp_redirect($url, $status, $source) {
        $GLOBALS['redirect'] = array($url, $status, $source);
        throw new Redirected(); // Inspect the terminal redirect without exiting the harness.
    }
    require __DIR__ . '/../wordpress/longlife-headless-commerce/newsletter-confirmation.php';
    $registered_hooks = $hooks;
    $count = 0;
    function check($result, $message) {
        if (!$result) throw new \RuntimeException('FAIL: ' . $message);
        $GLOBALS['count']++;
    }
    function reset_confirmation() {
        $GLOBALS['hooks'] = $GLOBALS['registered_hooks'];
        $GLOBALS['provider_unavailable'] = false;
        $GLOBALS['redirect'] = null;
        $GLOBALS['no_cache'] = false;
        $GLOBALS['verified_tokens'] = 0;
        $GLOBALS['storefront'] = 'https://shop.example.test';
        $GLOBALS['subscriber'] = new \MailPoet\Entities\SubscriberEntity();
        $GLOBALS['services'] = array(
            \MailPoet\Router\Router::class => new \MailPoet\Router\Router(),
            \MailPoet\Subscribers\SubscribersRepository::class => new \MailPoet\Subscribers\SubscribersRepository(),
            \MailPoet\Subscribers\LinkTokens::class => new \MailPoet\Subscribers\LinkTokens(),
        );
        $_GET = array();
    }
    function finish_request() {
        try { fire('template_redirect'); } catch (Redirected $done) {}
    }
    $before = 'mailpoet_conflict_resolver_router_url_query_parameters';
    $confirmed = 'mailpoet_subscription_confirmed';
    reset_confirmation();
    fire($before);
    check(!isset($hooks['template_redirect']), 'pending subscription cannot redirect before MailPoet confirms it');
    $subscriber->status = 'subscribed';
    fire($confirmed, $subscriber);
    check($redirect === null, 'confirmation listeners are allowed to finish before redirect');
    finish_request();
    check($redirect === array('https://shop.example.test/newsletter-confirmed', 303, 'Longlife Headless Commerce'), 'confirmed subscriber reaches the frontend without email or token parameters');
    check($no_cache, 'subscriber redirect is not cacheable');

    reset_confirmation();
    $subscriber->status = 'subscribed';
    fire($before);
    check($verified_tokens === 1, 'repeat click uses MailPoet token validation');
    finish_request();
    check($redirect[0] === 'https://shop.example.test/newsletter-confirmed', 'already confirmed links also finish on the frontend');

    reset_confirmation();
    fire($before);
    $subscriber->status = 'subscribed'; // A failed save can leave an in-memory object changed.
    finish_request(); // No successful confirmation action was fired.
    check($redirect === null, 'failed confirmation cannot appear successful from an in-memory status change');

    foreach (array('unconfirmed', 'unsubscribed', 'bounced', 'inactive') as $status) {
        reset_confirmation();
        $subscriber->status = $status;
        fire($before);
        finish_request();
        check($redirect === null && $subscriber->status === $status, 'redirect code never changes subscriber status');
    }
    foreach (array('manage', 'unsubscribe', 'confirm_unsubscribe', 'tracking_opt_out') as $action) {
        reset_confirmation();
        $subscriber->status = 'subscribed';
        $services[\MailPoet\Router\Router::class]->endpointAction = $action;
        fire($before);
        fire($confirmed, $subscriber);
        finish_request();
        check($redirect === null, 'other MailPoet subscription actions remain with MailPoet');
    }
    foreach (array(array('token' => 'wrong'), array('token' => array('bad')), array('token' => ''), array('email' => 'missing@example.test'), array('preview' => 1)) as $patch) {
        reset_confirmation();
        $subscriber->status = 'subscribed';
        $router = $services[\MailPoet\Router\Router::class];
        $router->data = array_merge($router->data, $patch);
        fire($before);
        finish_request();
        check($redirect === null, 'invalid, unknown and preview links retain MailPoet error handling');
    }
    reset_confirmation();
    $subscriber->status = 'subscribed';
    $_GET['preview'] = 1;
    fire($before);
    fire($confirmed, $subscriber);
    finish_request();
    check($redirect === null, 'WordPress confirmation previews stay in WordPress');

    foreach (array('deleted', 'pending') as $field) {
        reset_confirmation();
        $subscriber->status = 'subscribed';
        $subscriber->$field = 'pending-state';
        fire($before);
        finish_request();
        check($redirect === null, 'trashed or pending subscriber data cannot trigger the repeat-click shortcut');
    }
    reset_confirmation();
    $subscriber->status = 'subscribed';
    $services[\MailPoet\Router\Router::class]->apiRequest = false;
    fire($confirmed, $subscriber);
    finish_request();
    check($redirect === null, 'background and API confirmations do not redirect a browser');

    reset_confirmation();
    $subscriber->status = 'subscribed';
    $provider_unavailable = true;
    fire($before);
    fire($confirmed, $subscriber);
    finish_request();
    check($redirect === null, 'provider initialization failures do not break page rendering');

    reset_confirmation();
    $subscriber->status = 'subscribed';
    $storefront = '';
    fire($confirmed, $subscriber);
    finish_request();
    check($redirect === null, 'missing frontend configuration retains MailPoet page');
    echo "Passed $count newsletter confirmation checks.\n";
}
