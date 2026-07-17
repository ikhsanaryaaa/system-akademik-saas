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

// Permission dasar. Permission modul lain ditambahkan seiring modul dikerjakan.
var Permissions = []PermissionDef{
	{"user.read", "Melihat daftar dan detail user"},
	{"user.create", "Membuat user baru"},
	{"user.update", "Mengubah data user"},
	{"user.delete", "Menghapus user"},
	{"role.read", "Melihat daftar role dan permission"},

	{"master.read", "Melihat data master"},
	{"master.create", "Membuat data master"},
	{"master.update", "Mengubah data master"},
	{"master.delete", "Menghapus data master"},

	{"curriculum.read", "Melihat data kurikulum"},
	{"curriculum.create", "Membuat data kurikulum"},
	{"curriculum.update", "Mengubah data kurikulum"},
	{"curriculum.delete", "Menghapus data kurikulum"},

	{"attendance.read", "Melihat data absensi dan laporan"},
	{"attendance.create", "Mencatat dan mengubah absensi"},
	{"attendance.manage", "Mengelola pengaturan jam dan kartu RFID"},

	{"grading.read", "Melihat penilaian, leger, dan raport"},
	{"grading.create", "Mengelola penilaian dan mengisi nilai"},

	{"kesiswaan.read", "Melihat data kesiswaan"},
	{"kesiswaan.create", "Membuat data kesiswaan"},
	{"kesiswaan.update", "Mengubah data kesiswaan"},
	{"kesiswaan.delete", "Menghapus data kesiswaan"},

	{"bk.read", "Melihat data bimbingan konseling"},
	{"bk.create", "Membuat data bimbingan konseling"},
	{"bk.update", "Mengubah data bimbingan konseling"},
	{"bk.delete", "Menghapus data bimbingan konseling"},

	{"piket.read", "Melihat data guru piket"},
	{"piket.create", "Membuat data guru piket"},
	{"piket.update", "Mengubah data guru piket"},
	{"piket.delete", "Menghapus data guru piket"},

	{"bkk.read", "Melihat data bursa kerja khusus"},
	{"bkk.create", "Membuat data bursa kerja khusus"},
	{"bkk.update", "Mengubah data bursa kerja khusus"},
	{"bkk.delete", "Menghapus data bursa kerja khusus"},
}

// masterPermissionKeys mengembalikan seluruh key permission master data.
func masterPermissionKeys() []string {
	return []string{"master.read", "master.create", "master.update", "master.delete"}
}

// AdministratorPermissions mengembalikan seluruh permission (Administrator penuh).
func AdministratorPermissions() []string {
	keys := make([]string, 0, len(Permissions))
	for _, p := range Permissions {
		keys = append(keys, p.Key)
	}
	return keys
}

// TataUsahaPermissions mengembalikan permission untuk role Tata Usaha:
// mengelola data master, melihat user, dan mengelola absensi penuh.
func TataUsahaPermissions() []string {
	keys := append(masterPermissionKeys(), "user.read")
	return append(keys, "attendance.read", "attendance.create", "attendance.manage")
}

// GuruPermissions mengembalikan permission untuk role Guru:
// mencatat absensi, mengelola penilaian, dan membaca data master serta kurikulum.
func GuruPermissions() []string {
	return []string{
		"attendance.read", "attendance.create",
		"grading.read", "grading.create",
		"master.read", "curriculum.read",
		"bk.read",
	}
}

// WaliKelasPermissions sama dengan Guru pada tahap ini, ditambah membaca data BK:
// mencatat absensi kelas, mengelola penilaian, membaca data master, kurikulum, dan BK.
func WaliKelasPermissions() []string {
	return []string{
		"attendance.read", "attendance.create",
		"grading.read", "grading.create",
		"master.read", "curriculum.read",
		"bk.read",
	}
}

// kesiswaanPermissionKeys mengembalikan seluruh key permission kesiswaan.
func kesiswaanPermissionKeys() []string {
	return []string{"kesiswaan.read", "kesiswaan.create", "kesiswaan.update", "kesiswaan.delete"}
}

// bkPermissionKeys mengembalikan seluruh key permission bimbingan konseling.
func bkPermissionKeys() []string {
	return []string{"bk.read", "bk.create", "bk.update", "bk.delete"}
}

// piketPermissionKeys mengembalikan seluruh key permission guru piket.
func piketPermissionKeys() []string {
	return []string{"piket.read", "piket.create", "piket.update", "piket.delete"}
}

// bkkPermissionKeys mengembalikan seluruh key permission bursa kerja khusus.
func bkkPermissionKeys() []string {
	return []string{"bkk.read", "bkk.create", "bkk.update", "bkk.delete"}
}

// WakilKesiswaanPermissions mengembalikan permission untuk role Wakil Kesiswaan:
// mengelola data kesiswaan dan guru piket, ditambah membaca data master sebagai referensi.
func WakilKesiswaanPermissions() []string {
	keys := append(kesiswaanPermissionKeys(), piketPermissionKeys()...)
	return append(keys, "master.read")
}

// BimbinganKonselingPermissions mengembalikan permission untuk role Bimbingan Konseling:
// mengelola data BK ditambah membaca data master sebagai referensi.
func BimbinganKonselingPermissions() []string {
	return append(bkPermissionKeys(), "master.read")
}

// BursaKerjaKhususPermissions mengembalikan permission untuk role Bursa Kerja Khusus:
// mengelola data BKK ditambah membaca data master sebagai referensi.
func BursaKerjaKhususPermissions() []string {
	return append(bkkPermissionKeys(), "master.read")
}

// curriculumPermissionKeys mengembalikan seluruh key permission kurikulum.
func curriculumPermissionKeys() []string {
	return []string{"curriculum.read", "curriculum.create", "curriculum.update", "curriculum.delete"}
}

// WakilKurikulumPermissions mengembalikan permission untuk role Wakil Kurikulum:
// mengelola kurikulum ditambah membaca data master sebagai referensi.
func WakilKurikulumPermissions() []string {
	return append(curriculumPermissionKeys(), "master.read")
}
