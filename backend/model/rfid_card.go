package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// RfidCard memetakan UID kartu RFID ke seorang siswa atau pendidik.
// Tepat satu dari StudentID atau TeacherID yang terisi.
type RfidCard struct {
	ID        uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	UID       string     `gorm:"uniqueIndex;size:64;not null" json:"uid"`
	StudentID *uuid.UUID `gorm:"type:uuid;index" json:"student_id,omitempty"`
	TeacherID *uuid.UUID `gorm:"type:uuid;index" json:"teacher_id,omitempty"`

	Student *Student `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	Teacher *Teacher `gorm:"foreignKey:TeacherID" json:"teacher,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (r *RfidCard) BeforeCreate(_ *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}
