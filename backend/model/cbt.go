package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Question adalah butir soal pada bank soal, difilter per kelas dan jurusan.
// Type memakai multiple_choice, true_false, essay, atau matching.
// ImageURL dan Formula mendukung soal bergambar dan berumus.
type Question struct {
	ID             uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	SubjectID      *uuid.UUID `gorm:"type:uuid;index" json:"subject_id,omitempty"`
	ClassID        *uuid.UUID `gorm:"type:uuid;index" json:"class_id,omitempty"`
	MajorID        *uuid.UUID `gorm:"type:uuid;index" json:"major_id,omitempty"`
	Type           string     `gorm:"size:20;not null;default:'multiple_choice'" json:"type"`
	Text           string     `gorm:"type:text;not null" json:"text"`
	ImageURL       string     `gorm:"size:255" json:"image_url"`
	Formula        string     `gorm:"type:text" json:"formula"`
	Difficulty     string     `gorm:"size:20" json:"difficulty"`
	Points         float64    `gorm:"default:1" json:"points"`
	EssayKey       string     `gorm:"type:text" json:"essay_key"`
	AcademicYearID *uuid.UUID `gorm:"type:uuid;index" json:"academic_year_id,omitempty"`

	Subject *Subject         `gorm:"foreignKey:SubjectID" json:"subject,omitempty"`
	Class   *Class           `gorm:"foreignKey:ClassID" json:"class,omitempty"`
	Major   *Major           `gorm:"foreignKey:MajorID" json:"major,omitempty"`
	Options []QuestionOption `gorm:"foreignKey:QuestionID" json:"options,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (q *Question) BeforeCreate(_ *gorm.DB) error {
	if q.ID == uuid.Nil {
		q.ID = uuid.New()
	}
	return nil
}

// QuestionOption adalah opsi jawaban untuk soal pilihan ganda, benar/salah,
// atau pasangan pada soal menjodohkan. IsCorrect menandai kunci jawaban.
// MatchText dipakai untuk sisi pasangan pada soal menjodohkan.
type QuestionOption struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	QuestionID uuid.UUID `gorm:"type:uuid;not null;index" json:"question_id"`
	Text       string    `gorm:"type:text" json:"text"`
	ImageURL   string    `gorm:"size:255" json:"image_url"`
	MatchText  string    `gorm:"type:text" json:"match_text"`
	IsCorrect  bool      `gorm:"default:false" json:"is_correct"`
	Order      int       `gorm:"default:0" json:"order"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (o *QuestionOption) BeforeCreate(_ *gorm.DB) error {
	if o.ID == uuid.Nil {
		o.ID = uuid.New()
	}
	return nil
}

// ExamPackage adalah paket atau naskah ujian yang disusun dari bank soal.
// ShuffleQuestions dan ShuffleOptions mengatur pengacakan per peserta.
type ExamPackage struct {
	ID               uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	Title            string     `gorm:"size:200;not null" json:"title"`
	SubjectID        *uuid.UUID `gorm:"type:uuid;index" json:"subject_id,omitempty"`
	ClassID          *uuid.UUID `gorm:"type:uuid;index" json:"class_id,omitempty"`
	MajorID          *uuid.UUID `gorm:"type:uuid;index" json:"major_id,omitempty"`
	AcademicYearID   *uuid.UUID `gorm:"type:uuid;index" json:"academic_year_id,omitempty"`
	Description      string     `gorm:"type:text" json:"description"`
	ShuffleQuestions bool       `gorm:"default:false" json:"shuffle_questions"`
	ShuffleOptions   bool       `gorm:"default:false" json:"shuffle_options"`

	Subject *Subject          `gorm:"foreignKey:SubjectID" json:"subject,omitempty"`
	Class   *Class            `gorm:"foreignKey:ClassID" json:"class,omitempty"`
	Major   *Major            `gorm:"foreignKey:MajorID" json:"major,omitempty"`
	Items   []ExamPackageItem `gorm:"foreignKey:PackageID" json:"items,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (p *ExamPackage) BeforeCreate(_ *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

// ExamPackageItem menautkan sebuah soal ke paket ujian dengan urutan dan bobot.
type ExamPackageItem struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	PackageID  uuid.UUID `gorm:"type:uuid;not null;index" json:"package_id"`
	QuestionID uuid.UUID `gorm:"type:uuid;not null;index" json:"question_id"`
	Order      int       `gorm:"default:0" json:"order"`
	Points     float64   `gorm:"default:1" json:"points"`

	Question *Question `gorm:"foreignKey:QuestionID" json:"question,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (i *ExamPackageItem) BeforeCreate(_ *gorm.DB) error {
	if i.ID == uuid.Nil {
		i.ID = uuid.New()
	}
	return nil
}

// ExamSchedule adalah penjadwalan pelaksanaan ujian dari sebuah paket.
// Token dirilis proktor per sesi. Status memakai scheduled, ongoing, atau finished.
type ExamSchedule struct {
	ID             uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	PackageID      uuid.UUID  `gorm:"type:uuid;not null;index" json:"package_id"`
	Title          string     `gorm:"size:200;not null" json:"title"`
	ClassID        *uuid.UUID `gorm:"type:uuid;index" json:"class_id,omitempty"`
	MajorID        *uuid.UUID `gorm:"type:uuid;index" json:"major_id,omitempty"`
	AcademicYearID *uuid.UUID `gorm:"type:uuid;index" json:"academic_year_id,omitempty"`
	StartAt        *time.Time `json:"start_at,omitempty"`
	EndAt          *time.Time `json:"end_at,omitempty"`
	DurationMin    int        `gorm:"default:0" json:"duration_min"`
	Token          string     `gorm:"size:20" json:"token"`
	Status         string     `gorm:"size:20;not null;default:'scheduled'" json:"status"`

	Package *ExamPackage `gorm:"foreignKey:PackageID" json:"package,omitempty"`
	Class   *Class       `gorm:"foreignKey:ClassID" json:"class,omitempty"`
	Major   *Major       `gorm:"foreignKey:MajorID" json:"major,omitempty"`
	Rooms   []ExamRoom   `gorm:"foreignKey:ScheduleID" json:"rooms,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (s *ExamSchedule) BeforeCreate(_ *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

// ExamRoom adalah ruang atau sesi pelaksanaan ujian dengan pengawas.
// Pengawas dipilih dari data guru (bukan role terpisah).
type ExamRoom struct {
	ID           uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	ScheduleID   uuid.UUID  `gorm:"type:uuid;not null;index" json:"schedule_id"`
	Name         string     `gorm:"size:150;not null" json:"name"`
	SupervisorID *uuid.UUID `gorm:"type:uuid;index" json:"supervisor_id,omitempty"`
	Capacity     int        `gorm:"default:0" json:"capacity"`
	Session      string     `gorm:"size:50" json:"session"`

	Supervisor *Teacher `gorm:"foreignKey:SupervisorID" json:"supervisor,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (r *ExamRoom) BeforeCreate(_ *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}

// ExamParticipant adalah alokasi seorang siswa ke jadwal ujian, unik per jadwal per siswa.
// Menyimpan status monitoring dan kontrol sesi dari sisi proktor.
// Status memakai not_started, ongoing, submitted, disconnected, atau flagged.
type ExamParticipant struct {
	ID          uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	ScheduleID  uuid.UUID  `gorm:"type:uuid;not null;index:idx_schedule_student,unique" json:"schedule_id"`
	StudentID   uuid.UUID  `gorm:"type:uuid;not null;index:idx_schedule_student,unique" json:"student_id"`
	RoomID      *uuid.UUID `gorm:"type:uuid;index" json:"room_id,omitempty"`
	Status      string     `gorm:"size:20;not null;default:'not_started'" json:"status"`
	LoginLocked bool       `gorm:"default:false" json:"login_locked"`
	AccessOpen  bool       `gorm:"default:true" json:"access_open"`
	ExtraMinute int        `gorm:"default:0" json:"extra_minute"`
	Score       *float64   `json:"score,omitempty"`
	StartedAt   *time.Time `json:"started_at,omitempty"`
	SubmittedAt *time.Time `json:"submitted_at,omitempty"`

	Student *Student  `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	Room    *ExamRoom `gorm:"foreignKey:RoomID" json:"room,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (p *ExamParticipant) BeforeCreate(_ *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

// ExamViolation adalah catatan pelanggaran peserta yang dikirim dari aplikasi mobile,
// contoh: percobaan keluar app, hilang fokus, atau perpindahan jaringan mencurigakan.
type ExamViolation struct {
	ID            uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	ParticipantID uuid.UUID  `gorm:"type:uuid;not null;index" json:"participant_id"`
	Type          string     `gorm:"size:50;not null" json:"type"`
	Detail        string     `gorm:"type:text" json:"detail"`
	OccurredAt    *time.Time `json:"occurred_at,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (v *ExamViolation) BeforeCreate(_ *gorm.DB) error {
	if v.ID == uuid.Nil {
		v.ID = uuid.New()
	}
	return nil
}
