import SimpleCrudPage from "../../components/SimpleCrudPage";

export default function TeachersPage() {
  return (
    <SimpleCrudPage
      title="Pendidik"
      path="/teachers"
      columns={[
        { key: "name", label: "Nama" },
        { key: "nip", label: "NIP" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Telepon" },
      ]}
      fields={[
        { key: "name", label: "Nama", required: true },
        { key: "nip", label: "NIP" },
        { key: "email", label: "Email", type: "email" },
        { key: "phone", label: "Telepon" },
        { key: "gender", label: "Jenis Kelamin (L/P)" },
      ]}
    />
  );
}
