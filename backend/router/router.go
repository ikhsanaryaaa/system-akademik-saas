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

	r.Static("/uploads", cfg.UploadDir)

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
	uploadHandler := handler.NewUploadHandler(cfg.UploadDir)
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
	dutyScheduleHandler := handler.NewDutyScheduleHandler(db)
	dutyLogHandler := handler.NewDutyLogHandler(db)
	guestBookHandler := handler.NewGuestBookHandler(db)
	dailyViolationHandler := handler.NewDailyViolationHandler(db)
	latenessHandler := handler.NewLatenessHandler(db)
	leavePermitHandler := handler.NewLeavePermitHandler(db)
	internshipPlaceHandler := handler.NewInternshipPlaceHandler(db)
	internshipHandler := handler.NewInternshipHandler(db)
	jobVacancyHandler := handler.NewJobVacancyHandler(db)
	materialHandler := handler.NewMaterialHandler(db)
	assignmentHandler := handler.NewAssignmentHandler(db)
	quizHandler := handler.NewQuizHandler(db)
	forumThreadHandler := handler.NewForumThreadHandler(db)
	lmsReportHandler := handler.NewLmsReportHandler(db)
	paymentTypeHandler := handler.NewPaymentTypeHandler(db)
	invoiceHandler := handler.NewInvoiceHandler(db)
	financeReportHandler := handler.NewFinanceReportHandler(db)
	questionHandler := handler.NewQuestionHandler(db)
	examPackageHandler := handler.NewExamPackageHandler(db)
	examScheduleHandler := handler.NewExamScheduleHandler(db)
	examRoomHandler := handler.NewExamRoomHandler(db)
	examParticipantHandler := handler.NewExamParticipantHandler(db)
	examResultHandler := handler.NewExamResultHandler(db)
	auditLogHandler := handler.NewAuditLogHandler(db)

	api := r.Group("/api")
	{
		api.GET("/health", healthHandler.Check)

		// Route auth publik.
		api.POST("/auth/login", authHandler.Login)

		// Route yang butuh autentikasi.
		auth := api.Group("")
		auth.Use(middleware.Auth(jwtManager))
		// AuditWrite mencatat seluruh aksi tulis (create, update, delete) yang
		// berhasil pada route terautentikasi. Login dan logout dicatat terpisah
		// di dalam AuthHandler karena login berada di luar group ini.
		auth.Use(middleware.AuditWrite(db))
		{
			auth.POST("/auth/logout", authHandler.Logout)
			auth.GET("/auth/me", authHandler.Me)
			auth.POST("/auth/change-password", authHandler.ChangePassword)

			auth.GET("/roles", middleware.RequirePermission("role.read"), roleHandler.List)

			auth.GET("/audit-logs", middleware.RequirePermission("audit.read"), auditLogHandler.List)

			auth.GET("/users", middleware.RequirePermission("user.read"), userHandler.List)
			auth.GET("/users/:id", middleware.RequirePermission("user.read"), userHandler.Detail)
			auth.POST("/users", middleware.RequirePermission("user.create"), userHandler.Create)
			auth.PUT("/users/:id", middleware.RequirePermission("user.update"), userHandler.Update)
			auth.DELETE("/users/:id", middleware.RequirePermission("user.delete"), userHandler.Delete)

			auth.POST("/uploads", middleware.RequirePermission("master.create"), uploadHandler.Upload)

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

			// Guru Piket.
			registerPiketCRUD(auth, "/duty-schedules", dutyScheduleHandler.List, dutyScheduleHandler.Create, dutyScheduleHandler.Update, dutyScheduleHandler.Delete)
			registerPiketCRUD(auth, "/duty-logs", dutyLogHandler.List, dutyLogHandler.Create, dutyLogHandler.Update, dutyLogHandler.Delete)
			registerPiketCRUD(auth, "/guest-book", guestBookHandler.List, guestBookHandler.Create, guestBookHandler.Update, guestBookHandler.Delete)
			registerPiketCRUD(auth, "/daily-violations", dailyViolationHandler.List, dailyViolationHandler.Create, dailyViolationHandler.Update, dailyViolationHandler.Delete)
			registerPiketCRUD(auth, "/lateness", latenessHandler.List, latenessHandler.Create, latenessHandler.Update, latenessHandler.Delete)
			registerPiketCRUD(auth, "/leave-permits", leavePermitHandler.List, leavePermitHandler.Create, leavePermitHandler.Update, leavePermitHandler.Delete)

			// Bursa Kerja Khusus.
			registerBkkCRUD(auth, "/internship-places", internshipPlaceHandler.List, internshipPlaceHandler.Create, internshipPlaceHandler.Update, internshipPlaceHandler.Delete)
			registerBkkCRUD(auth, "/internships", internshipHandler.List, internshipHandler.Create, internshipHandler.Update, internshipHandler.Delete)
			registerBkkCRUD(auth, "/job-vacancies", jobVacancyHandler.List, jobVacancyHandler.Create, jobVacancyHandler.Update, jobVacancyHandler.Delete)

			// Learning Management System.
			registerLmsCRUD(auth, "/materials", materialHandler.List, materialHandler.Create, materialHandler.Update, materialHandler.Delete)
			registerLmsCRUD(auth, "/assignments", assignmentHandler.List, assignmentHandler.Create, assignmentHandler.Update, assignmentHandler.Delete)
			registerLmsCRUD(auth, "/quizzes", quizHandler.List, quizHandler.Create, quizHandler.Update, quizHandler.Delete)
			registerLmsCRUD(auth, "/forum-threads", forumThreadHandler.List, forumThreadHandler.Create, forumThreadHandler.Update, forumThreadHandler.Delete)

			readLms := middleware.RequirePermission("lms.read")
			writeLms := middleware.RequirePermission("lms.create")
			manageLms := middleware.RequirePermission("lms.update")
			deleteLms := middleware.RequirePermission("lms.delete")

			auth.GET("/assignments/:id/submissions", readLms, assignmentHandler.Submissions)
			auth.PUT("/assignments/:id/submissions/:submissionId", manageLms, assignmentHandler.GradeSubmission)

			auth.GET("/quizzes/:id/questions", readLms, quizHandler.Questions)
			auth.POST("/quizzes/:id/questions", writeLms, quizHandler.AddQuestion)
			auth.DELETE("/quizzes/:id/questions/:questionId", deleteLms, quizHandler.DeleteQuestion)

			auth.GET("/forum-threads/:id/posts", readLms, forumThreadHandler.Posts)
			auth.POST("/forum-threads/:id/posts", writeLms, forumThreadHandler.AddPost)
			auth.DELETE("/forum-threads/:id/posts/:postId", deleteLms, forumThreadHandler.DeletePost)

			auth.GET("/lms/report", readLms, lmsReportHandler.Report)

			// Keuangan.
			registerFinanceCRUD(auth, "/payment-types", paymentTypeHandler.List, paymentTypeHandler.Create, paymentTypeHandler.Update, paymentTypeHandler.Delete)

			readFin := middleware.RequirePermission("finance.read")
			writeFin := middleware.RequirePermission("finance.create")
			updateFin := middleware.RequirePermission("finance.update")
			deleteFin := middleware.RequirePermission("finance.delete")

			auth.GET("/invoices", readFin, invoiceHandler.List)
			auth.GET("/invoices/:id", readFin, invoiceHandler.Detail)
			auth.POST("/invoices", writeFin, invoiceHandler.Create)
			auth.PUT("/invoices/:id", updateFin, invoiceHandler.Update)
			auth.DELETE("/invoices/:id", deleteFin, invoiceHandler.Delete)
			auth.POST("/invoices/:id/payments", writeFin, invoiceHandler.AddPayment)
			auth.DELETE("/invoices/:id/payments/:paymentId", deleteFin, invoiceHandler.DeletePayment)
			auth.GET("/invoices/:id/message", readFin, invoiceHandler.Message)

			auth.GET("/finance/report", readFin, financeReportHandler.Report)

			// CBT (Computer Based Test) untuk proktor dan pengawas.
			readCbt := middleware.RequirePermission("cbt.read")
			writeCbt := middleware.RequirePermission("cbt.create")
			updateCbt := middleware.RequirePermission("cbt.update")
			deleteCbt := middleware.RequirePermission("cbt.delete")
			monitorCbt := middleware.RequirePermission("cbt.monitor")
			controlCbt := middleware.RequirePermission("cbt.control")

			// Bank soal.
			auth.GET("/questions", readCbt, questionHandler.List)
			auth.POST("/questions", writeCbt, questionHandler.Create)
			auth.PUT("/questions/:id", updateCbt, questionHandler.Update)
			auth.DELETE("/questions/:id", deleteCbt, questionHandler.Delete)

			// Paket ujian.
			auth.GET("/exam-packages", readCbt, examPackageHandler.List)
			auth.POST("/exam-packages", writeCbt, examPackageHandler.Create)
			auth.PUT("/exam-packages/:id", updateCbt, examPackageHandler.Update)
			auth.DELETE("/exam-packages/:id", deleteCbt, examPackageHandler.Delete)
			auth.GET("/exam-packages/:id/items", readCbt, examPackageHandler.Items)
			auth.POST("/exam-packages/:id/items", updateCbt, examPackageHandler.AddItem)
			auth.DELETE("/exam-packages/:id/items/:itemId", updateCbt, examPackageHandler.RemoveItem)

			// Jadwal ujian, ruang, dan pengawas.
			auth.GET("/exam-schedules", readCbt, examScheduleHandler.List)
			auth.GET("/exam-schedules/:id", readCbt, examScheduleHandler.Detail)
			auth.POST("/exam-schedules", writeCbt, examScheduleHandler.Create)
			auth.PUT("/exam-schedules/:id", updateCbt, examScheduleHandler.Update)
			auth.DELETE("/exam-schedules/:id", deleteCbt, examScheduleHandler.Delete)
			auth.POST("/exam-schedules/:id/token", controlCbt, examScheduleHandler.ReleaseToken)

			auth.GET("/exam-schedules/:id/rooms", readCbt, examRoomHandler.List)
			auth.POST("/exam-schedules/:id/rooms", updateCbt, examRoomHandler.Create)
			auth.DELETE("/exam-schedules/:id/rooms/:roomId", updateCbt, examRoomHandler.Delete)

			// Alokasi peserta.
			auth.GET("/exam-schedules/:id/participants", monitorCbt, examParticipantHandler.List)
			auth.POST("/exam-schedules/:id/participants", updateCbt, examParticipantHandler.Allocate)
			auth.DELETE("/exam-schedules/:id/participants/:participantId", updateCbt, examParticipantHandler.Remove)

			// Kontrol sesi dan pelanggaran (proktor dan pengawas).
			auth.POST("/exam-participants/:participantId/control", controlCbt, examParticipantHandler.Control)
			auth.GET("/exam-participants/:participantId/violations", monitorCbt, examParticipantHandler.Violations)
			auth.POST("/exam-participants/:participantId/violations", monitorCbt, examParticipantHandler.AddViolation)
			auth.PUT("/exam-participants/:participantId/score", updateCbt, examParticipantHandler.SetScore)

			// Hasil, laporan, dan integrasi nilai.
			auth.GET("/exam-schedules/:id/report", readCbt, examResultHandler.Report)
			auth.POST("/exam-schedules/:id/push-grading", updateCbt, examResultHandler.PushToGrading)
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

// registerPiketCRUD mendaftarkan route CRUD untuk entitas guru piket,
// dengan permission piket.read untuk baca dan piket.create/update/delete untuk tulis.
func registerPiketCRUD(g *gin.RouterGroup, path string, list, create, update, del gin.HandlerFunc) {
	g.GET(path, middleware.RequirePermission("piket.read"), list)
	g.POST(path, middleware.RequirePermission("piket.create"), create)
	g.PUT(path+"/:id", middleware.RequirePermission("piket.update"), update)
	g.DELETE(path+"/:id", middleware.RequirePermission("piket.delete"), del)
}

// registerBkkCRUD mendaftarkan route CRUD untuk entitas bursa kerja khusus,
// dengan permission bkk.read untuk baca dan bkk.create/update/delete untuk tulis.
func registerBkkCRUD(g *gin.RouterGroup, path string, list, create, update, del gin.HandlerFunc) {
	g.GET(path, middleware.RequirePermission("bkk.read"), list)
	g.POST(path, middleware.RequirePermission("bkk.create"), create)
	g.PUT(path+"/:id", middleware.RequirePermission("bkk.update"), update)
	g.DELETE(path+"/:id", middleware.RequirePermission("bkk.delete"), del)
}

// registerLmsCRUD mendaftarkan route CRUD untuk entitas LMS,
// dengan permission lms.read untuk baca dan lms.create/update/delete untuk tulis.
func registerLmsCRUD(g *gin.RouterGroup, path string, list, create, update, del gin.HandlerFunc) {
	g.GET(path, middleware.RequirePermission("lms.read"), list)
	g.POST(path, middleware.RequirePermission("lms.create"), create)
	g.PUT(path+"/:id", middleware.RequirePermission("lms.update"), update)
	g.DELETE(path+"/:id", middleware.RequirePermission("lms.delete"), del)
}

// registerFinanceCRUD mendaftarkan route CRUD untuk entitas keuangan,
// dengan permission finance.read untuk baca dan finance.create/update/delete untuk tulis.
func registerFinanceCRUD(g *gin.RouterGroup, path string, list, create, update, del gin.HandlerFunc) {
	g.GET(path, middleware.RequirePermission("finance.read"), list)
	g.POST(path, middleware.RequirePermission("finance.create"), create)
	g.PUT(path+"/:id", middleware.RequirePermission("finance.update"), update)
	g.DELETE(path+"/:id", middleware.RequirePermission("finance.delete"), del)
}
