---
version: 1.0
name: sim-sekolah-design-system
description: Design system untuk Sistem Informasi Manajemen Sekolah (Akademik + CBT) — web app SaaS multi-tenant berbasis React + Vite + Tailwind CSS. Seluruh antarmuka berada di balik autentikasi (SPA tanpa SSR), sehingga fokus desain adalah kepadatan data yang tetap terbaca: sidebar navigasi per-modul, top bar konteks (sekolah/tahun ajaran/role), tabel data padat, form entri, filter per kelas & jurusan, kartu statistik dashboard, dan dashboard monitoring CBT real-time untuk proktor & pengawas. Bahasa visual: tenang, profesional, dan tepercaya — selaras dengan sistem CBT pemerintah (UNBK/ANBK/TKA) — dengan satu warna aksi biru institusional di atas kanvas netral slate. Bukan situs marketing; ini adalah aplikasi kerja harian.

colors:
  primary: "#2563eb"
  primary-hover: "#1d4ed8"
  primary-active: "#1e40af"
  primary-disabled: "#93c5fd"
  primary-soft: "#eff6ff"
  primary-border: "#bfdbfe"
  ink: "#0f172a"
  body: "#334155"
  muted: "#64748b"
  muted-soft: "#94a3b8"
  hairline: "#e2e8f0"
  hairline-soft: "#f1f5f9"
  canvas: "#ffffff"
  surface-soft: "#f8fafc"
  surface-strong: "#f1f5f9"
  sidebar: "#0f172a"
  sidebar-elevated: "#1e293b"
  sidebar-active: "#2563eb"
  on-primary: "#ffffff"
  on-sidebar: "#e2e8f0"
  on-sidebar-muted: "#94a3b8"
  success: "#16a34a"
  success-soft: "#dcfce7"
  warning: "#d97706"
  warning-soft: "#fef3c7"
  danger: "#dc2626"
  danger-soft: "#fee2e2"
  danger-hover: "#b91c1c"
  info: "#0284c7"
  info-soft: "#e0f2fe"
  status-idle: "#64748b"
  status-active: "#2563eb"
  status-done: "#16a34a"
  status-disconnected: "#d97706"
  status-flagged: "#dc2626"

typography:
  page-title:
    fontFamily: "Inter, -apple-system, system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.3px
  section-title:
    fontFamily: "Inter, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: -0.2px
  card-title:
    fontFamily: "Inter, sans-serif"
    fontSize: 15px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  body-md:
    fontFamily: "Inter, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-strong:
    fontFamily: "Inter, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: 0
  body-sm:
    fontFamily: "Inter, sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  caption:
    fontFamily: "Inter, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0.1px
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  overline:
    fontFamily: "Inter, sans-serif"
    fontSize: 11px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0.6px
  table-header:
    fontFamily: "Inter, sans-serif"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0.3px
  numeric:
    fontFamily: "'JetBrains Mono', 'Geist Mono', ui-monospace, 'Cascadia Mono', Menlo, Consolas, monospace"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  numeric-lg:
    fontFamily: "'JetBrains Mono', ui-monospace, monospace"
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: -0.5px
  timer:
    fontFamily: "'JetBrains Mono', ui-monospace, monospace"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.5px
  button:
    fontFamily: "Inter, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0

rounded:
  none: 0px
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  base: 16px
  md: 20px
  lg: 24px
  xl: 32px
  xxl: 48px

components:
  app-shell:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.body}"
  sidebar:
    backgroundColor: "{colors.sidebar}"
    textColor: "{colors.on-sidebar}"
    typography: "{typography.body-sm}"
    width: 260px
  sidebar-item:
    backgroundColor: transparent
    textColor: "{colors.on-sidebar-muted}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: 10px 12px
  sidebar-item-active:
    backgroundColor: "{colors.sidebar-active}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.md}"
  sidebar-group-label:
    backgroundColor: transparent
    textColor: "{colors.on-sidebar-muted}"
    typography: "{typography.overline}"
    padding: 16px 12px 6px
  topbar:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    height: 60px
    borderBottom: "1px solid {colors.hairline}"
  context-switcher:
    backgroundColor: "{colors.surface-strong}"
    textColor: "{colors.body}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: 6px 12px
    height: 36px
  page-header:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.page-title}"
  breadcrumb:
    backgroundColor: transparent
    textColor: "{colors.muted}"
    typography: "{typography.body-sm}"
  card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body}"
    rounded: "{rounded.lg}"
    padding: 24px
    border: "1px solid {colors.hairline}"
  stat-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.numeric-lg}"
    rounded: "{rounded.lg}"
    padding: 20px
    border: "1px solid {colors.hairline}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 9px 16px
    height: 38px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 9px 16px
    height: 38px
    border: "1px solid {colors.hairline}"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 9px 16px
    height: 38px
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 9px 12px
  button-icon:
    backgroundColor: transparent
    textColor: "{colors.muted}"
    rounded: "{rounded.md}"
    size: 36px
  text-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 8px 12px
    height: 38px
    border: "1px solid {colors.hairline}"
  select-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 8px 12px
    height: 38px
    border: "1px solid {colors.hairline}"
  field-label:
    backgroundColor: transparent
    textColor: "{colors.body}"
    typography: "{typography.label}"
  field-error:
    backgroundColor: transparent
    textColor: "{colors.danger}"
    typography: "{typography.caption}"
  filter-bar:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body}"
    rounded: "{rounded.lg}"
    padding: 16px
    border: "1px solid {colors.hairline}"
  data-table:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    border: "1px solid {colors.hairline}"
  table-header-cell:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.muted}"
    typography: "{typography.table-header}"
    padding: 10px 16px
  table-row:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body}"
    typography: "{typography.body-sm}"
    padding: 12px 16px
    borderBottom: "1px solid {colors.hairline-soft}"
  table-row-hover:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.body}"
  pagination:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body}"
    typography: "{typography.body-sm}"
  tabs:
    backgroundColor: transparent
    textColor: "{colors.muted}"
    typography: "{typography.body-strong}"
    borderBottom: "1px solid {colors.hairline}"
  tab-active:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    typography: "{typography.body-strong}"
    borderBottom: "2px solid {colors.primary}"
  badge-neutral:
    backgroundColor: "{colors.surface-strong}"
    textColor: "{colors.body}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: 2px 10px
  badge-success:
    backgroundColor: "{colors.success-soft}"
    textColor: "{colors.success}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: 2px 10px
  badge-warning:
    backgroundColor: "{colors.warning-soft}"
    textColor: "{colors.warning}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: 2px 10px
  badge-danger:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: 2px 10px
  badge-info:
    backgroundColor: "{colors.info-soft}"
    textColor: "{colors.info}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: 2px 10px
  status-dot:
    size: 8px
    rounded: "{rounded.full}"
  role-pill:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary-active}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: 2px 10px
    border: "1px solid {colors.primary-border}"
  modal:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body}"
    rounded: "{rounded.xl}"
    padding: 24px
    maxWidth: 520px
  modal-overlay:
    backgroundColor: "rgba(15, 23, 42, 0.5)"
  drawer:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body}"
    width: 420px
    borderLeft: "1px solid {colors.hairline}"
  toast:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: 12px 16px
  alert-info:
    backgroundColor: "{colors.info-soft}"
    textColor: "{colors.info}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: 12px 16px
  alert-danger:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger-hover}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: 12px 16px
  empty-state:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.muted}"
    typography: "{typography.body-md}"
    padding: 48px
  cbt-monitor-tile:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: 12px
    border: "1px solid {colors.hairline}"
  cbt-token-display:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary-active}"
    typography: "{typography.timer}"
    rounded: "{rounded.md}"
    padding: 12px 20px
    border: "1px solid {colors.primary-border}"
  exam-timer:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-primary}"
    typography: "{typography.timer}"
    rounded: "{rounded.md}"
    padding: 8px 16px
  login-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body}"
    rounded: "{rounded.xl}"
    padding: 32px
    border: "1px solid {colors.hairline}"
    maxWidth: 400px
---

## Overview

Ini adalah design system untuk **Sistem Informasi Manajemen Sekolah (Akademik + CBT)** — sebuah aplikasi kerja SaaS multi-tenant, bukan situs marketing. Seluruh halaman berada di balik autentikasi (SPA React + Vite, tanpa SSR), jadi prioritas desain adalah **kepadatan data yang tetap terbaca**: banyak tabel, form entri, filter, kartu statistik, dan dashboard monitoring — dipakai setiap hari oleh 15 peran berbeda (Administrator, Kepala Sekolah, Guru, Wali Kelas, Siswa, Orang Tua, Proktor/Pengawas CBT, dan lainnya).

Bahasa visual dibangun untuk **kepercayaan institusional**: satu warna aksi biru (`{colors.primary}` — #2563eb) di atas kanvas netral slate, tipografi Inter yang bersih, dan sudut membulat moderat (bukan pill). Nada ini sengaja diselaraskan dengan sistem CBT pemerintah (UNBK/ANBK/TKA) — tenang, jelas, dan tidak main-main, karena sistem ini memegang nilai, keuangan, dan pelaksanaan ujian.

Struktur aplikasi mengikuti pola **app shell** klasik: sidebar gelap di kiri untuk navigasi modul, top bar untuk konteks (sekolah / tahun ajaran / role) dan aksi akun, lalu area konten terang di kanan. Karena hampir semua data difilter **per kelas & jurusan**, komponen filter dan konteks adalah warga kelas satu, bukan tambahan.

**Karakteristik kunci:**
- Satu warna aksi: `{colors.primary}` (#2563eb) untuk tombol primer, tautan, tab aktif, dan item sidebar aktif. Semantik (hijau/kuning/merah) hanya untuk status.
- App shell: sidebar `{component.sidebar}` (260px, gelap) + top bar `{component.topbar}` (60px, terang) + kanvas `{colors.surface-soft}`.
- Kepadatan data terkontrol: tabel `{component.data-table}` dengan baris 12px, header uppercase kecil, hover halus.
- Filter per kelas & jurusan sebagai pola berulang di hampir setiap modul (`{component.filter-bar}`).
- Angka selalu monospace (`{typography.numeric}`) — nilai, tagihan, token, timer, dan sisa waktu ujian.
- Status berbasis warna + dot untuk peserta CBT: idle, mengerjakan, selesai, terputus, ditandai curang.
- Sudut membulat moderat: `{rounded.md}` (8px) untuk kontrol, `{rounded.lg}` (12px) untuk kartu. Tanpa pill pada tombol.

## Colors

### Brand & Aksi
- **Primary** (`{colors.primary}` — #2563eb): Warna aksi tunggal. Tombol primer, tautan, tab aktif, item sidebar aktif, border fokus input.
- **Primary Hover** (`{colors.primary-hover}` — #1d4ed8) & **Primary Active** (`{colors.primary-active}` — #1e40af): State hover dan press.
- **Primary Disabled** (`{colors.primary-disabled}` — #93c5fd): Biru pudar untuk tombol nonaktif.
- **Primary Soft** (`{colors.primary-soft}` — #eff6ff) & **Primary Border** (`{colors.primary-border}` — #bfdbfe): Latar & garis lembut untuk role pill, token display, highlight baris terpilih.

### Surface & Kanvas
- **Canvas** (`{colors.canvas}` — #ffffff): Latar kartu, tabel, form, modal.
- **Surface Soft** (`{colors.surface-soft}` — #f8fafc): Latar area konten utama (di belakang kartu) dan header tabel.
- **Surface Strong** (`{colors.surface-strong}` — #f1f5f9): Fill context switcher, badge netral, tombol sekunder pada state hover.
- **Sidebar** (`{colors.sidebar}` — #0f172a) & **Sidebar Elevated** (`{colors.sidebar-elevated}` — #1e293b): Latar navigasi gelap dan grup/hover di dalamnya.

### Hairline
- **Hairline** (`{colors.hairline}` — #e2e8f0): Border default kartu, tabel, input.
- **Hairline Soft** (`{colors.hairline-soft}` — #f1f5f9): Pemisah antar-baris tabel.

### Teks
- **Ink** (`{colors.ink}` — #0f172a): Judul halaman, angka besar, teks penekanan.
- **Body** (`{colors.body}` — #334155): Teks berjalan default.
- **Muted** (`{colors.muted}` — #64748b): Sub-judul, breadcrumb, header tabel, placeholder.
- **Muted Soft** (`{colors.muted-soft}` — #94a3b8): Teks nonaktif, hint sekunder.

### Semantik (status, bukan aksi)
- **Success** (`{colors.success}` — #16a34a) / **soft** #dcfce7: Lunas, hadir, ujian selesai, terkirim.
- **Warning** (`{colors.warning}` — #d97706) / **soft** #fef3c7: Cicilan/menunggu, terlambat, peserta terputus.
- **Danger** (`{colors.danger}` — #dc2626) / **soft** #fee2e2: Menunggak, alpa, pelanggaran, ditandai curang, aksi destruktif.
- **Info** (`{colors.info}` — #0284c7) / **soft** #e0f2fe: Pengumuman, catatan netral, banner informasi.

### Status Peserta CBT
Dipakai pada dot status dan badge di dashboard monitoring proktor:
- **Idle** (`{colors.status-idle}` — #64748b): Belum mulai.
- **Active** (`{colors.status-active}` — #2563eb): Sedang mengerjakan.
- **Done** (`{colors.status-done}` — #16a34a): Selesai/submit.
- **Disconnected** (`{colors.status-disconnected}` — #d97706): Terputus (semi-online, sedang resync).
- **Flagged** (`{colors.status-flagged}` — #dc2626): Ditandai curang / pelanggaran terdeteksi.

## Typography

### Font Family
UI memakai **Inter** untuk seluruh teks antarmuka, dengan fallback `-apple-system, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`. Nilai numerik memakai **JetBrains Mono** (atau Geist Mono) agar digit rata dan mudah dibandingkan dalam kolom — cocok untuk nilai, tagihan, token, dan timer.

Keduanya font gratis/open-source, jadi bisa langsung dipaketkan dan tidak perlu substitusi berlisensi.

### Hierarki

| Token | Size | Weight | Line Height | Penggunaan |
|---|---|---|---|---|
| `{typography.page-title}` | 24px | 600 | 1.25 | Judul halaman/modul |
| `{typography.section-title}` | 18px | 600 | 1.33 | Judul bagian dalam halaman |
| `{typography.card-title}` | 15px | 600 | 1.4 | Judul kartu, header panel |
| `{typography.body-md}` | 14px | 400 | 1.5 | Teks default, isi input |
| `{typography.body-strong}` | 14px | 600 | 1.5 | Penekanan, label tab |
| `{typography.body-sm}` | 13px | 400 | 1.5 | Isi tabel, teks sekunder |
| `{typography.caption}` | 12px | 400 | 1.4 | Badge, hint, metadata |
| `{typography.label}` | 13px | 500 | 1.4 | Label field form |
| `{typography.overline}` | 11px | 600 | 1.3 | Label grup sidebar (uppercase) |
| `{typography.table-header}` | 12px | 600 | 1.3 | Header kolom tabel (uppercase) |
| `{typography.numeric}` | 14px | 500 | 1.4 | Nilai, tagihan, angka dalam tabel — monospace |
| `{typography.numeric-lg}` | 28px | 600 | 1.15 | Angka besar pada stat card — monospace |
| `{typography.timer}` | 20px | 600 | 1.2 | Sisa waktu ujian, token — monospace |
| `{typography.button}` | 14px | 500 | 1.2 | Label tombol |

### Prinsip
- **Ukuran UI kompak.** Base body 14px, tabel 13px — aplikasi kerja padat, bukan halaman marketing.
- **Weight moderat.** 400 untuk teks, 500 untuk label/tombol, 600 untuk judul & penekanan. Hindari 700+ kecuali angka besar.
- **Monospace untuk semua angka yang dibandingkan.** Nilai, uang, token, sisa waktu — agar kolom digit sejajar dan mudah dibaca.
- **Uppercase hanya untuk overline & header tabel** dengan letter-spacing positif kecil; sisanya sentence case.

## Layout

### Sistem Spacing
- **Base unit:** 4px.
- **Token:** `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.base}` 16px · `{spacing.md}` 20px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.xxl}` 48px.
- **Padding kartu:** `{spacing.lg}` (24px). **Padding sel tabel:** 12px × 16px. **Gap antar kartu:** `{spacing.lg}` (24px).
- **Padding area konten:** `{spacing.xl}` (32px) di desktop, turun ke `{spacing.base}` (16px) di mobile.

### App Shell
Tiga zona tetap:
1. **Sidebar** (`{component.sidebar}`) — kolom gelap 260px di kiri, fixed, dengan navigasi modul berkelompok. Bisa di-collapse ke rail ikon 64px.
2. **Top bar** (`{component.topbar}`) — batang 60px terang di atas area konten. Berisi tombol collapse sidebar, breadcrumb, context switcher (sekolah / tahun ajaran), pencarian global, lonceng notifikasi, dan menu akun + role pill.
3. **Area konten** — kanvas `{colors.surface-soft}`, scrollable, berisi page header lalu kartu/tabel/form.

### Grid & Container
- **Konten:** lebar penuh area (tanpa cap sempit) — ini aplikasi kerja, ruang layar dimanfaatkan penuh.
- **Grid stat card dashboard:** 4-up di desktop, 2-up di tablet, 1-up di mobile.
- **Form:** 2 kolom di desktop untuk field pendek, 1 kolom di mobile. Field lebar penuh (alamat, deskripsi) selalu 1 kolom.
- **Detail + samping:** pola 2/3 konten + 1/3 panel samping (mis. detail siswa + ringkasan) yang menumpuk vertikal di mobile.

### Filosofi Kepadatan
Padat tapi bernapas. Baris tabel 12px vertikal, hairline lembut antar-baris, tanpa border vertikal berat. Whitespace dipakai untuk **mengelompokkan**, bukan menghias — filter dipisahkan dari tabel, aksi dikumpulkan di kanan header. Kepadatan tinggi wajar di sini karena pengguna adalah staf yang mengelola ratusan baris siswa/nilai/tagihan setiap hari.

## Elevation & Depth

| Level | Perlakuan | Penggunaan |
|---|---|---|
| Flat + border | `1px {colors.hairline}`, tanpa shadow | Kartu, tabel, input — mayoritas permukaan |
| Shadow-sm | `0 1px 2px rgba(15,23,42,0.05)` | Stat card, dropdown |
| Shadow-md | `0 4px 12px rgba(15,23,42,0.08)` | Popover, menu, drawer |
| Shadow-lg | `0 12px 32px rgba(15,23,42,0.16)` | Modal di atas overlay |

Depth dibangun dari **border + shadow tipis**, bukan gradien atau bayangan tebal. Overlay modal memakai `rgba(15,23,42,0.5)`. Sidebar gelap memberi kontras struktural terhadap konten terang tanpa perlu shadow.

## Shapes

### Skala Border Radius

| Token | Value | Penggunaan |
|---|---|---|
| `{rounded.none}` | 0px | Tepi tabel yang menempel kontainer |
| `{rounded.xs}` | 4px | Checkbox, tag mungil, status dot squircle |
| `{rounded.sm}` | 6px | Input dalam grup padat, badge kecil |
| `{rounded.md}` | 8px | Tombol, input, select, item sidebar, chip filter |
| `{rounded.lg}` | 12px | Kartu, panel, tabel, filter bar |
| `{rounded.xl}` | 16px | Modal, drawer, login card |
| `{rounded.full}` | 9999px | Badge status, role pill, avatar, status dot |

Kontrol interaktif memakai `{rounded.md}` (8px), kontainer `{rounded.lg}` (12px). **Tombol sengaja tidak pill** — sudut moderat menegaskan nada aplikasi kerja/pemerintahan, bukan produk konsumer.

## Components

### Navigasi

**`sidebar`** — Kolom navigasi gelap 260px, latar `{colors.sidebar}`, fixed di kiri. Berisi logo/nama sekolah di atas, lalu item modul yang dikelompokkan (Master Data, Kurikulum, Penilaian, Kesiswaan, BK, Absensi, Guru Piket, BKK, LMS, Keuangan, CBT, Sistem). **Item yang tampil difilter oleh RBAC** — setiap role hanya melihat modul yang boleh diaksesnya. Bisa collapse ke rail ikon 64px.

**`sidebar-item`** / **`sidebar-item-active`** — Baris navigasi, ikon + label, rounded `{rounded.md}`. Default teks `{colors.on-sidebar-muted}`; hover naik ke `{colors.sidebar-elevated}`; aktif memakai fill `{colors.sidebar-active}` dengan teks putih.

**`sidebar-group-label`** — Label grup modul, `{typography.overline}` uppercase, `{colors.on-sidebar-muted}`.

**`topbar`** — Batang atas 60px, latar `{colors.canvas}`, border bawah hairline. Kiri: toggle sidebar + breadcrumb. Kanan: context switcher, pencarian, notifikasi, menu akun + role pill.

**`context-switcher`** — Pil kecil `{colors.surface-strong}` untuk memilih **tahun ajaran** (dan sekolah aktif bagi super-admin multi-tenant). Konteks ini memengaruhi seluruh data yang ditampilkan.

**`breadcrumb`** — Jejak lokasi, `{typography.body-sm}` `{colors.muted}`, pemisah "/". Segmen terakhir tanpa tautan.

### Header & Kartu

**`page-header`** — Judul halaman `{typography.page-title}` di kiri, tombol aksi utama (mis. "Tambah Siswa") di kanan, breadcrumb di atasnya.

**`card`** — Kontainer dasar, latar `{colors.canvas}`, border hairline, rounded `{rounded.lg}`, padding 24px. Dipakai untuk panel form, ringkasan, dan pembungkus tabel.

**`stat-card`** — Kartu metrik dashboard: label overline di atas, angka besar `{typography.numeric-lg}`, dan delta/subteks opsional. Contoh: "Total Siswa", "Tagihan Belum Lunas", "Kehadiran Hari Ini". Grid 4-up.

### Tombol

**`button-primary`** — Aksi utama. Latar `{colors.primary}`, teks putih, rounded `{rounded.md}`, tinggi 38px. Hover ke `{colors.primary-hover}`, disabled `{colors.primary-disabled}`.

**`button-secondary`** — Aksi sekunder. Latar putih, border hairline, teks `{colors.body}`. Hover fill `{colors.surface-soft}`.

**`button-danger`** — Aksi destruktif (hapus, reset login peserta, tutup sesi). Latar `{colors.danger}`. Selalu diikuti konfirmasi via `{component.modal}`.

**`button-ghost`** — Aksi ringan/tautan aksi. Transparan, teks `{colors.primary}`.

**`button-icon`** — Tombol ikon 36px untuk aksi baris tabel (edit, hapus, lihat) dan toolbar.

### Form

**`text-input`** / **`select-input`** — Field standar tinggi 38px, border hairline, rounded `{rounded.md}`. Fokus: border 2px `{colors.primary}`. Error: border `{colors.danger}`.

**`field-label`** — Label field `{typography.label}`; tanda wajib "*" `{colors.danger}`.

**`field-error`** — Pesan validasi `{typography.caption}` `{colors.danger}` di bawah field. Sumber pesan mengikuti validasi type-safe Elysia di server.

**`filter-bar`** — Baris filter di atas tabel: **Tingkatan / Kelas / Jurusan / Tahun Ajaran**, plus pencarian dan tombol filter. Ini pola paling berulang — hampir setiap modul difilter per kelas & jurusan (lihat PRD §5).

### Tabel & Data

**`data-table`** — Tabel data utama dibungkus kartu, rounded `{rounded.lg}`. Header `{component.table-header-cell}` (latar `{colors.surface-soft}`, teks uppercase kecil). Baris `{component.table-row}` tinggi ~44px dengan pemisah hairline-soft; hover `{colors.surface-soft}`. Kolom angka rata kanan dengan `{typography.numeric}`. Baris terpilih diberi latar `{colors.primary-soft}`. Kolom aksi memakai `{component.button-icon}`.

**`pagination`** — Kontrol bawah tabel: info "1–20 dari 340", pilih ukuran halaman, tombol prev/next. `{typography.body-sm}`.

**`tabs`** / **`tab-active`** — Navigasi dalam halaman (mis. detail siswa: Profil / Nilai / Absensi / Pelanggaran / Tagihan). Tab aktif garis bawah 2px `{colors.primary}`.

**`empty-state`** — Kondisi data kosong: ikon, kalimat ringkas, dan (bila relevan) tombol aksi. Padding 48px, teks `{colors.muted}`.

### Badge, Status & Role

**`badge-neutral` / `-success` / `-warning` / `-danger` / `-info`** — Pil status kecil rounded `{rounded.full}` dengan latar soft + teks semantik. Pemetaan: Lunas/Hadir/Selesai → success; Cicilan/Terlambat/Menunggu → warning; Menunggak/Alpa/Pelanggaran → danger; Pengumuman/Info → info.

**`status-dot`** — Titik 8px berwarna untuk status peserta CBT dan indikator ringkas dalam tabel, memakai palet status (idle/active/done/disconnected/flagged).

**`role-pill`** — Menandai peran pengguna (Guru, Wali Kelas, Proktor, dll.), latar `{colors.primary-soft}`, border `{colors.primary-border}`. Muncul di menu akun dan daftar Manajemen User.

### Overlay & Notifikasi

**`modal`** — Dialog terpusat di atas `{component.modal-overlay}`, rounded `{rounded.xl}`, maks 520px. Untuk form ringkas dan **konfirmasi aksi destruktif**.

**`drawer`** — Panel geser dari kanan 420px untuk detail/quick-edit tanpa pindah halaman (mis. detail peserta CBT dari dashboard monitoring).

**`toast`** — Notifikasi sesaat pojok layar, latar `{colors.ink}`. Sukses/gagal aksi (simpan, kirim WhatsApp, sinkronisasi).

**`alert-info` / `alert-danger`** — Banner inline dalam halaman untuk konteks penting (mis. "Tahun ajaran ini sudah dikunci", "Koneksi RFID reader terputus").

### Permukaan CBT (Proktor & Pengawas — Web)

> Catatan: peserta ujian **tidak** memakai web. Web CBT hanya untuk proktor & pengawas (monitoring & kontrol sesi) — lihat PRD §5.11. Antarmuka peserta ada di PRD-android.md dan PRD-ios.md.

**`cbt-monitor-tile`** — Kartu ringkas per peserta di grid monitoring: nama + nomor, status-dot berwarna, badge status, progres (mis. "24/40"), dan sisa waktu monospace. Grid rapat agar satu ruang/sesi terlihat sekaligus. Tile `flagged` diberi border `{colors.danger}`.

**`cbt-token-display`** — Tampilan token/kata sandi sesi yang dirilis proktor, `{typography.timer}` monospace besar di atas `{colors.primary-soft}`, dengan tombol rilis ulang.

**`exam-timer`** — Penghitung mundur sesi, latar `{colors.ink}`, monospace. Berubah ke `{colors.danger}` saat mendekati habis.

Aksi proktor (reset login, buka/tutup akses, perpanjang waktu, hentikan/lanjutkan) memakai `{component.button-secondary}`/`{component.button-danger}` dan selalu dikonfirmasi via modal.

### Autentikasi

**`login-card`** — Kartu login terpusat di kanvas `{colors.surface-soft}`, rounded `{rounded.xl}`, maks 400px. Logo/nama sekolah, field identitas + password, tombol primer lebar penuh. Satu-satunya layar publik; sisanya di balik autentikasi.

## Do's and Don'ts

### Do
- Gunakan pola **app shell** (sidebar gelap + top bar terang + kanvas soft) sebagai kerangka setiap halaman terautentikasi.
- Tampilkan item sidebar & aksi **sesuai RBAC** — sembunyikan, jangan hanya nonaktifkan, modul yang tak boleh diakses role tersebut.
- Sediakan `{component.filter-bar}` kelas & jurusan di setiap modul yang datanya per kelas & jurusan (lihat penanda di PRD §5).
- Render semua angka (nilai, tagihan, token, sisa waktu) dengan `{typography.numeric}` monospace.
- Pakai badge semantik + status-dot yang konsisten untuk status (lunas/menunggak, hadir/alpa, status peserta CBT).
- Konfirmasi setiap aksi destruktif (hapus, reset login peserta, tutup sesi) lewat `{component.modal}`.
- Jaga `{colors.primary}` tetap satu-satunya warna aksi.

### Don't
- Jangan mendesain layar peserta ujian di web — peserta hanya via aplikasi mobile (kiosk mode). Web CBT khusus proktor & pengawas.
- Jangan pakai hijau/kuning/merah sebagai warna aksi tombol; itu khusus semantik status.
- Jangan gunakan tombol pill (`{rounded.full}`) — kontrol memakai `{rounded.md}` (8px).
- Jangan bikin tabel terlalu renggang; ini alat kerja padat, bukan halaman marketing.
- Jangan tambah warna brand kedua atau gradien tebal; depth cukup dari border + shadow tipis.
- Jangan tampilkan angka penting (nilai/uang) dengan font proporsional — kolom digit harus sejajar.
- Jangan andalkan warna saja untuk status — sertakan label/badge teks (aksesibilitas).

## Responsive Behavior

Antarmuka wajib **responsif desktop dan mobile** (PRD §8). Fokus utama tetap desktop (staf sekolah bekerja di layar besar), tapi Siswa dan Orang Tua kerap membuka via ponsel untuk melihat nilai, absensi, tagihan, dan pengumuman.

### Breakpoints (selaras default Tailwind)

| Nama | Lebar | Perubahan Kunci |
|---|---|---|
| Mobile | < 640px (`sm`) | Sidebar jadi drawer overlay (hamburger); stat card 1-up; tabel jadi scroll horizontal atau daftar kartu; form 1 kolom; top bar meringkas ke logo + hamburger + akun. |
| Tablet | 640–1024px (`md`/`lg`) | Sidebar collapse ke rail ikon 64px; stat card 2-up; form 2 kolom; tabel tetap tapi kolom sekunder bisa disembunyikan. |
| Desktop | 1024–1280px (`xl`) | Sidebar penuh 260px; stat card 4-up; layout penuh. |
| Wide | > 1280px (`2xl`) | Konten lebar penuh; kolom tabel lega; monitoring CBT menampilkan lebih banyak tile per baris. |

### Touch Targets
- Tombol tinggi 38px + area klik padded → efektif ≥ 44px di sentuh.
- Item sidebar dan baris tabel di mobile diberi tinggi ≥ 44px.
- Tombol ikon aksi baris minimal 36px; di mobile dipindah ke menu "⋯" agar tak sempit.

### Strategi Collapsing
- **Sidebar:** penuh → rail ikon → drawer overlay seiring layar mengecil.
- **Tabel padat:** di mobile, tabel besar (daftar siswa, leger nilai, tagihan) beralih ke **daftar kartu** — satu baris jadi satu kartu ringkas dengan field berlabel — atau scroll horizontal untuk data yang harus tetap tabular.
- **Filter bar:** kolaps ke tombol "Filter" yang membuka `{component.drawer}` berisi kontrol kelas & jurusan di mobile.
- **Dashboard CBT:** grid tile turun dari banyak kolom ke 1–2 kolom; kontrol proktor pindah ke drawer detail peserta.
- **Form:** 2 kolom → 1 kolom; tombol aksi jadi lebar penuh di bawah.

## Iteration Guide

1. Fokus satu komponen/halaman per iterasi. Rujuk key YAML langsung, jangan tulis hex inline.
2. Kontrol baru default `{rounded.md}`; kontainer baru default `{rounded.lg}`; badge/pill status `{rounded.full}`.
3. Varian tombol/badge hidup sebagai entri terpisah di blok `components:`.
4. Setiap modul data mengikuti pola: `page-header` → `filter-bar` (kelas & jurusan) → `data-table` → `pagination`, dengan create/edit via `modal` atau halaman form.
5. Warna aksi tetap `{colors.primary}`; semantik hanya untuk status.
6. Tetapkan visibilitas per elemen berdasarkan RBAC sejak desain, bukan belakangan.
7. Angka selalu monospace; status selalu badge + dot berlabel.

## Known Gaps

- **Antarmuka peserta CBT (kiosk mode) tidak dicakup di sini** — ada di PRD-android.md (Lock Task Mode / Screen Pinning) dan PRD-ios.md (Guided Access / Automatic Assessment Configuration). Dokumen ini hanya web (staf, guru, proktor, pengawas, siswa/ortu untuk monitoring).
- **Dark mode** belum didefinisikan; token disusun agar bisa ditambah (kanvas/ink dapat dibalik) namun palet gelap penuh di luar cakupan v1.
- **Timing animasi & micro-interaction** belum dirinci; default transisi Tailwind (~150ms) dianggap cukup.
- **Ilustrasi & empty-state art** belum ada; empty-state saat ini berbasis ikon + teks.
- **Aksesibilitas** menargetkan WCAG AA (kontras, target sentuh, label non-warna); validasi penuh perlu pengujian dengan teknologi bantu dan tinjauan ahli.
- **Branding / white-label per sekolah didukung.** Karena web di-deploy per sekolah (PRD §6.1), identitas visual — nama sekolah, logo, favicon, judul aplikasi, footer, dan **warna utama** — bersumber dari konfigurasi di database, bukan hardcode. Implementasikan `{colors.primary}` (beserta hover/active/soft/border turunannya) sebagai **CSS custom property** (mis. `--color-primary`) yang di-inject dari pengaturan branding saat aplikasi dimuat, sehingga rebranding tidak menyentuh kode. Token lain (netral slate, semantik status) tetap konstan untuk menjaga konsistensi & keterbacaan.
- **Font** Inter + JetBrains Mono keduanya open-source, jadi tidak ada substitusi berlisensi seperti pada dokumen sebelumnya.




