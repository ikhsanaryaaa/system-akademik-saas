import EntityCard from "../../components/EntityCard";
import SimpleCrudPage from "../../components/SimpleCrudPage";

export default function SubjectsPage() {
  return (
    <SimpleCrudPage
      title="Mata Pelajaran"
      path="/subjects"
      permPrefix="curriculum"
      card={{
        render: (row, actions) => (
          <EntityCard
            hidePhoto
            title={String(row.code ?? "-")}
            fallbackTitle={String(row.name ?? "")}
            titleBadge
            rows={[{ label: "Nama", value: String(row.name ?? "-") }]}
            onEdit={actions.onEdit}
            onDelete={actions.onDelete}
          />
        ),
      }}
      fields={[
        { key: "name", label: "Nama", required: true },
        { key: "code", label: "Kode", required: true },
      ]}
    />
  );
}
