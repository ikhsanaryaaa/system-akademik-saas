import SimpleCrudPage from "../../components/SimpleCrudPage";

export default function SubjectsPage() {
  return (
    <SimpleCrudPage
      title="Mata Pelajaran"
      path="/subjects"
      permPrefix="curriculum"
      columns={[
        { key: "name", label: "Nama" },
        { key: "code", label: "Kode" },
        {
          key: "category",
          label: "Kategori",
          render: (row) =>
            ({ wajib: "Wajib", peminatan: "Peminatan", mulok: "Mulok" })[
              String(row.category)
            ] ?? "-",
        },
      ]}
      fields={[
        { key: "name", label: "Nama", required: true },
        { key: "code", label: "Kode", required: true },
        {
          key: "category",
          label: "Kategori",
          type: "select",
          required: true,
          options: [
            { value: "wajib", label: "Wajib" },
            { value: "peminatan", label: "Peminatan" },
            { value: "mulok", label: "Mulok" },
          ],
        },
      ]}
    />
  );
}
