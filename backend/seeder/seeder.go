package seeder

import (
	"log"
	"os"

	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/rbac"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/util/password"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// Run menjalankan seeder idempoten: permission, 15 role, dan satu Administrator awal.
func Run(db *gorm.DB) error {
	if err := seedPermissions(db); err != nil {
		return err
	}
	if err := seedRoles(db); err != nil {
		return err
	}
	if err := seedAdministrator(db); err != nil {
		return err
	}
	return nil
}

func seedPermissions(db *gorm.DB) error {
	for _, p := range rbac.Permissions {
		perm := model.Permission{Key: p.Key, Description: p.Description}
		// Idempoten: abaikan bila key sudah ada.
		if err := db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "key"}},
			DoNothing: true,
		}).Create(&perm).Error; err != nil {
			return err
		}
	}
	return nil
}

func seedRoles(db *gorm.DB) error {
	for _, r := range rbac.Roles {
		var role model.Role
		err := db.Where("slug = ?", r.Slug).First(&role).Error
		if err == gorm.ErrRecordNotFound {
			role = model.Role{Name: r.Name, Slug: r.Slug, Description: r.Description}
			if err := db.Create(&role).Error; err != nil {
				return err
			}
		} else if err != nil {
			return err
		}

		// Tetapkan permission per role sesuai kewenangannya.
		var keys []string
		switch r.Slug {
		case "administrator":
			keys = rbac.AdministratorPermissions()
		case "tata-usaha":
			keys = rbac.TataUsahaPermissions()
		case "wakil-kurikulum":
			keys = rbac.WakilKurikulumPermissions()
		case "guru":
			keys = rbac.GuruPermissions()
		case "wali-kelas":
			keys = rbac.WaliKelasPermissions()
		case "wakil-kesiswaan":
			keys = rbac.WakilKesiswaanPermissions()
		case "bimbingan-konseling":
			keys = rbac.BimbinganKonselingPermissions()
		}

		if len(keys) > 0 {
			var perms []model.Permission
			if err := db.Where("key IN ?", keys).Find(&perms).Error; err != nil {
				return err
			}
			if err := db.Model(&role).Association("Permissions").Replace(perms); err != nil {
				return err
			}
		}
	}
	return nil
}

func seedAdministrator(db *gorm.DB) error {
	var count int64
	if err := db.Model(&model.User{}).Where("username = ?", "admin").Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	pass := os.Getenv("SEED_ADMIN_PASSWORD")
	if pass == "" {
		pass = "admin123"
	}
	hash, err := password.Hash(pass)
	if err != nil {
		return err
	}

	var adminRole model.Role
	if err := db.Where("slug = ?", "administrator").First(&adminRole).Error; err != nil {
		return err
	}

	admin := model.User{
		Name:         "Administrator",
		Username:     "admin",
		Email:        "admin@example.com",
		PasswordHash: hash,
		IsActive:     true,
		Roles:        []model.Role{adminRole},
	}
	if err := db.Create(&admin).Error; err != nil {
		return err
	}

	log.Println("seeder: user Administrator awal dibuat (username: admin)")
	return nil
}
