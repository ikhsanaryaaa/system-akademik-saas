package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Material adalah konten materi pembelajaran, difilter per kelas dan jurusan.
type Material struct {
	ID             uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	Title          string     `gorm:"size:200;not null" json:"title"`
	SubjectID      *uuid.UUID `gorm:"type:uuid;index" json:"subject_id,omitempty"`
	ClassID        *uuid.UUID `gorm:"type:uuid;index" json:"class_id,omitempty"`
	MajorID        *uuid.UUID `gorm:"type:uuid;index" json:"major_id,omitempty"`
	TeacherID      *uuid.UUID `gorm:"type:uuid;index" json:"teacher_id,omitempty"`
	Semester       int        `gorm:"default:1" json:"semester"`
	Content        string     `gorm:"type:text" json:"content"`
	AttachmentURL  string     `gorm:"size:255" json:"attachment_url"`
	AcademicYearID *uuid.UUID `gorm:"type:uuid;index" json:"academic_year_id,omitempty"`

	Subject *Subject `gorm:"foreignKey:SubjectID" json:"subject,omitempty"`
	Class   *Class   `gorm:"foreignKey:ClassID" json:"class,omitempty"`
	Major   *Major   `gorm:"foreignKey:MajorID" json:"major,omitempty"`
	Teacher *Teacher `gorm:"foreignKey:TeacherID" json:"teacher,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (m *Material) BeforeCreate(_ *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

// Assignment adalah tugas untuk siswa, difilter per kelas dan jurusan.
type Assignment struct {
	ID             uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	Title          string     `gorm:"size:200;not null" json:"title"`
	SubjectID      *uuid.UUID `gorm:"type:uuid;index" json:"subject_id,omitempty"`
	ClassID        *uuid.UUID `gorm:"type:uuid;index" json:"class_id,omitempty"`
	MajorID        *uuid.UUID `gorm:"type:uuid;index" json:"major_id,omitempty"`
	TeacherID      *uuid.UUID `gorm:"type:uuid;index" json:"teacher_id,omitempty"`
	Semester       int        `gorm:"default:1" json:"semester"`
	Description    string     `gorm:"type:text" json:"description"`
	MaxScore       float64    `gorm:"default:100" json:"max_score"`
	DueDate        *time.Time `json:"due_date,omitempty"`
	AcademicYearID *uuid.UUID `gorm:"type:uuid;index" json:"academic_year_id,omitempty"`

	Subject *Subject `gorm:"foreignKey:SubjectID" json:"subject,omitempty"`
	Class   *Class   `gorm:"foreignKey:ClassID" json:"class,omitempty"`
	Major   *Major   `gorm:"foreignKey:MajorID" json:"major,omitempty"`
	Teacher *Teacher `gorm:"foreignKey:TeacherID" json:"teacher,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (a *Assignment) BeforeCreate(_ *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}

// AssignmentSubmission adalah pengumpulan tugas oleh siswa, unik per tugas per siswa.
// Status memakai submitted atau graded.
type AssignmentSubmission struct {
	ID            uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	AssignmentID  uuid.UUID  `gorm:"type:uuid;not null;index:idx_assignment_student,unique" json:"assignment_id"`
	StudentID     uuid.UUID  `gorm:"type:uuid;not null;index:idx_assignment_student,unique" json:"student_id"`
	Content       string     `gorm:"type:text" json:"content"`
	AttachmentURL string     `gorm:"size:255" json:"attachment_url"`
	Score         *float64   `json:"score,omitempty"`
	Feedback      string     `gorm:"type:text" json:"feedback"`
	Status        string     `gorm:"size:20;not null;default:'submitted'" json:"status"`
	SubmittedAt   *time.Time `json:"submitted_at,omitempty"`

	Student *Student `gorm:"foreignKey:StudentID" json:"student,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (s *AssignmentSubmission) BeforeCreate(_ *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

// Quiz adalah kuis latihan untuk siswa, difilter per kelas dan jurusan.
type Quiz struct {
	ID             uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	Title          string     `gorm:"size:200;not null" json:"title"`
	SubjectID      *uuid.UUID `gorm:"type:uuid;index" json:"subject_id,omitempty"`
	ClassID        *uuid.UUID `gorm:"type:uuid;index" json:"class_id,omitempty"`
	MajorID        *uuid.UUID `gorm:"type:uuid;index" json:"major_id,omitempty"`
	TeacherID      *uuid.UUID `gorm:"type:uuid;index" json:"teacher_id,omitempty"`
	Semester       int        `gorm:"default:1" json:"semester"`
	Description    string     `gorm:"type:text" json:"description"`
	DurationMin    int        `gorm:"default:0" json:"duration_min"`
	StartAt        *time.Time `json:"start_at,omitempty"`
	EndAt          *time.Time `json:"end_at,omitempty"`
	AcademicYearID *uuid.UUID `gorm:"type:uuid;index" json:"academic_year_id,omitempty"`

	Subject   *Subject       `gorm:"foreignKey:SubjectID" json:"subject,omitempty"`
	Class     *Class         `gorm:"foreignKey:ClassID" json:"class,omitempty"`
	Major     *Major         `gorm:"foreignKey:MajorID" json:"major,omitempty"`
	Teacher   *Teacher       `gorm:"foreignKey:TeacherID" json:"teacher,omitempty"`
	Questions []QuizQuestion `gorm:"foreignKey:QuizID" json:"questions,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (q *Quiz) BeforeCreate(_ *gorm.DB) error {
	if q.ID == uuid.Nil {
		q.ID = uuid.New()
	}
	return nil
}

// QuizQuestion adalah satu soal pilihan ganda pada sebuah quiz.
// Answer memakai salah satu dari a, b, c, atau d.
type QuizQuestion struct {
	ID       uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	QuizID   uuid.UUID `gorm:"type:uuid;not null;index" json:"quiz_id"`
	Question string    `gorm:"type:text;not null" json:"question"`
	OptionA  string    `gorm:"type:text" json:"option_a"`
	OptionB  string    `gorm:"type:text" json:"option_b"`
	OptionC  string    `gorm:"type:text" json:"option_c"`
	OptionD  string    `gorm:"type:text" json:"option_d"`
	Answer   string    `gorm:"size:1" json:"answer"`
	Points   float64   `gorm:"default:1" json:"points"`
	Order    int       `gorm:"default:0" json:"order"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (q *QuizQuestion) BeforeCreate(_ *gorm.DB) error {
	if q.ID == uuid.Nil {
		q.ID = uuid.New()
	}
	return nil
}

// ForumThread adalah topik diskusi kelas, difilter per kelas dan jurusan.
type ForumThread struct {
	ID             uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	Title          string     `gorm:"size:200;not null" json:"title"`
	SubjectID      *uuid.UUID `gorm:"type:uuid;index" json:"subject_id,omitempty"`
	ClassID        *uuid.UUID `gorm:"type:uuid;index" json:"class_id,omitempty"`
	MajorID        *uuid.UUID `gorm:"type:uuid;index" json:"major_id,omitempty"`
	CreatedBy      string     `gorm:"size:120" json:"created_by"`
	Body           string     `gorm:"type:text" json:"body"`
	AcademicYearID *uuid.UUID `gorm:"type:uuid;index" json:"academic_year_id,omitempty"`

	Subject *Subject    `gorm:"foreignKey:SubjectID" json:"subject,omitempty"`
	Class   *Class      `gorm:"foreignKey:ClassID" json:"class,omitempty"`
	Major   *Major      `gorm:"foreignKey:MajorID" json:"major,omitempty"`
	Posts   []ForumPost `gorm:"foreignKey:ThreadID" json:"posts,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (t *ForumThread) BeforeCreate(_ *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}

// ForumPost adalah balasan pada sebuah thread diskusi.
type ForumPost struct {
	ID       uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	ThreadID uuid.UUID `gorm:"type:uuid;not null;index" json:"thread_id"`
	Author   string    `gorm:"size:120" json:"author"`
	Body     string    `gorm:"type:text;not null" json:"body"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (p *ForumPost) BeforeCreate(_ *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}
