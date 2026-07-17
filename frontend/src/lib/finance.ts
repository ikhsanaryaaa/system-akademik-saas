// Tipe dan konstanta modul Keuangan.

export const invoiceStatuses = ["unpaid", "partial", "paid"];

// Label status tagihan untuk tampilan.
export const invoiceStatusLabel: Record<string, string> = {
  unpaid: "Belum Bayar",
  partial: "Cicil",
  paid: "Lunas",
};

// Kelas badge status tagihan; teks label selalu ikut ditampilkan sehingga
// tidak hanya mengandalkan warna (aksesibilitas).
export const invoiceStatusBadge: Record<string, string> = {
  unpaid: "bg-red-100 text-danger",
  partial: "bg-amber-100 text-warning",
  paid: "bg-green-100 text-success",
};

export const paymentMethods = ["tunai", "transfer", "qris", "lainnya"];

// fmtRupiah memformat angka menjadi mata uang Rupiah, contoh 1500000 menjadi "Rp1.500.000".
export function fmtRupiah(v: unknown): string {
  const n = Number(v ?? 0);
  if (Number.isNaN(n)) return "Rp0";
  return "Rp" + Math.round(n).toLocaleString("id-ID");
}

export interface InvoicePayment {
  id: string;
  invoice_id: string;
  amount: number;
  method: string;
  note: string;
  paid_at?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  student_id: string;
  payment_type_id?: string;
  class_id?: string;
  major_id?: string;
  academic_year_id?: string;
  title: string;
  total_amount: number;
  paid_amount: number;
  status: string;
  due_date?: string;
  note: string;
  student?: { name: string; nis: string };
  payment_type?: { name: string };
  class?: { name: string };
  payments?: InvoicePayment[];
}

export interface FinanceReport {
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  unpaid_count: number;
  partial_count: number;
  paid_count: number;
}
