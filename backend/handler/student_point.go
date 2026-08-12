package handler

import (
	"github.com/google/uuid"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"gorm.io/gorm"
)

// studentContext mengambil kelas dan jurusan milik siswa terpilih beserta tahun
// ajaran aktif. Handler BK dan kesiswaan memakai ini supaya nilai kelas dan
// jurusan pada catatan tidak dapat bertentangan dengan siswa yang dipilih.
// Kolomnya tetap disimpan per catatan karena berfungsi sebagai rekaman kondisi
// siswa saat kejadian, bukan cerminan kelas siswa saat ini.
func studentContext(db *gorm.DB, studentID uuid.UUID) (classID, majorID, yearID *uuid.UUID, err error) {
	var student model.Student
	if err = db.Select("class_id", "major_id").First(&student, "id = ?", studentID).Error; err != nil {
		return nil, nil, nil, err
	}
	return student.ClassID, student.MajorID, activeAcademicYearID(db), nil
}

// activeAcademicYearID mengambil tahun ajaran aktif, atau nil bila belum ada.
func activeAcademicYearID(db *gorm.DB) *uuid.UUID {
	var year model.AcademicYear
	if db.Select("id").First(&year, "is_active = ?", true).Error != nil {
		return nil
	}
	return &year.ID
}

// studentPoint menghitung akumulasi poin seorang siswa pada satu tahun ajaran,
// yaitu total poin pelanggaran dikurangi poin prestasi, dengan batas bawah nol.
// Bila tahun ajaran aktif belum diatur, seluruh riwayat ikut dihitung supaya
// angkanya tidak kosong.
func studentPoint(db *gorm.DB, studentID uuid.UUID, yearID *uuid.UUID) (int, error) {
	withYear := func(q *gorm.DB, table string) *gorm.DB {
		if yearID == nil {
			return q
		}
		return q.Where(table+".academic_year_id = ?", *yearID)
	}

	var violation, achievement int
	q := db.Model(&model.ViolationRecord{}).
		Joins("JOIN violation_types vt ON vt.id = violation_records.violation_type_id").
		Where("violation_records.student_id = ?", studentID)
	if err := withYear(q, "violation_records").Select("COALESCE(SUM(vt.point), 0)").Scan(&violation).Error; err != nil {
		return 0, err
	}

	q = db.Model(&model.Achievement{}).Where("achievements.student_id = ?", studentID)
	if err := withYear(q, "achievements").Select("COALESCE(SUM(achievements.point), 0)").Scan(&achievement).Error; err != nil {
		return 0, err
	}

	total := violation - achievement
	if total < 0 {
		total = 0
	}
	return total, nil
}

// sanctionFor mengambil tahap sanksi tertinggi yang ambang poinnya sudah
// terlampaui. Mengembalikan nil bila poin masih di bawah seluruh ambang.
func sanctionFor(db *gorm.DB, point int) *model.SanctionLevel {
	var level model.SanctionLevel
	if db.Where("min_point <= ?", point).Order("min_point desc").First(&level).Error != nil {
		return nil
	}
	return &level
}
