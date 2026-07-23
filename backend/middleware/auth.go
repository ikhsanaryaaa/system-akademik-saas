package middleware

import (
	"net/http"
	"net/url"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
	appjwt "github.com/ikhsanaryaaa/system-akademik-saas/backend/util/jwt"
)

// Context key untuk menyimpan identitas user hasil parse JWT.
const (
	CtxUserID      = "user_id"
	CtxUsername    = "username"
	CtxPermissions = "permissions"
	AuthCookieName = "sim_session"
)

// Auth menerima Bearer token untuk API client dan HttpOnly cookie untuk web.
func Auth(manager *appjwt.Manager, allowedOrigins []string) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := ""
		cookieAuth := false
		header := c.GetHeader("Authorization")
		if strings.HasPrefix(header, "Bearer ") {
			tokenString = strings.TrimPrefix(header, "Bearer ")
		} else if token, err := c.Cookie(AuthCookieName); err == nil {
			tokenString = token
			cookieAuth = true
		}
		if tokenString == "" {
			response.Error(c, http.StatusUnauthorized, "Token tidak ditemukan", nil)
			c.Abort()
			return
		}
		if cookieAuth && isUnsafeMethod(c.Request.Method) && !allowedOrigin(c.GetHeader("Origin"), allowedOrigins) {
			response.Error(c, http.StatusForbidden, "Origin tidak valid", nil)
			c.Abort()
			return
		}

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

func isUnsafeMethod(method string) bool {
	return method != http.MethodGet && method != http.MethodHead && method != http.MethodOptions
}

func allowedOrigin(origin string, allowed []string) bool {
	if origin == "" {
		return false
	}
	parsed, err := url.Parse(origin)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return false
	}
	canonical := parsed.Scheme + "://" + parsed.Host
	for _, candidate := range allowed {
		if canonical == strings.TrimRight(candidate, "/") {
			return true
		}
	}
	return false
}
