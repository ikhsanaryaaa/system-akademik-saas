// Helper format nilai untuk tampilan tabel dan form.

// fmtDate memotong nilai tanggal ISO ke format tampilan (YYYY-MM-DD).
export function fmtDate(v: unknown): string {
  return v ? String(v).slice(0, 10) : "-";
}

// fmtDateTime memotong nilai ISO ke format tampilan tanggal dan jam.
export function fmtDateTime(v: unknown): string {
  return v ? String(v).slice(0, 16).replace("T", " ") : "-";
}
