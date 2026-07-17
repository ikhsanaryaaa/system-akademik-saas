package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/middleware"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
	appjwt "github.com/ikhsanaryaaa/system-akademik-saas/backend/util/jwt"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/util/password"
	"gorm.io/gorm"
)

type AuthHandler struct {
	db  *gorm.DB
	jwt *appjwt.Manager
}

func NewAuthHandler(db *gorm.DB, jwt *appjwt.Manager) *AuthHandler {
	return &AuthHandler{db: db, jwt: jwt}
}

type loginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type changePasswordRequest struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=6"`
}

// Login memvalidasi kredensial dan mengembalikan JWT access token.
func (h *AuthHandler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}

	var user model.User
	err := h.db.Preload("Roles.Permissions").Where("username = ?", req.Username).First(&user).Error
	if err != nil {
		response.Error(c, http.StatusUnauthorized, "Username atau password salah", nil)
		return
	}

	if !user.IsActive {
		response.Error(c, http.StatusForbidden, "Akun tidak aktif", nil)
		return
	}

	if !password.Verify(user.PasswordHash, req.Password) {
		response.Error(c, http.StatusUnauthorized, "Username atau password salah", nil)
		return
	}

	token, err := h.jwt.Generate(user.ID, user.Username, user.PermissionKeys())
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal membuat token", nil)
		return
	}

	now := time.Now()
	h.db.Model(&user).Update("last_login_at", &now)

	h.recordAudit(c, &user.ID, user.Username, "login")

	response.OK(c, "Login berhasil", gin.H{
		"token": token,
		"user": gin.H{
			"id":          user.ID,
			"name":        user.Name,
			"username":    user.Username,
			"permissions": user.PermissionKeys(),
		},
	})
}

// Logout bersifat stateless pada sisi server; client cukup membuang token.
func (h *AuthHandler) Logout(c *gin.Context) {
	if raw, exists := c.Get(middleware.CtxUserID); exists {
		if id, ok := raw.(uuid.UUID); ok {
			username, _ := c.Get(middleware.CtxUsername)
			name, _ := username.(string)
			h.recordAudit(c, &id, name, "logout")
		}
	}
	response.OK(c, "Logout berhasil", nil)
}

// recordAudit mencatat aktivitas autentikasi (login, logout) ke tabel audit
// secara best-effort tanpa mengganggu alur utama request.
func (h *AuthHandler) recordAudit(c *gin.Context, userID *uuid.UUID, username, action string) {
	entry := model.AuditLog{
		UserID:     userID,
		Username:   username,
		Action:     action,
		Resource:   "auth",
		Method:     c.Request.Method,
		Path:       c.Request.URL.Path,
		StatusCode: http.StatusOK,
		IPAddress:  c.ClientIP(),
		UserAgent:  auditUserAgent(c.Request.UserAgent()),
	}
	h.db.Create(&entry)
}

// auditUserAgent memotong user agent agar muat di kolom database.
func auditUserAgent(ua string) string {
	if len(ua) > 255 {
		return ua[:255]
	}
	return ua
}

// Me mengembalikan profil user yang sedang login beserta permission-nya.
func (h *AuthHandler) Me(c *gin.Context) {
	userID, _ := c.Get(middleware.CtxUserID)
	id, ok := userID.(uuid.UUID)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "Tidak terautentikasi", nil)
		return
	}

	var user model.User
	if err := h.db.Preload("Roles.Permissions").First(&user, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "User tidak ditemukan", nil)
		return
	}

	response.OK(c, "Profil user", gin.H{
		"id":          user.ID,
		"name":        user.Name,
		"username":    user.Username,
		"email":       user.Email,
		"roles":       user.Roles,
		"permissions": user.PermissionKeys(),
	})
}

// ChangePassword mengganti password user yang sedang login.
func (h *AuthHandler) ChangePassword(c *gin.Context) {
	var req changePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}

	userID, _ := c.Get(middleware.CtxUserID)
	id, ok := userID.(uuid.UUID)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "Tidak terautentikasi", nil)
		return
	}

	var user model.User
	if err := h.db.First(&user, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "User tidak ditemukan", nil)
		return
	}

	if !password.Verify(user.PasswordHash, req.OldPassword) {
		response.Error(c, http.StatusBadRequest, "Password lama salah", nil)
		return
	}

	hash, err := password.Hash(req.NewPassword)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal memproses password", nil)
		return
	}

	if err := h.db.Model(&user).Update("password_hash", hash).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan password", nil)
		return
	}

	response.OK(c, "Password berhasil diganti", nil)
}
