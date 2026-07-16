# Product Requirements Document (PRD)
## Aplikasi Mobile — Android (Sistem Akademik & CBT)

| Item | Keterangan |
|------|------------|
| Nama Produk | Aplikasi Sekolah (Android) |
| Versi Dokumen | 1.0 |
| Tanggal | 15 Juli 2026 |
| Status | Draft |
| Platform | Android (React Native / Expo) |
| Distribusi | Google Play Store |
| Dokumen Induk | PRD.md (Sistem Manajemen Sekolah) |

---

## 1. Ringkasan

Aplikasi Android adalah klien mobile dari Sistem Manajemen Sekolah,
dibangun dengan React Native (Expo). Satu aplikasi melayani banyak sekolah;
setiap sekolah memiliki VPS, domain, dan database sendiri. Aplikasi
menentukan server tujuan (`baseURL`) saat runtime — bukan ditanam saat
build — sehingga satu binary dapat dipakai semua sekolah.

Fokus utama dokumen ini adalah hal-hal **khusus Android**, terutama
**secure exam / kiosk mode** untuk CBT yang mekanismenya berbeda dari iOS.

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

## 3. Fitur Umum (Android)

- Autentikasi (email + password), simpan sesi, auto-login.
- Push notification (FCM — Firebase Cloud Messaging).
- Akses modul sesuai peran: nilai, jadwal, absensi, tagihan, LMS,
  pengumuman, e-raport, dsb.
- Scan QR (kamera) untuk penentuan sekolah bila metode QR dipakai.
- Dukungan mode gelap dan aksesibilitas dasar.

---

## 4. CBT — Secure Exam Mode (Android)

Peserta mengerjakan ujian di dalam aplikasi dengan penguncian perangkat
menggunakan mekanisme kiosk bawaan Android.

### 4.1 Penguncian Perangkat (Kiosk)
- **Screen Pinning (Pin App)** — mode dasar, tersedia di semua perangkat;
  peserta di-pin ke aplikasi ujian. Bisa keluar dengan kombinasi tombol,
  namun keluar terdeteksi & dicatat.
- **Lock Task Mode (Kiosk)** — mode ketat; memblokir tombol Home, Recent
  Apps, notification bar, split screen, dan floating window. Membutuhkan
  aplikasi ditetapkan sebagai **Device Owner** atau perangkat yang di-manage
  (MDM/EMM). Cocok untuk ujian taruhan tinggi di perangkat milik sekolah.

### 4.2 Anti-Kecurangan
- Deteksi keluar aplikasi / kehilangan fokus (lifecycle `onPause`,
  `AppState`) → dicatat sebagai pelanggaran, memicu peringatan / auto-submit.
- Blokir tangkapan layar & screen recording (`FLAG_SECURE`).
- Cegah screen mirroring / cast ke layar eksternal.
- Blokir floating window, Picture-in-Picture, dan split screen selama ujian
  (efektif penuh dalam Lock Task Mode).
- Nonaktifkan notifikasi selama sesi ujian.
- Login sesi tunggal per peserta; login ganda diblokir/di-reset proktor.

### 4.3 Mode Semi-Online
- Naskah soal di-cache lokal; jawaban auto-save di perangkat.
- Sinkronisasi jawaban ke VPS sekolah secara berkala & saat submit.
- Ujian tetap berjalan saat koneksi terputus, resume tanpa kehilangan data.

### 4.4 Batasan Android
- **Screen Pinning** mudah dipasang tapi kurang ketat (peserta masih bisa
  keluar, walau terdeteksi).
- **Lock Task Mode** paling aman namun butuh Device Owner/MDM — pada HP
  pribadi siswa tanpa MDM, penguncian tidak dapat sepenuhnya total.
- Sebagian vendor (Xiaomi/Oppo/dll) memiliki fitur overlay yang perilakunya
  dapat berbeda; perlu pengujian per merk.
- Tidak ada teknologi yang mencegah penggunaan perangkat kedua; pengawas
  fisik tetap diperlukan.

---

## 5. Kebutuhan Teknis Android
- Target Android API level sesuai kebijakan Play Store terbaru.
- Izin: kamera (scan QR), notifikasi (FCM).
- Distribusi via Google Play; sertakan akun demo + sekolah demo untuk review.
- Privacy Policy dan pelabelan data (Data Safety) wajib diisi.
- Untuk mode kiosk penuh: dokumentasi setup Device Owner / integrasi MDM.

