import SimpleCrudPage from "../../components/SimpleCrudPage";

export default function StaffPage() {
  return (
    <SimpleCrudPage
      title="Tenaga Non-Kependidikan"
      path="/staff"
      columns={[
        { key: "name", label: "Nama" },
        { key: "nip", label: "NIP" },
        { key: "position", label: "Jabatan" },
        { key: "phone", label: "Telepon" },
      ]}
      fields={[
        { key: "name", label: "Nama", required: true },
        { key: "nip", label: "NIP" },
        { key: "position", label: "Jabatan" },
        { key: "email", label: "Email", type: "email" },
        { key: "phone", label: "Telepon" },
      ]}
    />
  );
}
