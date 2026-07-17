package handler

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
	"gorm.io/gorm"
)

// ---- PaymentType (Jenis Pembayaran) ----

type PaymentTypeHandler struct {
	db *gorm.DB
}

func NewPaymentTypeHandler(db *gorm.DB) *PaymentTypeHandler {
	return &PaymentTypeHandler{db: db}
}

type paymentTypeRequest struct {
	Name          string  `json:"name" binding:"required"`
	Description   string  `json:"description"`
	DefaultAmount float64 `json:"default_amount" binding:"min=0"`
}

func (h *PaymentTypeHandler) List(c *gin.Context) {
	var items []model.PaymentType
	if err := h.db.Order("name asc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil jenis pembayaran", nil)
		return
	}
	response.OK(c, "Daftar jenis pembayaran", items)
}

func (h *PaymentTypeHandler) Create(c *gin.Context) {
	var req paymentTypeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	item := model.PaymentType{Name: req.Name, Description: req.Description, DefaultAmount: req.DefaultAmount}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan jenis pembayaran", nil)
		return
	}
	response.Created(c, "Jenis pembayaran dibuat", item)
}

func (h *PaymentTypeHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req paymentTypeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.PaymentType
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Jenis pembayaran tidak ditemukan", nil)
		return
	}
	item.Name = req.Name
	item.Description = req.Description
	item.DefaultAmount = req.DefaultAmount
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan jenis pembayaran", nil)
		return
	}
	response.OK(c, "Jenis pembayaran diperbarui", item)
}

func (h *PaymentTypeHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.Delete(&model.PaymentType{}, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus jenis pembayaran", nil)
		return
	}
	response.OK(c, "Jenis pembayaran dihapus", nil)
}

// ---- Invoice (Tagihan) ----

type InvoiceHandler struct {
	db *gorm.DB
}

func NewInvoiceHandler(db *gorm.DB) *InvoiceHandler {
	return &InvoiceHandler{db: db}
}

type invoiceRequest struct {
	StudentID      uuid.UUID  `json:"student_id" binding:"required"`
	PaymentTypeID  *uuid.UUID `json:"payment_type_id"`
	ClassID        *uuid.UUID `json:"class_id"`
	MajorID        *uuid.UUID `json:"major_id"`
	AcademicYearID *uuid.UUID `json:"academic_year_id"`
	Title          string     `json:"title" binding:"required"`
	TotalAmount    float64    `json:"total_amount" binding:"min=0"`
	DueDate        *time.Time `json:"due_date"`
	Note           string     `json:"note"`
}

// invoiceStatus menentukan status tagihan dari total dan jumlah terbayar.
func invoiceStatus(total, paid float64) string {
	switch {
	case paid <= 0:
		return "unpaid"
	case paid >= total:
		return "paid"
	default:
		return "partial"
	}
}

func (h *InvoiceHandler) List(c *gin.Context) {
	q := h.db.Model(&model.Invoice{}).
		Preload("Student").Preload("PaymentType").Preload("Class").Preload("Major")
	if v := c.Query("class_id"); v != "" {
		q = q.Where("class_id = ?", v)
	}
	if v := c.Query("major_id"); v != "" {
		q = q.Where("major_id = ?", v)
	}
	if v := c.Query("student_id"); v != "" {
		q = q.Where("student_id = ?", v)
	}
	if v := c.Query("status"); v != "" {
		q = q.Where("status = ?", v)
	}
	if v := c.Query("academic_year_id"); v != "" {
		q = q.Where("academic_year_id = ?", v)
	}
	var items []model.Invoice
	if err := q.Order("created_at desc").Find(&items).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal mengambil tagihan", nil)
		return
	}
	response.OK(c, "Daftar tagihan", items)
}

func (h *InvoiceHandler) Detail(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var item model.Invoice
	if err := h.db.
		Preload("Student").Preload("PaymentType").Preload("Class").Preload("Major").
		Preload("Payments", func(db *gorm.DB) *gorm.DB { return db.Order("created_at asc") }).
		First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Tagihan tidak ditemukan", nil)
		return
	}
	response.OK(c, "Detail tagihan", item)
}

func (h *InvoiceHandler) Create(c *gin.Context) {
	var req invoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	item := model.Invoice{
		StudentID:      req.StudentID,
		PaymentTypeID:  req.PaymentTypeID,
		ClassID:        req.ClassID,
		MajorID:        req.MajorID,
		AcademicYearID: req.AcademicYearID,
		Title:          req.Title,
		TotalAmount:    req.TotalAmount,
		PaidAmount:     0,
		Status:         invoiceStatus(req.TotalAmount, 0),
		DueDate:        req.DueDate,
		Note:           req.Note,
	}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan tagihan", nil)
		return
	}
	response.Created(c, "Tagihan dibuat", item)
}

func (h *InvoiceHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	var req invoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	var item model.Invoice
	if err := h.db.First(&item, "id = ?", id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Tagihan tidak ditemukan", nil)
		return
	}
	item.StudentID = req.StudentID
	item.PaymentTypeID = req.PaymentTypeID
	item.ClassID = req.ClassID
	item.MajorID = req.MajorID
	item.AcademicYearID = req.AcademicYearID
	item.Title = req.Title
	item.TotalAmount = req.TotalAmount
	item.DueDate = req.DueDate
	item.Note = req.Note
	// Status disesuaikan ulang bila total berubah, memakai jumlah terbayar terkini.
	item.Status = invoiceStatus(item.TotalAmount, item.PaidAmount)
	if err := h.db.Save(&item).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan tagihan", nil)
		return
	}
	response.OK(c, "Tagihan diperbarui", item)
}

func (h *InvoiceHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	err = h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("invoice_id = ?", id).Delete(&model.InvoicePayment{}).Error; err != nil {
			return err
		}
		return tx.Delete(&model.Invoice{}, "id = ?", id).Error
	})
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus tagihan", nil)
		return
	}
	response.OK(c, "Tagihan dihapus", nil)
}

type invoicePaymentRequest struct {
	Amount float64    `json:"amount" binding:"required,gt=0"`
	Method string     `json:"method"`
	Note   string     `json:"note"`
	PaidAt *time.Time `json:"paid_at"`
}

// recalcInvoice menghitung ulang jumlah terbayar dan status tagihan dari rincian pembayaran.
func recalcInvoice(tx *gorm.DB, invoiceID uuid.UUID) error {
	var invoice model.Invoice
	if err := tx.First(&invoice, "id = ?", invoiceID).Error; err != nil {
		return err
	}
	var paid float64
	if err := tx.Model(&model.InvoicePayment{}).
		Where("invoice_id = ?", invoiceID).
		Select("COALESCE(SUM(amount), 0)").Scan(&paid).Error; err != nil {
		return err
	}
	invoice.PaidAmount = paid
	invoice.Status = invoiceStatus(invoice.TotalAmount, paid)
	return tx.Save(&invoice).Error
}

// AddPayment mencatat satu pembayaran atau cicilan lalu menghitung ulang status tagihan.
func (h *InvoiceHandler) AddPayment(c *gin.Context) {
	invoiceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	if err := h.db.First(&model.Invoice{}, "id = ?", invoiceID).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Tagihan tidak ditemukan", nil)
		return
	}
	var req invoicePaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}
	paidAt := req.PaidAt
	if paidAt == nil {
		now := time.Now()
		paidAt = &now
	}
	payment := model.InvoicePayment{
		InvoiceID: invoiceID,
		Amount:    req.Amount,
		Method:    req.Method,
		Note:      req.Note,
		PaidAt:    paidAt,
	}
	err = h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&payment).Error; err != nil {
			return err
		}
		return recalcInvoice(tx, invoiceID)
	})
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan pembayaran", nil)
		return
	}
	response.Created(c, "Pembayaran dicatat", payment)
}

// DeletePayment menghapus satu pembayaran lalu menghitung ulang status tagihan.
func (h *InvoiceHandler) DeletePayment(c *gin.Context) {
	invoiceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	paymentID, err := uuid.Parse(c.Param("paymentId"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	err = h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("id = ? AND invoice_id = ?", paymentID, invoiceID).
			Delete(&model.InvoicePayment{}).Error; err != nil {
			return err
		}
		return recalcInvoice(tx, invoiceID)
	})
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menghapus pembayaran", nil)
		return
	}
	response.OK(c, "Pembayaran dihapus", nil)
}

// rupiah memformat angka menjadi string mata uang, contoh 1500000 menjadi "Rp1.500.000".
func rupiah(v float64) string {
	n := int64(v)
	neg := n < 0
	if neg {
		n = -n
	}
	s := fmt.Sprintf("%d", n)
	var out []byte
	for i, digit := range []byte(s) {
		if i > 0 && (len(s)-i)%3 == 0 {
			out = append(out, '.')
		}
		out = append(out, digit)
	}
	prefix := "Rp"
	if neg {
		prefix = "-Rp"
	}
	return prefix + string(out)
}

// Message menyusun teks pesan tagihan atau konfirmasi pembayaran untuk sebuah tagihan.
// Pengiriman via WhatsApp gateway ditangani modul terpisah, endpoint ini hanya menyusun teksnya.
func (h *InvoiceHandler) Message(c *gin.Context) {
	invoiceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID tidak valid", nil)
		return
	}
	kind := c.DefaultQuery("kind", "billing")
	if kind != "billing" && kind != "confirmation" {
		response.Error(c, http.StatusBadRequest, "Parameter kind harus billing atau confirmation", nil)
		return
	}
	var invoice model.Invoice
	if err := h.db.Preload("Student").First(&invoice, "id = ?", invoiceID).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Tagihan tidak ditemukan", nil)
		return
	}
	name := "-"
	if invoice.Student != nil {
		name = invoice.Student.Name
	}
	remaining := invoice.TotalAmount - invoice.PaidAmount
	if remaining < 0 {
		remaining = 0
	}

	var text string
	if kind == "confirmation" {
		text = fmt.Sprintf(
			"Yth. Orang Tua/Wali %s,\nTerima kasih, pembayaran untuk tagihan %s telah kami terima.\nTerbayar: %s dari total %s.\nSisa tagihan: %s.",
			name, invoice.Title, rupiah(invoice.PaidAmount), rupiah(invoice.TotalAmount), rupiah(remaining),
		)
	} else {
		text = fmt.Sprintf(
			"Yth. Orang Tua/Wali %s,\nKami informasikan tagihan %s sebesar %s.\nSudah terbayar: %s.\nSisa tagihan: %s.\nMohon segera diselesaikan. Terima kasih.",
			name, invoice.Title, rupiah(invoice.TotalAmount), rupiah(invoice.PaidAmount), rupiah(remaining),
		)
	}
	response.OK(c, "Teks pesan disusun", gin.H{"kind": kind, "message": text})
}

// ---- Laporan Keuangan ----

type FinanceReportHandler struct {
	db *gorm.DB
}

func NewFinanceReportHandler(db *gorm.DB) *FinanceReportHandler {
	return &FinanceReportHandler{db: db}
}

// Report mengembalikan rekap keuangan: total tagihan, total terbayar, sisa,
// dan jumlah tagihan per status, dapat difilter per kelas dan jurusan.
func (h *FinanceReportHandler) Report(c *gin.Context) {
	classID := c.Query("class_id")
	majorID := c.Query("major_id")
	academicYearID := c.Query("academic_year_id")

	applyFilter := func(q *gorm.DB) *gorm.DB {
		if classID != "" {
			q = q.Where("class_id = ?", classID)
		}
		if majorID != "" {
			q = q.Where("major_id = ?", majorID)
		}
		if academicYearID != "" {
			q = q.Where("academic_year_id = ?", academicYearID)
		}
		return q
	}

	var totals struct {
		TotalAmount float64
		PaidAmount  float64
	}
	applyFilter(h.db.Model(&model.Invoice{})).
		Select("COALESCE(SUM(total_amount), 0) as total_amount, COALESCE(SUM(paid_amount), 0) as paid_amount").
		Scan(&totals)

	var unpaid, partial, paid int64
	applyFilter(h.db.Model(&model.Invoice{})).Where("status = ?", "unpaid").Count(&unpaid)
	applyFilter(h.db.Model(&model.Invoice{})).Where("status = ?", "partial").Count(&partial)
	applyFilter(h.db.Model(&model.Invoice{})).Where("status = ?", "paid").Count(&paid)

	outstanding := totals.TotalAmount - totals.PaidAmount
	if outstanding < 0 {
		outstanding = 0
	}

	response.OK(c, "Laporan keuangan", gin.H{
		"total_amount":       totals.TotalAmount,
		"paid_amount":        totals.PaidAmount,
		"outstanding_amount": outstanding,
		"unpaid_count":       unpaid,
		"partial_count":      partial,
		"paid_count":         paid,
	})
}
