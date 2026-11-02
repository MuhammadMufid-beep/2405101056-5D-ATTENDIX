# 2405101056-5D-ATTENDIX

# Pengumpulan UTS Pemrograman Web Dasar

## Identitas Mahasiswa

- Nama: [Muhammad Badiul Mufid AL Khudori]
- NIM: [2405101056]
- Kelas: [5D]
- Program Studi: [Teknik Informatika]
- Mata Kuliah: Pemrograman Web Dasar
- Tahun Akademik: [2025/2026]

## Deskripsi

Repository ini berisi source code dan dokumentasi hasil pengerjaan Ujian Tengah Semester (UTS)
mata kuliah Pemrograman Web Dasar.

## Deskripsi Pengerjaan UTS

Aplikasi yang dibuat bernama **Attendix – Smart Attendance System**, yaitu website sistem
informasi absensi dan manajemen karyawan perusahaan. Aplikasi dibangun menggunakan HTML5, CSS3,
dan JavaScript Vanilla (tanpa framework), dengan Chart.js untuk grafik dan Lucide Icons untuk ikon.
Data disimulasikan menggunakan LocalStorage, sehingga perubahan data tidak hilang saat halaman
di-refresh.

Aplikasi memiliki tiga peran pengguna (Owner, HRD, Karyawan) dengan satu halaman login dan
dashboard yang berbeda sesuai peran. Struktur kode memisahkan lapisan data (`data.js`),
autentikasi (`auth.js`), komponen antarmuka (`main.js`), dan logika halaman (`pages.js`) agar
mudah dikembangkan ke backend PHP dan database MySQL pada tahap berikutnya.

## Fitur yang Diimplementasikan

1. Login multi-role (Owner, HRD, Karyawan) dengan pembatasan akses halaman, remember me, dan logout.
2. Dashboard Owner/HRD: statistik kehadiran, grafik dengan filter 7 hari/30 hari/bulan ini,
   aktivitas terbaru, jadwal mingguan, dan pengumuman.
3. Dashboard Karyawan: jam digital real-time, absen masuk dan pulang (simulasi GPS dan selfie),
   status kehadiran, ringkasan bulanan, dan sisa cuti.
4. Monitoring absensi dengan filter tanggal dan departemen.
5. CRUD Data Karyawan dan Departemen (tambah, edit, nonaktifkan, hapus, detail).
6. Pengaturan jadwal kerja dan shift (pagi, siang, malam).
7. Pengajuan Izin, Cuti, dan Lembur beserta persetujuan atau penolakan oleh HRD/Owner.
8. Rekap dan laporan (harian, mingguan, bulanan, keterlambatan, izin dan cuti, lembur) dengan
   grafik, export Excel (CSV), dan export PDF.
9. Pengaturan perusahaan, manajemen akun HRD (khusus Owner), profil pengguna, dan notifikasi.
10. Tampilan responsif untuk desktop, tablet, dan smartphone.

## Struktur Folder

- `uts/`: Source code dan file pendukung UTS.
  - `uts/index.html`: Pintu masuk aplikasi.
  - `uts/pages/`: Halaman aplikasi (login, dashboard, attendance, employees, departments,
    schedule, leave, overtime, reports, settings, profile).
  - `uts/css/`: Stylesheet (`style.css`).
  - `uts/js/`: `data.js`, `auth.js`, `main.js`, `pages.js`.
  - `uts/assets/`: Gambar dan ikon.
  - `uts/backend/`: Disiapkan untuk pengembangan PHP + MySQL.
- `uts/screenshots/`: Bukti visual hasil implementasi.

## Cara Menjalankan Aplikasi

1. Pastikan komputer terhubung ke internet (Chart.js, Lucide, dan Google Fonts dimuat via CDN).
2. Buka folder `uts/` di VS Code.
3. Jalankan salah satu cara berikut:
   - Install ekstensi **Live Server**, klik kanan `index.html`, pilih **Open with Live Server**; atau
   - Salin folder ke `htdocs` XAMPP, jalankan Apache, lalu buka `http://localhost/uts/`.
4. Login menggunakan akun demo:

| Role     | Username   | Password      |
|----------|------------|---------------|
| Owner    | `owner`    | `owner123`    |
| HRD      | `hrd`      | `hrd123`      |
| Karyawan | `karyawan` | `karyawan123` |

Untuk mengembalikan data demo ke awal, hapus LocalStorage lewat DevTools
(Application → Local Storage → Clear) lalu refresh halaman.

## Referensi

- MDN Web Docs – HTML, CSS, JavaScript: https://developer.mozilla.org
- Chart.js: https://www.chartjs.org/docs
- Lucide Icons: https://lucide.dev
- Google Fonts – Plus Jakarta Sans: https://fonts.google.com/specimen/Plus+Jakarta+Sans
