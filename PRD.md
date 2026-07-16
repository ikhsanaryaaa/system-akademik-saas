# Product Requirements Document (PRD)
## Aplikasi Manajemen Sekolah — Sistem Akademik & CBT

| Item | Keterangan |
|------|------------|
| Nama Produk | Sistem Informasi Manajemen Sekolah (Akademik + CBT) |
| Versi Dokumen | 1.0 |
| Tanggal | 15 Juli 2026 |
| Status | Draft |
| Model Aplikasi | Self-hosted per sekolah — satu deployment & satu database per sekolah (single-tenant per instance); aplikasi mobile terhubung via direktori sekolah pusat |

---

## 1. Ringkasan Produk

Aplikasi manajemen sekolah berbasis web yang mengintegrasikan proses
akademik, kesiswaan, keuangan, bimbingan konseling, absensi, LMS, dan
Computer Based Test (CBT) dalam satu platform. Sistem di-deploy secara
terpisah untuk setiap sekolah (self-hosted, satu database per sekolah),
sehingga data tiap sekolah terisolasi penuh di level instance — bukan
multi-tenant yang berbagi satu database. Aplikasi mobile CBT terhubung ke
backend sekolah yang dipilih melalui sebuah direktori sekolah pusat
(lihat §6.1).

Seluruh proses bisnis dipetakan berdasarkan **tingkatan kelas** dan
**jurusan**, sehingga data penilaian, kesiswaan, absensi, keuangan, dan
LMS selalu terkait dengan konteks kelas dan jurusan siswa.

---

## 2. Tujuan & Sasaran

- Mendigitalkan proses administrasi dan akademik sekolah secara terpadu.
- Menyediakan data yang akurat, real-time, dan dapat diaudit.
- Mempermudah pelaporan bagi setiap peran (role) di sekolah.
- Meningkatkan keterlibatan siswa dan orang tua melalui LMS dan notifikasi.
- Menyederhanakan pengelolaan keuangan, absensi, dan bimbingan konseling.

---

## 3. Ruang Lingkup

Termasuk dalam ruang lingkup: master data, kurikulum, penilaian & e-raport,
kesiswaan, bimbingan konseling, absensi (manual & RFID), guru piket, bursa
kerja khusus (BKK), LMS, CBT (Computer Based Test), keuangan, dan
pengaturan sistem.

Belum termasuk (dapat menjadi fase lanjutan): integrasi Dapodik, mobile app
native, dan payment gateway online.

---

## 4. Pengguna & Peran (Roles)

| No | Peran | Tanggung Jawab Utama |
|----|-------|----------------------|
| 1 | Administrator | Kelola seluruh sistem, user, role & hak akses, konfigurasi |
| 2 | Kepala Sekolah | Monitoring, persetujuan, akses seluruh laporan |
| 3 | Wakil Kurikulum | Struktur kurikulum, jadwal pelajaran, kalender akademik |
| 4 | Wakil Kesiswaan | Penerimaan, pembinaan, dan kegiatan kesiswaan |
| 5 | Bendahara | Jenis pembayaran, tagihan, dan laporan keuangan |
| 6 | Tata Usaha | Administrasi data siswa, pendidik, dan surat-menyurat |
| 7 | Bimbingan Konseling (BK) | Pelanggaran, konseling, tindak lanjut, prestasi, alumni |
| 8 | Bursa Kerja Khusus (BKK) | PKL, tempat PKL, lowongan kerja |
| 9 | Kepala Program | Kelola program/jurusan yang dipimpin |
| 10 | Guru | Materi, penilaian, tugas, quiz, absensi kelas |
| 11 | Wali Kelas | Perwalian, e-raport, monitoring siswa kelasnya |
| 12 | Siswa | Materi, tugas, quiz, absensi, tagihan, raport |
| 13 | Orang Tua | Monitoring nilai, absensi, tagihan, dan pengumuman anak |
| 14 | Proktor CBT | Pelaksanaan ujian: kelola sesi, token, buka/tutup & reset peserta |
| 15 | Pengawas CBT | Pengawasan peserta: monitor jalannya ujian dan kepatuhan peserta (ditugaskan dari data guru) |

Setiap peran memiliki hak akses (RBAC) yang dapat dikonfigurasi melalui
modul **Manajemen User — Referensi Role & Hak Akses**.

---

## 5. Modul & Fitur

> Catatan: fitur bertanda **(per kelas & jurusan)** artinya data difilter
> dan dikelola berdasarkan tingkatan kelas dan jurusan.

### 5.1 Master Data
- Tingkatan
- Kelas
- Jurusan
- Data pendidik (guru & tenaga pengajar)
- Data tenaga non-kependidikan
- Data siswa

### 5.2 Bidang Kurikulum
- Struktur kurikulum
- Pemetaan kelas
- Jadwal pelajaran
- Kalender akademik
- Laporan kurikulum

### 5.3 Penilaian
- Input konten materi **(per kelas & jurusan)**
- Input nilai sumatif **(per kelas & jurusan)**
- Input nilai raport **(per kelas & jurusan)**
- Laporan leger **(per kelas & jurusan)**
- e-Raport **(per kelas & jurusan)**
- Laporan penilaian

### 5.4 Bidang Kesiswaan
- Penerimaan Peserta Didik Baru (PPDB) **(per kelas & jurusan)**
- Pembinaan kesiswaan **(per kelas & jurusan)**
- Pengembangan bakat & minat **(per kelas & jurusan)**
- Kegiatan kesiswaan lainnya
- Laporan kesiswaan

### 5.5 Bimbingan Konseling (BK)
- Jenis pelanggaran
- Agenda BK
- Buku siswa **(per kelas & jurusan)**
- Pencatatan pelanggaran **(per kelas & jurusan)**
- Tindak lanjut **(per kelas & jurusan)**
- Sesi konseling **(per kelas & jurusan)**
- Kunjungan ke rumah / home visit **(per kelas & jurusan)**
- Prestasi siswa **(per kelas & jurusan)**
- Data alumni **(per kelas & jurusan)**
- Laporan BK **(per kelas & jurusan)**

### 5.6 Absensi
- Absensi guru manual (masuk & keluar)
- Absensi siswa manual (masuk & keluar) **(per kelas & jurusan)**
- Absensi RFID (masuk & keluar) **(per kelas & jurusan)**
- Laporan absensi **(per kelas & jurusan)**

### 5.7 Guru Piket
- Jadwal piket
- Buku piket
- Buku tamu
- Pelanggaran harian **(per kelas & jurusan)**
- Keterlambatan **(per kelas & jurusan)**
- Izin keluar **(per kelas & jurusan)**
- Laporan guru piket

### 5.8 Bursa Kerja Khusus (BKK)
- Input daftar PKL
- Data PKL
- Data tempat PKL
- Lowongan kerja
- Laporan BKK

### 5.9 LMS (Learning Management System)
- Materi **(per kelas & jurusan)**
- Tugas **(per kelas & jurusan)**
- Quiz **(per kelas & jurusan)**
- Forum diskusi **(per kelas & jurusan)**
- Laporan LMS

### 5.10 Bidang Keuangan
- Jenis pembayaran
- Tagihan pembayaran, mendukung cicilan **(per kelas & jurusan)**
- Rincian tagihan **(per kelas & jurusan)**
- Kirim pesan tagihan & konfirmasi pembayaran (via WhatsApp)
- Laporan keuangan

### 5.11 CBT (Computer Based Test)

> **Pembagian platform CBT:**
> - **Peserta ujian** mengerjakan soal **hanya melalui aplikasi mobile**
>   (kiosk mode) — lihat PRD-android.md dan PRD-ios.md.
> - **Web CBT hanya untuk proktor & pengawas** (monitoring, kontrol sesi,
>   dan administrasi ujian). Web tidak digunakan peserta untuk mengerjakan
>   ujian karena tidak dapat mengunci perangkat (banyak celah kecurangan).

**Administrasi & bank soal (web — guru/kurikulum/proktor):**
- Bank soal **(per kelas & jurusan)** — pilihan ganda, benar/salah, esai,
  menjodohkan; dukung gambar dan rumus
- Penyusunan paket/naskah ujian dari bank soal (acak soal & opsi jawaban)
- Penjadwalan ujian: waktu mulai/selesai, durasi, token/kata sandi ujian
- Alokasi peserta per kelas & jurusan serta pembagian ruang/sesi
- Penugasan pengawas ujian per ruang/sesi, dipilih dari data guru
- Koreksi otomatis (objektif) dan koreksi manual (esai) oleh guru
- Hasil & analisis butir soal (tingkat kesukaran, daya pembeda)
- Integrasi nilai CBT ke modul Penilaian **(per kelas & jurusan)**
- Laporan CBT **(per kelas & jurusan)**

**Monitoring & pengawasan (web — proktor & pengawas):**
- Dashboard pemantauan peserta real-time: status (belum mulai, mengerjakan,
  selesai, terputus, ditandai curang), progres, dan sisa waktu
- Kontrol sesi: rilis token, reset login peserta, buka/tutup akses,
  perpanjang waktu, hentikan/lanjutkan ujian peserta tertentu
- Log pelanggaran peserta yang dikirim dari aplikasi

**Pelaksanaan ujian (aplikasi mobile — peserta):**
- Mengerjakan soal dengan timer, auto-save, dan resume bila koneksi terputus
- Secure exam / kiosk mode (lihat 5.11.1)

#### 5.11.1 Secure Exam Mode (setara Safe Exam Browser / CBT Pemerintah)
Mode ujian aman untuk mencegah kecurangan, mengacu pada perilaku Safe Exam
Browser dan sistem CBT pemerintah (UNBK/ANBK/TKA):

- **Kiosk / lockdown perangkat**: layar terkunci penuh selama ujian.
  - Android: Lock Task Mode / Screen Pinning.
  - iOS: Guided Access / Automatic Assessment Configuration.
- **Cegah pindah aplikasi & multitasking**: keluar dari app selama ujian
  terdeteksi, dicatat sebagai pelanggaran, dan dapat memicu peringatan
  atau auto-submit sesuai kebijakan.
- **Blokir tangkapan layar, screen recording, dan screen mirroring**.
- **Nonaktifkan notifikasi, split screen, copy-paste, dan share** saat ujian.
- **Token & kata sandi ujian** yang dirilis proktor per sesi (rilis ulang
  bila peserta perlu reset).
- **Login sesi tunggal**: satu peserta hanya bisa aktif di satu perangkat;
  login ganda diblokir/di-reset oleh proktor.
- **Mode semi-online**: naskah soal di-cache lokal, jawaban tersimpan
  otomatis dan disinkronkan berkala; ujian tetap berjalan saat koneksi
  putus sementara dan resume tanpa kehilangan jawaban.
- **Deteksi & pencatatan pelanggaran**: percobaan keluar app, hilang fokus,
  perpindahan jaringan mencurigakan; tercatat di log ujian.
- **Monitoring proktor real-time**: status peserta (belum mulai, mengerjakan,
  selesai, terputus, ditandai curang), progres pengerjaan, dan sisa waktu.
- **Kontrol proktor**: reset login peserta, buka/tutup akses, perpanjang
  waktu, dan hentikan/lanjutkan ujian peserta tertentu.
- **Randomisasi**: urutan soal dan opsi jawaban diacak per peserta.
- **Cap waktu & audit**: waktu mulai, submit, dan durasi tercatat penuh
  untuk keperluan audit.
- **Auto-submit** saat waktu habis atau sesi ditutup proktor.

> Catatan teknis: secure exam mode **hanya berlaku di aplikasi mobile**
> (peserta). Mekanisme kiosk berbeda antar platform dan dirinci pada
> dokumen terpisah — lihat **PRD-android.md** (Lock Task Mode / Screen
> Pinning) dan **PRD-ios.md** (Guided Access / Automatic Assessment
> Configuration). Web CBT tidak menjalankan mode ini karena hanya dipakai
> proktor & pengawas, bukan peserta.

### 5.12 Sistem (System)
- Profil sekolah
- **Branding / White-label (rebranding)** — nama sekolah, logo, favicon,
  warna utama, judul aplikasi, dan footer dikonfigurasi dari pengaturan
  (disimpan di database), bukan hardcode. Karena web di-deploy per sekolah
  (§6.1), setiap instance dapat tampil dengan identitas sekolahnya sendiri
  tanpa mengubah kode.
- Pengaturan jam absensi (masuk & keluar)
- Manajemen user — Referensi Role & Hak Akses (RBAC)
- WhatsApp gateway
- **Pengaturan email (SMTP)** — konfigurasi server SMTP per instance untuk
  pengiriman email sistem (mis. reset password).
- Perubahan password
- **Lupa / reset password:**
  - **Via email (SMTP)** — untuk user yang memiliki email (umumnya
    admin, guru, staf): kirim tautan reset berbatas waktu ke email terdaftar.
  - **Via Admin / Tata Usaha** — untuk user tanpa email (umumnya siswa &
    orang tua): admin mereset password secara manual.
  - **(Opsional) via WhatsApp** — kirim tautan/OTP reset melalui WhatsApp
    Gateway bagi user tanpa email.
- Pengumuman
- Notifikasi
- Pusat laporan (report center)

---

## 6. Arsitektur & Teknologi

| Layer | Teknologi |
|-------|-----------|
| Frontend | React + Vite (SPA), React Router untuk navigasi |
| Styling | Tailwind CSS |
| Bahasa Backend | Go (Golang) |
| Framework API | Gin (REST router & middleware) |
| Database | PostgreSQL |
| ORM / DB Layer | GORM |
| Dokumentasi API | Swagger/OpenAPI via swaggo |
| Server | Linux Ubuntu |
| Email | SMTP (reset password & email sistem) |
| Integrasi | WhatsApp Gateway, RFID Reader, SMTP |

Arsitektur bersifat **API-first**: frontend React (Vite, SPA)
berkomunikasi dengan backend Go melalui REST API. Aplikasi
frontend berupa Single Page Application tanpa SSR karena seluruh halaman
berada di balik autentikasi (tidak memerlukan SEO). Akses ke PostgreSQL
menggunakan GORM, routing dan middleware ditangani Gin, validasi input
memakai struct validation Go, dan dokumentasi API (Swagger/OpenAPI)
dihasilkan dengan swaggo.

### 6.1 Model Deployment & Konektivitas Aplikasi Mobile

**Web (per sekolah):**
- Aplikasi web di-deploy terpisah untuk setiap sekolah (self-hosted /
  instance sendiri), bukan satu instance bersama untuk banyak sekolah.
- Setiap deployment memiliki **database sendiri**, sehingga data satu
  sekolah sepenuhnya terisolasi di level instance. Konsekuensinya isolasi
  data, keamanan, dan RBAC menjadi **single-tenant per instance** —
  tidak perlu pemisahan `tenant_id` atau row-level security lintas sekolah.

**Aplikasi Mobile Android & iOS (peserta CBT):**
- Terdapat satu **direktori sekolah pusat** yang menyimpan daftar sekolah
  beserta **baseURL** backend masing-masing sekolah.
- Alur: peserta membuka aplikasi → **memilih sekolah** → aplikasi mengambil
  **baseURL** sekolah tersebut dari direktori pusat → seluruh komunikasi CBT
  (login, ambil naskah, kirim jawaban, sinkronisasi) diarahkan ke backend
  sekolah yang bersangkutan.
- Dengan pola ini, satu aplikasi mobile melayani banyak sekolah tanpa
  backend ujian terpusat — beban pelaksanaan ujian tetap ditangani backend
  masing-masing sekolah. Direktori pusat adalah satu-satunya komponen
  bersama; sisanya per sekolah.

---

## 7. Alur Pengembangan

Pengembangan mengikuti pendekatan **backend → REST API → frontend**.
Untuk setiap modul/fitur, urutan pengerjaannya adalah:

1. **Alur bisnis** — definisikan proses dan aturan bisnis.
2. **Struktur database** — rancang tabel, relasi, dan indeks menggunakan
   model GORM, lalu jalankan migration.
3. **Validasi** — aturan validasi input di sisi server memanfaatkan
   struct validation Go.
4. **Endpoint** — implementasi REST API dengan Gin (Go).
5. **Response JSON** — format respons yang konsisten.
6. **Error handling** — penanganan error dan kode status yang standar.
7. **Frontend** — implementasi antarmuka React yang mengonsumsi API.

---

## 8. Kebutuhan Non-Fungsional

- **Isolasi per sekolah**: setiap sekolah memiliki deployment & database
  sendiri (single-tenant per instance); tidak ada data lintas sekolah dalam
  satu instance.
- **Keamanan**: autentikasi, otorisasi berbasis peran (RBAC), enkripsi
  password, proteksi terhadap serangan umum (SQL injection, XSS, CSRF).
- **Audit trail**: pencatatan aktivitas penting untuk keperluan audit.
- **Konsistensi API**: format response dan error handling seragam.
- **Skalabilitas**: mampu menangani banyak sekolah dan pengguna.
- **Ketersediaan**: backup berkala dan strategi pemulihan data.
- **Responsif**: antarmuka dapat diakses dari desktop dan perangkat mobile.

---

## 9. Asumsi & Batasan

- Setiap data akademik terikat pada tahun ajaran, tingkatan, dan jurusan.
- Absensi RFID membutuhkan perangkat pembaca RFID di lokasi sekolah.
- Notifikasi dan pengiriman pesan tagihan bergantung pada WhatsApp Gateway.
- Pelaksanaan CBT membutuhkan perangkat (PC/laptop/tablet) dan koneksi yang
  memadai; nilai hasil CBT terintegrasi ke modul Penilaian.
- Pengawas CBT bukan akun terpisah, melainkan guru yang ditugaskan sebagai
  pengawas pada sesi/ruang ujian tertentu (pola serupa Wali Kelas dan Guru
  Piket).
- Web di-deploy terpisah oleh/untuk masing-masing sekolah; setiap instance
  memiliki database sendiri (single-tenant per deployment).
- Aplikasi mobile CBT memilih sekolah dari direktori pusat lalu mengambil
  baseURL sekolah tersebut untuk terhubung ke backend sekolah yang
  bersangkutan (lihat §6.1).

