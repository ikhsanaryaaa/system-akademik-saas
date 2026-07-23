package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AttendanceRecord adalah record kehadiran satu person pada satu sesi.
// Metode (manual|qr|rfid|unknown) tersimpan per record, bukan per sesi.
type AttendanceRecord struct {
	ID           uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	SessionID    uuid.UUID  `gorm:"type:uuid;not null;index:idx_session_person,unique" json:"session_id"`
	PersonID     uuid.UUID  `gorm:"type:uuid;not null;index:idx_session_person,unique" json:"person_id"`
	Status       string     `gorm:"size:20;not null" json:"status"`
	Method       string     `gorm:"size:20;not null" json:"method"`
	MarkedBy     *uuid.UUID `gorm:"type:uuid" json:"marked_by,omitempty"`
	CheckInTime  *time.Time `json:"check_in_time,omitempty"`
	CheckOutTime *time.Time `json:"check_out_time,omitempty"`
	Note         string     `gorm:"size:255" json:"note"`

	Session *AttendanceSession `gorm:"foreignKey:SessionID" json:"session,omitempty"`
	// ponytail: PersonID polymorphic; handler memvalidasi person sesuai SessionType.
	Student *Student `gorm:"foreignKey:PersonID;references:ID;-:migration" json:"student,omitempty"`
	Teacher *Teacher `gorm:"foreignKey:PersonID;references:ID;-:migration" json:"teacher,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (a *AttendanceRecord) BeforeCreate(_ *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}
