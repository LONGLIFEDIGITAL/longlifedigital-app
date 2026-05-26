import s from '../constants/styles';
import LDLogo from '../components/LDLogo';

export default function AboutPage({ contact, isAdmin, setContactForm, setShowContactEdit }) {
 return (
  <div>
   <div style={s.shopHero}><div style={s.inner}><h1 style={s.shopH1}>About Us</h1><p style={s.shopSub}>Our story, mission and values</p></div></div>
   <div style={{...s.inner,maxWidth:800,padding:"60px 24px"}}>
    <div style={{textAlign:"center",marginBottom:48}}><LDLogo size={72}/><h2 style={{...s.sectionH2,marginTop:20}}>Longlife Digital</h2><p style={{color:"#6B7280",fontSize:16,lineHeight:1.85}}>Premium digital products for entrepreneurs, creators and learners</p></div>
    {[["Our Mission","We believe that premium knowledge should be accessible to everyone ready to invest in themselves. Every product we create delivers real, measurable value."],["What We Sell","We offer a curated collection of ebooks, online courses, marketing tools, digital templates and premium domain names — all with instant delivery and lifetime access."],["Our Promise","Every product is handcrafted, tested and proven. We stand behind everything we sell with secure payments through Payhip and Stripe, fast support and a satisfaction guarantee."]].map(([title,text])=>(<div key={title} style={{marginBottom:36,padding:"28px",background:"#FAFAFA",borderRadius:12,border:"1px solid #F3F4F6"}}><h3 style={{fontSize:20,fontWeight:"700",color:"#1a0533",fontFamily:"'Playfair Display',serif",marginBottom:12}}>{title}</h3><p style={{color:"#6B7280",lineHeight:1.85}}>{text}</p></div>))}
    <div style={{background:"#F3EEFF",borderRadius:12,padding:"28px",border:"1px solid rgba(147,51,234,0.15)"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}><h3 style={{fontSize:20,fontWeight:"700",color:"#9333EA"}}>Contact Us</h3>{isAdmin&&<button className="btn-h" style={s.editBtn} onClick={()=>{setContactForm(contact);setShowContactEdit(true);}}>✎ Edit Contact Info</button>}</div><p style={{color:"#6B7280",marginBottom:8}}>📧 {contact.email}</p><p style={{color:"#6B7280",marginBottom:8}}>📞 {contact.phone}</p><p style={{color:"#6B7280",marginBottom:8}}>◎ {contact.social}</p><p style={{color:"#6B7280"}}>🌐 {contact.website}</p></div>
   </div>
  </div>
 );
}
