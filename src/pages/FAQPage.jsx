import { useState } from 'react';
import s from '../constants/styles';

export default function FAQPage({ setPage }) {
 const [open,setOpen]=useState(null);
 const faqs=[{q:"How do I download my product?",a:"After purchase you receive an email with a download link. Payhip delivers your file automatically within seconds."},{q:"What payment methods do you accept?",a:"We accept all major credit cards, PayPal, Apple Pay and Google Pay via Payhip or Stripe."},{q:"Can I get a refund?",a:"All digital product sales are final. Please read the description carefully before purchasing. Contact us at support@lldhome.com with any questions before buying."},{q:"Do I need special software?",a:"Most products are PDF files. Templates may require Canva (free) or Microsoft Word."},{q:"Can I share or resell your products?",a:"Standard products are for personal use only. PLR products can be rebranded and resold per the included license."},{q:"I lost my download link?",a:"Email support@lldhome.com with your order email and we will resend it within 24 hours."},{q:"Do you offer discounts?",a:"Yes! Use code WELCOME10 for 10% off your first order. Follow @longlifedigital for more codes."},{q:"How do I contact support?",a:"Email support@lldhome.com or call +1 (210) 742-4957. We reply within 24 hours Mon-Sat."}];
 return (
  <div>
   <div style={s.shopHero}><div style={s.inner}><div style={s.secLabel}>✦ FAQ ✦</div><h1 style={s.shopH1}>Frequently Asked Questions</h1><p style={s.shopSub}>Everything you need to know about Longlife Digital</p></div></div>
   <div style={{...s.inner,maxWidth:760,padding:"60px 24px"}}>
    {faqs.map((faq,i)=>(<div key={i} style={{border:"1px solid #F3F4F6",borderRadius:12,marginBottom:12,overflow:"hidden",boxShadow:open===i?"0 4px 20px rgba(147,51,234,0.08)":"none"}}><div className="btn-h" style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 20px",cursor:"pointer",background:open===i?"#F3EEFF":"#fff"}} onClick={()=>setOpen(open===i?null:i)}><span style={{fontSize:15,fontWeight:600,color:"#1a0533"}}>{faq.q}</span><span style={{fontSize:18,color:"#9333EA",fontWeight:700,flexShrink:0,marginLeft:12}}>{open===i?"−":"+"}</span></div>{open===i&&<div style={{padding:"0 20px 18px",fontSize:14,color:"#6B7280",lineHeight:1.8,borderTop:"1px solid #F3F4F6",background:"#fff"}}>{faq.a}</div>}</div>))}
    <div style={{textAlign:"center",marginTop:40,background:"#F3EEFF",borderRadius:16,padding:"32px",border:"1px solid rgba(147,51,234,0.15)"}}><p style={{color:"#6B7280",marginBottom:16,fontSize:15}}>Still have questions?</p><button className="btn-h" style={s.btnPrimary} onClick={()=>setPage("contact")}>Contact Us →</button></div>
   </div>
  </div>
 );
}
