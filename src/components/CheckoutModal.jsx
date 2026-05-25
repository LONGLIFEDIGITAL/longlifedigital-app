import s from '../constants/styles';
import { fmtPrice } from '../utils/helpers';
import { CATS } from '../constants/data';
import { StripeCheckout } from '../payments';

export default function CheckoutModal({
  showCheckout, checkoutItem, setShowCheckout,
  checkoutStep, setCheckoutStep,
  orderInfo, setOrderInfo,
  stripeLoading, stripeError, clientSecret,
  createPaymentIntent, resetStripe,
  setCart, fire, setPage,
  orderNum, setOrderNum,
}) {
 if (!showCheckout || !checkoutItem) return null;
 return (
  <div style={{position:"fixed",inset:0,background:"rgba(10,0,30,0.85)",backdropFilter:"blur(16px)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setShowCheckout(false)}>
   <div style={{background:"#fff",borderRadius:20,width:"100%",maxWidth:420,overflow:"hidden",boxShadow:"0 24px 60px rgba(0,0,0,0.4)",position:"relative"}} onClick={e=>e.stopPropagation()}>
    <div style={{height:4,background:"linear-gradient(90deg,#7C3AED,#C9963F,#E8C97A)"}}/>
    <div style={{padding:"28px 28px 24px"}}>
     <button style={{position:"absolute",top:16,right:16,background:"#F3F4F6",border:"none",color:"#374151",width:28,height:28,borderRadius:"50%",cursor:"pointer",fontSize:13}} onClick={()=>setShowCheckout(false)}>✕</button>
     <div style={{textAlign:"center",marginBottom:20}}>
      <div style={{width:52,height:52,borderRadius:12,background:"linear-gradient(135deg,#1a0533,#2d1066)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,margin:"0 auto 12px"}}>{CATS.find(c=>c.id===checkoutItem.cat)?.icon||"📦"}</div>
      <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:"#1a0533",marginBottom:4}}>{checkoutItem.name}</h3>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:700,color:"#9333EA"}}>${checkoutItem.price}</div>
     </div>
     {checkoutStep===3?(<div style={{textAlign:"center"}}><div style={{width:52,height:52,borderRadius:"50%",background:"linear-gradient(135deg,#059669,#10B981)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,margin:"0 auto 14px"}}>✓</div><h3 style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:"#1a0533",marginBottom:8}}>Payment Successful!</h3><p style={{fontSize:13,color:"#6B7280",marginBottom:16}}>Thank you {orderInfo.name}! Check {orderInfo.email} for your download link.</p>{checkoutItem?.pdfFile&&<a href={checkoutItem.pdfFile} download={checkoutItem.pdfName||"product.pdf"} style={{display:"block",background:"linear-gradient(135deg,#059669,#10B981)",borderRadius:10,padding:"12px",textAlign:"center",color:"#fff",fontWeight:700,fontSize:13,textDecoration:"none",marginBottom:12}}>⬇ Download Now</a>}<button className="btn-h" style={{...s.btnPrimary,width:"100%"}} onClick={()=>{setShowCheckout(false);setPage("shop");}}>Continue Shopping</button></div>):checkoutStep===2?(<div style={{padding:"4px 0"}}>{stripeLoading&&<div style={{textAlign:"center",padding:"40px 0",color:"#9333EA",fontSize:13}}>Setting up secure payment…</div>}{stripeError&&<div style={{padding:"10px 14px",background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:8,color:"#ef4444",fontSize:13,marginBottom:12}}>{stripeError}</div>}{clientSecret&&!stripeLoading&&<StripeCheckout clientSecret={clientSecret} productName={checkoutItem.name} amount={checkoutItem.price} onSuccess={(pi)=>{setOrderNum("LD-"+pi.id.slice(-6).toUpperCase());setCheckoutStep(3);setCart(prev=>prev.filter(i=>i.id!==checkoutItem?.id));fire("Payment successful! ✦");}} onError={(msg)=>fire(msg,"err")}/>}<button style={{background:"none",border:"none",color:"#9333EA",fontSize:12,cursor:"pointer",width:"100%",marginTop:10}} onClick={()=>{setCheckoutStep(1);resetStripe();}}>← Back</button></div>):(<div><label style={s.lbl}>Full Name *</label><input className="inp-f" style={{...s.inp,marginBottom:10}} placeholder="John Smith" value={orderInfo.name} onChange={e=>setOrderInfo({...orderInfo,name:e.target.value})}/><label style={s.lbl}>Email * (download sent here)</label><input className="inp-f" style={s.inp} placeholder="john@email.com" value={orderInfo.email} onChange={e=>setOrderInfo({...orderInfo,email:e.target.value})}/><button className="btn-h" style={{...s.btnPrimary,width:"100%",padding:"13px",marginTop:14}} onClick={()=>{if(!orderInfo.name||!orderInfo.email||!orderInfo.email.includes("@")){fire("Fill name and email","err");return;}createPaymentIntent({amount:checkoutItem.price,productName:checkoutItem.name,customerEmail:orderInfo.email,customerName:orderInfo.name});setCheckoutStep(2);}}>Continue to Payment →</button><p style={{textAlign:"center",fontSize:11,color:"#9CA3AF",marginTop:10}}>🔒 Secured by Stripe</p></div>)}
    </div>
   </div>
  </div>
 );
}
