/* pages.js – renderer tiap halaman + boot. Setiap halaman memakai Store/Auth sehingga siap diganti API PHP. */
const P={},PAGE=document.body.dataset.page,DAYS=['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
async function ctx(){const[emp,dep,st]=await Promise.all([Store.list('karyawan'),Store.list('departemen'),Store.settings()]);
  const E=Object.fromEntries(emp.map(e=>[e.id,e])),D=Object.fromEntries(dep.map(d=>[d.id,d]));return{emp,dep,st,E,D,dn:e=>D[e.departemen_id]?.nama||'-'}}
async function run(){const v=$('#view');v.innerHTML='';await P[PAGE](v);icons()}
const daysOf=i=>Math.round((new Date(i.tgl_selesai)-new Date(i.tgl_mulai))/864e5)+1;

/* ---------- Login ---------- */
function initLogin(){
  if(Auth.user())return location.href='dashboard.html';
  $('#root').innerHTML=`<div class="login"><section class="lv"><div class="brand"><div class="logo">A</div><div><b>Attendix</b><small>Smart Attendance System</small></div></div><h1>Kehadiran tim, rapi dan terpantau.</h1><p>Pantau absensi, jadwal, izin, cuti, dan lembur seluruh karyawan dari satu dashboard.</p>
  <svg class="ill" viewBox="0 0 320 190"><rect x="10" y="20" width="200" height="140" rx="16" fill="#fff" opacity=".95"/><rect x="28" y="40" width="70" height="10" rx="5" fill="#2563eb"/><g fill="#93b4f8"><rect x="28" y="120" width="22" height="26" rx="4"/><rect x="60" y="100" width="22" height="46" rx="4"/><rect x="92" y="78" width="22" height="68" rx="4"/><rect x="124" y="90" width="22" height="56" rx="4"/></g><rect x="156" y="110" width="22" height="36" rx="4" fill="#2563eb"/><rect x="190" y="70" width="120" height="90" rx="16" fill="#13285a"/><circle cx="224" cy="104" r="16" fill="#3b82f6"/><path d="M216 104l6 6 11-12" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/><rect x="248" y="96" width="46" height="7" rx="3" fill="#8ea3d6"/><rect x="248" y="110" width="30" height="7" rx="3" fill="#8ea3d6"/></svg></section>
  <section class="lf"><form id="lf"><div><h2>Masuk ke Attendix</h2><p class="muted">Gunakan email atau username Anda.</p></div><label class="fld"><span>Email / Username</span><input id="un" required autocomplete="username"></label><label class="fld"><span>Password</span><div class="pw"><input id="pw" type="password" required autocomplete="current-password"><button type="button" id="eye" aria-label="Tampilkan password"><i data-lucide="eye"></i></button></div></label><label class="chk"><input type="checkbox" id="rm"> Ingat saya</label><div class="err-t" id="le"></div><button class="btn full">Masuk</button>
  <div class="demo"><small>Akun demo – klik untuk mengisi</small><div>${[['owner','owner123','Owner'],['hrd','hrd123','HRD'],['karyawan','karyawan123','Karyawan']].map(a=>`<button type="button" class="chip" data-u="${a[0]}" data-p="${a[1]}">${a[2]}</button>`).join('')}</div></div></form></section></div>`;
  icons();
  $('#eye').onclick=()=>{const p=$('#pw');p.type=p.type=='password'?'text':'password'};
  document.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{$('#un').value=b.dataset.u;$('#pw').value=b.dataset.p});
  $('#lf').onsubmit=async e=>{e.preventDefault();const s=await Auth.login($('#un').value.trim(),$('#pw').value,$('#rm').checked);s?location.href='dashboard.html':$('#le').textContent='Username atau password salah. Coba akun demo di bawah.'};
}

/* ---------- Absensi (dipakai dashboard & halaman absensi karyawan) ---------- */
async function attend(type){
  const u=Auth.user(),t=today(),now=new Date().toTimeString().slice(0,5),c=await ctx(),me=c.E[u.karyawan_id];
  const rec=(await Store.list('absensi')).find(a=>a.karyawan_id==me.id&&a.tanggal==t);
  if(type=='in'&&rec?.jam_masuk)return toast('Anda sudah absen masuk hari ini','err');
  if(type=='out'&&!rec?.jam_masuk)return toast('Absen masuk dulu sebelum absen pulang','err');
  if(type=='out'&&rec.jam_pulang)return toast('Anda sudah absen pulang','err');
  modal(type=='in'?'Absen Masuk':'Absen Pulang',`<div class="w2 geo">Lokasi (simulasi GPS): <b>-7.2575, 112.7521</b> – dalam radius kantor ✓</div><label class="w2 chk"><input type="checkbox" name="selfie" required> Ambil foto selfie (simulasi)</label>`,async()=>{
    if(type=='in'){const late=mins(now)>mins(c.st.shifts[me.shift][0])+ +c.st.toleransi;
      const row={karyawan_id:me.id,tanggal:t,jam_masuk:now,jam_pulang:'',status:late?'terlambat':'hadir'};
      rec?await Store.update('absensi',rec.id,row):await Store.insert('absensi',row);toast(late?'Absen masuk tercatat (terlambat)':'Absen masuk tercatat')}
    else{await Store.update('absensi',rec.id,{jam_pulang:now});toast('Absen pulang tercatat')}
    run()},'Konfirmasi');
}

/* ---------- Dashboard ---------- */
P.dashboard=v=>Auth.user().role=='karyawan'?empDash(v):adminDash(v);
async function adminDash(v){
  const c=await ctx(),[abs,izin,lem]=await Promise.all([Store.list('absensi'),Store.list('izin'),Store.list('lembur')]),ta=abs.filter(a=>a.tanggal==today()),n=s=>ta.filter(a=>a.status==s).length;
  const stat=[['users','Total Karyawan',c.emp.filter(e=>e.status=='aktif').length,'blue'],['user-check','Hadir Hari Ini',n('hadir')+n('terlambat'),'green'],['clock-alert','Terlambat',n('terlambat'),'amber'],['calendar-off','Izin & Cuti Hari Ini',n('izin'),'violet']];
  const nm=id=>c.E[id]?.nama||'-';
  const feed=[...ta.filter(a=>a.jam_masuk).sort((a,b)=>b.jam_masuk.localeCompare(a.jam_masuk)).slice(0,4).map(a=>['fingerprint',`${nm(a.karyawan_id)} absen ${a.jam_pulang?'pulang '+a.jam_pulang:'masuk '+a.jam_masuk}`,a.status]),...izin.slice(-3).map(i=>['calendar-off',`${nm(i.karyawan_id)} mengajukan ${i.jenis}`,i.status]),...lem.slice(-2).map(l=>['timer',`${nm(l.karyawan_id)} mengajukan lembur ${l.durasi} jam`,l.status])];
  v.innerHTML=`<div class="stats">${stat.map(s=>`<div class="stat ${s[3]}"><i data-lucide="${s[0]}"></i><div><small>${s[1]}</small><b>${s[2]}</b></div></div>`).join('')}</div>
  <div class="g2"><section class="card"><div class="ch"><h3>Statistik Kehadiran</h3><select id="rg"><option value="7">7 hari</option><option value="30">30 hari</option><option value="m">Bulan ini</option></select></div><canvas id="ch" height="130"></canvas></section>
  ${card('Aktivitas Terbaru','<ul class="feed">'+feed.map(f=>`<li><i data-lucide="${f[0]}"></i><div>${esc(f[1])}</div>${bd(f[2])}</li>`).join('')+'</ul>')}</div>
  <div class="g2">${card('Jadwal Kerja Mingguan',`<div class="week">${DAYS.map(d=>{const on=c.st.hari_kerja.includes(d);return `<div class="${on?'on':''}"><b>${d}</b><small>${on?c.st.masuk+'<br>'+c.st.pulang:'Libur'}</small></div>`}).join('')}</div>`)}
  ${card('Pengumuman','<ul class="feed">'+c.st.pengumuman.map(p=>`<li><i data-lucide="megaphone"></i><div><b>${esc(p.judul)}</b><small>${esc(p.isi)}</small></div></li>`).join('')+'</ul>')}</div>`;
  const draw=r=>{const d=new Date(),k=r=='m'?d.getDate():+r,days=[];for(let i=k-1;i>=0;i--){const x=new Date();x.setDate(d.getDate()-i);days.push(ymd(x))}
    chart('ch',{type:'bar',data:{labels:days.map(x=>x.slice(5)),datasets:[['hadir','#2563eb'],['terlambat','#f59e0b'],['izin','#8b5cf6'],['alpha','#ef4444']].map(([s,col])=>({label:s,data:days.map(x=>abs.filter(a=>a.tanggal==x&&a.status==s).length),backgroundColor:col,borderRadius:4}))},options:{scales:{x:{stacked:true},y:{stacked:true}},plugins:{legend:{position:'bottom'}}}})};
  $('#rg').onchange=e=>draw(e.target.value);draw('7');
}
async function empDash(v){
  const u=Auth.user(),c=await ctx(),me=c.E[u.karyawan_id],t=today(),mine=(await Store.list('absensi')).filter(a=>a.karyawan_id==me.id).sort((a,b)=>b.tanggal.localeCompare(a.tanggal)),td=mine.find(a=>a.tanggal==t),mo=mine.filter(a=>a.tanggal.slice(0,7)==t.slice(0,7));
  const used=(await Store.list('izin')).filter(i=>i.karyawan_id==me.id&&i.jenis=='Cuti Tahunan'&&i.status=='disetujui').reduce((s,i)=>s+daysOf(i),0),sh=c.st.shifts[me.shift];
  const stat=[['user-check','Hadir Bulan Ini',mo.filter(a=>a.status=='hadir'||a.status=='terlambat').length,'green'],['clock-alert','Keterlambatan',mo.filter(a=>a.status=='terlambat').length,'amber'],['calendar-off','Izin',mo.filter(a=>a.status=='izin').length,'violet'],['plane','Sisa Cuti (hari)',12-used,'blue']];
  v.innerHTML=`<div class="g2 e1"><section class="card hero"><small>${new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</small><div class="big" id="bigclk"></div><p>Status hari ini: ${bd(td?td.status:'belum absen')} ${td?.jam_masuk?'· Masuk '+td.jam_masuk:''} ${td?.jam_pulang?'· Pulang '+td.jam_pulang:''}</p><div class="row"><button class="btn out" id="bin">Absen Masuk</button><button class="btn ghost" id="bout">Absen Pulang</button></div></section>
  ${card('Jadwal Hari Ini',`<p class="muted">Shift ${me.shift}</p><b class="sh">${sh[0]} – ${sh[1]}</b>`)}</div>
  <div class="stats">${stat.map(s=>`<div class="stat ${s[3]}"><i data-lucide="${s[0]}"></i><div><small>${s[1]}</small><b>${s[2]}</b></div></div>`).join('')}</div>
  ${card('Riwayat Aktivitas','<ul class="feed">'+(mine.slice(0,5).map(a=>`<li><i data-lucide="fingerprint"></i><div>${fmtD(a.tanggal)}<small>${a.jam_masuk||'-'} – ${a.jam_pulang||'-'}</small></div>${bd(a.status)}</li>`).join('')||'<li>Belum ada riwayat.</li>')+'</ul>')}`;
  $('#bin').onclick=()=>attend('in');$('#bout').onclick=()=>attend('out');
}

/* ---------- Absensi: monitoring (admin) / absen (karyawan) ---------- */
P.attendance=async v=>{const u=Auth.user(),c=await ctx(),abs=await Store.list('absensi');
  if(u.role=='karyawan'){const me=c.E[u.karyawan_id],mine=abs.filter(a=>a.karyawan_id==me.id).sort((a,b)=>b.tanggal.localeCompare(a.tanggal)),td=mine.find(a=>a.tanggal==today());
    v.innerHTML=`<section class="card hero"><small>Absensi hari ini</small><div class="big" id="bigclk"></div><p>${bd(td?td.status:'belum absen')} · Lokasi simulasi: Kantor Pusat Surabaya</p><div class="row"><button class="btn out" id="bin">Absen Masuk</button><button class="btn ghost" id="bout">Absen Pulang</button></div></section>${card('Riwayat Absensi','<div id="tb"></div>')}`;
    $('#bin').onclick=()=>attend('in');$('#bout').onclick=()=>attend('out');
    return table($('#tb'),{rows:mine,filters:[{k:'status',l:'Semua Status',o:['hadir','terlambat','izin','alpha']}],cols:[{l:'Tanggal',r:r=>fmtD(r.tanggal)},{l:'Masuk',r:r=>r.jam_masuk||'-'},{l:'Pulang',r:r=>r.jam_pulang||'-'},{l:'Status',r:r=>bd(r.status)}]})}
  v.innerHTML=`<section class="card"><div class="ch"><h3>Monitoring Absensi</h3><input type="date" id="dt" value="${today()}"></div><div id="tb"></div></section>`;
  const draw=()=>{const d=$('#dt').value,rows=c.emp.filter(e=>e.status=='aktif').map(e=>{const a=abs.find(x=>x.karyawan_id==e.id&&x.tanggal==d);return{kode:e.kode,nama:e.nama,departemen:c.dn(e),jam_masuk:a?.jam_masuk||'-',jam_pulang:a?.jam_pulang||'-',status:a?a.status:'belum absen'}});
    table($('#tb'),{rows,filters:[{k:'departemen',l:'Semua Departemen',o:c.dep.map(x=>x.nama)},{k:'status',l:'Semua Status',o:['hadir','terlambat','izin','alpha','belum absen']}],cols:[{l:'ID',k:'kode'},{l:'Karyawan',r:r=>`<b>${esc(r.nama)}</b>`},{l:'Departemen',k:'departemen'},{l:'Masuk',k:'jam_masuk'},{l:'Pulang',k:'jam_pulang'},{l:'Status',r:r=>bd(r.status)}]})};
  $('#dt').onchange=draw;draw()};

/* ---------- Data Karyawan ---------- */
P.employees=async v=>{const c=await ctx();
  const form=e=>fields([{n:'nama',l:'Nama Lengkap',v:e.nama,w:1},{n:'email',l:'Email',t:'email',v:e.email},{n:'telp',l:'No. Telepon',v:e.telp},{n:'jabatan',l:'Jabatan',v:e.jabatan},{n:'departemen_id',l:'Departemen',o:c.dep.map(d=>[d.id,d.nama]),v:e.departemen_id},{n:'tgl_bergabung',l:'Tanggal Bergabung',t:'date',v:e.tgl_bergabung||today()},{n:'shift',l:'Shift',o:['pagi','siang','malam'],v:e.shift||'pagi'},{n:'status',l:'Status',o:['aktif','nonaktif'],v:e.status||'aktif'}]);
  v.innerHTML=`<section class="card"><div class="ch"><h3>Data Karyawan</h3><button class="btn" id="add">+ Tambah Karyawan</button></div><div id="tb"></div></section>`;
  table($('#tb'),{rows:c.emp.map(e=>({...e,dep:c.dn(e)})),filters:[{k:'dep',l:'Semua Departemen',o:c.dep.map(d=>d.nama)},{k:'status',l:'Semua Status',o:['aktif','nonaktif']}],
    cols:[{l:'Karyawan',r:r=>`<div class="name"><span class="av">${ini(r.nama)}</span><div><b>${esc(r.nama)}</b><br><small class="muted">${r.kode}</small></div></div>`},{l:'Jabatan',k:'jabatan'},{l:'Departemen',k:'dep'},{l:'Kontak',r:r=>`${esc(r.email)}<br><small class="muted">${esc(r.telp)}</small>`},{l:'Bergabung',r:r=>fmtD(r.tgl_bergabung)},{l:'Status',r:r=>bd(r.status)},
    {l:'Aksi',r:r=>`<button class="btn ghost sm" data-act="view" data-id="${r.id}">Detail</button> <button class="btn ghost sm" data-act="edit" data-id="${r.id}">Edit</button> <button class="btn ghost sm" data-act="tog" data-id="${r.id}">${r.status=='aktif'?'Nonaktifkan':'Aktifkan'}</button> <button class="btn no sm" data-act="del" data-id="${r.id}">Hapus</button>`}]});
  const save=(id)=>async d=>{d.departemen_id=+d.departemen_id;id?await Store.update('karyawan',id,d):await Store.insert('karyawan',{...d,kode:'EMP-'+String(Math.max(0,...c.emp.map(e=>e.id))+1).padStart(3,'0')});toast('Data karyawan disimpan');run()};
  $('#add').onclick=()=>modal('Tambah Karyawan',form({}),save());
  onAct($('#tb'),async(a,id)=>{const e=c.E[id];
    if(a=='edit')modal('Edit Karyawan',form(e),save(id));
    if(a=='view')modal('Detail Karyawan',`<div class="w2 prof"><span class="av">${ini(e.nama)}</span><div><h3>${esc(e.nama)}</h3><span class="muted">${esc(e.jabatan)} · ${c.dn(e)}</span></div></div><div class="w2 dl"><div><small>ID</small>${e.kode}</div><div><small>Email</small>${esc(e.email)}</div><div><small>Telepon</small>${esc(e.telp)}</div><div><small>Bergabung</small>${fmtD(e.tgl_bergabung)}</div></div>`,()=>true,'Tutup');
    if(a=='tog'){await Store.update('karyawan',id,{status:e.status=='aktif'?'nonaktif':'aktif'});toast('Status diperbarui');run()}
    if(a=='del'&&confirm(`Hapus ${e.nama}?`)){await Store.remove('karyawan',id);toast('Karyawan dihapus');run()}})};

/* ---------- Departemen ---------- */
P.departments=async v=>{const c=await ctx(),f=d=>fields([{n:'nama',l:'Nama Departemen',v:d.nama,w:1},{n:'deskripsi',l:'Deskripsi',v:d.deskripsi,w:1}]);
  v.innerHTML=`<section class="card"><div class="ch"><h3>Departemen</h3><button class="btn" id="add">+ Tambah Departemen</button></div><div id="tb"></div></section>`;
  table($('#tb'),{rows:c.dep.map(d=>({...d,jml:c.emp.filter(e=>e.departemen_id==d.id).length})),cols:[{l:'Departemen',r:r=>`<b>${esc(r.nama)}</b>`},{l:'Deskripsi',k:'deskripsi'},{l:'Jumlah Karyawan',k:'jml'},{l:'Aksi',r:r=>`<button class="btn ghost sm" data-act="edit" data-id="${r.id}">Edit</button> <button class="btn no sm" data-act="del" data-id="${r.id}">Hapus</button>`}]});
  const save=id=>async d=>{id?await Store.update('departemen',id,d):await Store.insert('departemen',d);toast('Departemen disimpan');run()};
  $('#add').onclick=()=>modal('Tambah Departemen',f({}),save());
  onAct($('#tb'),async(a,id)=>{const d=c.D[id];if(a=='edit')modal('Edit Departemen',f(d),save(id));
    if(a=='del'){if(c.emp.some(e=>e.departemen_id==id))return toast('Pindahkan karyawan dulu sebelum menghapus departemen','err');if(confirm('Hapus departemen?')){await Store.remove('departemen',id);toast('Departemen dihapus');run()}}})};

/* ---------- Jadwal Kerja ---------- */
P.schedule=async v=>{const u=Auth.user(),c=await ctx(),adm=u.role!='karyawan',S=c.st.shifts,me=c.E[u.karyawan_id];
  const wk=sh=>`<div class="week">${DAYS.map(d=>{const on=c.st.hari_kerja.includes(d);return `<div class="${on?'on':''}"><b>${d}</b><small>${on?sh[0]+'<br>'+sh[1]:'Libur'}</small></div>`}).join('')}</div>`;
  if(!adm){v.innerHTML=card(`Jadwal Mingguan – Shift ${me.shift}`,wk(S[me.shift]));return}
  v.innerHTML=`${card('Kalender Kerja Mingguan (Shift Pagi)',wk(S.pagi))}<section class="card"><div class="ch"><h3>Jadwal Shift Karyawan</h3><button class="btn" id="sh">Atur Jam Shift</button></div><div id="tb"></div></section>`;
  table($('#tb'),{rows:c.emp.map(e=>({...e,dep:c.dn(e)})),filters:[{k:'dep',l:'Semua Departemen',o:c.dep.map(d=>d.nama)}],cols:[{l:'Karyawan',r:r=>`<b>${esc(r.nama)}</b>`},{l:'Departemen',k:'dep'},{l:'Shift',r:r=>`<select data-act="sh" data-id="${r.id}">${['pagi','siang','malam'].map(s=>`<option ${s==r.shift?'selected':''}>${s}</option>`).join('')}</select>`},{l:'Jam Kerja',r:r=>S[r.shift].join(' – ')}]});
  $('#tb').addEventListener('change',async e=>{if(e.target.dataset.act=='sh'){await Store.update('karyawan',e.target.dataset.id,{shift:e.target.value});toast('Shift diperbarui');run()}});
  $('#sh').onclick=()=>modal('Atur Jam Shift',['pagi','siang','malam'].map(s=>fields([{n:s+'_a',l:'Shift '+s+' – masuk',t:'time',v:S[s][0]},{n:s+'_b',l:'Shift '+s+' – pulang',t:'time',v:S[s][1]}])).join(''),async d=>{await Store.saveSettings({shifts:Object.fromEntries(['pagi','siang','malam'].map(s=>[s,[d[s+'_a'],d[s+'_b']]]))});toast('Jam shift disimpan');run()})};

/* ---------- Izin & Cuti, Lembur (generik) ---------- */
function reqPage(cfg){return async v=>{const u=Auth.user(),adm=u.role!='karyawan',c=await ctx();let rows=await Store.list(cfg.t);if(!adm)rows=rows.filter(r=>r.karyawan_id==u.karyawan_id);
  rows=rows.map(r=>({...r,nama:c.E[r.karyawan_id]?.nama||'-'})).reverse();
  v.innerHTML=`<section class="card"><div class="ch"><h3>${cfg.title}</h3>${adm?'':'<button class="btn" id="add">+ Buat Pengajuan</button>'}</div><div id="tb"></div></section>`;
  table($('#tb'),{rows,filters:[{k:'status',l:'Semua Status',o:['menunggu','disetujui','ditolak']}],cols:[...(adm?[{l:'Karyawan',k:'nama'}]:[]),...cfg.cols,{l:'Status',r:r=>bd(r.status)},...(adm?[{l:'Aksi',r:r=>r.status=='menunggu'?`<button class="btn ok sm" data-act="ok" data-id="${r.id}">Setujui</button> <button class="btn no sm" data-act="no" data-id="${r.id}">Tolak</button>`:'-'}]:[])]});
  onAct($('#tb'),async(a,id)=>{const st=a=='ok'?'disetujui':'ditolak',r=rows.find(x=>x.id==id);await Store.update(cfg.t,id,{status:st});await notify('k'+r.karyawan_id,`Pengajuan ${cfg.label} Anda ${st}`);toast('Pengajuan '+st);run()});
  if(!adm)$('#add').onclick=()=>modal('Pengajuan '+cfg.label,fields(cfg.f),async d=>{const e=cfg.chk(d);if(e){toast(e,'err');return false}
    await Store.insert(cfg.t,{...cfg.mk(d),karyawan_id:u.karyawan_id,status:'menunggu'});await notify('admin',`${u.nama} mengajukan ${cfg.label}`);toast('Pengajuan terkirim');run()})}}
P.leave=reqPage({t:'izin',label:'izin/cuti',title:'Izin & Cuti',
  cols:[{l:'Jenis',k:'jenis'},{l:'Tanggal',r:r=>fmtD(r.tgl_mulai)+' – '+fmtD(r.tgl_selesai)},{l:'Alasan',k:'alasan'},{l:'Dokumen',r:r=>esc(r.dokumen||'-')}],
  f:[{n:'jenis',l:'Jenis',o:['Cuti Tahunan','Sakit','Izin Pribadi'],w:1},{n:'tgl_mulai',l:'Tanggal Mulai',t:'date',v:today()},{n:'tgl_selesai',l:'Tanggal Selesai',t:'date',v:today()},{n:'alasan',l:'Alasan',t:'textarea',w:1},{n:'dokumen',l:'Upload Dokumen (simulasi)',t:'file',req:false,w:1}],
  chk:d=>d.tgl_selesai<d.tgl_mulai?'Tanggal selesai tidak boleh sebelum tanggal mulai':'',mk:d=>({jenis:d.jenis,tgl_mulai:d.tgl_mulai,tgl_selesai:d.tgl_selesai,alasan:d.alasan,dokumen:d.dokumen?.name||''})});
P.overtime=reqPage({t:'lembur',label:'lembur',title:'Pengajuan Lembur',
  cols:[{l:'Tanggal',r:r=>fmtD(r.tanggal)},{l:'Jam',r:r=>r.mulai+' – '+r.selesai},{l:'Durasi',r:r=>r.durasi+' jam'},{l:'Alasan',k:'alasan'}],
  f:[{n:'tanggal',l:'Tanggal Lembur',t:'date',v:today(),w:1},{n:'mulai',l:'Jam Mulai',t:'time',v:'17:00'},{n:'selesai',l:'Jam Selesai',t:'time',v:'20:00'},{n:'alasan',l:'Alasan',t:'textarea',w:1}],
  chk:d=>mins(d.selesai)<=mins(d.mulai)?'Jam selesai harus setelah jam mulai':'',mk:d=>({tanggal:d.tanggal,mulai:d.mulai,selesai:d.selesai,alasan:d.alasan,durasi:((mins(d.selesai)-mins(d.mulai))/60).toFixed(1)})});

/* ---------- Rekap & Laporan ---------- */
P.reports=async v=>{const c=await ctx(),[abs,izin,lem]=await Promise.all([Store.list('absensi'),Store.list('izin'),Store.list('lembur')]);
  const T={harian:'Laporan Harian',mingguan:'Laporan Mingguan',bulanan:'Laporan Bulanan',terlambat:'Laporan Keterlambatan',izin:'Laporan Izin & Cuti',lembur:'Laporan Lembur'};let cur={cols:[],rows:[]};
  v.innerHTML=`<section class="card"><div class="ch"><h3>Rekap & Laporan</h3><div class="row"><select id="rt">${Object.entries(T).map(([k,l])=>`<option value="${k}">${l}</option>`).join('')}</select><select id="rd"><option value="">Semua Departemen</option>${c.dep.map(d=>`<option>${esc(d.nama)}</option>`).join('')}</select><button class="btn ghost" id="xl">Export Excel</button><button class="btn" id="pf">Export PDF</button></div></div><div class="g2 rp"><div id="tb"></div><canvas id="ch" height="220"></canvas></div></section>`;
  const grp=(r,k)=>r.reduce((o,x)=>(o[x[k]]=(o[x[k]]||0)+1,o),{});
  const draw=()=>{const t=$('#rt').value,dp=$('#rd').value,emp=c.emp.filter(e=>!dp||c.dn(e)==dp),ids=emp.map(e=>e.id),n={harian:1,mingguan:7,bulanan:30}[t];let cols,rows,dist;
    if(n){const from=ymd(new Date(Date.now()-(n-1)*864e5));cols=['kode','nama','departemen','hadir','terlambat','izin','alpha'];
      rows=emp.map(e=>{const a=abs.filter(x=>x.karyawan_id==e.id&&x.tanggal>=from),k=s=>a.filter(x=>x.status==s).length;return{kode:e.kode,nama:e.nama,departemen:c.dn(e),hadir:k('hadir'),terlambat:k('terlambat'),izin:k('izin'),alpha:k('alpha')}});
      dist=Object.fromEntries(['hadir','terlambat','izin','alpha'].map(s=>[s,rows.reduce((x,r)=>x+r[s],0)]))}
    else if(t=='terlambat'){cols=['tanggal','nama','jam_masuk'];rows=abs.filter(a=>a.status=='terlambat'&&ids.includes(a.karyawan_id)).map(a=>({tanggal:a.tanggal,nama:c.E[a.karyawan_id].nama,jam_masuk:a.jam_masuk})).sort((a,b)=>b.tanggal.localeCompare(a.tanggal));dist=grp(rows,'nama')}
    else if(t=='izin'){cols=['nama','jenis','tgl_mulai','tgl_selesai','status'];rows=izin.filter(i=>ids.includes(i.karyawan_id)).map(i=>({nama:c.E[i.karyawan_id].nama,jenis:i.jenis,tgl_mulai:i.tgl_mulai,tgl_selesai:i.tgl_selesai,status:i.status}));dist=grp(rows,'jenis')}
    else{cols=['nama','tanggal','mulai','selesai','durasi','status'];rows=lem.filter(l=>ids.includes(l.karyawan_id)).map(l=>({nama:c.E[l.karyawan_id].nama,tanggal:l.tanggal,mulai:l.mulai,selesai:l.selesai,durasi:l.durasi,status:l.status}));dist=grp(rows,'status')}
    cur={cols,rows,t};
    table($('#tb'),{rows,cols:cols.map(k=>({l:k.replace('_',' '),k}))});
    chart('ch',{type:'doughnut',data:{labels:Object.keys(dist),datasets:[{data:Object.values(dist),backgroundColor:['#2563eb','#f59e0b','#8b5cf6','#ef4444','#0b1b3f','#16a34a','#06b6d4','#94a3b8','#f97316','#14b8a6','#e11d48','#64748b']}]},options:{plugins:{legend:{position:'bottom'}}}})};
  $('#rt').onchange=draw;$('#rd').onchange=draw;
  $('#xl').onclick=()=>{const csv=[cur.cols,...cur.rows.map(r=>cur.cols.map(k=>r[k]))].map(r=>r.map(x=>`"${String(x).replace(/"/g,'""')}"`).join(',')).join('\n'),a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv'}));a.download='attendix-'+cur.t+'-'+today()+'.csv';a.click();toast('File Excel (CSV) diunduh')};
  $('#pf').onclick=()=>window.print();draw()};

/* ---------- Pengaturan ---------- */
P.settings=async v=>{const u=Auth.user(),c=await ctx(),st=c.st,users=(await Store.list('users')).filter(x=>x.role=='hrd');
  v.innerHTML=`<form class="card" id="sf"><div class="ch"><h3>Profil Perusahaan & Absensi</h3></div><div class="grid2">${fields([{n:'perusahaan',l:'Nama Perusahaan',v:st.perusahaan,w:1},{n:'logo',l:'Logo Perusahaan (simulasi)',t:'file',req:false,w:1},{n:'masuk',l:'Jam Masuk',t:'time',v:st.masuk},{n:'pulang',l:'Jam Pulang',t:'time',v:st.pulang},{n:'toleransi',l:'Toleransi Keterlambatan (menit)',t:'number',v:st.toleransi,w:1}])}
  <div class="w2"><span class="lb">Hari Kerja</span><div class="chips">${DAYS.map(d=>`<label class="chip"><input type="checkbox" name="hk" value="${d}" ${st.hari_kerja.includes(d)?'checked':''}>${d}</label>`).join('')}</div></div>
  <label class="chk w2"><input type="checkbox" name="notif" ${st.notif?'checked':''}> Aktifkan notifikasi pengajuan</label><div class="w2"><button class="btn">Simpan Pengaturan</button></div></div></form>
  ${u.role=='owner'?`<section class="card"><div class="ch"><h3>Akun HRD (khusus Owner)</h3><button class="btn" id="add">+ Tambah HRD</button></div><div id="tb"></div></section>`:card('Akun HRD','<p class="muted">Pengelolaan akun HRD hanya tersedia untuk Owner.</p>')}`;
  $('#sf').onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.target);await Store.saveSettings({perusahaan:fd.get('perusahaan'),masuk:fd.get('masuk'),pulang:fd.get('pulang'),toleransi:+fd.get('toleransi'),hari_kerja:DAYS.filter(d=>fd.getAll('hk').includes(d)),notif:fd.has('notif')});toast('Pengaturan disimpan')};
  if(u.role!='owner')return;
  table($('#tb'),{rows:users,cols:[{l:'Nama',k:'nama'},{l:'Username',k:'username'},{l:'Email',k:'email'},{l:'Aksi',r:r=>`<button class="btn no sm" data-act="del" data-id="${r.id}">Hapus</button>`}]});
  $('#add').onclick=()=>modal('Tambah Akun HRD',fields([{n:'nama',l:'Nama',w:1},{n:'username',l:'Username'},{n:'email',l:'Email',t:'email'},{n:'password',l:'Password',t:'password',w:1}]),async d=>{if((await Store.list('users')).some(x=>x.username==d.username)){toast('Username sudah dipakai','err');return false}await Store.insert('users',{...d,telp:'',role:'hrd',karyawan_id:null});toast('Akun HRD ditambahkan');run()});
  onAct($('#tb'),async(a,id)=>{if(confirm('Hapus akun HRD ini?')){await Store.remove('users',id);toast('Akun dihapus');run()}})};

/* ---------- Profil ---------- */
P.profile=async v=>{const u=Auth.user(),c=await ctx(),kar=u.karyawan_id?c.E[u.karyawan_id]:null,tbl=kar?'karyawan':'users',me=kar||(await Store.list('users')).find(x=>x.id==u.id);
  v.innerHTML=`<section class="card"><div class="prof"><span class="av">${ini(me.nama)}</span><div style="flex:1"><h2>${esc(me.nama)}</h2><span class="muted">${kar?esc(me.jabatan)+' · '+c.dn(me):ROLE[u.role]}</span></div><button class="btn" id="ed">Edit Profil</button></div>
  <div class="dl"><div><small>ID</small>${kar?me.kode:'USR-'+String(me.id).padStart(3,'0')}</div><div><small>Email</small>${esc(me.email)}</div><div><small>Telepon</small>${esc(me.telp)}</div>${kar?`<div><small>Bergabung</small>${fmtD(me.tgl_bergabung)}</div>`:`<div><small>Peran</small>${ROLE[u.role]}</div>`}</div></section>`;
  $('#ed').onclick=()=>modal('Edit Profil',fields([{n:'nama',l:'Nama Lengkap',v:me.nama,w:1},{n:'email',l:'Email',t:'email',v:me.email},{n:'telp',l:'No. Telepon',v:me.telp}]),async d=>{await Store.update(tbl,me.id,d);if(kar)await Store.update('users',u.id,{nama:d.nama,email:d.email,telp:d.telp});
    const s=Auth.user(),k=sessionStorage.getItem('attendix_session')?sessionStorage:localStorage;k.setItem('attendix_session',JSON.stringify({...s,nama:d.nama}));toast('Profil diperbarui');location.reload()})};

/* ---------- Boot ---------- */
(async()=>{if(PAGE=='login')return initLogin();const u=Auth.guard(PAGE);if(!u)return;await shell(PAGE,u);await run()})();
