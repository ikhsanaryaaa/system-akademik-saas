import { Eye, Pencil, Printer, Trash2 } from "lucide-react";

// IconActions menampilkan aksi baris sebagai icon: Lihat, Cetak, Edit, dan Hapus.
// Handler yang kosong berarti tombolnya disembunyikan mengikuti RBAC.
export default function IconActions({
  onView,
  onPrint,
  onEdit,
  onDelete,
}: {
  onView?: () => void;
  onPrint?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {onView && (
        <button
          type="button"
          onClick={onView}
          aria-label="Lihat"
          title="Lihat"
          className="grid h-9 w-9 place-items-center rounded-md text-body hover:bg-surface-strong"
        >
          <Eye className="h-4 w-4" />
        </button>
      )}
      {onPrint && (
        <button
          type="button"
          onClick={onPrint}
          aria-label="Cetak"
          title="Cetak"
          className="grid h-9 w-9 place-items-center rounded-md text-body hover:bg-surface-strong"
        >
          <Printer className="h-4 w-4" />
        </button>
      )}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit"
          title="Edit"
          className="grid h-9 w-9 place-items-center rounded-md text-primary hover:bg-primary-soft"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label="Hapus"
          title="Hapus"
          className="grid h-9 w-9 place-items-center rounded-md text-danger hover:bg-danger-soft"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
