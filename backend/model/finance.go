package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// PaymentType adalah jenis pembayaran, contoh "SPP", "Uang Gedung", "Seragam".
type PaymentType struct {
	ID            uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Name          string    `gorm:"size:150;not null" json:"name"`
	Description   string    `gorm:"type:text" json:"description"`
	DefaultAmount float64   `gorm:"default:0" json:"default_amount"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (p *PaymentType) BeforeCreate(_ *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

// Invoice adalah tagihan pembayaran untuk seorang siswa, difilter per kelas dan jurusan.
// Mendukung cicilan lewat kumpulan InvoicePayment. Status memakai unpaid, partial, atau paid.
type Invoice struct {
	ID             uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	StudentID      uuid.UUID  `gorm:"type:uuid;not null;index" json:"student_id"`
	PaymentTypeID  *uuid.UUID `gorm:"type:uuid;index" json:"payment_type_id,omitempty"`
	ClassID        *uuid.UUID `gorm:"type:uuid;index" json:"class_id,omitempty"`
	MajorID        *uuid.UUID `gorm:"type:uuid;index" json:"major_id,omitempty"`
	AcademicYearID *uuid.UUID `gorm:"type:uuid;index" json:"academic_year_id,omitempty"`
	Title          string     `gorm:"size:200;not null" json:"title"`
	TotalAmount    float64    `gorm:"not null;default:0" json:"total_amount"`
	PaidAmount     float64    `gorm:"not null;default:0" json:"paid_amount"`
	Status         string     `gorm:"size:20;not null;default:'unpaid'" json:"status"`
	DueDate        *time.Time `json:"due_date,omitempty"`
	Note           string     `gorm:"type:text" json:"note"`

	Student     *Student         `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	PaymentType *PaymentType     `gorm:"foreignKey:PaymentTypeID" json:"payment_type,omitempty"`
	Class       *Class           `gorm:"foreignKey:ClassID" json:"class,omitempty"`
	Major       *Major           `gorm:"foreignKey:MajorID" json:"major,omitempty"`
	Payments    []InvoicePayment `gorm:"foreignKey:InvoiceID" json:"payments,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (i *Invoice) BeforeCreate(_ *gorm.DB) error {
	if i.ID == uuid.Nil {
		i.ID = uuid.New()
	}
	return nil
}

// InvoicePayment adalah satu pembayaran atau cicilan terhadap sebuah tagihan.
// Kumpulan pembayaran membentuk rincian tagihan.
type InvoicePayment struct {
	ID        uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	InvoiceID uuid.UUID  `gorm:"type:uuid;not null;index" json:"invoice_id"`
	Amount    float64    `gorm:"not null;default:0" json:"amount"`
	Method    string     `gorm:"size:50" json:"method"`
	Note      string     `gorm:"type:text" json:"note"`
	PaidAt    *time.Time `json:"paid_at,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (p *InvoicePayment) BeforeCreate(_ *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}
