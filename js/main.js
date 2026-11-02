/* main.js – helper UI (toast, modal, tabel, chart) + shell (sidebar, header, notifikasi). */
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ini=n=>n.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
const icons=()=>window.lucide&&lucide.createIcons();
const mins=t=>{const[h,m]=t.split(':');return +h*60+ +m};
const fmtD=d=>new Date(d+'T00:00').toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});
const bd=s=>`<span class="bd ${String(s).replace(/\s/g,'')}">${esc(s)}</span>`;
const card=(t,b,x='')=>`<section class="card ${x}"><div class="ch"><h3>${t}</h3></div>${b}</section>`;
function toast(m,t='ok'){let w=$('#toasts');if(!w){w=document.createElement('div');w.id='toasts';document.body.append(w)}const e=document.createElement('div');e.className='toast '+t;e.textContent=m;w.append(e);setTimeout(()=>e.remove(),3000)}
function fields(list){return list.map(f=>{const v=f.v??'',r=f.req===false?'':'required';let i;
  if(f.o)i=`<select name="${f.n}" ${r}>${f.o.map(o=>{const[a,b]=Array.isArray(o)?o:[o,o];return `<option value="${esc(a)}" ${a==v?'selected':''}>${esc(b)}</option>`}).join('')}</select>`;
  else if(f.t=='textarea')i=`<textarea name="${f.n}" rows="3" ${r}>${esc(v)}</textarea>`;
  else i=`<input name="${f.n}" type="${f.t||'text'}" value="${esc(v)}" ${r}>`;
  return `<label class="fld ${f.w?'w2':''}"><span>${f.l}</span>${i}</label>`}).join('')}
function modal(title,body,onOk,ok='Simpan'){const o=document.createElement('div');o.className='overlay';
  o.innerHTML=`<form class="modal"><div class="mh"><h3>${title}</h3><button type="button" class="x icon-btn">✕</button></div><div class="mb grid2">${body}</div><div class="mf"><button type="button" class="btn ghost x">Batal</button><button class="btn">${ok}</button></div></form>`;
  document.body.append(o);o.querySelectorAll('.x').forEach(b=>b.onclick=()=>o.remove());
  o.querySelector('form').onsubmit=async e=>{e.preventDefault();if(await onOk(Object.fromEntries(new FormData(e.target)),e.target)!==false)o.remove()};icons()}
function onAct(el,fn){el.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(b)fn(b.dataset.act,b.dataset.id)})}
/* Tabel generik: pencarian, filter dropdown, pagination */
function table(el,{cols,rows,filters=[],size=8}){let q='',pg=1;const fv={};
  el.innerHTML=`<div class="tools"><input class="search" placeholder="Cari data...">${filters.map((f,i)=>`<select data-f="${i}"><option value="">${f.l}</option>${f.o.map(o=>`<option>${esc(o)}</option>`).join('')}</select>`).join('')}</div><div class="tw"><table><thead><tr>${cols.map(c=>`<th>${c.l}</th>`).join('')}</tr></thead><tbody></tbody></table></div><div class="pager"></div>`;
  const draw=()=>{const r=rows.filter(x=>(!q||JSON.stringify(Object.values(x)).toLowerCase().includes(q))&&filters.every((f,i)=>!fv[i]||x[f.k]==fv[i]));
    const n=Math.max(1,Math.ceil(r.length/size));pg=Math.min(pg,n);
    $('tbody',el).innerHTML=r.slice((pg-1)*size,pg*size).map(x=>`<tr>${cols.map(c=>`<td>${c.r?c.r(x):esc(x[c.k])}</td>`).join('')}</tr>`).join('')||`<tr><td colspan="${cols.length}" class="empty">Belum ada data yang cocok.</td></tr>`;
    $('.pager',el).innerHTML=`<span>${r.length} data</span><div><button class="btn ghost sm" ${pg<2?'disabled':''} data-p="-1">‹</button> <b>${pg}/${n}</b> <button class="btn ghost sm" ${pg>=n?'disabled':''} data-p="1">›</button></div>`;
    el.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{pg+=+b.dataset.p;draw()});icons()};
  $('.search',el).oninput=e=>{q=e.target.value.toLowerCase();pg=1;draw()};
  el.querySelectorAll('[data-f]').forEach(s=>s.onchange=()=>{fv[s.dataset.f]=s.value;pg=1;draw()});draw()}
const _ch={};
function chart(id,cfg){if(_ch[id])_ch[id].destroy();_ch[id]=new Chart($('#'+id),cfg)}
const MENU=[['dashboard','layout-dashboard','Dashboard','Dashboard'],['attendance','fingerprint','Monitoring Absensi','Absensi'],['employees','users','Data Karyawan'],['departments','building-2','Departemen'],['schedule','calendar-days','Jadwal Kerja','Jadwal Kerja'],['leave','calendar-off','Izin & Cuti','Pengajuan'],['overtime','timer','Pengajuan Lembur','Lembur'],['reports','bar-chart-3','Rekap & Laporan'],['settings','settings','Pengaturan'],['profile','user-round',null,'Profil Saya']];
async function shell(page,u){
  const adm=u.role!='karyawan',items=MENU.filter(m=>Auth.can(m[0],u.role)&&(adm?m[2]:m[3]));const lb=m=>adm?m[2]:m[3];
  $('#root').innerHTML=`<div class="app"><aside id="sb"><div class="brand"><div class="logo">A</div><div><b>Attendix</b><small>Smart Attendance System</small></div></div><nav>${items.map(m=>`<a href="${m[0]}.html" class="${m[0]==page?'on':''}" title="${lb(m)}"><i data-lucide="${m[1]}"></i><span>${lb(m)}</span></a>`).join('')}</nav><button class="collapse" id="col"><i data-lucide="chevrons-left"></i><span>Ciutkan menu</span></button></aside>
  <div class="main"><header class="top"><button class="icon-btn" id="burger"><i data-lucide="menu"></i></button><div class="hello"><h2>Selamat datang, ${esc(u.nama.split(' ')[0])}</h2><small id="date"></small></div><div class="sbox"><i data-lucide="search"></i><input id="gs" placeholder="Cari menu lalu Enter"></div><div class="clock" id="clk"></div>
  <div class="dd"><button class="icon-btn" id="bell"><i data-lucide="bell"></i><em id="bc"></em></button><div class="pop" id="bp"></div></div>
  <div class="dd"><button class="user" id="ub"><span class="av">${ini(u.nama)}</span><span class="un"><b>${esc(u.nama)}</b><small>${ROLE[u.role]}</small></span></button><div class="pop sm" id="up"><a href="profile.html">Profil Saya</a><a href="#" id="lo">Keluar</a></div></div></header><main id="view"></main></div></div>`;
  const tick=()=>{const d=new Date(),t=d.toLocaleTimeString('id-ID',{hour12:false});$('#clk').textContent=t;$('#date').textContent=d.toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});const b=$('#bigclk');if(b)b.textContent=t};tick();setInterval(tick,1000);
  $('#col').onclick=()=>document.body.classList.toggle('mini');$('#burger').onclick=()=>$('#sb').classList.toggle('open');
  $('#lo').onclick=e=>{e.preventDefault();Auth.logout()};
  $('#gs').onkeydown=e=>{if(e.key=='Enter'){const q=e.target.value.toLowerCase(),m=items.find(m=>lb(m).toLowerCase().includes(q));m?location.href=m[0]+'.html':toast('Menu tidak ditemukan','err')}};
  const me=adm?'admin':'k'+u.karyawan_id,nt=(await Store.list('notifikasi')).filter(n=>n.untuk==me).reverse();
  $('#bc').textContent=nt.filter(n=>!n.dibaca).length||'';
  $('#bp').innerHTML=`<div class="ni"><b>Notifikasi</b></div>`+(nt.slice(0,6).map(n=>`<div class="ni ${n.dibaca?'':'new'}">${esc(n.pesan)}<small>${new Date(n.waktu).toLocaleString('id-ID')}</small></div>`).join('')||'<div class="ni">Belum ada notifikasi.</div>');
  const pops=[['bell','bp'],['ub','up']];
  pops.forEach(([b,p])=>$('#'+b).onclick=async e=>{e.stopPropagation();pops.forEach(([,q])=>q!=p&&$('#'+q).classList.remove('show'));$('#'+p).classList.toggle('show');
    if(b=='bell'&&$('#bc').textContent){for(const n of nt.filter(n=>!n.dibaca))await Store.update('notifikasi',n.id,{dibaca:true});$('#bc').textContent=''}});
  document.addEventListener('click',()=>document.querySelectorAll('.pop').forEach(p=>p.classList.remove('show')));
}
