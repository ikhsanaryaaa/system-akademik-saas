package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	appjwt "github.com/ikhsanaryaaa/system-akademik-saas/backend/util/jwt"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
)

// Context key untuk menyimpan identitas user hasil parse JWT.
const (
	CtxUserID      = "user_id"
	CtxUsername    = "username"
	CtxPermissions = "permissions"
)

// Auth memvalidasi Authorization header (Bearer token) dan menaruh
// identitas user di context. Menolak request tanpa token yang valid.
func Auth(manager *appjwt.Manager) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if header == "" || !strings.HasPrefix(header, "Bearer ") {
			response.Error(c, http.StatusUnauthorized, "Token tidak ditemukan", nil)
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(header, "Bearer ")
		claims, err := manager.Parse(tokenString)
		if err != nil {
			response.Error(c, http.StatusUnauthorized, "Token tidak valid atau kedaluwarsa", nil)
			c.Abort()
			return
		}

		c.Set(CtxUserID, claims.UserID)
		c.Set(CtxUsername, claims.Username)
		c.Set(CtxPermissions, claims.Permissions)
		c.Next()
	}
}
