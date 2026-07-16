package migration

import (
	"log"

	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"gorm.io/gorm"
)

// models adalah daftar model GORM yang ikut auto-migrate.
// Model bisnis lain ditambahkan seiring modul dikerjakan di tahap berikutnya.
var models = []interface{}{
	&model.Permission{},
	&model.Role{},
	&model.User{},
}

// Run menjalankan auto-migrate untuk seluruh model terdaftar.
func Run(db *gorm.DB) error {
	if len(models) == 0 {
		log.Println("migration: belum ada model terdaftar, dilewati")
		return nil
	}
	return db.AutoMigrate(models...)
}
