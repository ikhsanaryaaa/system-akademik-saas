package main

import (
	"log"

	"github.com/ikhsanaryaaa/system-akademik-saas/backend/config"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/database"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/migration"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/router"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/seeder"
)

func main() {
	cfg := config.Load()

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
