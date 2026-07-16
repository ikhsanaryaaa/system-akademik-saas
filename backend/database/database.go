package database

import (
	"fmt"
	"time"

	"github.com/ikhsanaryaaa/system-akademik-saas/backend/config"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Connect membuka koneksi PostgreSQL via GORM dan mengatur connection pool.
func Connect(cfg *config.Config) (*gorm.DB, error) {
	logLevel := logger.Silent
	if cfg.AppMode == "debug" {
		logLevel = logger.Info
	}

	db, err := gorm.Open(postgres.Open(cfg.DSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		return nil, fmt.Errorf("gagal membuka koneksi database: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil handle sql.DB: %w", err)
	}

	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetConnMaxLifetime(time.Hour)

	if err := sqlDB.Ping(); err != nil {
		return nil, fmt.Errorf("gagal ping database: %w", err)
	}

	return db, nil
}
