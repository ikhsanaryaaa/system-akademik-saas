package seeder

import (
	"fmt"
	"time"

	"github.com/ikhsanaryaaa/system-akademik-saas/backend/model"
	"gorm.io/gorm"
)

type dummySubject struct {
	Code, Name, Category string
	Majors               []string
}

type scheduleSlot struct {
	Day, Period         int
	Start, End, Subject string
}

var (
	firstNamesL = []string{"Budi", "Agus", "Dedi", "Eko", "Fajar", "Gunawan", "Hendra", "Irfan", "Joko", "Krisna", "Lukman", "Mahdi", "Nanda", "Oki", "Putra", "Rizki", "Slamet", "Teguh", "Umar", "Wahyu", "Yusuf", "Zaki", "Andi", "Bayu", "Candra"}
	firstNamesP = []string{"Ayu", "Bella", "Citra", "Dewi", "Eka", "Fitri", "Gita", "Hesti", "Indah", "Juwita", "Kartika", "Lestari", "Mega", "Nurul", "Oktavia", "Puspita", "Rina", "Sari", "Tari", "Utami", "Vina", "Wulan", "Yanti", "Zahra", "Anisa"}
	lastNames   = []string{"Santoso", "Wijaya", "Kurniawan", "Pratama", "Nugroho", "Saputra", "Hidayat", "Ramadhan", "Setiawan", "Halim", "Firmansyah", "Maulana", "Purnomo", "Suryana", "Gunawan", "Permana", "Wibowo", "Handoko", "Kusuma", "Lesmana"}
)

// fullName menghasilkan nama realistis dari kombinasi first + last name.
// gender "L"/"P" memilih pool depan; offset memisahkan set (guru/staff/siswa) agar tidak seragam.
func fullName(gender string, index, offset int) string {
	first := firstNamesL
	if gender == "P" {
		first = firstNamesP
	}
	return first[(index)%len(first)] + " " + lastNames[(index*7+offset)%len(lastNames)]
}

var dummySubjects = []dummySubject{
	{Code: "PAI", Name: "Pendidikan Agama Islam", Category: "wajib"},
	{Code: "PPKN", Name: "Pendidikan Pancasila", Category: "wajib"},
	{Code: "BIN", Name: "Bahasa Indonesia", Category: "wajib"},
	{Code: "MTK", Name: "Matematika", Category: "wajib"},
	{Code: "BIG", Name: "Bahasa Inggris", Category: "wajib"},
	{Code: "PJOK", Name: "Pendidikan Jasmani", Category: "wajib"},
	{Code: "SEJ", Name: "Sejarah Indonesia", Category: "wajib"},
	{Code: "INF", Name: "Informatika", Category: "wajib"},
	{Code: "KWU", Name: "Projek Kreatif dan Kewirausahaan", Category: "wajib"},
	{Code: "TJKT", Name: "Teknik Jaringan Komputer dan Telekomunikasi", Category: "produktif", Majors: []string{"TKJ"}},
	{Code: "ASJ", Name: "Administrasi Sistem Jaringan", Category: "produktif", Majors: []string{"TKJ"}},
	{Code: "TKRO", Name: "Teknik Kendaraan Ringan Otomotif", Category: "produktif", Majors: []string{"TKR"}},
	{Code: "PMKR", Name: "Pemeliharaan Mesin Kendaraan Ringan", Category: "produktif", Majors: []string{"TKR"}},
	{Code: "MPLB", Name: "Manajemen Perkantoran dan Layanan Bisnis", Category: "produktif", Majors: []string{"MPLB"}},
	{Code: "OTKP", Name: "Otomatisasi Tata Kelola Perkantoran", Category: "produktif", Majors: []string{"MPLB"}},
}

func buildWeeklySchedule(subjectCodes []string, offset int) []scheduleSlot {
	times := [][2]string{{"07:00", "08:20"}, {"08:20", "09:40"}, {"10:00", "11:20"}, {"11:20", "12:40"}, {"13:20", "14:40"}}
	rows := make([]scheduleSlot, 0, 30)
	for day := 1; day <= 6; day++ {
		for period, slot := range times {
			rows = append(rows, scheduleSlot{Day: day, Period: period, Start: slot[0], End: slot[1], Subject: subjectCodes[((day-1)*len(times)+period+offset)%len(subjectCodes)]})
		}
	}
	return rows
}

func seedDummy(db *gorm.DB) error {
	return db.Transaction(func(tx *gorm.DB) error {
		year := model.AcademicYear{Name: "2026/2027", IsActive: true}
		if err := tx.Where("name = ?", year.Name).FirstOrCreate(&year).Error; err != nil {
			return err
		}

		grades := make(map[string]model.GradeLevel)
		for i, code := range []string{"X", "XI", "XII"} {
			row := model.GradeLevel{Code: code, Name: "Kelas " + code, Order: i + 10}
			if err := tx.Where("code = ?", code).FirstOrCreate(&row).Error; err != nil {
				return err
			}
			grades[code] = row
		}

		majorNames := map[string]string{"TKJ": "Teknik Komputer dan Jaringan", "TKR": "Teknik Kendaraan Ringan", "MPLB": "Manajemen Perkantoran dan Layanan Bisnis"}
		majors := make(map[string]model.Major)
		for _, code := range []string{"TKJ", "TKR", "MPLB"} {
			row := model.Major{Code: code, Name: majorNames[code]}
			if err := tx.Where("code = ?", code).FirstOrCreate(&row).Error; err != nil {
				return err
			}
			majors[code] = row
		}

		subjects := make(map[string]model.Subject)
		for _, item := range dummySubjects {
			row := model.Subject{Code: item.Code, Name: item.Name, Category: item.Category}
			if err := tx.Where("code = ?", item.Code).FirstOrCreate(&row).Error; err != nil {
				return err
			}
			subjects[item.Code] = row
		}

		teachers := make([]model.Teacher, 20)
		for i := range teachers {
			n := i + 1
			gender := []string{"L", "P"}[i%2]
			row := model.Teacher{Name: fullName(gender, i, 0), NIP: fmt.Sprintf("DUMMY-GURU-%03d", n), Email: fmt.Sprintf("guru%02d@example.test", n), Phone: fmt.Sprintf("08120000%04d", n), Gender: gender}
			if err := tx.Where("n_ip = ?", row.NIP).Assign(row).FirstOrCreate(&row).Error; err != nil {
				return err
			}
			teachers[i] = row
		}

		positions := []string{"Tata Usaha", "Operator Sekolah", "Pustakawan", "Laboran", "Keamanan", "Kebersihan"}
		for i := 0; i < 10; i++ {
			n := i + 1
			row := model.Staff{Name: fullName([]string{"L", "P"}[i%2], i, 5), NIP: fmt.Sprintf("DUMMY-STAFF-%03d", n), Position: positions[i%len(positions)], Email: fmt.Sprintf("staff%02d@example.test", n), Phone: fmt.Sprintf("08130000%04d", n)}
			if err := tx.Where("n_ip = ?", row.NIP).Assign(row).FirstOrCreate(&row).Error; err != nil {
				return err
			}
		}

		type classData struct {
			row   model.Class
			major string
		}
		classes := make([]classData, 0, 9)
		for _, gradeCode := range []string{"X", "XI", "XII"} {
			for _, majorCode := range []string{"TKJ", "TKR", "MPLB"} {
				grade, major := grades[gradeCode], majors[majorCode]
				homeroom := teachers[len(classes)%len(teachers)].ID
				row := model.Class{Name: gradeCode + " " + majorCode + " 1", GradeLevelID: grade.ID, MajorID: &major.ID, AcademicYearID: year.ID, HomeroomID: &homeroom}
				if err := tx.Where("grade_level_id = ? AND major_id = ? AND academic_year_id = ?", grade.ID, major.ID, year.ID).FirstOrCreate(&row).Error; err != nil {
					return err
				}
				classes = append(classes, classData{row: row, major: majorCode})
			}
		}

		birthDate := time.Date(2009, 1, 1, 0, 0, 0, 0, time.UTC)
		for i := 0; i < 100; i++ {
			n, class := i+1, classes[i%len(classes)]
			major := majors[class.major]
			row := model.Student{Name: fullName([]string{"L", "P"}[i%2], i, 3), NIS: fmt.Sprintf("DUMMY-NIS-%04d", n), NISN: fmt.Sprintf("009900%04d", n), Gender: []string{"L", "P"}[i%2], BirthPlace: "Kota Dummy", BirthDate: &birthDate, ClassID: &class.row.ID, MajorID: &major.ID, AcademicYearID: &year.ID}
			if err := tx.Where("nis = ?", row.NIS).Assign(row).FirstOrCreate(&row).Error; err != nil {
				return err
			}
		}

		common := []string{"PAI", "PPKN", "BIN", "MTK", "BIG", "PJOK", "SEJ", "INF", "KWU"}
		productive := map[string][]string{"TKJ": {"TJKT", "ASJ"}, "TKR": {"TKRO", "PMKR"}, "MPLB": {"MPLB", "OTKP"}}
		for classIndex, class := range classes {
			codes := append(append([]string{}, common...), productive[class.major]...)
			for subjectIndex, code := range codes {
				subject := subjects[code]
				teacher := teachers[(classIndex+subjectIndex*len(classes))%len(teachers)]
				mapping := model.ClassSubject{ClassID: class.row.ID, SubjectID: subject.ID, TeacherID: &teacher.ID}
				if err := tx.Where("class_id = ? AND subject_id = ?", class.row.ID, subject.ID).FirstOrCreate(&mapping).Error; err != nil {
					return err
				}
			}
			for _, slot := range buildWeeklySchedule(codes, classIndex) {
				subject := subjects[slot.Subject]
				teacher := teachers[(classIndex+slot.Period*len(classes))%len(teachers)]
				lesson := model.LessonSchedule{ClassID: class.row.ID, SubjectID: subject.ID, TeacherID: &teacher.ID, DayOfWeek: slot.Day, StartTime: slot.Start, EndTime: slot.End}
				if err := tx.Where("class_id = ? AND day_of_week = ? AND start_time = ?", class.row.ID, slot.Day, slot.Start).FirstOrCreate(&lesson).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
}

func containsMajor(majors []string, code string) bool {
	for _, major := range majors {
		if major == code {
			return true
		}
	}
	return false
}

func dummySubjectCodes(major string) []string {
	codes := make([]string, 0, len(dummySubjects))
	for _, subject := range dummySubjects {
		if len(subject.Majors) == 0 || containsMajor(subject.Majors, major) {
			codes = append(codes, subject.Code)
		}
	}
	return codes
}
