package handler

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"
)

// Kolom tetap sebelum kolom komponen pada template impor.
const (
	kolomNIS  = 0
	kolomAwal = 2
)

// Template mengunduh file Excel yang kolomnya mengikuti komponen pada rencana,
// sudah terisi daftar siswa beserta nilai yang ada supaya guru tinggal melengkapi.
func (h *NilaiSiswaHandler) Template(c *gin.Context) {
	rencana, ok := h.muatRencana(c)
	if !ok {
		return
	}

	var siswa []model.Student
	h.db.Where("class_id = ?", rencana.KelasID).Order("name asc").Find(&siswa)

	komponenIDs := make([]uuid.UUID, 0, len(rencana.Komponen))
	for _, k := range rencana.Komponen {
		komponenIDs = append(komponenIDs, k.ID)
	}
	var nilai []model.NilaiSiswa
	if len(komponenIDs) > 0 {
		h.db.Where("komponen_id IN ?", komponenIDs).Find(&nilai)
	}
	nilaiPer := make(map[[2]uuid.UUID]*float64, len(nilai))
	for _, n := range nilai {
		nilaiPer[[2]uuid.UUID{n.KomponenID, n.SiswaID}] = n.Nilai
	}

	f := excelize.NewFile()
	defer f.Close()
	sheet := f.GetSheetName(0)

	// Baris pertama adalah header. Nama kolom komponen dicocokkan lagi saat impor.
	_ = f.SetCellValue(sheet, "A1", "NIS")
	_ = f.SetCellValue(sheet, "B1", "Nama")
	for i, k := range rencana.Komponen {
		cell, _ := excelize.CoordinatesToCellName(kolomAwal+i+1, 1)
		_ = f.SetCellValue(sheet, cell, k.Nama)
	}

	for baris, s := range siswa {
		nomor := baris + 2
		_ = f.SetCellValue(sheet, fmt.Sprintf("A%d", nomor), s.NIS)
		_ = f.SetCellValue(sheet, fmt.Sprintf("B%d", nomor), s.Name)
		for i, k := range rencana.Komponen {
			cell, _ := excelize.CoordinatesToCellName(kolomAwal+i+1, nomor)
			if n := nilaiPer[[2]uuid.UUID{k.ID, s.ID}]; n != nil {
				_ = f.SetCellValue(sheet, cell, *n)
			}
		}
	}

	nama := fmt.Sprintf("template-nilai-%s.xlsx", rencana.ID.String()[:8])
	c.Header("Content-Disposition", `attachment; filename="`+nama+`"`)
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	if err := f.Write(c.Writer); err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal membuat template", nil)
	}
}

type barisGagal struct {
	Baris  int    `json:"baris"`
	NIS    string `json:"nis"`
	Alasan string `json:"alasan"`
}

// Impor membaca file Excel dan menyimpan nilai per baris. Baris yang salah
// dilaporkan beserta alasannya tanpa membatalkan baris yang valid.
func (h *NilaiSiswaHandler) Impor(c *gin.Context) {
	rencana, ok := h.muatRencana(c)
	if !ok {
		return
	}
	if rencana.Terkunci() {
		response.Error(c, http.StatusConflict, "Nilai sudah dikunci dan tidak bisa diimpor", nil)
		return
	}

	berkas, err := c.FormFile("file")
	if err != nil {
		response.Error(c, http.StatusBadRequest, "File impor tidak ditemukan", nil)
		return
	}
	dibuka, err := berkas.Open()
	if err != nil {
		response.Error(c, http.StatusBadRequest, "File impor tidak bisa dibuka", nil)
		return
	}
	defer dibuka.Close()

	f, err := excelize.OpenReader(dibuka)
	if err != nil {
		response.Error(c, http.StatusUnprocessableEntity, "File bukan format Excel yang valid", nil)
		return
	}
	defer f.Close()

	rows, err := f.GetRows(f.GetSheetName(0))
	if err != nil || len(rows) < 2 {
		response.Error(c, http.StatusUnprocessableEntity, "File tidak berisi data nilai", nil)
		return
	}

	// Kolom dicocokkan lewat nama header, bukan posisi, supaya urutan kolom yang
	// bergeser tidak menyimpan nilai ke komponen yang salah.
	header := rows[0]
	kolomKomponen := make(map[int]uuid.UUID)
	for i := kolomAwal; i < len(header); i++ {
		judul := strings.TrimSpace(header[i])
		for _, k := range rencana.Komponen {
			if strings.EqualFold(judul, strings.TrimSpace(k.Nama)) {
				kolomKomponen[i] = k.ID
				break
			}
		}
	}
	if len(kolomKomponen) == 0 {
		response.Error(c, http.StatusUnprocessableEntity,
			"Tidak ada kolom yang cocok dengan komponen pada rencana ini", nil)
		return
	}

	var siswa []model.Student
	h.db.Where("class_id = ?", rencana.KelasID).Find(&siswa)
	siswaPerNIS := make(map[string]uuid.UUID, len(siswa))
	for _, s := range siswa {
		siswaPerNIS[strings.TrimSpace(s.NIS)] = s.ID
	}

	pelaku := userIDDariContext(c)
	gagal := make([]barisGagal, 0)
	entries := make([]nilaiEntry, 0)
	siswaTersentuh := make(map[uuid.UUID]bool)

	for i, row := range rows[1:] {
		nomorBaris := i + 2
		if len(row) <= kolomNIS {
			continue
		}
		nis := strings.TrimSpace(row[kolomNIS])
		if nis == "" {
			continue
		}
		siswaID, ada := siswaPerNIS[nis]
		if !ada {
			gagal = append(gagal, barisGagal{Baris: nomorBaris, NIS: nis,
				Alasan: "NIS tidak ditemukan pada kelas ini"})
			continue
		}

		barisValid := true
		barisEntries := make([]nilaiEntry, 0, len(kolomKomponen))
		for kolom, komponenID := range kolomKomponen {
			if kolom >= len(row) {
				continue
			}
			teks := strings.TrimSpace(row[kolom])
			if teks == "" {
				// Sel kosong berarti belum dinilai, bukan nol, jadi dilewati
				// supaya impor tidak menghapus nilai yang sudah ada.
				continue
			}
			angka, err := strconv.ParseFloat(strings.ReplaceAll(teks, ",", "."), 64)
			if err != nil {
				gagal = append(gagal, barisGagal{Baris: nomorBaris, NIS: nis,
					Alasan: "Nilai " + teks + " bukan angka"})
				barisValid = false
				break
			}
			if angka < 0 || angka > 100 {
				gagal = append(gagal, barisGagal{Baris: nomorBaris, NIS: nis,
					Alasan: "Nilai " + teks + " di luar rentang 0 sampai 100"})
				barisValid = false
				break
			}
			nilai := angka
			barisEntries = append(barisEntries, nilaiEntry{
				KomponenID: komponenID, SiswaID: siswaID, Nilai: &nilai,
			})
		}
		if !barisValid {
			continue
		}
		entries = append(entries, barisEntries...)
		if len(barisEntries) > 0 {
			siswaTersentuh[siswaID] = true
		}
	}

	if len(entries) > 0 {
		err = h.db.Transaction(func(tx *gorm.DB) error {
			for _, e := range entries {
				if err := simpanSatuNilai(tx, e, pelaku); err != nil {
					return err
				}
			}
			for siswaID := range siswaTersentuh {
				if err := hitungNilaiAkhir(tx, rencana, siswaID); err != nil {
					return err
				}
			}
			return nil
		})
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "Gagal menyimpan hasil impor", nil)
			return
		}
	}

	response.OK(c, "Impor selesai", gin.H{
		"tersimpan":    len(entries),
		"siswa_diubah": len(siswaTersentuh),
		"baris_gagal":  gagal,
	})
}

// Raport mengembalikan nilai seluruh mata pelajaran seorang siswa pada satu
// semester, bersumber dari report_card_scores. Dipakai halaman cetak.
func (h *NilaiSiswaHandler) Raport(c *gin.Context) {
	siswaID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "ID siswa tidak valid", nil)
		return
	}
	tahunID, errTahun := uuid.Parse(c.Query("tahun_ajaran_id"))
	semester, _ := strconv.Atoi(c.Query("semester"))
	if errTahun != nil || semester == 0 {
		response.Error(c, http.StatusBadRequest, "Tahun ajaran dan semester wajib diisi", nil)
		return
	}

	var siswa model.Student
	if err := h.db.Preload("Class").First(&siswa, "id = ?", siswaID).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Siswa tidak ditemukan", nil)
		return
	}

	var baris []model.ReportCardScore
	h.db.Preload("Subject").
		Where("student_id = ? AND academic_year_id = ? AND semester = ?", siswaID, tahunID, semester).
		Find(&baris)

	type mapelRow struct {
		MataPelajaran string  `json:"mata_pelajaran"`
		Pengetahuan   float64 `json:"pengetahuan"`
		Keterampilan  float64 `json:"keterampilan"`
		Deskripsi     string  `json:"deskripsi"`
	}
	rows := make([]mapelRow, 0, len(baris))
	total := 0.0
	for _, b := range baris {
		row := mapelRow{
			Pengetahuan:  b.KnowledgeScore,
			Keterampilan: b.SkillScore,
			Deskripsi:    b.Description,
		}
		if b.Subject != nil {
			row.MataPelajaran = b.Subject.Name
		}
		total += b.KnowledgeScore
		rows = append(rows, row)
	}
	rata := 0.0
	if len(rows) > 0 {
		rata = total / float64(len(rows))
	}

	var tahun model.AcademicYear
	h.db.First(&tahun, "id = ?", tahunID)

	kelas := ""
	if siswa.Class != nil {
		kelas = siswa.Class.Name
	}

	response.OK(c, "Raport siswa", gin.H{
		"siswa": gin.H{
			"id": siswa.ID, "nama": siswa.Name, "nis": siswa.NIS,
			"nisn": siswa.NISN, "kelas": kelas,
		},
		"tahun_ajaran":   tahun.Name,
		"semester":       semester,
		"mata_pelajaran": rows,
		"rata_rata":      rata,
	})
}

// simpanSatuNilai menyimpan satu nilai beserta jejak auditnya.
// Dipakai bersama oleh batch save dan impor Excel supaya aturannya tidak berbeda.
func simpanSatuNilai(tx *gorm.DB, e nilaiEntry, pelaku *uuid.UUID) error {
	var lama model.NilaiSiswa
	adaLama := tx.First(&lama, "komponen_id = ? AND siswa_id = ?", e.KomponenID, e.SiswaID).Error == nil

	if adaLama {
		updates := map[string]any{"nilai": e.Nilai, "catatan": e.Catatan}
		if err := tx.Model(&model.NilaiSiswa{}).Where("id = ?", lama.ID).Updates(updates).Error; err != nil {
			return err
		}
	} else {
		baris := model.NilaiSiswa{
			KomponenID: e.KomponenID,
			SiswaID:    e.SiswaID,
			Nilai:      e.Nilai,
			Catatan:    e.Catatan,
		}
		if err := tx.Create(&baris).Error; err != nil {
			return err
		}
	}

	audit := model.AuditNilai{
		KomponenID: e.KomponenID,
		SiswaID:    e.SiswaID,
		NilaiBaru:  e.Nilai,
	}
	if adaLama {
		audit.NilaiLama = lama.Nilai
	}
	if pelaku != nil {
		audit.UserID = *pelaku
	}
	return tx.Create(&audit).Error
}
