package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// InternshipPlace adalah master tempat PKL (Praktik Kerja Lapangan).
type InternshipPlace struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Name        string    `gorm:"size:150;not null" json:"name"`
	Field       string    `gorm:"size:100" json:"field"`
	Address     string    `gorm:"type:text" json:"address"`
	ContactName string    `gorm:"size:120" json:"contact_name"`
	Phone       string    `gorm:"size:30" json:"phone"`
	Quota       int       `gorm:"default:0" json:"quota"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (i *InternshipPlace) BeforeCreate(_ *gorm.DB) error {
	if i.ID == uuid.Nil {
		i.ID = uuid.New()
	}
	return nil
}

// Internship adalah penempatan PKL seorang siswa pada satu tempat.
type Internship struct {
	ID        uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	StudentID uuid.UUID  `gorm:"type:uuid;not null;index" json:"student_id"`
	PlaceID   uuid.UUID  `gorm:"type:uuid;not null;index" json:"place_id"`
	ClassID   *uuid.UUID `gorm:"type:uuid;index" json:"class_id,omitempty"`
	MajorID   *uuid.UUID `gorm:"type:uuid;index" json:"major_id,omitempty"`
	Mentor    string     `gorm:"size:120" json:"mentor"`
	Status    string     `gorm:"size:20;not null;default:'ongoing'" json:"status"`
	StartDate *time.Time `json:"start_date,omitempty"`
	EndDate   *time.Time `json:"end_date,omitempty"`

	Student *Student         `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	Place   *InternshipPlace `gorm:"foreignKey:PlaceID" json:"place,omitempty"`
	Class   *Class           `gorm:"foreignKey:ClassID" json:"class,omitempty"`
	Major   *Major           `gorm:"foreignKey:MajorID" json:"major,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (i *Internship) BeforeCreate(_ *gorm.DB) error {
	if i.ID == uuid.Nil {
		i.ID = uuid.New()
	}
	return nil
}

// JobVacancy adalah lowongan kerja yang dipublikasikan BKK.
type JobVacancy struct {
	ID          uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	Position    string     `gorm:"size:150;not null" json:"position"`
	Company     string     `gorm:"size:150;not null" json:"company"`
	Description string     `gorm:"type:text" json:"description"`
	Location    string     `gorm:"size:150" json:"location"`
	Status      string     `gorm:"size:20;not null;default:'open'" json:"status"`
	Deadline    *time.Time `json:"deadline,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (j *JobVacancy) BeforeCreate(_ *gorm.DB) error {
	if j.ID == uuid.Nil {
		j.ID = uuid.New()
	}
	return nil
}
