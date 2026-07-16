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
	subjectHandler := handler.NewSubjectHandler(db)
	classSubjectHandler := handler.NewClassSubjectHandler(db)
	lessonScheduleHandler := handler.NewLessonScheduleHandler(db)
	academicCalendarHandler := handler.NewAcademicCalendarHandler(db)
	attendanceSettingHandler := handler.NewAttendanceSettingHandler(db)
	rfidCardHandler := handler.NewRfidCardHandler(db)
	teacherAttendanceHandler := handler.NewTeacherAttendanceHandler(db)
	studentAttendanceHandler := handler.NewStudentAttendanceHandler(db)
	rfidTapHandler := handler.NewRfidTapHandler(db)
	assessmentHandler := handler.NewAssessmentHandler(db)
	assessmentScoreHandler := handler.NewAssessmentScoreHandler(db)
	reportCardHandler := handler.NewReportCardHandler(db)
	admissionHandler := handler.NewAdmissionHandler(db)
	studentCoachingHandler := handler.NewStudentCoachingHandler(db)
	talentDevelopmentHandler := handler.NewTalentDevelopmentHandler(db)
	studentActivityHandler := handler.NewStudentActivityHandler(db)
	violationTypeHandler := handler.NewViolationTypeHandler(db)
	counselingAgendaHandler := handler.NewCounselingAgendaHandler(db)
	violationRecordHandler := handler.NewViolationRecordHandler(db)
	counselingSessionHandler := handler.NewCounselingSessionHandler(db)
	homeVisitHandler := handler.NewHomeVisitHandler(db)
	achievementHandler := handler.NewAchievementHandler(db)
	alumniHandler := handler.NewAlumniHandler(db)
	studentBookHandler := handler.NewStudentBookHandler(db)

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

			registerCurriculumCRUD(auth, "/subjects", subjectHandler.List, subjectHandler.Create, subjectHandler.Update, subjectHandler.Delete)
			registerCurriculumCRUD(auth, "/class-subjects", classSubjectHandler.List, classSubjectHandler.Create, classSubjectHandler.Update, classSubjectHandler.Delete)
			registerCurriculumCRUD(auth, "/lesson-schedules", lessonScheduleHandler.List, lessonScheduleHandler.Create, lessonScheduleHandler.Update, lessonScheduleHandler.Delete)
			registerCurriculumCRUD(auth, "/academic-calendar", academicCalendarHandler.List, academicCalendarHandler.Create, academicCalendarHandler.Update, academicCalendarHandler.Delete)

			// Absensi.
			readAtt := middleware.RequirePermission("attendance.read")
			writeAtt := middleware.RequirePermission("attendance.create")
			manageAtt := middleware.RequirePermission("attendance.manage")

			auth.GET("/attendance/setting", readAtt, attendanceSettingHandler.Get)
			auth.PUT("/attendance/setting", manageAtt, attendanceSettingHandler.Save)

			auth.GET("/attendance/rfid-cards", manageAtt, rfidCardHandler.List)
			auth.POST("/attendance/rfid-cards", manageAtt, rfidCardHandler.Create)
			auth.DELETE("/attendance/rfid-cards/:id", manageAtt, rfidCardHandler.Delete)
			auth.POST("/attendance/rfid-tap", writeAtt, rfidTapHandler.Tap)

			auth.GET("/attendance/teachers", readAtt, teacherAttendanceHandler.List)
			auth.POST("/attendance/teachers", writeAtt, teacherAttendanceHandler.Mark)
			auth.POST("/attendance/teachers/:id/checkout", writeAtt, teacherAttendanceHandler.Checkout)

			auth.GET("/attendance/students/roster", readAtt, studentAttendanceHandler.Roster)
			auth.POST("/attendance/students", writeAtt, studentAttendanceHandler.SaveBulk)
			auth.GET("/attendance/students/report", readAtt, studentAttendanceHandler.Report)

			// Penilaian dan e-Raport.
			readGrade := middleware.RequirePermission("grading.read")
			writeGrade := middleware.RequirePermission("grading.create")

			auth.GET("/assessments", readGrade, assessmentHandler.List)
			auth.POST("/assessments", writeGrade, assessmentHandler.Create)
			auth.PUT("/assessments/:id", writeGrade, assessmentHandler.Update)
			auth.DELETE("/assessments/:id", writeGrade, assessmentHandler.Delete)
			auth.GET("/assessments/:id/scores", readGrade, assessmentScoreHandler.Roster)
			auth.POST("/assessments/:id/scores", writeGrade, assessmentScoreHandler.SaveBulk)

			auth.POST("/report-cards", writeGrade, reportCardHandler.Save)
			auth.GET("/report-cards/leger", readGrade, reportCardHandler.Leger)
			auth.GET("/report-cards/student", readGrade, reportCardHandler.ReportCard)

			// Kesiswaan.
			registerKesiswaanCRUD(auth, "/admissions", admissionHandler.List, admissionHandler.Create, admissionHandler.Update, admissionHandler.Delete)
			registerKesiswaanCRUD(auth, "/student-coaching", studentCoachingHandler.List, studentCoachingHandler.Create, studentCoachingHandler.Update, studentCoachingHandler.Delete)
			registerKesiswaanCRUD(auth, "/talent-development", talentDevelopmentHandler.List, talentDevelopmentHandler.Create, talentDevelopmentHandler.Update, talentDevelopmentHandler.Delete)
			registerKesiswaanCRUD(auth, "/student-activities", studentActivityHandler.List, studentActivityHandler.Create, studentActivityHandler.Update, studentActivityHandler.Delete)

			// Bimbingan Konseling.
			registerBkCRUD(auth, "/violation-types", violationTypeHandler.List, violationTypeHandler.Create, violationTypeHandler.Update, violationTypeHandler.Delete)
			registerBkCRUD(auth, "/counseling-agenda", counselingAgendaHandler.List, counselingAgendaHandler.Create, counselingAgendaHandler.Update, counselingAgendaHandler.Delete)
			registerBkCRUD(auth, "/violation-records", violationRecordHandler.List, violationRecordHandler.Create, violationRecordHandler.Update, violationRecordHandler.Delete)
			registerBkCRUD(auth, "/counseling-sessions", counselingSessionHandler.List, counselingSessionHandler.Create, counselingSessionHandler.Update, counselingSessionHandler.Delete)
			registerBkCRUD(auth, "/home-visits", homeVisitHandler.List, homeVisitHandler.Create, homeVisitHandler.Update, homeVisitHandler.Delete)
			registerBkCRUD(auth, "/achievements", achievementHandler.List, achievementHandler.Create, achievementHandler.Update, achievementHandler.Delete)
			registerBkCRUD(auth, "/alumni", alumniHandler.List, alumniHandler.Create, alumniHandler.Update, alumniHandler.Delete)

			auth.PUT("/violation-records/:id/follow-up", middleware.RequirePermission("bk.update"), violationRecordHandler.FollowUp)
			auth.GET("/student-book", middleware.RequirePermission("bk.read"), studentBookHandler.Book)
		}
	}

	return r
}

// registerCurriculumCRUD mendaftarkan route CRUD untuk entitas kurikulum,
// dengan permission curriculum.read untuk baca dan curriculum.create/update/delete untuk tulis.
func registerCurriculumCRUD(g *gin.RouterGroup, path string, list, create, update, del gin.HandlerFunc) {
	g.GET(path, middleware.RequirePermission("curriculum.read"), list)
	g.POST(path, middleware.RequirePermission("curriculum.create"), create)
	g.PUT(path+"/:id", middleware.RequirePermission("curriculum.update"), update)
	g.DELETE(path+"/:id", middleware.RequirePermission("curriculum.delete"), del)
}

// registerMasterCRUD mendaftarkan route CRUD standar untuk entitas master data,
// dengan permission master.read untuk baca dan master.create/update/delete untuk tulis.
func registerMasterCRUD(g *gin.RouterGroup, path string, list, create, update, del gin.HandlerFunc) {
	g.GET(path, middleware.RequirePermission("master.read"), list)
	g.POST(path, middleware.RequirePermission("master.create"), create)
	g.PUT(path+"/:id", middleware.RequirePermission("master.update"), update)
	g.DELETE(path+"/:id", middleware.RequirePermission("master.delete"), del)
}

// registerKesiswaanCRUD mendaftarkan route CRUD untuk entitas kesiswaan,
// dengan permission kesiswaan.read untuk baca dan kesiswaan.create/update/delete untuk tulis.
func registerKesiswaanCRUD(g *gin.RouterGroup, path string, list, create, update, del gin.HandlerFunc) {
	g.GET(path, middleware.RequirePermission("kesiswaan.read"), list)
	g.POST(path, middleware.RequirePermission("kesiswaan.create"), create)
	g.PUT(path+"/:id", middleware.RequirePermission("kesiswaan.update"), update)
	g.DELETE(path+"/:id", middleware.RequirePermission("kesiswaan.delete"), del)
}

// registerBkCRUD mendaftarkan route CRUD untuk entitas bimbingan konseling,
// dengan permission bk.read untuk baca dan bk.create/update/delete untuk tulis.
func registerBkCRUD(g *gin.RouterGroup, path string, list, create, update, del gin.HandlerFunc) {
	g.GET(path, middleware.RequirePermission("bk.read"), list)
	g.POST(path, middleware.RequirePermission("bk.create"), create)
	g.PUT(path+"/:id", middleware.RequirePermission("bk.update"), update)
	g.DELETE(path+"/:id", middleware.RequirePermission("bk.delete"), del)
}
