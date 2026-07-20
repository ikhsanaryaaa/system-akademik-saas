import { useState, type ComponentType } from "react";
import { BookOpen, CalendarDays, GraduationCap, type LucideIcon } from "lucide-react";
import AcademicYearsPage from "./AcademicYearsPage";
import GradeLevelsPage from "./GradeLevelsPage";
import MajorsPage from "./MajorsPage";

type TabKey = "years" | "grades" | "majors";
type EmbeddedPage = ComponentType<{ embedded?: boolean }>;

const tabs: { key: TabKey; label: string; description: string; icon: LucideIcon; page: EmbeddedPage }[] = [
  {
    key: "years",
    label: "Tahun Ajaran",
    description: "Atur periode akademik aktif",
    icon: CalendarDays,
    page: AcademicYearsPage,
  },
  {
    key: "grades",
    label: "Tingkatan",
    description: "Kelola jenjang dan urutan kelas",
    icon: GraduationCap,
    page: GradeLevelsPage,
  },
  {
    key: "majors",
    label: "Jurusan",
    description: "Kelola program keahlian sekolah",
    icon: BookOpen,
    page: MajorsPage,
  },
];

export default function AcademicPage() {
  const [active, setActive] = useState<TabKey>("years");
  const selected = tabs.find((tab) => tab.key === active) ?? tabs[0];
  const Page = selected.page;

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Akademik</h1>
        <p className="mt-1 text-sm text-muted">Kelola struktur dasar akademik sekolah dalam satu tempat.</p>
      </div>

      <div
        role="tablist"
        aria-label="Data akademik"
        className="mt-6 grid gap-3 sm:grid-cols-3"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selectedTab = tab.key === active;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={selectedTab}
              onClick={() => setActive(tab.key)}
              className={`rounded-lg border p-4 text-left transition-colors ${
                selectedTab
                  ? "border-primary bg-primary-soft"
                  : "border-hairline bg-canvas hover:border-primary-border hover:bg-surface-soft"
              }`}
            >
              <span className="flex items-center gap-3">
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-md ${
                    selectedTab ? "bg-primary text-white" : "bg-surface-strong text-muted"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className={`block text-sm font-semibold ${selectedTab ? "text-primary" : "text-ink"}`}>
                    {tab.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">{tab.description}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <section
        role="tabpanel"
        className="mt-4 rounded-lg border border-hairline bg-canvas p-4 shadow-sm sm:p-5"
      >
        <div className="mb-5 border-b border-hairline pb-4">
          <h2 className="text-lg font-semibold text-ink">{selected.label}</h2>
          <p className="mt-1 text-sm text-muted">{selected.description}</p>
        </div>
        <Page embedded />
      </section>
    </div>
  );
}
