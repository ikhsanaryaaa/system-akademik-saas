package migration

import (
	"log"
	"strings"

	"github.com/google/uuid"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"gorm.io/gorm"
)

// konteksKey adalah kombinasi yang membedakan satu rencana penilaian dari yang lain.
type konteksKey struct {
	tahunAjaranID uuid.UUID
	semester      int
	kelasID       uuid.UUID
	mapelID       uuid.UUID
}

// BackfillPenilaian memindahkan data assessments lama ke struktur rencana penilaian.
// Tiap kombinasi tahun ajaran, semester, kelas, dan mata pelajaran jadi satu rencana,
// dan tiap baris assessments jadi satu komponen di dalamnya.
// Idempotent: berhenti kalau rencana_penilaian sudah terisi.
func BackfillPenilaian(db *gorm.DB) error {
	var sudahAda int64
	if err := db.Model(&model.RencanaPenilaian{}).Count(&sudahAda).Error; err != nil {
		return err
	}
	if sudahAda > 0 {
		log.Println("migration: backfill penilaian sudah jalan, dilewati")
		return nil
	}

	var assessments []model.Assessment
	if err := db.Order("created_at asc").Find(&assessments).Error; err != nil {
		return err
	}
	if len(assessments) == 0 {
		log.Println("migration: tidak ada assessments lama, backfill penilaian dilewati")
		return nil
	}

	log.Printf("migration: memulai backfill penilaian dari %d assessments", len(assessments))

	return db.Transaction(func(tx *gorm.DB) error {
		// Peta guru pengampu per pasangan kelas dan mata pelajaran.
		var mapping []model.ClassSubject
		if err := tx.Find(&mapping).Error; err != nil {
			return err
		}
		guruPer := make(map[[2]uuid.UUID]*uuid.UUID, len(mapping))
		for _, m := range mapping {
			guruPer[[2]uuid.UUID{m.ClassID, m.SubjectID}] = m.TeacherID
		}

		rencanaPer := make(map[konteksKey]uuid.UUID)
		urutanPer := make(map[uuid.UUID]int)
		tanpaGuru := 0

		for _, a := range assessments {
			key := konteksKey{
				tahunAjaranID: a.AcademicYearID,
				semester:      a.Semester,
				kelasID:       a.ClassID,
				mapelID:       a.SubjectID,
			}

			rencanaID, ada := rencanaPer[key]
			if !ada {
				guruID := guruPer[[2]uuid.UUID{a.ClassID, a.SubjectID}]
				if guruID == nil {
					tanpaGuru++
					log.Printf("migration: warning rencana untuk kelas %s mapel %s tidak punya guru pengampu di class_subjects", a.ClassID, a.SubjectID)
				}
				rencana := model.RencanaPenilaian{
					TahunAjaranID:   a.AcademicYearID,
					Semester:        a.Semester,
					MataPelajaranID: a.SubjectID,
					KelasID:         a.ClassID,
					GuruID:          guruID,
					Status:          model.RencanaStatusAktif,
					KKTP:            70,
				}
				if err := tx.Create(&rencana).Error; err != nil {
					return err
				}
				rencanaID = rencana.ID
				rencanaPer[key] = rencanaID
			}

			komponen := model.KomponenPenilaian{
				RencanaID: rencanaID,
				Nama:      a.Title,
				Jenis:     jenisDariTipeLama(a.Type),
				Bobot:     a.Weight,
				Urutan:    urutanPer[rencanaID],
			}
			if err := tx.Create(&komponen).Error; err != nil {
				return err
			}
			urutanPer[rencanaID]++

			// Salin nilai milik assessment ini ke komponen yang baru dibuat.
			var scores []model.AssessmentScore
			if err := tx.Where("assessment_id = ?", a.ID).Find(&scores).Error; err != nil {
				return err
			}
			for _, s := range scores {
				nilai := s.Score
				baris := model.NilaiSiswa{
					KomponenID: komponen.ID,
					SiswaID:    s.StudentID,
					Nilai:      &nilai,
					Catatan:    s.Note,
				}
				if err := tx.Create(&baris).Error; err != nil {
					return err
				}
			}
		}

		log.Printf("migration: backfill penilaian selesai, %d rencana dibuat, %d tanpa guru pengampu", len(rencanaPer), tanpaGuru)
		return nil
	})
}

// jenisDariTipeLama memetakan kolom type pada assessments lama ke jenis komponen baru.
// Tipe lama berupa teks bebas seperti "ulangan harian", "tugas", "uts", "uas",
// jadi pemetaan dilakukan lewat pencocokan kata kunci.
func jenisDariTipeLama(tipe string) string {
	t := strings.ToLower(strings.TrimSpace(tipe))
	switch {
	case strings.Contains(t, "uas"), strings.Contains(t, "pas"), strings.Contains(t, "akhir semester"):
		return model.JenisSumatifAkhirSemester
	case strings.Contains(t, "tugas"), strings.Contains(t, "formatif"), strings.Contains(t, "praktik"):
		return model.JenisFormatif
	default:
		return model.JenisSumatifLingkupMateri
	}
}
