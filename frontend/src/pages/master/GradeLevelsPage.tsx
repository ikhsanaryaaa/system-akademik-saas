import SimpleCrudPage from "../../components/SimpleCrudPage";

export default function GradeLevelsPage() {
  return (
    <SimpleCrudPage
      title="Tingkatan"
      path="/grade-levels"
      columns={[
        { key: "code", label: "Kode" },
        { key: "name", label: "Nama" },
        { key: "order", label: "Urutan" },
      ]}
      fields={[
        { key: "name", label: "Nama", required: true },
        { key: "code", label: "Kode", required: true },
        { key: "order", label: "Urutan", type: "number" },
      ]}
    />
  );
}
