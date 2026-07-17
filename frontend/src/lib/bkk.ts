// Konstanta modul Bursa Kerja Khusus (BKK).

export const internshipStatuses = ["ongoing", "done", "cancelled"];
export const jobVacancyStatuses = ["open", "closed"];

// Label status untuk tampilan.
export const internshipStatusLabel: Record<string, string> = {
  ongoing: "Berlangsung",
  done: "Selesai",
  cancelled: "Batal",
};

export const jobVacancyStatusLabel: Record<string, string> = {
  open: "Dibuka",
  closed: "Ditutup",
};
