import s from '../constants/styles';
import LDLogo from './LDLogo';

const SERVICES=[{icon:"🤝",label:"Affiliate Marketing",desc:"Earn commissions promoting top products"},{icon:"🔍",label:"SEO",desc:"Rank higher on Google organically"},{icon:"🏢",label:"LLC Formation Assistance",desc:"Start your business the right way"},{icon:"💻",label:"Website Design",desc:"Custom professional websites built for you"},{icon:"📱",label:"Social Media Management",desc:"Grow your audience consistently"},{icon:"📍",label:"Google Business Optimization",desc:"Dominate local search results"},{icon:"📣",label:"Facebook & Google Ads",desc:"Paid advertising that converts"},{icon:"🤖",label:"AI Automation Services",desc:"Automate repetitive tasks with AI"},{icon:"🎨",label:"Branding & Graphic Design",desc:"Premium brand identity design"},{icon:"📦",label:"Digital Product Creation",desc:"We create your digital products for you"}];
const DOMAIN_CATS=[{icon:"⭐",label:"Premium Domains",desc:"High-value short & memorable domains"},{icon:"🏷️",label:"Brandable Domains",desc:"Perfect for startups and new brands"},{icon:"📍",label:"Local Business Domains",desc:"City and region-specific domains"},{icon:"🤖",label:"AI-Related Domains",desc:"Future-proof AI and tech domains"},{icon:"📈",label:"Marketing Domains",desc:"High-converting niche domains"},{icon:"🏠",label:"Real Estate Domains",desc:"Premium property and realtor domains"}];

export default function Nav({
  page, setPage,
  annBarHidden, scrolled,
  search, setSearch,
  setFilterCat,
  isAdmin, logout,
  setShowLogin, setShowDashboard,
  cart, setShowCart,
  menuOpen, setMenuOpen,
  activeDropdown, setActiveDropdown,
}) {
 return (
  <>
  <div style={{...s.annBar,transform:annBarHidden?"translateY(-100%)":"translateY(0)"}}><span>🎉 Get <strong>10% off</strong> your first order — Code: <strong>WELCOME10</strong> &nbsp;|&nbsp; ⚡ Instant Digital Delivery &nbsp;|&nbsp; 📧 support@lldhome.com</span></div>
  <nav style={{...s.nav,boxShadow:scrolled?"0 2px 20px rgba(0,0,0,0.1)":"none",top:annBarHidden?"0":"36px",transition:"top 0.3s ease"}} onMouseLeave={()=>setActiveDropdown(null)}>
   <div style={s.navInner}>
    <div style={s.brand} onClick={()=>{setPage("home");setMenuOpen(false);setActiveDropdown(null);}}><LDLogo size={36}/><div><div style={s.brandName}>Longlife Digital</div><div style={s.brandSub}>Premium Digital Store</div></div></div>
    <div className="nav-links-wrap" style={s.navLinks}>
     <span style={{...s.navLink,color:page==="home"?"#9333EA":"#374151",borderBottom:page==="home"?"2px solid #C9963F":"2px solid transparent"}} onClick={()=>{setPage("home");setActiveDropdown(null);}}>Home</span>
     <div style={{position:"relative"}} onMouseEnter={()=>setActiveDropdown("services")}>
      <span style={{...s.navLink,color:page==="services"?"#9333EA":"#374151",borderBottom:page==="services"?"2px solid #C9963F":"2px solid transparent",display:"flex",alignItems:"center",gap:4}}>Services <span style={{fontSize:10,opacity:0.6}}>▾</span></span>
      {activeDropdown==="services"&&(<div style={s.dropdown}><div style={s.dropdownHeader}>Our Services</div><div style={s.dropdownGrid}>{SERVICES.map((svc,i)=>(<div key={i} className="btn-h" style={s.dropdownItem} onClick={()=>{setPage("services");setActiveDropdown(null);}}><span style={s.dropdownIcon}>{svc.icon}</span><div><div style={s.dropdownLabel}>{svc.label}</div><div style={s.dropdownDesc}>{svc.desc}</div></div></div>))}</div><div style={s.dropdownFooter} onClick={()=>{setPage("services");setActiveDropdown(null);}}>View All Services →</div></div>)}
     </div>
     <span style={{...s.navLink,color:page==="courses"?"#9333EA":"#374151",borderBottom:page==="courses"?"2px solid #C9963F":"2px solid transparent"}} onClick={()=>{setPage("courses");setActiveDropdown(null);}}>Courses</span>
     <div style={{position:"relative"}} onMouseEnter={()=>setActiveDropdown("domains")}>
      <span style={{...s.navLink,color:page==="domains"?"#9333EA":"#374151",borderBottom:page==="domains"?"2px solid #C9963F":"2px solid transparent",display:"flex",alignItems:"center",gap:4}}>Domains <span style={{fontSize:10,opacity:0.6}}>▾</span></span>
      {activeDropdown==="domains"&&(<div style={{...s.dropdown,width:480}}><div style={s.dropdownHeader}>Domains For Sale</div><div style={{...s.dropdownGrid,gridTemplateColumns:"1fr 1fr"}}>{DOMAIN_CATS.map((d,i)=>(<div key={i} className="btn-h" style={s.dropdownItem} onClick={()=>{setPage("domains");setActiveDropdown(null);}}><span style={s.dropdownIcon}>{d.icon}</span><div><div style={s.dropdownLabel}>{d.label}</div><div style={s.dropdownDesc}>{d.desc}</div></div></div>))}</div><div style={s.dropdownFooter} onClick={()=>{setPage("domains");setActiveDropdown(null);}}>Browse All Domains →</div></div>)}
     </div>
     <span style={{...s.navLink,color:page==="shop"?"#9333EA":"#374151",borderBottom:page==="shop"?"2px solid #C9963F":"2px solid transparent"}} onClick={()=>{setPage("shop");setActiveDropdown(null);}}>Digital Products</span>
     <span style={{...s.navLink,color:page==="about"?"#9333EA":"#374151",borderBottom:page==="about"?"2px solid #C9963F":"2px solid transparent"}} onClick={()=>{setPage("about");setActiveDropdown(null);}}>About</span>
     <span style={{...s.navLink,color:page==="contact"?"#9333EA":"#374151",borderBottom:page==="contact"?"2px solid #C9963F":"2px solid transparent"}} onClick={()=>{setPage("contact");setActiveDropdown(null);}}>Contact</span>
    </div>
    <div style={s.navRight}>
     <div style={s.searchWrap}><span style={{color:"#9CA3AF",fontSize:14}}>🔍</span><input style={s.searchInp} placeholder="Search products..." value={search} onChange={e=>{setSearch(e.target.value);if(e.target.value){setFilterCat("all");setPage("shop");}}}/></div>
     {isAdmin?(<div style={{display:"flex",gap:6,alignItems:"center"}}><button className="btn-h" style={{background:"linear-gradient(135deg,#1a0533,#2d1066)",color:"#E8C97A",border:"1px solid rgba(201,150,63,0.3)",borderRadius:7,padding:"6px 12px",fontSize:11,fontWeight:700,cursor:"pointer"}} onClick={()=>setShowDashboard(true)}>⚡ Dashboard</button><button className="btn-h" style={s.logoutBtn} onClick={logout}>Logout</button></div>):(<div style={{width:8,height:8,cursor:"pointer",opacity:0}} onClick={()=>setShowLogin(true)} title=""/>)}
     <button className="btn-h" style={s.cartIconBtn} onClick={()=>setShowCart(true)}>🛒{cart.length>0&&<span style={s.cartBadge}>{cart.length}</span>}</button>
     <button className="ham-btn" style={s.hamBtn} onClick={()=>setMenuOpen(!menuOpen)}>{menuOpen?"✕":"☰"}</button>
    </div>
   </div>
   {menuOpen&&(<div style={s.mobileMenu}>{[["home","🏠 Home"],["services","⚙️ Services"],["courses","🎓 Courses"],["domains","🌐 Domains"],["shop","📦 Digital Products"],["about","ℹ️ About"],["contact","📞 Contact"],["blog","📝 Blog"]].map(([id,label])=>(<div key={id} style={{...s.mobileLink,color:page===id?"#9333EA":"#374151"}} onClick={()=>{setPage(id);setMenuOpen(false);}}>{label}</div>))} <div style={s.mobileLink} onClick={()=>{setShowCart(true);setMenuOpen(false);}}>🛒 Cart ({cart.length})</div></div>)}
  </nav>
  </>
 );
}
