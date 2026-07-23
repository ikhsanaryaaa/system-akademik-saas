package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Session type constants
const (
	SessionTypeStudent = "student"
	SessionTypeTeacher = "teacher"
)

// Session status constants
const (
	SessionStatusDraft  = "draft"
	SessionStatusOpen   = "open"
	SessionStatusClosed = "closed"
)

// Attendance method constants
const (
	AttendanceMethodManual  = "manual"
	AttendanceMethodQR      = "qr"
	AttendanceMethodRFID    = "rfid"
	AttendanceMethodUnknown = "unknown"
)

const (
	AttendanceScopeDaily  = "daily"
	AttendanceScopeLesson = "lesson"
)

// AttendanceSession adalah wadah absensi harian atau jam pelajaran.
type AttendanceSession struct {
	ID               uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	SessionType      string     `gorm:"size:20;not null;index" json:"session_type"`
	Scope            string     `gorm:"size:20;not null;default:'daily';index" json:"scope"`
	Date             time.Time  `gorm:"not null;index" json:"date"`
	ClassID          *uuid.UUID `gorm:"type:uuid;index" json:"class_id,omitempty"`
	Name             string     `gorm:"size:100" json:"name"`
	Status           string     `gorm:"size:20;not null;default:'draft'" json:"status"`
	DefaultMethod    string     `gorm:"size:20;not null;default:'manual'" json:"default_method"`
	LessonScheduleID *uuid.UUID `gorm:"type:uuid;index" json:"lesson_schedule_id,omitempty"`
	SubjectID        *uuid.UUID `gorm:"type:uuid;index" json:"subject_id,omitempty"`
	TeacherID        *uuid.UUID `gorm:"type:uuid;index" json:"teacher_id,omitempty"`
	ScheduledStart   *string    `gorm:"size:5" json:"scheduled_start,omitempty"`
	ScheduledEnd     *string    `gorm:"size:5" json:"scheduled_end,omitempty"`
	ParentSessionID  *uuid.UUID `gorm:"type:uuid;index" json:"parent_session_id,omitempty"`
	OpenedAt         *time.Time `json:"opened_at,omitempty"`
	OpenedBy         *uuid.UUID `gorm:"type:uuid" json:"opened_by,omitempty"`
	ClosedAt         *time.Time `json:"closed_at,omitempty"`
	ClosedBy         *uuid.UUID `gorm:"type:uuid" json:"closed_by,omitempty"`
	OverrideBy       *uuid.UUID `gorm:"type:uuid" json:"override_by,omitempty"`
	OverrideReason   string     `gorm:"size:500" json:"override_reason,omitempty"`

	Class          *Class             `gorm:"foreignKey:ClassID" json:"class,omitempty"`
	LessonSchedule *LessonSchedule    `gorm:"foreignKey:LessonScheduleID" json:"lesson_schedule,omitempty"`
	Subject        *Subject           `gorm:"foreignKey:SubjectID" json:"subject,omitempty"`
	Teacher        *Teacher           `gorm:"foreignKey:TeacherID" json:"teacher,omitempty"`
	ParentSession  *AttendanceSession `gorm:"foreignKey:ParentSessionID" json:"parent_session,omitempty"`
	Records        []AttendanceRecord `gorm:"foreignKey:SessionID" json:"records,omitempty"`

	PresentCount int64 `gorm:"-" json:"present_count,omitempty"`
	StudentCount int64 `gorm:"-" json:"student_count,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (a *AttendanceSession) BeforeCreate(_ *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}
