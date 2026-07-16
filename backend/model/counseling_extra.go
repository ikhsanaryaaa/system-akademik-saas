package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// HomeVisit adalah kunjungan ke rumah siswa oleh BK.
type HomeVisit struct {
	ID        uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	StudentID uuid.UUID  `gorm:"type:uuid;not null;index" json:"student_id"`
	ClassID   *uuid.UUID `gorm:"type:uuid;index" json:"class_id,omitempty"`
	MajorID   *uuid.UUID `gorm:"type:uuid;index" json:"major_id,omitempty"`
	Purpose   string     `gorm:"size:150;not null" json:"purpose"`
	Address   string     `gorm:"type:text" json:"address"`
	Result    string     `gorm:"type:text" json:"result"`
	Officer   string     `gorm:"size:120" json:"officer"`
	Date      *time.Time `json:"date,omitempty"`

	Student *Student `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	Class   *Class   `gorm:"foreignKey:ClassID" json:"class,omitempty"`
	Major   *Major   `gorm:"foreignKey:MajorID" json:"major,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (h *HomeVisit) BeforeCreate(_ *gorm.DB) error {
	if h.ID == uuid.Nil {
		h.ID = uuid.New()
	}
	return nil
}

// Achievement adalah prestasi siswa (akademik atau non-akademik).
type Achievement struct {
	ID        uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	StudentID uuid.UUID  `gorm:"type:uuid;not null;index" json:"student_id"`
	ClassID   *uuid.UUID `gorm:"type:uuid;index" json:"class_id,omitempty"`
	MajorID   *uuid.UUID `gorm:"type:uuid;index" json:"major_id,omitempty"`
	Title     string     `gorm:"size:150;not null" json:"title"`
	Category  string     `gorm:"size:50" json:"category"`
	Level     string     `gorm:"size:50" json:"level"`
	Rank      string     `gorm:"size:50" json:"rank"`
	Organizer string     `gorm:"size:120" json:"organizer"`
	Date      *time.Time `json:"date,omitempty"`

	Student *Student `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	Class   *Class   `gorm:"foreignKey:ClassID" json:"class,omitempty"`
	Major   *Major   `gorm:"foreignKey:MajorID" json:"major,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (a *Achievement) BeforeCreate(_ *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}

// Alumni adalah data alumni beserta jalur setelah lulus.
type Alumni struct {
	ID             uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	Name           string     `gorm:"size:150;not null" json:"name"`
	GraduationYear int        `gorm:"index" json:"graduation_year"`
	MajorID        *uuid.UUID `gorm:"type:uuid;index" json:"major_id,omitempty"`
	Track          string     `gorm:"size:50" json:"track"`
	Destination    string     `gorm:"size:150" json:"destination"`
	Phone          string     `gorm:"size:30" json:"phone"`
	Email          string     `gorm:"size:120" json:"email"`
	Note           string     `gorm:"type:text" json:"note"`

	Major *Major `gorm:"foreignKey:MajorID" json:"major,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (a *Alumni) BeforeCreate(_ *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}
