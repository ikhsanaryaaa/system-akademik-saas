package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// DailyViolation adalah pelanggaran harian siswa yang dicatat guru piket.
type DailyViolation struct {
	ID        uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	StudentID uuid.UUID  `gorm:"type:uuid;not null;index" json:"student_id"`
	ClassID   *uuid.UUID `gorm:"type:uuid;index" json:"class_id,omitempty"`
	MajorID   *uuid.UUID `gorm:"type:uuid;index" json:"major_id,omitempty"`
	Category  string     `gorm:"size:50" json:"category"`
	Detail    string     `gorm:"type:text" json:"detail"`
	Officer   string     `gorm:"size:120" json:"officer"`
	Date      *time.Time `json:"date,omitempty"`

	Student *Student `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	Class   *Class   `gorm:"foreignKey:ClassID" json:"class,omitempty"`
	Major   *Major   `gorm:"foreignKey:MajorID" json:"major,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (d *DailyViolation) BeforeCreate(_ *gorm.DB) error {
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}
	return nil
}

// Lateness adalah catatan keterlambatan siswa.
type Lateness struct {
	ID          uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	StudentID   uuid.UUID  `gorm:"type:uuid;not null;index" json:"student_id"`
	ClassID     *uuid.UUID `gorm:"type:uuid;index" json:"class_id,omitempty"`
	MajorID     *uuid.UUID `gorm:"type:uuid;index" json:"major_id,omitempty"`
	Minutes     int        `gorm:"default:0" json:"minutes"`
	Reason      string     `gorm:"type:text" json:"reason"`
	Officer     string     `gorm:"size:120" json:"officer"`
	Date        *time.Time `json:"date,omitempty"`

	Student *Student `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	Class   *Class   `gorm:"foreignKey:ClassID" json:"class,omitempty"`
	Major   *Major   `gorm:"foreignKey:MajorID" json:"major,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (l *Lateness) BeforeCreate(_ *gorm.DB) error {
	if l.ID == uuid.Nil {
		l.ID = uuid.New()
	}
	return nil
}

// LeavePermit adalah izin keluar siswa selama jam sekolah.
type LeavePermit struct {
	ID         uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	StudentID  uuid.UUID  `gorm:"type:uuid;not null;index" json:"student_id"`
	ClassID    *uuid.UUID `gorm:"type:uuid;index" json:"class_id,omitempty"`
	MajorID    *uuid.UUID `gorm:"type:uuid;index" json:"major_id,omitempty"`
	Reason     string     `gorm:"type:text" json:"reason"`
	Status     string     `gorm:"size:20;not null;default:'out'" json:"status"`
	Officer    string     `gorm:"size:120" json:"officer"`
	LeaveTime  *time.Time `json:"leave_time,omitempty"`
	ReturnTime *time.Time `json:"return_time,omitempty"`

	Student *Student `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	Class   *Class   `gorm:"foreignKey:ClassID" json:"class,omitempty"`
	Major   *Major   `gorm:"foreignKey:MajorID" json:"major,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (l *LeavePermit) BeforeCreate(_ *gorm.DB) error {
	if l.ID == uuid.Nil {
		l.ID = uuid.New()
	}
	return nil
}
