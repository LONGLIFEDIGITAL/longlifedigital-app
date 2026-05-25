import s from '../constants/styles';
import LDLogo from './LDLogo';

export default function LoginModal({ showLogin, setShowLogin, loginPass, setLoginPass, loginErr, setLoginErr, login }) {
 if (!showLogin) return null;
 return (
  <div style={s.overlay} onClick={()=>{setShowLogin(false);setLoginPass("");setLoginErr(false);}}>
   <div style={{...s.modal,maxWidth:360,textAlign:"center"}} onClick={e=>e.stopPropagation()}>
    <button style={s.xBtn} onClick={()=>{setShowLogin(false);setLoginPass("");setLoginErr(false);}}>✕</button>
    <LDLogo size={48}/>
    <h2 style={{...s.modalH,marginTop:14,marginBottom:6}}>Admin Login</h2>
    <p style={{color:"#9CA3AF",fontSize:13,marginBottom:20}}>Enter your password to manage products</p>
    <input className="inp-f" style={{...s.inp,textAlign:"center",letterSpacing:4,borderColor:loginErr?"#EF4444":"#E5E7EB"}} type="password" placeholder="Password" value={loginPass} onChange={e=>{setLoginPass(e.target.value);setLoginErr(false);}} onKeyDown={e=>e.key==="Enter"&&login()} autoFocus/>
    {loginErr&&<p style={{color:"#EF4444",fontSize:12,marginTop:8}}>Incorrect password.</p>}
    <button className="btn-h" style={{...s.btnPrimary,width:"100%",marginTop:14,padding:"12px"}} onClick={login}>Login</button>
   </div>
  </div>
 );
}
