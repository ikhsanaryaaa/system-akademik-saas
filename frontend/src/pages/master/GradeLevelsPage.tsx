import { GraduationCap } from "lucide-react";
import SimpleCrudPage from "../../components/SimpleCrudPage";
import IconActions from "../../components/IconActions";

export default function GradeLevelsPage({ embedded = false }: { embedded?: boolean }) {
  return (
    <SimpleCrudPage
      title="Tingkatan"
      path="/grade-levels"
      hideHeader={embedded}
      card={{
        render: (row, actions) => (
          <article className="rounded-lg border border-hairline bg-canvas p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-primary-soft text-primary">
                <GraduationCap className="h-5 w-5" />
              </span>
              <IconActions onEdit={actions.onEdit} onDelete={actions.onDelete} />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-ink">{String(row.name)}</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Kode</dt>
                <dd className="font-mono text-body">{String(row.code ?? "-")}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Urutan</dt>
                <dd className="font-mono text-body">{String(row.order ?? "-")}</dd>
              </div>
            </dl>
          </article>
        ),
      }}
      fields={[
        { key: "name", label: "Nama", required: true },
        { key: "code", label: "Kode", required: true },
        { key: "order", label: "Urutan", type: "number" },
      ]}
    />
  );
}
