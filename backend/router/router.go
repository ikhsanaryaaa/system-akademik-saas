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
	academicYearHandler := handler.NewAcademicYearHandler(db)
	gradeLevelHandler := handler.NewGradeLevelHandler(db)
	majorHandler := handler.NewMajorHandler(db)
	teacherHandler := handler.NewTeacherHandler(db)
	staffHandler := handler.NewStaffHandler(db)
	classHandler := handler.NewClassHandler(db)
	studentHandler := handler.NewStudentHandler(db)

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

			registerMasterCRUD(auth, "/academic-years", academicYearHandler.List, academicYearHandler.Create, academicYearHandler.Update, academicYearHandler.Delete)
			registerMasterCRUD(auth, "/grade-levels", gradeLevelHandler.List, gradeLevelHandler.Create, gradeLevelHandler.Update, gradeLevelHandler.Delete)
			registerMasterCRUD(auth, "/majors", majorHandler.List, majorHandler.Create, majorHandler.Update, majorHandler.Delete)
			registerMasterCRUD(auth, "/teachers", teacherHandler.List, teacherHandler.Create, teacherHandler.Update, teacherHandler.Delete)
			registerMasterCRUD(auth, "/staff", staffHandler.List, staffHandler.Create, staffHandler.Update, staffHandler.Delete)
			registerMasterCRUD(auth, "/classes", classHandler.List, classHandler.Create, classHandler.Update, classHandler.Delete)
			registerMasterCRUD(auth, "/students", studentHandler.List, studentHandler.Create, studentHandler.Update, studentHandler.Delete)
		}
	}

	return r
}

// registerMasterCRUD mendaftarkan route CRUD standar untuk entitas master data,
// dengan permission master.read untuk baca dan master.create/update/delete untuk tulis.
func registerMasterCRUD(g *gin.RouterGroup, path string, list, create, update, del gin.HandlerFunc) {
	g.GET(path, middleware.RequirePermission("master.read"), list)
	g.POST(path, middleware.RequirePermission("master.create"), create)
	g.PUT(path+"/:id", middleware.RequirePermission("master.update"), update)
	g.DELETE(path+"/:id", middleware.RequirePermission("master.delete"), del)
}
