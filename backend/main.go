package main

import (
	"log"
	"os"

	"github.com/ikhsanaryaaa/system-akademik-saas/backend/config"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/database"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/migration"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/router"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/seeder"
)

func main() {
	cfg := config.Load()

	if err := os.MkdirAll(cfg.UploadDir, 0o755); err != nil {
		log.Fatalf("gagal membuat folder upload: %v", err)
	}

	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("koneksi database gagal: %v", err)
	}

	if err := migration.Run(db); err != nil {
		log.Fatalf("migration gagal: %v", err)
	}

	if err := seeder.Run(db); err != nil {
		log.Fatalf("seeder gagal: %v", err)
	}

	r := router.Setup(cfg, db)

	addr := ":" + cfg.AppPort
	log.Printf("server berjalan di %s (mode %s)", addr, cfg.AppMode)
	if err := r.Run(addr); err != nil {
		log.Fatalf("server gagal berjalan: %v", err)
	}
}
