<?php
namespace MailPoet\API\MP\v1 { class APIException extends \Exception {} }
namespace MailPoet\API { class API { static function MP($version) { return $GLOBALS['mp']; } } }
namespace {
define('ABSPATH', __DIR__);
class WP_Error { public $status; function __construct(public $code,public $message,public $data){$this->status=$data['status'];} }
function lld_error($message,$status=400){return new WP_Error('lld_checkout',$message,['status'=>$status]);}
function is_wp_error($v){return $v instanceof WP_Error;}
function lld_response($v){return $v;}
function add_action(...$args){}
function sanitize_text_field($v){return strip_tags($v);}
function sanitize_textarea_field($v){return strip_tags($v);}
function is_email($v){return filter_var($v,FILTER_VALIDATE_EMAIL);}
function wp_json_encode($v){return json_encode($v);}
function wp_salt($v){return 'test-salt';}
function esc_html($v){return htmlspecialchars($v,ENT_QUOTES);}
function get_option($k,$fallback=0){return $GLOBALS['list'];}
function lld_record($k){return $GLOBALS['records'][$k]??null;}
function lld_insert($k,$kind,$data){if(isset($GLOBALS['records'][$k]))return false;$GLOBALS['records'][$k]=$data;return true;}
function lld_save($k,$data){$GLOBALS['records'][$k]=$data;}
function lld_delete($k){unset($GLOBALS['records'][$k]);}
function lld_inquiry_rate($client,$email){return $GLOBALS['throttle']?lld_error('Too many',429):true;}
function wc_get_logger(){return new class {function error(...$args){$GLOBALS['logs'][]=$args;} function notice(...$args){$GLOBALS['logs'][]=$args;}};}
class WC_Emails {
 static function instance(){return new self;}
 function wrap_message($subject,$body){return $body;}
 function send(...$args){$GLOBALS['mail'][]=$args;return $GLOBALS['mail_ok'];}
}
class Request {function __construct(public $data){} function get_param($k){return $this->data[$k]??null;}}
class MockMailPoet {
 public $subscriber=null,$calls=[],$fail=false;
 function getLists(){return [['id'=>7,'type'=>'default','name'=>'Newsletter'],['id'=>9,'type'=>'woocommerce_users']];}
 function getSubscriber($email){if(!$this->subscriber)throw new \MailPoet\API\MP\v1\APIException('not found',4);return $this->subscriber;}
 function addSubscriber($data,$lists,$options){$this->calls[]=['add',$data,$lists,$options];if($this->fail)throw new \RuntimeException('provider failure');return $this->subscriber=['id'=>1,'status'=>'unconfirmed'];}
 function subscribeToList($email,$list,$options){$this->calls[]=['subscribe',$email,$list,$options];return ['id'=>1,'status'=>'unconfirmed'];}
}
require __DIR__.'/../wordpress/longlife-headless-commerce/forms.php';
function check($v,$message){if(!$v)throw new \RuntimeException($message);}
function reset_state(){ $GLOBALS['records']=[];$GLOBALS['logs']=[];$GLOBALS['mail']=[];$GLOBALS['mail_ok']=true;$GLOBALS['list']=7;$GLOBALS['throttle']=false;$GLOBALS['mp']=new MockMailPoet; }
function request($patch=[]){return new Request(array_merge(['requestId'=>'6b030225-d7f1-4695-9e62-8dd372379a41','name'=>'Alex','email'=>'alex@example.test','service'=>'Website & design','message'=>'Hello <script>bad</script>','client'=>str_repeat('a',64),'consent'=>true],$patch));}
reset_state();
check(lld_contact_form(request())===['ok'=>true],'contact accepted');
check($mail[0][0]==='support@longlifedigital.co','fixed support recipient');
check(str_contains($mail[0][3],'Reply-To: alex@example.test'),'visitor reply-to');
check(!str_contains($mail[0][2],'<script>'),'escaped contact body');
check(lld_contact_form(request())===['ok'=>true] && count($mail)===1,'duplicate contact not resent');
check(lld_contact_form(request(['message'=>'changed']))->status===409,'changed replay rejected');
reset_state();$mail_ok=false;check(lld_contact_form(request())->status===503,'mail failure reported');check(!$records,'failed request retryable');
reset_state();$throttle=true;check(lld_contact_form(request())->status===429 && !$mail,'throttled email not sent');
reset_state();check(is_wp_error(lld_newsletter_signup(request(['consent'=>false]))),'consent enforced');check(!$mp->calls,'no unconsented subscriber');
$list=0;check(lld_newsletter_signup(request())->status===503,'missing list rejected');
reset_state();check(lld_newsletter_signup(request(['list'=>99]))===['ok'=>true],'new subscriber');
check($mp->calls[0][2]===[7],'server configured list only');
check($mp->calls[0][3]['send_confirmation_email']===true,'confirmation requested');
check(!isset($mp->calls[0][1]['status']),'MailPoet decides opt-in status');
check(lld_newsletter_signup(request())===['ok'=>true] && count($mp->calls)===1,'newsletter replay idempotent');
reset_state();$mp->subscriber=['id'=>1,'status'=>'subscribed','first_name'=>'Original','subscriptions'=>[['segment_id'=>7,'status'=>'subscribed']]];
check(lld_newsletter_signup(request())===['ok'=>true] && !$mp->calls,'existing member not duplicated or overwritten');
reset_state();$mp->subscriber=['id'=>1,'status'=>'unconfirmed'];
check(lld_newsletter_signup(request())===['ok'=>true] && $mp->calls[0][0]==='subscribe','pending signup uses MailPoet resubscribe');
foreach ([['id'=>1,'status'=>'subscribed','deleted_at'=>'2026-10-08'],['id'=>1,'status'=>'bounced'],['id'=>1,'status'=>'inactive']] as $subscriber) {
 reset_state();$mp->subscriber=$subscriber;$result=lld_newsletter_signup(request());
 check($result->status===422 && $result->code==='lld_newsletter_ineligible','ineligible subscriber gets an actionable validation error');
 check(str_contains($result->message,'contact support@longlifedigital.co'),'support guidance provided');
 check(!$mp->calls && !$records,'ineligible member not restored or subscribed and retry record released');
 check(str_contains($logs[0][0],isset($subscriber['deleted_at'])?'trashed_subscriber':'ineligible_subscriber_status'),'admin log distinguishes known rejection');
 check(!str_contains(json_encode($logs),'alex@example.test'),'diagnostics do not log subscriber addresses');
}
reset_state();$mp->subscriber=['id'=>1,'status'=>'unsubscribed'];check(lld_newsletter_signup(request())===['ok'=>true] && $mp->calls[0][0]==='subscribe','unsubscribed contact can request confirmation with consent');
reset_state();$mp->fail=true;check(lld_newsletter_signup(request())->status===503 && !$records,'provider failure visible and retryable');
check(str_contains($logs[0][0],'subscriber_add'),'unexpected failure identifies its stage');
echo "Contact and MailPoet bridge checks passed.\n";
}
