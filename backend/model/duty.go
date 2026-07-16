package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// DutySchedule adalah jadwal piket guru pada satu hari.
type DutySchedule struct {
	ID        uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	TeacherID uuid.UUID  `gorm:"type:uuid;not null;index" json:"teacher_id"`
	Day       string     `gorm:"size:20;not null" json:"day"`
	Date      *time.Time `json:"date,omitempty"`
	Note      string     `gorm:"type:text" json:"note"`

	Teacher *Teacher `gorm:"foreignKey:TeacherID" json:"teacher,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (d *DutySchedule) BeforeCreate(_ *gorm.DB) error {
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}
	return nil
}

// DutyLog adalah buku piket, catatan kejadian selama piket satu hari.
type DutyLog struct {
	ID        uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	TeacherID *uuid.UUID `gorm:"type:uuid;index" json:"teacher_id,omitempty"`
	Date      *time.Time `json:"date,omitempty"`
	Incident  string     `gorm:"type:text" json:"incident"`
	Action    string     `gorm:"type:text" json:"action"`

	Teacher *Teacher `gorm:"foreignKey:TeacherID" json:"teacher,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (d *DutyLog) BeforeCreate(_ *gorm.DB) error {
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}
	return nil
}

// GuestBook adalah buku tamu sekolah.
type GuestBook struct {
	ID           uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	Name         string     `gorm:"size:150;not null" json:"name"`
	Institution  string     `gorm:"size:150" json:"institution"`
	Purpose      string     `gorm:"size:200" json:"purpose"`
	Phone        string     `gorm:"size:30" json:"phone"`
	CheckInTime  *time.Time `json:"check_in_time,omitempty"`
	CheckOutTime *time.Time `json:"check_out_time,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (g *GuestBook) BeforeCreate(_ *gorm.DB) error {
	if g.ID == uuid.Nil {
		g.ID = uuid.New()
	}
	return nil
}
