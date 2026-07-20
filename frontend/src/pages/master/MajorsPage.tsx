import { BookOpen } from "lucide-react";
import SimpleCrudPage from "../../components/SimpleCrudPage";
import IconActions from "../../components/IconActions";

export default function MajorsPage({ embedded = false }: { embedded?: boolean }) {
  return (
    <SimpleCrudPage
      title="Jurusan"
      path="/majors"
      hideHeader={embedded}
      card={{
        render: (row, actions) => (
          <article className="rounded-lg border border-hairline bg-canvas p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-primary-soft text-primary">
                <BookOpen className="h-5 w-5" />
              </span>
              <IconActions onEdit={actions.onEdit} onDelete={actions.onDelete} />
            </div>
            <p className="mt-4 font-mono text-sm font-semibold text-primary">{String(row.code ?? "-")}</p>
            <h2 className="mt-1 text-lg font-semibold text-ink">{String(row.name)}</h2>
          </article>
        ),
      }}
      fields={[
        { key: "name", label: "Nama", required: true },
        { key: "code", label: "Kode", required: true },
      ]}
    />
  );
}
