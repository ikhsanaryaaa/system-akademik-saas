import { Trash2 } from "lucide-react";

export default function DeleteConfirmModal({
  title,
  description,
  onCancel,
  onConfirm,
  pending = false,
}: {
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  pending?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-overlay px-4">
      <div role="alertdialog" aria-modal="true" aria-labelledby="delete-confirm-title" className="w-full max-w-sm rounded-xl border border-hairline bg-canvas p-6 shadow-lg">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-danger-soft text-danger">
          <Trash2 className="h-5 w-5" />
        </div>
        <h2 id="delete-confirm-title" className="mt-4 text-lg font-semibold text-ink">{title}</h2>
        <p className="mt-2 text-sm text-muted">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={pending} className="h-[38px] rounded-md border border-hairline px-4 text-sm text-body hover:bg-surface-soft disabled:opacity-60">Batal</button>
          <button type="button" onClick={onConfirm} disabled={pending} className="h-[38px] rounded-md bg-danger px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60">{pending ? "Menghapus..." : "Hapus"}</button>
        </div>
      </div>
    </div>
  );
}
