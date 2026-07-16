package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// User adalah akun pengguna sistem. Satu user bisa punya beberapa role.
type User struct {
	ID           uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	Name         string     `gorm:"size:150;not null" json:"name"`
	Username     string     `gorm:"uniqueIndex;size:100;not null" json:"username"`
	Email        string     `gorm:"index;size:150" json:"email"`
	PasswordHash string     `gorm:"size:255;not null" json:"-"`
	IsActive     bool       `gorm:"default:true" json:"is_active"`
	Roles        []Role     `gorm:"many2many:user_roles" json:"roles,omitempty"`
	LastLoginAt  *time.Time `json:"last_login_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

func (u *User) BeforeCreate(_ *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

// PermissionKeys mengumpulkan seluruh permission key dari semua role user,
// tanpa duplikat. Roles harus sudah di-preload beserta Permissions.
func (u *User) PermissionKeys() []string {
	seen := make(map[string]struct{})
	keys := make([]string, 0)
	for _, role := range u.Roles {
		for _, perm := range role.Permissions {
			if _, ok := seen[perm.Key]; !ok {
				seen[perm.Key] = struct{}{}
				keys = append(keys, perm.Key)
			}
		}
	}
	return keys
}
