import s from '../constants/styles';
import { BLOG_POSTS } from '../constants/data';

export default function BlogPage() {
 return (
  <div>
   <div style={s.shopHero}><div style={s.inner}><h1 style={s.shopH1}>Blog</h1><p style={s.shopSub}>Tips, guides and strategies for digital entrepreneurs</p></div></div>
   <div style={{...s.inner,padding:"48px 24px"}}>
    <div style={s.blogGrid}>
     {BLOG_POSTS.map(post=>(<div key={post.id} className="pcard" style={s.blogCard}><div style={s.blogCardImg}><span style={{fontSize:56}}>{post.img}</span></div><div style={s.blogCardBody}><span style={s.blogTag}>{post.tag}</span><div style={s.blogDate}>{post.date}</div><h3 style={s.blogTitle}>{post.title}</h3><p style={s.blogExcerpt}>{post.excerpt}</p><button className="btn-h" style={s.blogReadMore}>Read More →</button></div></div>))}
    </div>
   </div>
  </div>
 );
}
