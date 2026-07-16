# Product Requirements Document (PRD)
## Aplikasi Mobile — iOS (Sistem Akademik & CBT)

| Item | Keterangan |
|------|------------|
| Nama Produk | Aplikasi Sekolah (iOS) |
| Versi Dokumen | 1.0 |
| Tanggal | 15 Juli 2026 |
| Status | Draft |
| Platform | iOS / iPadOS (React Native / Expo) |
| Distribusi | Apple App Store |
| Dokumen Induk | PRD.md (Sistem Manajemen Sekolah) |

---

## 1. Ringkasan

Aplikasi iOS adalah klien mobile dari Sistem Manajemen Sekolah, dibangun
dengan React Native (Expo). Satu aplikasi melayani banyak sekolah; setiap
sekolah memiliki VPS, domain, dan database sendiri. Aplikasi menentukan
server tujuan (`baseURL`) saat runtime — bukan ditanam saat build —
sehingga satu binary dapat dipakai semua sekolah.

Fokus utama dokumen ini adalah hal-hal **khusus iOS**, terutama **secure
exam mode** untuk CBT yang mekanismenya berbeda dari Android.

---

## 2. Arsitektur Koneksi (Multi-Server)

- Aplikasi tidak terhubung ke database mana pun secara langsung; semua data
  diakses melalui REST API milik VPS sekolah.
- Alur penentuan server:
  1. Pengguna memilih/menentukan sekolah (pilih dari daftar, kode, atau QR).
  2. Aplikasi menyimpan `baseURL` (alamat VPS sekolah) di penyimpanan lokal.
  3. Login (email + password) dikirim ke `baseURL` sekolah tersebut.
  4. Seluruh request berikutnya diarahkan ke `baseURL` yang tersimpan.
- **Logout** menghapus token sesi, tetapi `baseURL` tetap tersimpan.
- **Ganti Sekolah** (aksi terpisah) menghapus `baseURL` dan kembali ke
  pemilihan sekolah.

---

## 3. Fitur Umum (iOS)

- Autentikasi (email + password), simpan sesi, auto-login.
- Push notification (APNs — Apple Push Notification service).
- Akses modul sesuai peran: nilai, jadwal, absensi, tagihan, LMS,
  pengumuman, e-raport, dsb.
- Scan QR (kamera) untuk penentuan sekolah bila metode QR dipakai.
- Dukungan mode gelap dan aksesibilitas dasar.

---

## 4. CBT — Secure Exam Mode (iOS)

Peserta mengerjakan ujian di dalam aplikasi dengan penguncian perangkat
menggunakan mekanisme kiosk bawaan iOS.

### 4.1 Penguncian Perangkat (Kiosk)
- **Guided Access** — mengunci perangkat ke satu aplikasi; mematikan tombol
  Home, gesture, dan sentuhan area tertentu. Diaktifkan manual oleh
  pengguna/pengawas (Settings > Accessibility) atau dipandu di layar.
- **Automatic Assessment Configuration (Assessment Mode)** — API iOS khusus
  ujian; secara otomatis menonaktifkan fitur seperti autocorrect,
  definition lookup, screenshot, dan mencegah keluar aplikasi selama sesi.
  Ini padanan terdekat "kiosk ujian" di iOS.
- **Single App Mode / Autonomous Single App Mode (ASAM)** — penguncian
  penuh ke satu aplikasi; membutuhkan perangkat yang di-supervise via MDM
  (Apple School Manager). Cocok untuk perangkat milik sekolah (iPad kelas).

### 4.2 Anti-Kecurangan
- Deteksi keluar aplikasi / kehilangan fokus (`AppState`, lifecycle) →
  dicatat sebagai pelanggaran, memicu peringatan / auto-submit.
- Assessment Mode memblokir screenshot & fitur bantu selama ujian.
- Nonaktifkan notifikasi selama sesi (efektif penuh dalam ASAM/Assessment
  Mode).
- Login sesi tunggal per peserta; login ganda diblokir/di-reset proktor.
- Deteksi jailbreak (opsional) untuk menolak perangkat berisiko tinggi.

### 4.3 Mode Semi-Online
- Naskah soal di-cache lokal; jawaban auto-save di perangkat.
- Sinkronisasi jawaban ke VPS sekolah secara berkala & saat submit.
- Ujian tetap berjalan saat koneksi terputus, resume tanpa kehilangan data.

### 4.4 Batasan iOS
- **Guided Access** kuat tapi biasanya **diaktifkan manual** oleh pengguna —
  bergantung kepatuhan; tanpa MDM, aktivasi tidak dapat dipaksa oleh aplikasi.
- **ASAM/Single App Mode** paling aman namun **wajib perangkat di-supervise
  via MDM (Apple School Manager)** — tidak berlaku di iPhone pribadi siswa.
- Semua browser di iOS memakai WebKit; karenanya CBT web di iOS tetap tidak
  bisa mengunci — memperkuat keputusan memakai aplikasi.
- Tidak ada teknologi yang mencegah penggunaan perangkat kedua; pengawas
  fisik tetap diperlukan.

---

## 5. Kebutuhan Teknis iOS
- Membutuhkan akun Apple Developer Program (berbayar) untuk distribusi.
- Izin: kamera (scan QR), notifikasi (APNs).
- Distribusi via App Store; sertakan akun demo + sekolah demo untuk review
  (App Review memerlukan cara masuk tanpa akun sekolah nyata).
- Privacy Policy, Privacy Nutrition Label, dan opsi hapus akun wajib ada.
- Untuk mode kiosk penuh (ASAM): perangkat harus di-supervise via Apple
  School Manager / MDM.

