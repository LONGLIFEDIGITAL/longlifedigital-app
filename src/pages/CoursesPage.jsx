import s from '../constants/styles';
import ProductCard from '../components/ProductCard';

export default function CoursesPage({ products, addCart, goProduct, fire, isAdmin, openEdit, openDel }) {
 const courses = products.filter(p=>p.cat==="course");
 return (
  <div>
   <div style={s.shopHero}><div style={s.inner}><div style={s.secLabel}>✦ LEARN & GROW ✦</div><h1 style={s.shopH1}>Courses</h1><p style={s.shopSub}>Step-by-step courses to build skills and grow your income</p></div></div>
   <div style={{...s.inner,padding:"60px 24px"}}>
    {courses.length===0?(<div style={s.empty}><p style={{color:"#9CA3AF"}}>Courses coming soon!</p></div>):(<div style={s.shopGrid}>{courses.map(p=><ProductCard key={p.id} p={p} addCart={addCart} goProduct={goProduct} fire={fire} isAdmin={isAdmin} openEdit={openEdit} openDel={openDel}/>)}</div>)}
    <div style={{marginTop:48}}><div style={s.secLabel}>✦ ALL DIGITAL PRODUCTS ✦</div><h2 style={{...s.sectionH2,marginBottom:28}}>Also Available</h2><div style={s.shopGrid}>{products.filter(p=>p.cat!=="course").slice(0,4).map(p=><ProductCard key={p.id} p={p} addCart={addCart} goProduct={goProduct} fire={fire} isAdmin={isAdmin} openEdit={openEdit} openDel={openDel}/>)}</div></div>
   </div>
  </div>
 );
}
