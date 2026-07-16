// Konfigurasi branding per instance. Nilai default dipakai sebelum
// config dari backend tersedia, lalu ditimpa lewat applyBranding().
export interface Branding {
  schoolName: string;
  primaryColor: string;
}

export const defaultBranding: Branding = {
  schoolName: "Nama Sekolah",
  primaryColor: "#2563eb",
};

// applyBranding menulis warna utama ke CSS custom property di root document,
// sehingga seluruh komponen mengikuti warna instance tanpa mengubah kode.
export function applyBranding(branding: Branding = defaultBranding): void {
  const root = document.documentElement;
  root.style.setProperty("--color-primary", branding.primaryColor);
}
