import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { http, type ApiResponse } from "../../lib/http";
import { fmtDate, fmtDateTime } from "../../lib/format";
import {
  fmtRupiah,
  invoiceStatusBadge,
  invoiceStatusLabel,
  paymentMethods,
  type Invoice,
} from "../../lib/finance";
import { useAuth } from "../../context/AuthContext";

// renderSummary menampilkan ringkasan tagihan. Fungsi murni tanpa state lokal,
// diletakkan di module scope agar tidak dibangun ulang tiap render.
function renderSummary(inv: Invoice, remaining: number) {
  const status = String(inv.status);
  return (
    <div className="mt-4 grid grid-cols-1 gap-4 rounded-lg border border-hairline bg-white p-4 md:grid-cols-2">
      <div className="space-y-1 text-sm">
        <p>
          <span className="text-muted">Siswa: </span>
          <span className="text-ink">{inv.student?.name ?? "-"}</span>
          {inv.student?.nis && <span className="ml-1 font-mono text-muted">({inv.student.nis})</span>}
        </p>
        <p>
          <span className="text-muted">Jenis: </span>
          <span className="text-ink">{inv.payment_type?.name ?? "-"}</span>
        </p>
        <p>
          <span className="text-muted">Kelas: </span>
          <span className="text-ink">{inv.class?.name ?? "-"}</span>
        </p>
        <p>
          <span className="text-muted">Jatuh Tempo: </span>
          <span className="font-mono text-ink">{fmtDate(inv.due_date)}</span>
        </p>
      </div>
      <div className="space-y-1 text-sm">
        <p>
          <span className="text-muted">Total: </span>
          <span className="font-mono text-ink">{fmtRupiah(inv.total_amount)}</span>
        </p>
        <p>
          <span className="text-muted">Terbayar: </span>
          <span className="font-mono text-ink">{fmtRupiah(inv.paid_amount)}</span>
        </p>
        <p>
          <span className="text-muted">Sisa: </span>
          <span className="font-mono text-ink">{fmtRupiah(remaining)}</span>
        </p>
        <p>
          <span className="text-muted">Status: </span>
          <span className={`rounded-full px-2 py-0.5 text-xs ${invoiceStatusBadge[status] ?? ""}`}>
            {invoiceStatusLabel[status] ?? status}
          </span>
        </p>
      </div>
    </div>
  );
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { can } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState("tunai");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const canWrite = can("finance.create");
  const canDelete = can("finance.delete");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await http.get<ApiResponse<Invoice>>(`/invoices/${id}`);
      setInvoice(res.data.data ?? null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddPayment(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await http.post(`/invoices/${id}/payments`, { amount: Number(amount), method, note });
      setAmount(0);
      setNote("");
      load();
    } catch {
      setError("Gagal mencatat pembayaran, pastikan nominal lebih dari nol");
    }
  }

  async function handleDeletePayment(paymentId: string) {
    if (!confirm("Hapus pembayaran ini?")) return;
    await http.delete(`/invoices/${id}/payments/${paymentId}`);
    load();
  }

  async function generateMessage(kind: "billing" | "confirmation") {
    setMessage("");
    const res = await http.get<ApiResponse<{ message: string }>>(`/invoices/${id}/message`, {
      params: { kind },
    });
    setMessage(res.data.data?.message ?? "");
  }

  if (loading) {
    return <div className="rounded-lg border border-hairline bg-white p-8 text-center text-muted">Memuat...</div>;
  }
  if (!invoice) {
    return <div className="rounded-lg border border-hairline bg-white p-8 text-center text-muted">Tagihan tidak ditemukan.</div>;
  }

  const remaining = Math.max(0, invoice.total_amount - invoice.paid_amount);

  return (
    <div>
      <div className="flex items-center gap-3">
        <Link to="/finance/invoices" className="text-sm text-primary hover:underline">
          Kembali
        </Link>
      </div>
      <h1 className="mt-2 text-2xl font-semibold text-ink tracking-tight">{invoice.title}</h1>

      {renderSummary(invoice, remaining)}
      {renderMessageTools()}
      {renderPayments(invoice)}
      {canWrite && renderAddForm()}
    </div>
  );

  function renderMessageTools() {
    return (
      <div className="mt-4 rounded-lg border border-hairline bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-body">Pesan via WhatsApp</span>
          <button
            type="button"
            onClick={() => generateMessage("billing")}
            className="h-[34px] rounded-md border border-hairline px-3 text-sm text-body hover:bg-surface-soft"
          >
            Teks Tagihan
          </button>
          <button
            type="button"
            onClick={() => generateMessage("confirmation")}
            className="h-[34px] rounded-md border border-hairline px-3 text-sm text-body hover:bg-surface-soft"
          >
            Teks Konfirmasi
          </button>
        </div>
        {message && (
          <pre className="mt-3 whitespace-pre-wrap rounded-md bg-surface-soft p-3 text-sm text-ink">{message}</pre>
        )}
      </div>
    );
  }

  function renderPayments(inv: Invoice) {
    const payments = inv.payments ?? [];
    return (
      <div className="mt-4 overflow-hidden rounded-lg border border-hairline bg-white">
        <div className="border-b border-hairline px-4 py-3 text-sm font-semibold text-ink">Rincian Pembayaran</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-soft text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Nominal</th>
              <th className="px-4 py-3">Metode</th>
              <th className="px-4 py-3">Catatan</th>
              {canDelete && <th className="px-4 py-3 text-right">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={canDelete ? 5 : 4} className="px-4 py-8 text-center text-muted">
                  Belum ada pembayaran.
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="border-t border-hairline">
                  <td className="px-4 py-3 font-mono">{fmtDateTime(p.paid_at ?? p.created_at)}</td>
                  <td className="px-4 py-3 font-mono">{fmtRupiah(p.amount)}</td>
                  <td className="px-4 py-3 capitalize">{p.method || "-"}</td>
                  <td className="px-4 py-3 text-muted">{p.note || "-"}</td>
                  {canDelete && (
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeletePayment(p.id)}
                        className="text-danger hover:underline"
                      >
                        Hapus
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  }

  function renderAddForm() {
    const inputClass = "mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm outline-none focus:border-primary";
    return (
      <form onSubmit={handleAddPayment} className="mt-6 rounded-lg border border-hairline bg-white p-4">
        <h2 className="text-lg font-semibold text-ink">Catat Pembayaran</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label htmlFor="pay-amount" className="block text-sm font-medium text-body">
              Nominal
            </label>
            <input
              id="pay-amount"
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
              className={`${inputClass} font-mono`}
            />
          </div>
          <div>
            <label htmlFor="pay-method" className="block text-sm font-medium text-body">
              Metode
            </label>
            <select
              id="pay-method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className={`${inputClass} capitalize`}
            >
              {paymentMethods.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="pay-note" className="block text-sm font-medium text-body">
              Catatan
            </label>
            <input id="pay-note" value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            className="h-[38px] rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Simpan Pembayaran
          </button>
        </div>
      </form>
    );
  }
}
