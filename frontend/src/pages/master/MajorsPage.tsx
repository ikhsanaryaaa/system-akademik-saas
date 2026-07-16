import SimpleCrudPage from "../../components/SimpleCrudPage";

export default function MajorsPage() {
  return (
    <SimpleCrudPage
      title="Jurusan"
      path="/majors"
      columns={[
        { key: "code", label: "Kode" },
        { key: "name", label: "Nama" },
      ]}
      fields={[
        { key: "name", label: "Nama", required: true },
        { key: "code", label: "Kode", required: true },
      ]}
    />
  );
}
