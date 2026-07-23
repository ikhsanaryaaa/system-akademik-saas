package handler

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/middleware"
)

func TestSessionCookieAttributes(t *testing.T) {
	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	handler := NewAuthHandler(nil, nil, true, 3600)

	handler.setSessionCookie(ctx, "token", 3600)

	cookie := recorder.Header().Get("Set-Cookie")
	for _, want := range []string{middleware.AuthCookieName + "=token", "Path=/api", "Max-Age=3600", "HttpOnly", "Secure", "SameSite=Strict"} {
		if !strings.Contains(cookie, want) {
			t.Errorf("Set-Cookie %q tidak memuat %q", cookie, want)
		}
	}
}

func TestLogoutDeletesSessionCookie(t *testing.T) {
	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/auth/logout", nil)

	NewAuthHandler(nil, nil, false, 3600).Logout(ctx)

	cookie := recorder.Header().Get("Set-Cookie")
	if !strings.Contains(cookie, middleware.AuthCookieName+"=") || !strings.Contains(cookie, "Max-Age=0") {
		t.Fatalf("cookie logout tidak terhapus: %q", cookie)
	}
}
