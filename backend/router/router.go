package router

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/config"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/handler"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/middleware"
	"gorm.io/gorm"
)

// Setup membangun engine Gin lengkap dengan middleware dan route.
func Setup(cfg *config.Config, db *gorm.DB) *gin.Engine {
	if cfg.AppMode == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(middleware.ErrorHandler())

	r.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.CORSAllowOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	healthHandler := handler.NewHealthHandler(db)

	api := r.Group("/api")
	{
		api.GET("/health", healthHandler.Check)
	}

	return r
}
