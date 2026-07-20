package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

// Config menampung seluruh konfigurasi aplikasi yang dibaca dari environment.
type Config struct {
	AppPort string
	AppMode string

	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string

	CORSAllowOrigins []string
	UploadDir        string

	JWTSecret   string
	JWTTTLHours int

	BrandingSchoolName   string
	BrandingPrimaryColor string
}

// Load membaca file .env bila ada, lalu memuat nilai dari environment variable.
func Load() *Config {
	// .env opsional; di production nilai diambil dari environment langsung.
	_ = godotenv.Load()

	cfg := &Config{
		AppPort:              getEnv("APP_PORT", "8080"),
		AppMode:              getEnv("APP_MODE", "debug"),
		DBHost:               getEnv("DB_HOST", "localhost"),
		DBPort:               getEnv("DB_PORT", "5432"),
		DBUser:               getEnv("DB_USER", "postgres"),
		DBPassword:           getEnv("DB_PASSWORD", "postgres"),
		DBName:               getEnv("DB_NAME", "sim_sekolah"),
		DBSSLMode:            getEnv("DB_SSLMODE", "disable"),
		CORSAllowOrigins:     splitAndTrim(getEnv("CORS_ALLOW_ORIGINS", "http://localhost:5173")),
		UploadDir:            getEnv("UPLOAD_DIR", "./uploads"),
		JWTSecret:            getEnv("JWT_SECRET", "ubah-secret-ini-di-production"),
		JWTTTLHours:          getEnvInt("JWT_TTL_HOURS", 24),
		BrandingSchoolName:   getEnv("BRANDING_SCHOOL_NAME", "Nama Sekolah"),
		BrandingPrimaryColor: getEnv("BRANDING_PRIMARY_COLOR", "#2563eb"),
	}

	return cfg
}

// DSN membangun connection string PostgreSQL untuk GORM.
func (c *Config) DSN() string {
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		c.DBHost, c.DBPort, c.DBUser, c.DBPassword, c.DBName, c.DBSSLMode,
	)
}

func getEnv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return fallback
}

func splitAndTrim(s string) []string {
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if t := strings.TrimSpace(p); t != "" {
			out = append(out, t)
		}
	}
	return out
}
