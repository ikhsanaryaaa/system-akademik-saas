import SimpleCrudPage from "../../components/SimpleCrudPage";

export default function AcademicYearsPage() {
  return (
    <SimpleCrudPage
      title="Tahun Ajaran"
      path="/academic-years"
      columns={[
        { key: "name", label: "Nama" },
        { key: "is_active", label: "Aktif", render: (r) => (r.is_active ? "Ya" : "Tidak") },
      ]}
      fields={[
        { key: "name", label: "Nama (contoh 2025/2026)", required: true },
        { key: "is_active", label: "Jadikan tahun ajaran aktif", type: "checkbox" },
      ]}
    />
  );
}
