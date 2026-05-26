import s from '../constants/styles';

export default function PrivacyPage() {
 return (
  <div>
   <div style={s.shopHero}><div style={s.inner}><h1 style={s.shopH1}>Privacy Policy</h1><p style={s.shopSub}>Last updated: January 2024</p></div></div>
   <div style={{...s.inner,maxWidth:760,padding:"60px 24px"}}>
    {[["Information We Collect","We collect information you provide when making a purchase (name, email, payment details), information collected automatically (IP address, browser type, pages visited) and information from payment processors (Payhip, Stripe, PayPal)."],["How We Use Your Information","We use your information to process orders and deliver products, send purchase confirmations and product updates, respond to customer service requests, improve our products and services and send marketing emails (you may unsubscribe at any time)."],["Information Sharing","We do not sell, trade or rent your personal information to third parties. We share information with payment processors (Payhip, Stripe, PayPal) to complete transactions and with email service providers to send communications."],["Data Security","We implement industry-standard security measures to protect your personal information. Payment information is handled by PCI-compliant processors and is never stored on our servers."],["Cookies","We use cookies to improve your browsing experience, analyze site traffic and personalize content. You can control cookie settings through your browser."],["Your Rights","You have the right to access, correct or delete your personal data at any time. Email support@lldhome.com to make any requests regarding your personal information."],["Contact","Privacy questions: support@lldhome.com | longlifedigital.co"]].map(([title,body])=>(<div key={title} style={{marginBottom:28}}><h3 style={{fontSize:18,fontWeight:700,color:"#1a0533",fontFamily:"'Playfair Display',serif",marginBottom:10}}>{title}</h3><p style={{color:"#6B7280",lineHeight:1.85,fontSize:14}}>{body}</p></div>))}
   </div>
  </div>
 );
}
