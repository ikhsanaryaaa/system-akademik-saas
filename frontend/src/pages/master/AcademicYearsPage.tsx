import { CalendarDays } from "lucide-react";
import SimpleCrudPage from "../../components/SimpleCrudPage";
import IconActions from "../../components/IconActions";
import { useAcademicYear } from "../../context/AcademicYearContext";

export default function AcademicYearsPage({ embedded = false }: { embedded?: boolean }) {
  const { reload } = useAcademicYear();

  return (
    <SimpleCrudPage
      title="Tahun Ajaran"
      path="/academic-years"
      hideHeader={embedded}
      onChanged={reload}
      card={{
        render: (row, actions) => {
          const active = Boolean(row.is_active);
          return (
            <article
              className={`rounded-lg border bg-canvas p-5 shadow-sm ${
                active ? "border-primary" : "border-hairline"
              }`}
            >
              <span className="grid h-10 w-10 place-items-center rounded-md bg-primary-soft text-primary">
                <CalendarDays className="h-5 w-5" />
              </span>
              <div className="mt-5 flex items-end justify-between gap-3">
                <div>
                  <h2 className="font-mono text-xl font-semibold text-ink">{String(row.name)}</h2>
                  <span
                    className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                      active ? "bg-success-soft text-success" : "bg-surface-strong text-muted"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-success" : "bg-muted"}`} />
                    {active ? "Aktif" : "Tidak aktif"}
                  </span>
                </div>
                <IconActions onEdit={actions.onEdit} onDelete={actions.onDelete} />
              </div>
            </article>
          );
        },
      }}
      fields={[
        { key: "name", label: "Nama (contoh 2025/2026)", required: true },
        { key: "is_active", label: "Jadikan tahun ajaran aktif", type: "checkbox" },
      ]}
    />
  );
}
