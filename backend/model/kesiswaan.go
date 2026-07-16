package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Admission adalah data pendaftar PPDB (Penerimaan Peserta Didik Baru).
// Status memakai pending, accepted, atau rejected.
type Admission struct {
	ID             uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	Name           string     `gorm:"size:150;not null" json:"name"`
	OriginSchool   string     `gorm:"size:150" json:"origin_school"`
	Gender         string     `gorm:"size:10" json:"gender"`
	Phone          string     `gorm:"size:30" json:"phone"`
	Email          string     `gorm:"size:120" json:"email"`
	Address        string     `gorm:"type:text" json:"address"`
	MajorID        *uuid.UUID `gorm:"type:uuid;index" json:"major_id,omitempty"`
	Status         string     `gorm:"size:20;not null;default:'pending'" json:"status"`
	Note           string     `gorm:"type:text" json:"note"`
	RegisteredAt   *time.Time `json:"registered_at,omitempty"`
	AcademicYearID *uuid.UUID `gorm:"type:uuid;index" json:"academic_year_id,omitempty"`

	Major *Major `gorm:"foreignKey:MajorID" json:"major,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (a *Admission) BeforeCreate(_ *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}

// StudentCoaching adalah catatan pembinaan kesiswaan pada seorang siswa.
type StudentCoaching struct {
	ID        uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	StudentID uuid.UUID  `gorm:"type:uuid;not null;index" json:"student_id"`
	ClassID   *uuid.UUID `gorm:"type:uuid;index" json:"class_id,omitempty"`
	MajorID   *uuid.UUID `gorm:"type:uuid;index" json:"major_id,omitempty"`
	Topic     string     `gorm:"size:150;not null" json:"topic"`
	Detail    string     `gorm:"type:text" json:"detail"`
	CoachName string     `gorm:"size:120" json:"coach_name"`
	Date      *time.Time `json:"date,omitempty"`

	Student *Student `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	Class   *Class   `gorm:"foreignKey:ClassID" json:"class,omitempty"`
	Major   *Major   `gorm:"foreignKey:MajorID" json:"major,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (s *StudentCoaching) BeforeCreate(_ *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

// TalentDevelopment adalah catatan pengembangan bakat dan minat siswa.
type TalentDevelopment struct {
	ID        uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	StudentID uuid.UUID  `gorm:"type:uuid;not null;index" json:"student_id"`
	ClassID   *uuid.UUID `gorm:"type:uuid;index" json:"class_id,omitempty"`
	MajorID   *uuid.UUID `gorm:"type:uuid;index" json:"major_id,omitempty"`
	Field     string     `gorm:"size:100;not null" json:"field"`
	Category  string     `gorm:"size:50" json:"category"`
	Detail    string     `gorm:"type:text" json:"detail"`
	Mentor    string     `gorm:"size:120" json:"mentor"`

	Student *Student `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	Class   *Class   `gorm:"foreignKey:ClassID" json:"class,omitempty"`
	Major   *Major   `gorm:"foreignKey:MajorID" json:"major,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (t *TalentDevelopment) BeforeCreate(_ *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}

// StudentActivity adalah kegiatan kesiswaan (misalnya ekstrakurikuler atau acara).
type StudentActivity struct {
	ID          uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	Name        string     `gorm:"size:150;not null" json:"name"`
	Type        string     `gorm:"size:50" json:"type"`
	Description string     `gorm:"type:text" json:"description"`
	Organizer   string     `gorm:"size:120" json:"organizer"`
	Location    string     `gorm:"size:150" json:"location"`
	StartDate   *time.Time `json:"start_date,omitempty"`
	EndDate     *time.Time `json:"end_date,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (s *StudentActivity) BeforeCreate(_ *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}
