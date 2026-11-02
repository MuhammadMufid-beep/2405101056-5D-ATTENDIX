/* auth.js – autentikasi & hak akses. Untuk backend: ganti login() dengan POST ke API PHP; pembatasan akses wajib diulang di server. */
const ROLE={owner:'Owner / Super Admin',hrd:'HRD / Admin',karyawan:'Karyawan'};
const ACCESS={dashboard:'owner,hrd,karyawan',attendance:'owner,hrd,karyawan',employees:'owner,hrd',departments:'owner,hrd',schedule:'owner,hrd,karyawan',leave:'owner,hrd,karyawan',overtime:'owner,hrd,karyawan',reports:'owner,hrd',settings:'owner,hrd',profile:'owner,hrd,karyawan'};
const Auth={
  async login(u,p,remember){
    const x=(await Store.list('users')).find(a=>(a.username==u||a.email==u)&&a.password==p);if(!x)return null;
    const s={id:x.id,nama:x.nama,role:x.role,karyawan_id:x.karyawan_id};
    sessionStorage.removeItem('attendix_session');localStorage.removeItem('attendix_session');
    (remember?localStorage:sessionStorage).setItem('attendix_session',JSON.stringify(s));return s},
  user(){return JSON.parse(sessionStorage.getItem('attendix_session')||localStorage.getItem('attendix_session')||'null')},
  can(page,role){return (ACCESS[page]||'').split(',').includes(role)},
  guard(page){const u=this.user();if(!u){location.href='login.html';return null}if(!this.can(page,u.role)){location.href='dashboard.html';return null}return u},
  logout(){sessionStorage.removeItem('attendix_session');localStorage.removeItem('attendix_session');location.href='login.html'}
};
