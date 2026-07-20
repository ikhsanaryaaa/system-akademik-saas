import { Pencil, Trash2 } from "lucide-react";

// IconActions menampilkan tombol Edit dan Hapus sebagai icon.
// onEdit atau onDelete kosong berarti tombol disembunyikan mengikuti RBAC.
export default function IconActions({
  onEdit,
  onDelete,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
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
