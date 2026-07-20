import SimpleCrudPage from "../../components/SimpleCrudPage";
import EntityCard from "../../components/EntityCard";

export default function StaffPage() {
  return (
    <SimpleCrudPage
      title="Tenaga Non-Kependidikan"
      path="/staff"
      card={{
        render: (row, actions) => (
          <EntityCard
            photo={String(row.photo_url ?? "")}
            title={String(row.name)}
            rows={[
              { label: "NIP", value: String(row.nip ?? "-"), mono: true },
              { label: "Jabatan", value: String(row.position ?? "-") },
              { label: "Email", value: String(row.email ?? "-") },
              { label: "Telepon", value: String(row.phone ?? "-") },
            ]}
            onEdit={actions.onEdit}
            onDelete={actions.onDelete}
          />
        ),
      }}
      fields={[
        { key: "photo_url", label: "Foto", type: "photo" },
        { key: "name", label: "Nama", required: true },
        { key: "nip", label: "NIP" },
        { key: "position", label: "Jabatan" },
        { key: "email", label: "Email", type: "email" },
        { key: "phone", label: "Telepon" },
      ]}
    />
  );
}
