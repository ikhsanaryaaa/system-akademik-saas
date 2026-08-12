package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Lateness adalah catatan keterlambatan siswa. Menyimpan menit dan alasan yang
// tidak dimiliki rekap kehadiran, sementara status terlambat pada tanggal yang
// sama tetap ditulis ke StudentAttendance supaya kedua rekap tidak berselisih.
type Lateness struct {
	ID        uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	StudentID uuid.UUID  `gorm:"type:uuid;not null;index" json:"student_id"`
	ClassID   *uuid.UUID `gorm:"type:uuid;index" json:"class_id,omitempty"`
	MajorID   *uuid.UUID `gorm:"type:uuid;index" json:"major_id,omitempty"`
	Minutes   int        `gorm:"default:0" json:"minutes"`
	Reason    string     `gorm:"type:text" json:"reason"`
	// OfficerID diisi server dari jadwal piket. Officer teks dipertahankan
	// supaya catatan lama yang petugasnya diketik manual tetap terbaca.
	OfficerID *uuid.UUID `gorm:"type:uuid;index" json:"officer_id,omitempty"`
	Officer   string     `gorm:"size:120" json:"officer"`
	Date      *time.Time `json:"date,omitempty"`

	Student        *Student `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	Class          *Class   `gorm:"foreignKey:ClassID" json:"class,omitempty"`
	Major          *Major   `gorm:"foreignKey:MajorID" json:"major,omitempty"`
	OfficerTeacher *Teacher `gorm:"foreignKey:OfficerID" json:"officer_teacher,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (l *Lateness) BeforeCreate(_ *gorm.DB) error {
	if l.ID == uuid.Nil {
		l.ID = uuid.New()
	}
	return nil
}

// Status izin keluar. Selama masih out, siswa terhitung sedang berada di luar.
const (
	LeaveOut      = "out"
	LeaveReturned = "returned"
)

// LeavePermit adalah izin keluar siswa selama jam sekolah.
type LeavePermit struct {
	ID         uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	StudentID  uuid.UUID  `gorm:"type:uuid;not null;index" json:"student_id"`
	ClassID    *uuid.UUID `gorm:"type:uuid;index" json:"class_id,omitempty"`
	MajorID    *uuid.UUID `gorm:"type:uuid;index" json:"major_id,omitempty"`
	Reason     string     `gorm:"type:text" json:"reason"`
	Status     string     `gorm:"size:20;not null;default:'out';index" json:"status"`
	OfficerID  *uuid.UUID `gorm:"type:uuid;index" json:"officer_id,omitempty"`
	Officer    string     `gorm:"size:120" json:"officer"`
	LeaveTime  *time.Time `json:"leave_time,omitempty"`
	ReturnTime *time.Time `json:"return_time,omitempty"`

	Student        *Student `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	Class          *Class   `gorm:"foreignKey:ClassID" json:"class,omitempty"`
	Major          *Major   `gorm:"foreignKey:MajorID" json:"major,omitempty"`
	OfficerTeacher *Teacher `gorm:"foreignKey:OfficerID" json:"officer_teacher,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (l *LeavePermit) BeforeCreate(_ *gorm.DB) error {
	if l.ID == uuid.Nil {
		l.ID = uuid.New()
	}
	return nil
}
