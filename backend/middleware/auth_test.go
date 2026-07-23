package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	appjwt "github.com/ikhsanaryaaa/system-akademik-saas/backend/util/jwt"
)

func TestAuthTransportsAndCookieOrigin(t *testing.T) {
	gin.SetMode(gin.TestMode)
	manager := appjwt.NewManager("test-secret", time.Hour)
	token, err := manager.Generate(uuid.New(), "admin", []string{"master.read"})
	if err != nil {
		t.Fatal(err)
	}

	tests := []struct {
		name       string
		header     string
		cookie     bool
		origin     string
		method     string
		wantStatus int
	}{
		{name: "bearer", header: "Bearer " + token, method: http.MethodPost, wantStatus: http.StatusNoContent},
		{name: "cookie valid origin", cookie: true, origin: "http://localhost:5173", method: http.MethodPost, wantStatus: http.StatusNoContent},
		{name: "cookie invalid origin", cookie: true, origin: "https://evil.example", method: http.MethodPost, wantStatus: http.StatusForbidden},
		{name: "cookie safe method", cookie: true, method: http.MethodGet, wantStatus: http.StatusNoContent},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := gin.New()
			r.Use(Auth(manager, []string{"http://localhost:5173"}))
			r.Any("/", func(c *gin.Context) { c.Status(http.StatusNoContent) })
			req := httptest.NewRequest(tt.method, "/", nil)
			if tt.header != "" {
				req.Header.Set("Authorization", tt.header)
			}
			if tt.cookie {
				req.AddCookie(&http.Cookie{Name: AuthCookieName, Value: token})
			}
			if tt.origin != "" {
				req.Header.Set("Origin", tt.origin)
			}
			res := httptest.NewRecorder()
			r.ServeHTTP(res, req)
			if res.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d", res.Code, tt.wantStatus)
			}
		})
	}
}
