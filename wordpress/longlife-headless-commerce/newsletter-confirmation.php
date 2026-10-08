<?php
if (!defined('ABSPATH')) { exit; }

function lld_mailpoet_confirmation_data() {
    if (!class_exists('MailPoet\\DI\\ContainerWrapper')) return null;
    try {
        $router = \MailPoet\DI\ContainerWrapper::getInstance()->get(\MailPoet\Router\Router::class);
        if (!$router->apiRequest || $router->endpoint !== 'subscription' || $router->endpointAction !== 'confirm') return null;
        $data = $router->data;
        if (!is_array($data) || isset($data['preview']) || isset($_GET['preview'])
            || !is_string($data['email'] ?? null) || !is_string($data['token'] ?? null)
            || !$data['email'] || !$data['token']) return null;
        return $data;
    } catch (Throwable $error) {
        return null;
    }
}

function lld_newsletter_confirmation_redirect() {
    $storefront = lld_email_storefront_url();
    if (!$storefront || headers_sent()) return;
    nocache_headers();
    header('Referrer-Policy: no-referrer');
    header('X-Robots-Tag: noindex, nofollow');
    // The destination is the validated, admin-configured origin, never a request
    // parameter. Do not forward MailPoet's email address or bearer token.
    if (wp_redirect($storefront . '/newsletter-confirmed', 303, 'Longlife Headless Commerce')) exit;
}

// Let MailPoet finish saving consent, scheduling welcome mail and running all
// confirmation listeners before leaving WordPress. The original email link must
// continue reaching MailPoet so it can validate the token and confirm the signup.
add_action('mailpoet_subscription_confirmed', function ($subscriber) {
    $data = lld_mailpoet_confirmation_data();
    if ($data && $subscriber instanceof \MailPoet\Entities\SubscriberEntity
        && $subscriber->getStatus() === 'subscribed'
        && strcasecmp($subscriber->getEmail(), $data['email']) === 0) {
        add_action('template_redirect', 'lld_newsletter_confirmation_redirect', 5);
    }
});

// A valid link may be opened again after confirmation, including a link clicked
// before this plugin update. MailPoet does not fire its confirmed action again.
// Check the persisted state BEFORE its handler runs, and reuse its token verifier.
add_action('mailpoet_conflict_resolver_router_url_query_parameters', function () {
    $data = lld_mailpoet_confirmation_data();
    if (!$data) return;
    try {
        $container = \MailPoet\DI\ContainerWrapper::getInstance();
        $subscriber = $container->get(\MailPoet\Subscribers\SubscribersRepository::class)->findOneBy(array('email' => $data['email']));
        if (!$subscriber instanceof \MailPoet\Entities\SubscriberEntity
            || $subscriber->getStatus() !== 'subscribed' || $subscriber->getDeletedAt()
            || $subscriber->getUnconfirmedData() !== null) return;
        if ($container->get(\MailPoet\Subscribers\LinkTokens::class)->verifyToken($subscriber, $data['token'])) {
            add_action('template_redirect', 'lld_newsletter_confirmation_redirect', 5);
        }
    } catch (Throwable $error) {
        // Keep MailPoet's own page/error handling available if its API changes.
    }
});
