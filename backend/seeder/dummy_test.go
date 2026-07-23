package seeder

import (
	"testing"
	"time"
)

func TestBuildWeeklySchedule(t *testing.T) {
	for _, major := range []string{"TKJ", "TKR", "MPLB"} {
		codes := dummySubjectCodes(major)
		rows := buildWeeklySchedule(codes, 0)
		if len(rows) != 30 {
			t.Fatalf("%s: got %d slots, want 30", major, len(rows))
		}
		seen := make(map[[2]int]bool)
		for _, row := range rows {
			if row.Day < 1 || row.Day > 6 {
				t.Fatalf("%s: invalid day %d", major, row.Day)
			}
			if _, err := time.Parse("15:04", row.Start); err != nil {
				t.Fatalf("%s: invalid start %q", major, row.Start)
			}
			if _, err := time.Parse("15:04", row.End); err != nil {
				t.Fatalf("%s: invalid end %q", major, row.End)
			}
			key := [2]int{row.Day, row.Period}
			if seen[key] {
				t.Fatalf("%s: duplicate day/period %v", major, key)
			}
			seen[key] = true
		}
	}
}
