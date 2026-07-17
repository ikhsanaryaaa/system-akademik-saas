package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"gorm.io/gorm"
)

// writeMethods adalah method HTTP yang dianggap mengubah data dan perlu dicatat.
var writeMethods = map[string]string{
	"POST":   "create",
	"PUT":    "update",
	"PATCH":  "update",
	"DELETE": "delete",
}

// AuditWrite mencatat setiap aksi tulis (create, update, delete) ke tabel audit
// setelah handler selesai. Hanya request yang berhasil (status < 400) yang dicatat
// agar log tidak dipenuhi percobaan yang gagal validasi atau otorisasi.
// Pencatatan dilakukan best-effort: kegagalan menulis log tidak mengganggu response.
func AuditWrite(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		action, ok := writeMethods[c.Request.Method]
		if !ok {
			c.Next()
			return
		}
		// Logout dicatat sendiri oleh AuthHandler dengan action "logout",
		// jadi lewati di sini agar tidak terekam ganda.
		if c.Request.URL.Path == "/api/auth/logout" {
			c.Next()
			return
		}

		c.Next()

		status := c.Writer.Status()
		if status >= 400 {
			return
		}

		writeAuditLog(db, c, action)
	}
}

// writeAuditLog menyusun dan menyimpan satu entri audit dari context request.
func writeAuditLog(db *gorm.DB, c *gin.Context, action string) {
	entry := model.AuditLog{
		Action:     action,
		Method:     c.Request.Method,
		Path:       c.Request.URL.Path,
		Resource:   resourceFromPath(c.Request.URL.Path),
		StatusCode: c.Writer.Status(),
		IPAddress:  c.ClientIP(),
		UserAgent:  truncate(c.Request.UserAgent(), 255),
	}

	if raw, exists := c.Get(CtxUserID); exists {
		if id, ok := raw.(uuid.UUID); ok {
			entry.UserID = &id
		}
	}
	if raw, exists := c.Get(CtxUsername); exists {
		if name, ok := raw.(string); ok {
			entry.Username = name
		}
	}

	// Best-effort: abaikan error agar tidak mengganggu alur utama request.
	db.Create(&entry)
}

// resourceFromPath mengambil segmen modul dari path API sebagai nama resource,
// contoh "/api/users/123" menjadi "users", "/api/exam-schedules" menjadi "exam-schedules".
func resourceFromPath(path string) string {
	trimmed := strings.TrimPrefix(path, "/api/")
	trimmed = strings.TrimPrefix(trimmed, "/")
	segments := strings.Split(trimmed, "/")
	if len(segments) > 0 && segments[0] != "" {
		return segments[0]
	}
	return "unknown"
}

// truncate memotong string agar tidak melebihi batas kolom database.
func truncate(s string, max int) string {
	if len(s) > max {
		return s[:max]
	}
	return s
}
