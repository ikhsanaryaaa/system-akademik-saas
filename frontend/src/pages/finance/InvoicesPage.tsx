import { Link } from "react-router-dom";
import CrudModulePage, { type CrudModuleConfig } from "../../components/CrudModulePage";
import { fmtDate } from "../../lib/format";
import { fmtRupiah, invoiceStatusBadge, invoiceStatusLabel } from "../../lib/finance";

const config: CrudModuleConfig = {
  title: "Tagihan",
  path: "/invoices",
  permPrefix: "finance",
  addLabel: "Tambah Tagihan",
  filters: ["class", "major"],
  fields: [
    { key: "title", label: "Judul Tagihan", type: "text", required: true, fullWidth: true },
    { key: "student_id", label: "Siswa", type: "student", required: true },
    { key: "payment_type_id", label: "Jenis Pembayaran", type: "ref", refPath: "/payment-types" },
    { key: "class_id", label: "Kelas", type: "class" },
    { key: "major_id", label: "Jurusan", type: "major" },
    { key: "total_amount", label: "Total Tagihan", type: "number" },
    { key: "due_date", label: "Jatuh Tempo", type: "date" },
    { key: "note", label: "Catatan", type: "textarea" },
  ],
  columns: [
    { key: "title", label: "Judul" },
    { key: "student", label: "Siswa", render: (r) => (r.student as { name: string })?.name ?? "-" },
    { key: "total_amount", label: "Total", render: (r) => fmtRupiah(r.total_amount), mono: true },
    { key: "paid_amount", label: "Terbayar", render: (r) => fmtRupiah(r.paid_amount), mono: true },
    {
      key: "status",
      label: "Status",
      render: (r) => {
        const s = String(r.status);
        return (
          <span className={`rounded-full px-2 py-0.5 text-xs ${invoiceStatusBadge[s] ?? ""}`}>
            {invoiceStatusLabel[s] ?? s}
          </span>
        );
      },
    },
    { key: "due_date", label: "Jatuh Tempo", render: (r) => fmtDate(r.due_date), mono: true },
    {
      key: "detail",
      label: "Rincian",
      render: (r) => (
        <Link to={`/finance/invoices/${String(r.id)}`} className="text-primary hover:underline">
          Rincian
        </Link>
      ),
    },
  ],
};

export default function InvoicesPage() {
  return <CrudModulePage config={config} />;
}
