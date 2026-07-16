package migration

import (
	"log"

	"gorm.io/gorm"
)

// models adalah daftar model GORM yang ikut auto-migrate.
// Model bisnis ditambahkan di tahap berikutnya seiring modul dikerjakan.
var models = []interface{}{}

// Run menjalankan auto-migrate untuk seluruh model terdaftar.
func Run(db *gorm.DB) error {
	if len(models) == 0 {
		log.Println("migration: belum ada model terdaftar, dilewati")
		return nil
	}
	return db.AutoMigrate(models...)
}
