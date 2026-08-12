package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ViolationType adalah master jenis pelanggaran beserta poin dan kategorinya.
type ViolationType struct {
	ID       uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Name     string    `gorm:"size:150;not null" json:"name"`
	Category string    `gorm:"size:50" json:"category"`
	Point    int       `gorm:"not null;default:0" json:"point"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (v *ViolationType) BeforeCreate(_ *gorm.DB) error {
	if v.ID == uuid.Nil {
		v.ID = uuid.New()
	}
	return nil
}

// CounselingAgenda adalah agenda kegiatan BK.
// Field adalah bidang layanan dan Component adalah komponen layanan menurut POP BK.
type CounselingAgenda struct {
	ID          uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	Title       string     `gorm:"size:150;not null" json:"title"`
	Field       string     `gorm:"size:30" json:"field"`
	Component   string     `gorm:"size:40" json:"component"`
	Description string     `gorm:"type:text" json:"description"`
	Location    string     `gorm:"size:150" json:"location"`
	Date        *time.Time `json:"date,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (a *CounselingAgenda) BeforeCreate(_ *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}

// ViolationRecord adalah pencatatan pelanggaran seorang siswa.
// Tindak lanjut dimodelkan sebagai field status, catatan, dan tanggal pada record ini.
type ViolationRecord struct {
	ID              uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	StudentID       uuid.UUID  `gorm:"type:uuid;not null;index" json:"student_id"`
	ViolationTypeID uuid.UUID  `gorm:"type:uuid;not null;index" json:"violation_type_id"`
	ClassID         *uuid.UUID `gorm:"type:uuid;index" json:"class_id,omitempty"`
	MajorID         *uuid.UUID `gorm:"type:uuid;index" json:"major_id,omitempty"`
	AcademicYearID  *uuid.UUID `gorm:"type:uuid;index" json:"academic_year_id,omitempty"`
	Description     string     `gorm:"type:text" json:"description"`
	Date            *time.Time `json:"date,omitempty"`
	ReporterName    string     `gorm:"size:120" json:"reporter_name"`
	FollowUpStatus  string     `gorm:"size:20;not null;default:'open'" json:"follow_up_status"`
	FollowUpNote    string     `gorm:"type:text" json:"follow_up_note"`
	FollowUpDate    *time.Time `json:"follow_up_date,omitempty"`

	Student       *Student       `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	ViolationType *ViolationType `gorm:"foreignKey:ViolationTypeID" json:"violation_type,omitempty"`
	Class         *Class         `gorm:"foreignKey:ClassID" json:"class,omitempty"`
	Major         *Major         `gorm:"foreignKey:MajorID" json:"major,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (v *ViolationRecord) BeforeCreate(_ *gorm.DB) error {
	if v.ID == uuid.Nil {
		v.ID = uuid.New()
	}
	return nil
}

// CounselingSession adalah sesi konseling seorang siswa.
type CounselingSession struct {
	ID          uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	StudentID   uuid.UUID  `gorm:"type:uuid;not null;index" json:"student_id"`
	ClassID     *uuid.UUID `gorm:"type:uuid;index" json:"class_id,omitempty"`
	MajorID     *uuid.UUID `gorm:"type:uuid;index" json:"major_id,omitempty"`
	Type        string     `gorm:"size:50" json:"type"`
	Field       string     `gorm:"size:30" json:"field"`
	Topic       string     `gorm:"size:150;not null" json:"topic"`
	Summary     string     `gorm:"type:text" json:"summary"`
	Result      string     `gorm:"type:text" json:"result"`
	CounselName string     `gorm:"size:120" json:"counsel_name"`
	Date        *time.Time `json:"date,omitempty"`

	Student *Student `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	Class   *Class   `gorm:"foreignKey:ClassID" json:"class,omitempty"`
	Major   *Major   `gorm:"foreignKey:MajorID" json:"major,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (s *CounselingSession) BeforeCreate(_ *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

// SanctionLevel adalah master tahap sanksi berdasarkan ambang akumulasi poin.
// Tahap yang berlaku adalah baris dengan MinPoint tertinggi yang masih di bawah
// atau sama dengan poin siswa pada tahun ajaran berjalan.
type SanctionLevel struct {
	ID       uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	MinPoint int       `gorm:"not null;uniqueIndex" json:"min_point"`
	Name     string    `gorm:"size:100;not null" json:"name"`
	Action   string    `gorm:"type:text" json:"action"`
	Note     string    `gorm:"type:text" json:"note"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (s *SanctionLevel) BeforeCreate(_ *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}
