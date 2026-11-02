/* data.js – lapisan data. Skema mengikuti tabel MySQL. Untuk backend: ganti isi Store dengan fetch() ke API PHP. */
const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const today=()=>ymd(new Date());
const DB={get(k){try{return JSON.parse(localStorage.getItem('attendix_'+k))}catch(e){return null}},set(k,v){localStorage.setItem('attendix_'+k,JSON.stringify(v))}};
const Store={
  async list(t){return DB.get(t)||[]},
  async insert(t,row){const a=await this.list(t);row.id=Math.max(0,...a.map(r=>+r.id||0))+1;a.push(row);DB.set(t,a);return row},
  async update(t,id,p){const a=await this.list(t),i=a.findIndex(r=>r.id==id);if(i>-1)a[i]={...a[i],...p};DB.set(t,a);return a[i]},
  async remove(t,id){DB.set(t,(await this.list(t)).filter(r=>r.id!=id))},
  async settings(){return DB.get('pengaturan')},
  async saveSettings(p){DB.set('pengaturan',{...DB.get('pengaturan'),...p})}
};
async function notify(untuk,pesan){await Store.insert('notifikasi',{untuk,pesan,waktu:new Date().toISOString(),dibaca:false})}
function seed(){
  if(DB.get('v')==2)return;
  const rnd=a=>a[Math.floor(Math.random()*a.length)],pad=n=>String(n).padStart(2,'0');
  const dep=['Human Resources','Finance','Information Technology','Marketing','Operasional'].map((n,i)=>({id:i+1,nama:n,deskripsi:'Departemen '+n}));
  const names=['Andi Pratama','Siti Rahmawati','Budi Santoso','Dewi Lestari','Rizky Maulana','Nadia Putri','Fajar Nugroho','Maya Anggraini','Dimas Saputra','Lina Marlina','Agus Wijaya','Putri Ayu'];
  const emp=names.map((n,i)=>({id:i+1,kode:'EMP-'+String(i+1).padStart(3,'0'),nama:n,email:n.split(' ')[0].toLowerCase()+'@attendix.id',telp:'0812'+(30000000+i*1234567),departemen_id:i%5+1,jabatan:rnd(['Manager','Staff','Supervisor','Analyst']),tgl_bergabung:(2020+i%5)+'-0'+(i%9+1)+'-15',shift:i%6==5?'siang':'pagi',status:'aktif'}));
  const users=[
    {id:1,nama:'Hendra Wijaya',username:'owner',email:'owner@attendix.id',telp:'081200000001',password:'owner123',role:'owner',karyawan_id:null},
    {id:2,nama:'Rina Kartika',username:'hrd',email:'hrd@attendix.id',telp:'081200000002',password:'hrd123',role:'hrd',karyawan_id:null},
    {id:3,nama:'Budi Santoso',username:'karyawan',email:'budi@attendix.id',telp:'081200000003',password:'karyawan123',role:'karyawan',karyawan_id:3}];
  const abs=[];let id=1;
  for(let d=30;d>=0;d--){const dt=new Date();dt.setDate(dt.getDate()-d);if([0,6].includes(dt.getDay()))continue;
    emp.forEach(e=>{if(d==0&&e.id==3)return;const r=Math.random(),s=r<.78?'hadir':r<.9?'terlambat':r<.96?'izin':'alpha',off=s=='izin'||s=='alpha';
      abs.push({id:id++,karyawan_id:e.id,tanggal:ymd(dt),jam_masuk:off?'':(s=='terlambat'?'08:'+(15+Math.floor(Math.random()*40)):'07:'+(40+Math.floor(Math.random()*19))),jam_pulang:(off||d==0)?'':'17:'+pad(Math.floor(Math.random()*30)),status:s})})}
  const t=today();
  DB.set('users',users);DB.set('departemen',dep);DB.set('karyawan',emp);DB.set('absensi',abs);
  DB.set('izin',[{id:1,karyawan_id:3,jenis:'Cuti Tahunan',tgl_mulai:t,tgl_selesai:t,alasan:'Acara keluarga',dokumen:'',status:'disetujui'},{id:2,karyawan_id:4,jenis:'Sakit',tgl_mulai:t,tgl_selesai:t,alasan:'Demam',dokumen:'surat-dokter.pdf',status:'menunggu'},{id:3,karyawan_id:6,jenis:'Cuti Tahunan',tgl_mulai:t,tgl_selesai:t,alasan:'Liburan',dokumen:'',status:'menunggu'}]);
  DB.set('lembur',[{id:1,karyawan_id:5,tanggal:t,mulai:'17:00',selesai:'20:00',durasi:'3.0',alasan:'Deadline laporan',status:'menunggu'},{id:2,karyawan_id:9,tanggal:t,mulai:'17:00',selesai:'19:30',durasi:'2.5',alasan:'Maintenance server',status:'disetujui'}]);
  DB.set('notifikasi',[{id:1,untuk:'admin',pesan:'Dewi Lestari mengajukan izin sakit',waktu:new Date().toISOString(),dibaca:false},{id:2,untuk:'k3',pesan:'Selamat datang di Attendix!',waktu:new Date().toISOString(),dibaca:false}]);
  DB.set('pengaturan',{perusahaan:'PT Nusantara Digital',masuk:'08:00',pulang:'17:00',toleransi:10,hari_kerja:['Sen','Sel','Rab','Kam','Jum'],shifts:{pagi:['08:00','17:00'],siang:['13:00','22:00'],malam:['22:00','06:00']},notif:true,
    pengumuman:[{judul:'Rapat Bulanan',isi:'Jumat 14:00 di ruang utama.'},{judul:'Kebijakan Lembur',isi:'Pengajuan lembur maksimal H-1.'}]});
  DB.set('v',2);
}
seed();
