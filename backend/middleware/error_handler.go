package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
)

// ErrorHandler adalah middleware terpusat yang menangkap error yang
// didaftarkan handler lewat c.Error(), lalu mengubahnya jadi response standar.
func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		// Ambil error terakhir yang didaftarkan handler.
		if len(c.Errors) == 0 {
			return
		}
		// Bila handler sudah menulis response, jangan timpa.
		if c.Writer.Written() {
			return
		}

		err := c.Errors.Last()
		response.Error(c, http.StatusInternalServerError, "Terjadi kesalahan pada server", err.Error())
	}
}
