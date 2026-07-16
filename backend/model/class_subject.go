package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ClassSubject memetakan mata pelajaran ke kelas beserta pengajarnya.
type ClassSubject struct {
	ID        uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	ClassID   uuid.UUID  `gorm:"type:uuid;not null;index" json:"class_id"`
	SubjectID uuid.UUID  `gorm:"type:uuid;not null;index" json:"subject_id"`
	TeacherID *uuid.UUID `gorm:"type:uuid;index" json:"teacher_id,omitempty"`

	Class   *Class   `gorm:"foreignKey:ClassID" json:"class,omitempty"`
	Subject *Subject `gorm:"foreignKey:SubjectID" json:"subject,omitempty"`
	Teacher *Teacher `gorm:"foreignKey:TeacherID" json:"teacher,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (cs *ClassSubject) BeforeCreate(_ *gorm.DB) error {
	if cs.ID == uuid.Nil {
		cs.ID = uuid.New()
	}
	return nil
}
