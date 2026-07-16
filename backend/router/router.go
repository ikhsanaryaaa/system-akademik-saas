package router

import (
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/config"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/handler"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/middleware"
	appjwt "github.com/ikhsanaryaaa/system-akademik-saas/backend/util/jwt"
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

	jwtManager := appjwt.NewManager(cfg.JWTSecret, time.Duration(cfg.JWTTTLHours)*time.Hour)

	healthHandler := handler.NewHealthHandler(db)
	authHandler := handler.NewAuthHandler(db, jwtManager)
	userHandler := handler.NewUserHandler(db)
	roleHandler := handler.NewRoleHandler(db)

	api := r.Group("/api")
	{
		api.GET("/health", healthHandler.Check)

		// Route auth publik.
		api.POST("/auth/login", authHandler.Login)

		// Route yang butuh autentikasi.
		auth := api.Group("")
		auth.Use(middleware.Auth(jwtManager))
		{
			auth.POST("/auth/logout", authHandler.Logout)
			auth.GET("/auth/me", authHandler.Me)
			auth.POST("/auth/change-password", authHandler.ChangePassword)

			auth.GET("/roles", middleware.RequirePermission("role.read"), roleHandler.List)

			auth.GET("/users", middleware.RequirePermission("user.read"), userHandler.List)
			auth.GET("/users/:id", middleware.RequirePermission("user.read"), userHandler.Detail)
			auth.POST("/users", middleware.RequirePermission("user.create"), userHandler.Create)
			auth.PUT("/users/:id", middleware.RequirePermission("user.update"), userHandler.Update)
			auth.DELETE("/users/:id", middleware.RequirePermission("user.delete"), userHandler.Delete)
		}
	}

	return r
}
