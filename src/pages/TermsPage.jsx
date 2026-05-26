import s from '../constants/styles';

export default function TermsPage() {
 return (
  <div>
   <div style={s.shopHero}><div style={s.inner}><h1 style={s.shopH1}>Terms of Service</h1><p style={s.shopSub}>Last updated: January 2024</p></div></div>
   <div style={{...s.inner,maxWidth:760,padding:"60px 24px"}}>
    {[["Agreement","By accessing or using longlifedigital.co, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not use our services."],["Products and Services","Longlife Digital sells digital products including ebooks, templates, prompt packs and courses, as well as business services. All digital products are delivered electronically after payment."],["Intellectual Property","All products sold by Longlife Digital are protected by copyright law. Unless otherwise stated (e.g. PLR products), products are for personal use only and may not be resold, redistributed or shared."],["PLR Licenses","Products marked with PLR (Private Label Rights) may be rebranded and resold subject to the specific license included with the product. Reselling the PLR rights themselves is prohibited."],["Payment","All prices are in USD. We use Payhip and Stripe for secure payment processing. By completing a purchase you authorize the charge to your payment method."],["Disclaimer","Products are provided for educational and informational purposes. Results vary and are not guaranteed. Longlife Digital makes no warranty about income or business results from using our products."],["Limitation of Liability","Longlife Digital shall not be liable for any indirect, incidental or consequential damages arising from use of our products or services, to the maximum extent permitted by law."],["Changes","We reserve the right to modify these terms at any time. Continued use of our website after changes constitutes acceptance of the new terms."],["Contact","Terms questions: support@lldhome.com"]].map(([title,body])=>(<div key={title} style={{marginBottom:28}}><h3 style={{fontSize:18,fontWeight:700,color:"#1a0533",fontFamily:"'Playfair Display',serif",marginBottom:10}}>{title}</h3><p style={{color:"#6B7280",lineHeight:1.85,fontSize:14}}>{body}</p></div>))}
   </div>
  </div>
 );
}
