package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
)

// RequirePermission memastikan user punya permission tertentu.
// Bila diberi lebih dari satu, cukup salah satunya yang dimiliki.
// Harus dipasang setelah middleware Auth.
func RequirePermission(required ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		raw, exists := c.Get(CtxPermissions)
		if !exists {
			response.Error(c, http.StatusUnauthorized, "Tidak terautentikasi", nil)
			c.Abort()
			return
		}

		perms, _ := raw.([]string)
		for _, p := range perms {
			for _, want := range required {
				if p == want {
					c.Next()
					return
				}
			}
		}

		response.Error(c, http.StatusForbidden, "Anda tidak memiliki akses untuk aksi ini", nil)
		c.Abort()
	}
}
