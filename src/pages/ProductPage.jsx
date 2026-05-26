import s from '../constants/styles';
import { stars, fmtPrice, catLabel, getProdTheme } from '../utils/helpers';
import ProductCard from '../components/ProductCard';

export default function ProductPage({
  selProduct, products, setPage,
  addCart, fire, isAdmin, openEdit, openDel, goProduct,
}) {
 const p = selProduct;
 if (!p) return null;
 const discount = p.oldPrice ? Math.round((1-p.price/p.oldPrice)*100) : 0;
 const related = products.filter(r=>r.cat===p.cat&&r.id!==p.id).slice(0,4);
 return (
  <div>
   <div style={s.breadcrumb}><span style={s.breadLink} onClick={()=>setPage("home")}>Home</span><span style={s.breadSep}>/</span><span style={s.breadLink} onClick={()=>setPage("shop")}>Shop</span><span style={s.breadSep}>/</span><span style={s.breadCur}>{p.name}</span></div>
   <div style={s.inner}>
    <div style={s.detailGrid}>
     <div>
      <div style={{...s.detailImgBox,background:getProdTheme(p.id).bg}}>
       <div style={{position:"absolute",width:"70%",height:"70%",top:"-20%",right:"-10%",background:`radial-gradient(circle,${getProdTheme(p.id).orb1} 0%,transparent 70%)`,borderRadius:"50%",pointerEvents:"none"}}/>
       <div style={{position:"absolute",width:"50%",height:"50%",bottom:"-15%",left:"-10%",background:`radial-gradient(circle,${getProdTheme(p.id).orb2} 0%,transparent 70%)`,borderRadius:"50%",pointerEvents:"none"}}/>
       <div style={{position:"absolute",top:0,left:0,right:0,height:4,background:getProdTheme(p.id).bar}}/>
       {p.tag&&<div style={{position:"absolute",top:16,left:16,background:"rgba(0,0,0,0.4)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:20,padding:"5px 14px",fontSize:11,fontWeight:700,color:"#E8C97A",letterSpacing:1}}>{p.tag}</div>}
       <div style={{fontSize:120,opacity:0.1,pointerEvents:"none",userSelect:"none"}}>{getProdTheme(p.id).icon}</div>
       <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"16px 20px",background:"linear-gradient(0deg,rgba(0,0,0,0.88) 0%,transparent 100%)",display:"flex",alignItems:"center",gap:12}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:40,fontWeight:700,color:getProdTheme(p.id).priceColor,lineHeight:1}}>${p.price}</div>
        {p.oldPrice&&<><div style={{fontSize:16,color:"rgba(255,255,255,0.4)",textDecoration:"line-through"}}>${p.oldPrice}</div><div style={{background:"rgba(201,150,63,0.2)",border:"1px solid rgba(201,150,63,0.35)",borderRadius:20,padding:"4px 12px",fontSize:11,fontWeight:700,color:"#E8C97A"}}>SAVE {Math.round((1-p.price/p.oldPrice)*100)}%</div></>}
       </div>
      </div>
     </div>
     <div>
      <div style={s.detailCat}>{catLabel(p.cat)}</div>
      <h1 style={s.detailTitle}>{p.name}</h1>
      {p.reviews>0&&<div style={s.detailRating}><span style={{color:"#F59E0B"}}>{stars(p.rating).slice(0,5)}</span><span style={{color:"#6B7280",fontSize:13,marginLeft:8}}>{p.rating} ({p.reviews} reviews)</span></div>}
      <div style={s.detailPriceRow}><span style={s.detailPrice}>{fmtPrice(p.price)}</span>{p.oldPrice&&<span style={s.detailOldPrice}>{fmtPrice(p.oldPrice)}</span>}{discount>0&&<span style={s.detailSave}>Save {discount}%</span>}</div>
      <p style={s.detailDesc}>{p.desc}</p>
      <div style={s.detailMeta}>{p.level&&<div style={s.detailMetaItem}><span style={s.detailMetaLabel}>Level:</span><span>{p.level}</span></div>}{p.duration&&<div style={s.detailMetaItem}><span style={s.detailMetaLabel}>Duration:</span><span>{p.duration}</span></div>}{p.includes&&<div style={s.detailMetaItem}><span style={s.detailMetaLabel}>Includes:</span><span>{p.includes}</span></div>}</div>
      <div style={s.detailBtns}><button className="btn-h" style={{...s.btnPrimary,flex:1,padding:"14px",fontSize:15}} onClick={()=>addCart(p)}>Add to Cart</button><button className="btn-h" style={{...s.btnGold,flex:1,padding:"14px",fontSize:15}} onClick={()=>p.payhipUrl?window.open(p.payhipUrl,"_blank"):fire("Payhip link coming soon!","info")}>Buy Now</button></div>
      {p.stripeUrl&&<button className="btn-h" style={s.stripeBtn} onClick={()=>window.open(p.stripeUrl,"_blank")}>💳 Pay with Stripe</button>}
      <div style={s.detailTrust}>{["⚡ Instant Download","🔒 Secure Payment","♾️ Lifetime Access","💬 24hr Support"].map(t=><span key={t} style={s.detailTrustItem}>{t}</span>)}</div>
      {isAdmin&&<div style={{display:"flex",gap:10,marginTop:20,paddingTop:16,borderTop:"1px solid #F3F4F6"}}><button style={s.editBtn} onClick={()=>openEdit(p)}>Edit</button><button style={s.delBtnSm} onClick={()=>openDel(p.id)}>Delete</button></div>}
     </div>
    </div>
    {related.length>0&&(<div style={{marginTop:60,paddingTop:40,borderTop:"1px solid #F3F4F6"}}><h2 style={{...s.sectionH2,marginBottom:24}}>You May Also Like</h2><div style={s.shopGrid}>{related.map(r=><ProductCard key={r.id} p={r} addCart={addCart} goProduct={goProduct} fire={fire} isAdmin={isAdmin} openEdit={openEdit} openDel={openDel}/>)}</div></div>)}
   </div>
  </div>
 );
}
