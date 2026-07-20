import SimpleCrudPage from "../../components/SimpleCrudPage";
import EntityCard from "../../components/EntityCard";

export default function TeachersPage() {
  return (
    <SimpleCrudPage
      title="Pendidik"
      path="/teachers"
      card={{
        render: (row, actions) => (
          <EntityCard
            photo={String(row.photo_url ?? "")}
            title={String(row.name)}
            rows={[
              { label: "NIP", value: String(row.nip ?? "-"), mono: true },
              { label: "Email", value: String(row.email ?? "-") },
              { label: "Telepon", value: String(row.phone ?? "-") },
              { label: "Jenis Kelamin", value: String(row.gender ?? "-") },
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
        { key: "email", label: "Email", type: "email" },
        { key: "phone", label: "Telepon" },
        { key: "gender", label: "Jenis Kelamin", type: "gender" },
      ]}
    />
  );
}
