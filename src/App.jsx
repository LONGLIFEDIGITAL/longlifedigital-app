import { useState, useEffect } from "react";
import { StripeCheckout, useStripePayment } from './payments';

import s from './constants/styles';
import { CATS, INIT_PRODUCTS, EMPTY_FORM, DEFAULT_CONTACT } from './constants/data';

import LDLogo from './components/LDLogo';
import Nav from './components/Nav';
import ProductCard from './components/ProductCard';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import Toast from './components/Toast';
import LoginModal from './components/LoginModal';
import AIChat from './components/AIChat';

import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductPage from './pages/ProductPage';
import AboutPage from './pages/AboutPage';
import BlogPage from './pages/BlogPage';
import ServicesPage from './pages/ServicesPage';
import CoursesPage from './pages/CoursesPage';
import DomainsPage from './pages/DomainsPage';
import ContactPage from './pages/ContactPage';
import FAQPage from './pages/FAQPage';
import RefundPage from './pages/RefundPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';

export default function App() {
 const [page,setPage]=useState("home");
 const [products,setProducts]=useState(INIT_PRODUCTS);
 const [selProduct,setSelProduct]=useState(null);
 const [cart,setCart]=useState([]);
 const [showCart,setShowCart]=useState(false);
 const [filterCat,setFilterCat]=useState("all");
 const [sortBy,setSortBy]=useState("default");
 const [search,setSearch]=useState("");
 const [showForm,setShowForm]=useState(false);
 const [form,setForm]=useState(EMPTY_FORM);
 const [editId,setEditId]=useState(null);
 const [delId,setDelId]=useState(null);
 const [isAdmin,setIsAdmin]=useState(false);
 const [showLogin,setShowLogin]=useState(false);
 const [loginPass,setLoginPass]=useState("");
 const [loginErr,setLoginErr]=useState(false);
 const [toast,setToast]=useState(null);
 const [scrolled,setScrolled]=useState(false);
 const [annBarHidden,setAnnBarHidden]=useState(false);
 const [menuOpen,setMenuOpen]=useState(false);
 const [subscribed,setSubscribed]=useState(false);
 const [subscribers,setSubscribers]=useState([]);
 const [showCheckout,setShowCheckout]=useState(false);
 const [checkoutItem,setCheckoutItem]=useState(null);
 const [checkoutStep,setCheckoutStep]=useState(1);
 const [orderInfo,setOrderInfo]=useState({name:"",email:"",phone:""});
 const [payMethod,setPayMethod]=useState("card");
 const [cardNum,setCardNum]=useState("");
 const [cardExp,setCardExp]=useState("");
 const [cardCvc,setCardCvc]=useState("");
 const [cardName,setCardName]=useState("");
 const [orderNum,setOrderNum]=useState("");
 const [processing,setProcessing]=useState(false);
 const {clientSecret,loading:stripeLoading,error:stripeError,createPaymentIntent,reset:resetStripe}=useStripePayment();
 const [subName,setSubName]=useState("");
 const [subEmail,setSubEmail]=useState("");
 const [subConsent,setSubConsent]=useState(false);
 const [showPopup,setShowPopup]=useState(false);
 const [popupName,setPopupName]=useState("");
 const [popupEmail,setPopupEmail]=useState("");
 const [popupConsent,setPopupConsent]=useState(false);
 const [popupDone,setPopupDone]=useState(false);
 const [contact,setContact]=useState(DEFAULT_CONTACT);
 const [showContactEdit,setShowContactEdit]=useState(false);
 const [contactForm,setContactForm]=useState(DEFAULT_CONTACT);
 const [activeDropdown,setActiveDropdown]=useState(null);
 const [userRole,setUserRole]=useState(null);
 const [showDashboard,setShowDashboard]=useState(false);
 const [dashTab,setDashTab]=useState("overview");
 const [teamMembers,setTeamMembers]=useState([{id:1,name:"Owner",email:"support@lldhome.com",role:"owner",status:"active",added:"Jan 2024",lastLogin:"Today",permissions:["all"]}]);
 const [showMemberForm,setShowMemberForm]=useState(false);
 const [memberForm,setMemberForm]=useState({name:"",email:"",role:"va",password:""});
 const [editMemberId,setEditMemberId]=useState(null);
 const [orders,setOrders]=useState([
  {id:"LD-001",customer:"Sarah Johnson",email:"sarah@email.com",product:"AI Wealth Accelerator Bundle",amount:497,status:"completed",date:"Jan 20, 2024",method:"card"},
  {id:"LD-002",customer:"Marcus Williams",email:"marcus@email.com",product:"AI Prompts for Real Estate Agents",amount:37,status:"completed",date:"Jan 19, 2024",method:"google"},
  {id:"LD-003",customer:"Emma Davis",email:"emma@email.com",product:"Migraine & Headache Tracker",amount:12,status:"completed",date:"Jan 18, 2024",method:"card"},
  {id:"LD-004",customer:"James Brown",email:"james@email.com",product:"AI Money Machine Toolkit",amount:47,status:"completed",date:"Jan 17, 2024",method:"apple"},
  {id:"LD-005",customer:"Lisa Chen",email:"lisa@email.com",product:"PLR Online Business Bundle",amount:67,status:"refunded",date:"Jan 16, 2024",method:"card"},
 ]);

 const ROLE_PASSWORDS={owner:"longlife2024",manager:"manager2024",va:"va2024"};
 const ROLE_PERMISSIONS={owner:["dashboard","products","orders","members","store","subscribers","contact"],manager:["dashboard","products","orders","subscribers"],va:["dashboard","products","subscribers"]};
 const canDo=(perm)=>{if(!userRole)return false;return ROLE_PERMISSIONS[userRole]?.includes(perm)||false;};

 useEffect(()=>{
  let lastY=0;
  const fn=()=>{
   const currentY=window.scrollY;
   setScrolled(currentY>10);
   setAnnBarHidden(currentY>lastY&&currentY>60);
   lastY=currentY;
  };
  window.addEventListener("scroll",fn);
  return()=>window.removeEventListener("scroll",fn);
 },[]);
 useEffect(()=>{window.scrollTo(0,0);},[page]);

 useEffect(()=>{
  let count=0;let timer=null;
  const handler=(e)=>{
   if(e.key==="a"||e.key==="A"){
    count++;
    clearTimeout(timer);
    timer=setTimeout(()=>{count=0;},800);
    if(count>=3){count=0;if(!isAdmin)setShowLogin(true);else setShowDashboard(true);}
   }
  };
  window.addEventListener("keydown",handler);
  return()=>window.removeEventListener("keydown",handler);
 },[isAdmin]);
 useEffect(()=>{const t=setTimeout(()=>{if(!subscribed&&!popupDone)setShowPopup(true);},30000);return()=>clearTimeout(t);},[]);

 const fire=(msg,type="ok")=>{setToast({msg,type});setTimeout(()=>setToast(null),3000);};
 const addCart=(p)=>{if(cart.find(i=>i.id===p.id)){fire("Already in cart!","info");return;}setCart(prev=>[...prev,p]);fire(`"${p.name}" added to cart!`);};
 const rmCart=(id)=>setCart(prev=>prev.filter(i=>i.id!==id));
 const cartTotal=cart.reduce((sum,p)=>sum+Number(p.price),0);

 const login=()=>{const role=Object.keys(ROLE_PASSWORDS).find(r=>ROLE_PASSWORDS[r]===loginPass);if(role){setIsAdmin(true);setUserRole(role);setShowLogin(false);setLoginPass("");setLoginErr(false);fire(`Welcome back${role==="owner"?" Owner":role==="manager"?" Manager":" VA"}! ✦`);}else{setLoginErr(true);setLoginPass("");}};
 const logout=()=>{setIsAdmin(false);setUserRole(null);setShowDashboard(false);fire("Logged out.","info");};
 const guard=(fn)=>{if(!isAdmin){setShowLogin(true);return;}fn();};
 const openAdd=()=>guard(()=>{setForm(EMPTY_FORM);setEditId(null);setShowForm(true);});
 const openEdit=(p)=>guard(()=>{setForm({name:p.name,cat:p.cat,price:String(p.price),oldPrice:String(p.oldPrice||""),tag:p.tag||"",desc:p.desc,includes:p.includes||"",level:p.level||"",duration:p.duration||"",featured:p.featured||false,payhipUrl:p.payhipUrl||"",stripeUrl:p.stripeUrl||"",image:p.image||"",thumbnail:p.thumbnail||"",pdfFile:p.pdfFile||"",pdfName:p.pdfName||"",pdfSize:p.pdfSize||""});setEditId(p.id);setShowForm(true);});
 const openDel=(id)=>guard(()=>setDelId(id));
 const saveProduct=()=>{if(!form.name||!form.price||!form.desc){fire("Fill all required fields.","err");return;}const data={...form,price:Number(form.price),oldPrice:form.oldPrice?Number(form.oldPrice):null,rating:4.8,reviews:0};if(editId){setProducts(p=>p.map(x=>x.id===editId?{...x,...data}:x));fire("Product updated!");}else{setProducts(p=>[...p,{...data,id:Date.now()}]);fire("Product published!");}setShowForm(false);setEditId(null);};
 const delProduct=(id)=>{setProducts(p=>p.filter(x=>x.id!==id));setDelId(null);fire("Product removed.","info");};
 const goProduct=(p)=>{setSelProduct(p);setPage("product");};
 const openCheckout=(p)=>{setCheckoutItem(p);setCheckoutStep(1);setOrderInfo({name:"",email:"",phone:""});setCardNum("");setCardExp("");setCardCvc("");setCardName("");setPayMethod("card");setProcessing(false);resetStripe();setShowCheckout(true);};
 const STRIPE_KEY="pk_live_51TYT5WFUxxwF6THk5f6W6lnpuySIg76odRKfr78vYHPWeXmDPfxMRhVJrhq0Gp1BghRnjM2E8Lm41eoccOj33HIw00SuUZ07j5";

 const filtered=products.filter(p=>filterCat==="all"||p.cat===filterCat).filter(p=>!search||p.name.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>sortBy==="price-asc"?a.price-b.price:sortBy==="price-desc"?b.price-a.price:sortBy==="name"?a.name.localeCompare(b.name):0);

 return(
  <div style={s.root}>
   <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}body{background:#fff !important;font-family:'Inter',sans-serif}input,textarea,select{font-family:'Inter',sans-serif}input::placeholder,textarea::placeholder{color:#9CA3AF}select option{background:#fff}.nav-a:hover{color:#9333EA!important;cursor:pointer}.btn-h:hover{opacity:0.88;transform:translateY(-1px)}.pcard:hover{box-shadow:0 8px 40px rgba(0,0,0,0.12)!important;transform:translateY(-3px)!important}.pcard .quick-add{opacity:0;transition:opacity 0.2s}.pcard:hover .quick-add{opacity:1}.inp-f:focus{border-color:#9333EA!important;box-shadow:0 0 0 3px rgba(147,51,234,0.1)!important;outline:none}`}</style>
   <Toast toast={toast}/>
   <Nav
    page={page} setPage={setPage}
    annBarHidden={annBarHidden} scrolled={scrolled}
    search={search} setSearch={setSearch}
    setFilterCat={setFilterCat}
    isAdmin={isAdmin} logout={logout}
    setShowLogin={setShowLogin} setShowDashboard={setShowDashboard}
    cart={cart} setShowCart={setShowCart}
    menuOpen={menuOpen} setMenuOpen={setMenuOpen}
    activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown}
   />
   <div style={{paddingTop:96,background:"#fff",minHeight:"100vh"}}>
    {page==="home"&&<HomePage
     products={products} setPage={setPage} setFilterCat={setFilterCat}
     goProduct={goProduct} addCart={addCart} fire={fire}
     isAdmin={isAdmin} openAdd={openAdd} openEdit={openEdit} openDel={openDel}
     subName={subName} setSubName={setSubName}
     subEmail={subEmail} setSubEmail={setSubEmail}
     subConsent={subConsent} setSubConsent={setSubConsent}
     subscribed={subscribed} setSubscribed={setSubscribed} setSubscribers={setSubscribers}
     contact={contact}
    />}
    {page==="shop"&&<ShopPage
     products={products} filtered={filtered}
     filterCat={filterCat} setFilterCat={setFilterCat}
     sortBy={sortBy} setSortBy={setSortBy}
     isAdmin={isAdmin} openAdd={openAdd}
     addCart={addCart} goProduct={goProduct} fire={fire}
     openEdit={openEdit} openDel={openDel}
    />}
    {page==="product"&&<ProductPage
     selProduct={selProduct} products={products} setPage={setPage}
     addCart={addCart} fire={fire} isAdmin={isAdmin}
     openEdit={openEdit} openDel={openDel} goProduct={goProduct}
    />}
    {page==="about"&&<AboutPage
     contact={contact} isAdmin={isAdmin}
     setContactForm={setContactForm} setShowContactEdit={setShowContactEdit}
    />}
    {page==="blog"&&<BlogPage/>}
    {page==="services"&&<ServicesPage setPage={setPage}/>}
    {page==="courses"&&<CoursesPage
     products={products} addCart={addCart} goProduct={goProduct}
     fire={fire} isAdmin={isAdmin} openEdit={openEdit} openDel={openDel}
    />}
    {page==="domains"&&<DomainsPage setPage={setPage}/>}
    {page==="contact"&&<ContactPage fire={fire}/>}
    {page==="faq"&&<FAQPage setPage={setPage}/>}
    {page==="refund"&&<RefundPage/>}
    {page==="privacy"&&<PrivacyPage/>}
    {page==="terms"&&<TermsPage/>}
   </div>
   {showCart&&<CartDrawer
    cart={cart} setShowCart={setShowCart} rmCart={rmCart}
    setPage={setPage} openCheckout={openCheckout} setCart={setCart}
   />}
   <LoginModal
    showLogin={showLogin} setShowLogin={setShowLogin}
    loginPass={loginPass} setLoginPass={setLoginPass}
    loginErr={loginErr} setLoginErr={setLoginErr}
    login={login}
   />
   {delId&&(<div style={s.overlay} onClick={()=>setDelId(null)}><div style={{...s.modal,maxWidth:340,textAlign:"center"}} onClick={e=>e.stopPropagation()}><div style={{fontSize:40,marginBottom:12}}>⚠️</div><h3 style={s.modalH}>Delete this product?</h3><p style={{color:"#9CA3AF",marginBottom:24,fontSize:13}}>This cannot be undone.</p><div style={{display:"flex",gap:12,justifyContent:"center"}}><button className="btn-h" style={s.btnPrimary} onClick={()=>setDelId(null)}>Cancel</button><button className="btn-h" style={s.delBtn} onClick={()=>delProduct(delId)}>Delete</button></div></div></div>)}
   {showForm&&(<div style={s.overlay} onClick={()=>setShowForm(false)}><div style={{...s.modal,maxWidth:540}} onClick={e=>e.stopPropagation()}><button style={s.xBtn} onClick={()=>setShowForm(false)}>✕</button><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:22}}><LDLogo size={32}/><h2 style={s.modalH}>{editId?"Edit Product":"Add New Product"}</h2></div><div style={s.formSec}><div style={s.formSecTitle}>Basic Information</div><label style={s.lbl}>Category *</label><select className="inp-f" style={s.inp} value={form.cat} onChange={e=>setForm({...form,cat:e.target.value})}>{CATS.filter(c=>c.id!=="all").map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}</select><label style={s.lbl}>Product Name *</label><input className="inp-f" style={s.inp} placeholder="e.g. The AI Prompt Bible" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div><label style={s.lbl}>Price (USD) *</label><input className="inp-f" style={s.inp} placeholder="e.g. 29" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></div><div><label style={s.lbl}>Original Price (for sale)</label><input className="inp-f" style={s.inp} placeholder="e.g. 58" value={form.oldPrice} onChange={e=>setForm({...form,oldPrice:e.target.value})}/></div></div><label style={s.lbl}>Description *</label><textarea className="inp-f" style={{...s.inp,height:80,resize:"vertical"}} placeholder="Describe your product..." value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})}/><label style={s.lbl}>Badge (e.g. Best Seller, New, Hot)</label><input className="inp-f" style={s.inp} placeholder="e.g. Best Seller" value={form.tag} onChange={e=>setForm({...form,tag:e.target.value})}/><div style={{display:"flex",alignItems:"center",gap:10,marginTop:12}}><input type="checkbox" id="feat" checked={form.featured} onChange={e=>setForm({...form,featured:e.target.checked})} style={{width:18,height:18,accentColor:"#9333EA"}}/><label htmlFor="feat" style={{fontSize:13,color:"#6B7280",cursor:"pointer"}}>⭐ Show on Featured section</label></div></div><div style={s.formSec}><div style={s.formSecTitle}>Product Details</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div><label style={s.lbl}>Level</label><input className="inp-f" style={s.inp} placeholder="e.g. Beginner" value={form.level} onChange={e=>setForm({...form,level:e.target.value})}/></div><div><label style={s.lbl}>Duration</label><input className="inp-f" style={s.inp} placeholder="e.g. 8 Weeks" value={form.duration} onChange={e=>setForm({...form,duration:e.target.value})}/></div></div><label style={s.lbl}>What's Included (comma separated)</label><input className="inp-f" style={s.inp} placeholder="e.g. PDF guide, templates" value={form.includes} onChange={e=>setForm({...form,includes:e.target.value})}/></div><div style={s.formSec}><div style={s.formSecTitle}>Payment Links</div><label style={s.lbl}>Payhip Product URL</label><input className="inp-f" style={s.inp} placeholder="https://payhip.com/b/xxxxx" value={form.payhipUrl} onChange={e=>setForm({...form,payhipUrl:e.target.value})}/><label style={s.lbl}>Stripe Payment URL</label><input className="inp-f" style={s.inp} placeholder="https://buy.stripe.com/xxxxx" value={form.stripeUrl} onChange={e=>setForm({...form,stripeUrl:e.target.value})}/></div><div style={{display:"flex",gap:12,marginTop:8}}><button className="btn-h" style={{...s.btnPrimary,flex:1}} onClick={saveProduct}>{editId?"Save Changes":"Publish Product"}</button><button className="btn-h" style={s.delBtn} onClick={()=>setShowForm(false)}>Cancel</button></div></div></div>)}
   {showContactEdit&&(<div style={s.overlay} onClick={()=>setShowContactEdit(false)}><div style={{...s.modal,maxWidth:440}} onClick={e=>e.stopPropagation()}><button style={s.xBtn} onClick={()=>setShowContactEdit(false)}>✕</button><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:22}}><LDLogo size={32}/><h2 style={s.modalH}>Edit Contact Info</h2></div><div style={s.formSec}><div style={s.formSecTitle}>📞 Contact Details</div><label style={s.lbl}>Email Address</label><input className="inp-f" style={s.inp} value={contactForm.email} onChange={e=>setContactForm({...contactForm,email:e.target.value})}/><label style={s.lbl}>Phone Number</label><input className="inp-f" style={s.inp} value={contactForm.phone} onChange={e=>setContactForm({...contactForm,phone:e.target.value})}/><label style={s.lbl}>Social Media Handle</label><input className="inp-f" style={s.inp} value={contactForm.social} onChange={e=>setContactForm({...contactForm,social:e.target.value})}/><label style={s.lbl}>Website</label><input className="inp-f" style={s.inp} value={contactForm.website} onChange={e=>setContactForm({...contactForm,website:e.target.value})}/></div><div style={{display:"flex",gap:12,marginTop:8}}><button className="btn-h" style={{...s.btnPrimary,flex:1}} onClick={()=>{setContact(contactForm);setShowContactEdit(false);fire("✦ Contact info updated!");}}>Save Changes</button><button className="btn-h" style={s.delBtn} onClick={()=>setShowContactEdit(false)}>Cancel</button></div></div></div>)}
   {showDashboard&&isAdmin&&(<div style={{position:"fixed",inset:0,background:"rgba(10,0,30,0.92)",backdropFilter:"blur(20px)",zIndex:600,display:"flex",overflow:"hidden"}} onClick={()=>setShowDashboard(false)}><div style={{width:"100%",maxWidth:900,margin:"auto",background:"#fff",borderRadius:20,maxHeight:"90vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 40px 100px rgba(0,0,0,0.5)"}} onClick={e=>e.stopPropagation()}><div style={{background:"linear-gradient(135deg,#0a0118,#1a0533,#2d1066)",padding:"18px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}><div style={{display:"flex",alignItems:"center",gap:12}}><LDLogo size={32}/><div><div style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:"#fff"}}>Longlife Digital Dashboard</div><div style={{fontSize:11,color:"#C084FC"}}>{userRole==="owner"?"👑 Owner":userRole==="manager"?"🛠 Manager":"🤝 VA"}</div></div></div><button style={{background:"rgba(255,255,255,0.1)",border:"none",color:"#fff",width:32,height:32,borderRadius:"50%",cursor:"pointer",fontSize:16}} onClick={()=>setShowDashboard(false)}>✕</button></div><div style={{background:"#F9FAFB",borderBottom:"1px solid #E5E7EB",padding:"0 20px",display:"flex",gap:4,overflowX:"auto",flexShrink:0}}>{[canDo("dashboard")&&["overview","📊","Overview"],canDo("orders")&&["orders","🧾","Orders"],canDo("products")&&["products","📦","Products"],canDo("members")&&["members","👥","Team"],canDo("subscribers")&&["subs","✉️","Subscribers"],canDo("store")&&["store","⚙️","Settings"]].filter(Boolean).map(([id,icon,label])=>(<button key={id} className="btn-h" style={{padding:"12px 14px",border:"none",borderBottom:dashTab===id?"3px solid #9333EA":"3px solid transparent",background:"transparent",fontWeight:dashTab===id?700:400,color:dashTab===id?"#9333EA":"#6B7280",fontSize:12,cursor:"pointer",whiteSpace:"nowrap"}} onClick={()=>setDashTab(id)}>{icon} {label}</button>))}</div><div style={{flex:1,overflowY:"auto",padding:"24px"}}>
    {dashTab==="overview"&&(<div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:24}}>{[["💰","Revenue","$"+orders.filter(o=>o.status==="completed").reduce((sum,o)=>sum+o.amount,0).toLocaleString(),"#9333EA","#F3EEFF"],["🧾","Orders",orders.length,"#059669","#ECFDF5"],["📦","Products",products.length,"#0EA5E9","#EFF6FF"],["✉️","Subscribers",subscribers.length,"#C9963F","#FFF8EC"],["👥","Team",teamMembers.length,"#7C3AED","#F5F3FF"]].map(([icon,label,val,color,bg])=>(<div key={label} style={{background:bg,borderRadius:12,padding:"16px",border:"1px solid",borderColor:color+"22"}}><div style={{fontSize:24,marginBottom:6}}>{icon}</div><div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,color,marginBottom:2}}>{val}</div><div style={{fontSize:11,color:"#6B7280"}}>{label}</div></div>))}</div><div style={{border:"1px solid #F3F4F6",borderRadius:10,overflow:"hidden"}}>{orders.slice(0,5).map((o,i)=>(<div key={o.id} style={{display:"flex",gap:10,padding:"10px 14px",alignItems:"center",background:i%2===0?"#FAFAFA":"#fff",borderBottom:"1px solid #F3F4F6",flexWrap:"wrap"}}><span style={{fontSize:11,fontWeight:700,color:"#9333EA",minWidth:65}}>{o.id}</span><div style={{flex:2,minWidth:100}}><div style={{fontSize:12,fontWeight:600}}>{o.customer}</div><div style={{fontSize:10,color:"#9CA3AF"}}>{o.product.slice(0,25)}...</div></div><span style={{fontWeight:700,color:"#059669"}}>${o.amount}</span><span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:o.status==="completed"?"#ECFDF5":"#FFF0F0",color:o.status==="completed"?"#059669":"#EF4444"}}>{o.status}</span></div>))}</div></div>)}
    {dashTab==="orders"&&canDo("orders")&&(<div><h3 style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:"#1a0533",marginBottom:14}}>All Orders</h3><div style={{border:"1px solid #F3F4F6",borderRadius:10,overflow:"hidden"}}>{orders.map((o,i)=>(<div key={o.id} style={{display:"flex",gap:10,padding:"10px 14px",alignItems:"center",background:i%2===0?"#FAFAFA":"#fff",borderBottom:"1px solid #F3F4F6",flexWrap:"wrap"}}><span style={{fontSize:11,fontWeight:700,color:"#9333EA",minWidth:65}}>{o.id}</span><div style={{flex:2,minWidth:120}}><div style={{fontSize:12,fontWeight:600}}>{o.customer}</div><div style={{fontSize:10,color:"#9CA3AF"}}>{o.email}</div></div><div style={{fontSize:11,flex:2,minWidth:80}}>{o.product.slice(0,20)}...</div><span style={{fontWeight:700,color:"#059669",fontSize:13}}>${o.amount}</span><span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:o.status==="completed"?"#ECFDF5":"#FFF0F0",color:o.status==="completed"?"#059669":"#EF4444"}}>{o.status}</span></div>))}</div><div style={{marginTop:12,fontSize:13,color:"#374151"}}>Revenue: <strong style={{color:"#9333EA"}}>${orders.filter(o=>o.status==="completed").reduce((sum,o)=>sum+o.amount,0).toLocaleString()}</strong></div></div>)}
    {dashTab==="products"&&canDo("products")&&(<div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><h3 style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:"#1a0533"}}>Products</h3><button className="btn-h" style={s.btnPrimary} onClick={()=>{setShowDashboard(false);openAdd();}}>+ Add</button></div><div style={{border:"1px solid #F3F4F6",borderRadius:10,overflow:"hidden"}}>{products.map((p,i)=>(<div key={p.id} style={{display:"flex",gap:10,padding:"10px 14px",alignItems:"center",background:i%2===0?"#FAFAFA":"#fff",borderBottom:"1px solid #F3F4F6"}}><div style={{flex:2,minWidth:100}}><div style={{fontSize:12,fontWeight:600,color:"#111827"}}>{p.name}</div></div><span style={{fontFamily:"'Playfair Display',serif",fontWeight:700,color:"#9333EA"}}>${p.price}</span><div style={{display:"flex",gap:6}}><button style={{...s.editBtn,fontSize:10,padding:"4px 10px"}} onClick={()=>{setShowDashboard(false);openEdit(p);}}>Edit</button><button style={{...s.delBtnSm,fontSize:10,padding:"4px 8px"}} onClick={()=>{setShowDashboard(false);openDel(p.id);}}>Del</button></div></div>))}</div></div>)}
    {dashTab==="members"&&canDo("members")&&(<div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><h3 style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:"#1a0533"}}>Team & Access</h3><button className="btn-h" style={s.btnPrimary} onClick={()=>setShowMemberForm(true)}>+ Add Member</button></div><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>{[{r:"👑 Owner",p:"longlife2024",c:"#9333EA",b:"#F3EEFF"},{r:"🛠 Manager",p:"manager2024",c:"#059669",b:"#ECFDF5"},{r:"🤝 VA",p:"va2024",c:"#0EA5E9",b:"#EFF6FF"}].map(({r,p,c,b})=>(<div key={r} style={{background:b,borderRadius:10,padding:"12px",border:"1px solid",borderColor:c+"33"}}><div style={{fontSize:13,fontWeight:700,color:c,marginBottom:3}}>{r}</div><div style={{fontSize:11,color:"#9CA3AF"}}>Password: <strong style={{color:"#374151"}}>{p}</strong></div></div>))}</div><div style={{border:"1px solid #F3F4F6",borderRadius:10,overflow:"hidden",marginBottom:16}}>{teamMembers.map((m,i)=>(<div key={m.id} style={{display:"flex",gap:10,padding:"10px 14px",alignItems:"center",background:i%2===0?"#FAFAFA":"#fff",borderBottom:"1px solid #F3F4F6"}}><div style={{flex:1}}><div style={{fontSize:12,fontWeight:600}}>{m.name}</div><div style={{fontSize:10,color:"#9CA3AF"}}>{m.email}</div></div><span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:m.role==="owner"?"#F3EEFF":m.role==="manager"?"#ECFDF5":"#EFF6FF",color:m.role==="owner"?"#9333EA":m.role==="manager"?"#059669":"#0EA5E9"}}>{m.role==="owner"?"👑 Owner":m.role==="manager"?"🛠 Manager":"🤝 VA"}</span>{m.role!=="owner"&&<button style={{...s.editBtn,fontSize:10,padding:"4px 10px"}} onClick={()=>{setMemberForm({name:m.name,email:m.email,role:m.role,password:""});setEditMemberId(m.id);setShowMemberForm(true);}}>Edit</button>}{m.role!=="owner"&&<button style={{...s.delBtnSm,fontSize:10,padding:"4px 8px"}} onClick={()=>setTeamMembers(p=>p.filter(x=>x.id!==m.id))}>Del</button>}</div>))}</div>{showMemberForm&&(<div style={{background:"#F9FAFB",borderRadius:12,padding:"20px",border:"1px solid #E5E7EB"}}><h4 style={{fontSize:15,fontWeight:700,color:"#1a0533",marginBottom:12}}>{editMemberId?"Edit":"Add"} Team Member</h4><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}><div><label style={s.lbl}>Name *</label><input className="inp-f" style={s.inp} value={memberForm.name} onChange={e=>setMemberForm({...memberForm,name:e.target.value})}/></div><div><label style={s.lbl}>Email *</label><input className="inp-f" style={s.inp} value={memberForm.email} onChange={e=>setMemberForm({...memberForm,email:e.target.value})}/></div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}><div><label style={s.lbl}>Role</label><select className="inp-f" style={s.inp} value={memberForm.role} onChange={e=>setMemberForm({...memberForm,role:e.target.value})}><option value="manager">🛠 Manager</option><option value="va">🤝 VA</option></select></div><div><label style={s.lbl}>Custom Password</label><input className="inp-f" style={s.inp} type="text" placeholder={memberForm.role==="manager"?"manager2024":"va2024"} value={memberForm.password} onChange={e=>setMemberForm({...memberForm,password:e.target.value})}/></div></div><div style={{display:"flex",gap:10}}><button className="btn-h" style={{...s.btnPrimary,flex:1}} onClick={()=>{if(!memberForm.name||!memberForm.email){fire("Fill all fields","err");return;}if(editMemberId){setTeamMembers(p=>p.map(m=>m.id===editMemberId?{...m,...memberForm}:m));fire("Updated! ✦");setEditMemberId(null);}else{setTeamMembers(p=>[...p,{id:Date.now(),...memberForm,status:"active",added:new Date().toLocaleDateString("en-US",{month:"short",year:"numeric"}),lastLogin:"Never"}]);fire("Member added! ✦");}setShowMemberForm(false);setMemberForm({name:"",email:"",role:"va",password:""});}}>{editMemberId?"Save":"Add Member"}</button><button className="btn-h" style={s.delBtn} onClick={()=>{setShowMemberForm(false);setEditMemberId(null);}}>Cancel</button></div></div>)}</div>)}
    {dashTab==="subs"&&canDo("subscribers")&&(<div><h3 style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:"#1a0533",marginBottom:14}}>Email Subscribers ({subscribers.length})</h3>{subscribers.length===0?(<div style={{textAlign:"center",padding:"30px",background:"#F9FAFB",borderRadius:10,border:"1px dashed #E5E7EB"}}><div style={{fontSize:32,marginBottom:8}}>✉️</div><p style={{color:"#9CA3AF"}}>No subscribers yet</p></div>):subscribers.map((sub,i)=>(<div key={i} style={{display:"flex",gap:10,padding:"8px 14px",background:i%2===0?"#FAFAFA":"#fff",borderBottom:"1px solid #F3F4F6",fontSize:12}}><span style={{fontWeight:600,flex:1}}>{sub.name}</span><span style={{color:"#9333EA",flex:2}}>{sub.email}</span><span style={{color:"#9CA3AF"}}>{sub.date}</span></div>))}</div>)}
    {dashTab==="store"&&canDo("store")&&(<div><h3 style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:"#1a0533",marginBottom:14}}>Store Settings</h3><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}><div style={s.formSec}><div style={s.formSecTitle}>🏪 Store Info</div>{[["Store Name","Longlife Digital"],["URL","longlifedigital.co"],["Email","support@lldhome.com"],["Phone","+1 (210) 742-4957"]].map(([l,v])=>(<div key={l}><label style={s.lbl}>{l}</label><input className="inp-f" style={s.inp} defaultValue={v}/></div>))}<button className="btn-h" style={{...s.btnPrimary,marginTop:10,width:"100%"}} onClick={()=>fire("Saved! ✦")}>Save</button></div><div style={s.formSec}><div style={s.formSecTitle}>🔐 Passwords</div>{[["👑 Owner","longlife2024"],["🛠 Manager","manager2024"],["🤝 VA","va2024"]].map(([l,v])=>(<div key={l}><label style={s.lbl}>{l}</label><input className="inp-f" style={s.inp} defaultValue={v}/></div>))}<button className="btn-h" style={{...s.btnPrimary,marginTop:10,width:"100%"}} onClick={()=>fire("Updated! ✦")}>Update</button></div></div></div>)}
   </div></div></div>)}
   {showPopup&&!popupDone&&(<div style={{position:"fixed",inset:0,background:"rgba(26,5,51,0.75)",backdropFilter:"blur(12px)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>{setShowPopup(false);setPopupDone(true);}}><div style={{background:"linear-gradient(135deg,#1a0533,#2d1066)",border:"1px solid rgba(201,150,63,0.35)",borderRadius:24,padding:"40px 36px",width:"100%",maxWidth:480,position:"relative",boxShadow:"0 32px 80px rgba(0,0,0,0.5)"}} onClick={e=>e.stopPropagation()}><button style={{position:"absolute",top:16,right:16,background:"rgba(255,255,255,0.1)",border:"none",color:"rgba(255,255,255,0.6)",width:32,height:32,borderRadius:"50%",cursor:"pointer",fontSize:16}} onClick={()=>{setShowPopup(false);setPopupDone(true);}}>✕</button><div style={{position:"absolute",top:0,left:0,right:0,height:3,borderRadius:"24px 24px 0 0",background:"linear-gradient(90deg,#7C3AED,#C9963F,#E8C97A,#C9963F,#7C3AED)"}}/><div style={{textAlign:"center",marginBottom:28}}><div style={{fontSize:44,marginBottom:12}}>🎁</div><div style={{fontSize:10,letterSpacing:3,color:"#E8C97A",textTransform:"uppercase",marginBottom:10}}>✦ EXCLUSIVE OFFER ✦</div><h2 style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:"#fff",fontWeight:700,marginBottom:8}}>Get 10% Off Your First Order</h2><p style={{color:"#C084FC",fontSize:13,lineHeight:1.75}}>Sign up for news and exclusive offers from Longlife Digital and we will send you a <strong style={{color:"#E8C97A"}}>10% discount code</strong> for your first purchase.</p></div><div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}><input style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:10,padding:"12px 16px",color:"#fff",fontSize:14,outline:"none",fontFamily:"'Inter',sans-serif"}} placeholder="Your first name..." value={popupName} onChange={e=>setPopupName(e.target.value)}/><input style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:10,padding:"12px 16px",color:"#fff",fontSize:14,outline:"none",fontFamily:"'Inter',sans-serif"}} placeholder="Your email address..." value={popupEmail} onChange={e=>setPopupEmail(e.target.value)}/></div><label style={{display:"flex",alignItems:"flex-start",gap:8,cursor:"pointer",marginBottom:16}}><input type="checkbox" checked={popupConsent} onChange={e=>setPopupConsent(e.target.checked)} style={{marginTop:3,width:15,height:15,accentColor:"#C9963F",flexShrink:0}}/><span style={{fontSize:11,color:"rgba(255,255,255,0.55)",lineHeight:1.6}}>I agree to receive news, offers and updates from Longlife Digital. I can unsubscribe anytime.</span></label><button className="btn-h" style={{background:"linear-gradient(135deg,#C9963F,#E8C97A)",color:"#1a0533",border:"none",borderRadius:10,padding:"14px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif",width:"100%"}} onClick={()=>{if(!popupName.trim()){fire("Please enter your name.","err");return;}if(!popupEmail.trim()||!popupEmail.includes("@")){fire("Please enter a valid email.","err");return;}if(!popupConsent){fire("Please check the consent box.","err");return;}setSubscribers(prev=>[...prev,{name:popupName,email:popupEmail,date:new Date().toLocaleDateString(),time:new Date().toLocaleTimeString()}]);setSubscribed(true);setPopupDone(true);setShowPopup(false);fire(`✦ Welcome ${popupName}! Your code WELCOME10 is on its way!`);}}>✦ Claim My 10% Discount</button><p style={{textAlign:"center",fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:10}}>🔒 No spam. Unsubscribe anytime.</p></div></div>)}
   <CheckoutModal
    showCheckout={showCheckout} checkoutItem={checkoutItem} setShowCheckout={setShowCheckout}
    checkoutStep={checkoutStep} setCheckoutStep={setCheckoutStep}
    orderInfo={orderInfo} setOrderInfo={setOrderInfo}
    stripeLoading={stripeLoading} stripeError={stripeError} clientSecret={clientSecret}
    createPaymentIntent={createPaymentIntent} resetStripe={resetStripe}
    setCart={setCart} fire={fire} setPage={setPage}
    orderNum={orderNum} setOrderNum={setOrderNum}
   />
  <AIChat />
  </div>
 );
}
