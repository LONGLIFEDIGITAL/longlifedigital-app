import s from '../constants/styles';
import { CATS } from '../constants/data';
import ProductCard from '../components/ProductCard';

export default function ShopPage({
  products, filtered,
  filterCat, setFilterCat,
  sortBy, setSortBy,
  isAdmin, openAdd, addCart, goProduct, fire, openEdit, openDel,
}) {
 return (
  <div>
   <div style={s.shopHero}><div style={s.inner}><h1 style={s.shopH1}>All Products</h1><p style={s.shopSub}>Discover our full collection of premium digital products</p></div></div>
   <div style={s.inner}>
    <div style={s.shopLayout}>
     <div style={s.shopSidebar}>
      <div style={s.sidebarTitle}>Categories</div>
      {CATS.map(cat=>(<div key={cat.id} className="btn-h" style={{...s.sidebarLink,background:filterCat===cat.id?"#F3EEFF":"transparent",color:filterCat===cat.id?"#9333EA":"#374151",fontWeight:filterCat===cat.id?"700":"400"}} onClick={()=>setFilterCat(cat.id)}><span>{cat.icon}</span><span style={{flex:1}}>{cat.label}</span><span style={s.sidebarCount}>{cat.id==="all"?products.length:products.filter(p=>p.cat===cat.id).length}</span></div>))}
      {isAdmin&&<button className="btn-h" style={{...s.btnPrimary,width:"100%",marginTop:20}} onClick={openAdd}>+ Add Product</button>}
     </div>
     <div style={{flex:1}}>
      <div style={s.shopTopBar}><span style={s.resultsCount}>{filtered.length} product{filtered.length!==1?"s":""}</span><select style={s.sortSelect} value={sortBy} onChange={e=>setSortBy(e.target.value)}><option value="default">Sort by: Featured</option><option value="price-asc">Price: Low to High</option><option value="price-desc">Price: High to Low</option><option value="name">Name: A-Z</option></select></div>
      {filtered.length===0?(<div style={s.empty}><p style={{color:"#9CA3AF",fontSize:16}}>No products found.</p></div>):(<div style={s.shopGrid}>{filtered.map(p=><ProductCard key={p.id} p={p} addCart={addCart} goProduct={goProduct} fire={fire} isAdmin={isAdmin} openEdit={openEdit} openDel={openDel}/>)}</div>)}
     </div>
    </div>
   </div>
  </div>
 );
}
