// Package rbac memuat definisi statis 15 role dan permission dasar
// sesuai PRD. Dipakai oleh seeder dan sebagai referensi otorisasi.
package rbac

// RoleDef adalah definisi satu role beserta metadata-nya.
type RoleDef struct {
	Name        string
	Slug        string
	Description string
}

// 15 role sesuai PRD bagian 4.
var Roles = []RoleDef{
	{"Administrator", "administrator", "Kelola seluruh sistem, user, role, dan konfigurasi"},
	{"Kepala Sekolah", "kepala-sekolah", "Monitoring, persetujuan, akses seluruh laporan"},
	{"Wakil Kurikulum", "wakil-kurikulum", "Struktur kurikulum, jadwal, kalender akademik"},
	{"Wakil Kesiswaan", "wakil-kesiswaan", "Penerimaan, pembinaan, dan kegiatan kesiswaan"},
	{"Bendahara", "bendahara", "Jenis pembayaran, tagihan, dan laporan keuangan"},
	{"Tata Usaha", "tata-usaha", "Administrasi data siswa, pendidik, dan surat-menyurat"},
	{"Bimbingan Konseling", "bimbingan-konseling", "Pelanggaran, konseling, tindak lanjut, prestasi, alumni"},
	{"Bursa Kerja Khusus", "bursa-kerja-khusus", "PKL, tempat PKL, lowongan kerja"},
	{"Kepala Program", "kepala-program", "Kelola program atau jurusan yang dipimpin"},
	{"Guru", "guru", "Materi, penilaian, tugas, quiz, absensi kelas"},
	{"Wali Kelas", "wali-kelas", "Perwalian, e-raport, monitoring siswa kelasnya"},
	{"Siswa", "siswa", "Materi, tugas, quiz, absensi, tagihan, raport"},
	{"Orang Tua", "orang-tua", "Monitoring nilai, absensi, tagihan, dan pengumuman anak"},
	{"Proktor CBT", "proktor-cbt", "Kelola sesi, token, buka tutup dan reset peserta"},
	{"Pengawas CBT", "pengawas-cbt", "Monitor jalannya ujian dan kepatuhan peserta"},
}

// PermissionDef adalah definisi satu permission.
type PermissionDef struct {
	Key         string
	Description string
}

// Permission dasar untuk manajemen user. Permission modul lain
// ditambahkan seiring modul dikerjakan di tahap berikutnya.
var Permissions = []PermissionDef{
	{"user.read", "Melihat daftar dan detail user"},
	{"user.create", "Membuat user baru"},
	{"user.update", "Mengubah data user"},
	{"user.delete", "Menghapus user"},
	{"role.read", "Melihat daftar role dan permission"},
}

// Permission yang dimiliki Administrator (seluruh permission dasar).
func AdministratorPermissions() []string {
	keys := make([]string, 0, len(Permissions))
	for _, p := range Permissions {
		keys = append(keys, p.Key)
	}
	return keys
}
