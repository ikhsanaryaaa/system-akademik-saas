package seeder

import (
	"log"

	"gorm.io/gorm"
)

// Run menjalankan seeder data dasar.
// Data seed bisnis (role, admin awal, dan lainnya) ditambahkan di tahap berikutnya.
func Run(db *gorm.DB) error {
	log.Println("seeder: belum ada data seed, dilewati")
	return nil
}
