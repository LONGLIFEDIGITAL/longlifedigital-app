import s from '../constants/styles';

export default function Toast({ toast }) {
 if (!toast) return null;
 return (
  <div style={{...s.toast,background:toast.type==="err"?"#EF4444":toast.type==="info"?"#F59E0B":"#9333EA"}}>{toast.msg}</div>
 );
}
