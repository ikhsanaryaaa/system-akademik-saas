import SimpleCrudPage from "../../components/SimpleCrudPage";

export default function SubjectsPage() {
  return (
    <SimpleCrudPage
      title="Mata Pelajaran"
      path="/subjects"
      permPrefix="curriculum"
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
