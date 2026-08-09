import { http } from "./http";
import type { ApiResponse } from "./http";

// Jenis komponen penilaian, sejajar dengan konstanta di backend.
export const JENIS_KOMPONEN = [
  { value: "FORMATIF", label: "Formatif" },
  { value: "SUMATIF_LINGKUP_MATERI", label: "Sumatif Lingkup Materi" },
  { value: "SUMATIF_AKHIR_SEMESTER", label: "Sumatif Akhir Semester" },
] as const;

export type JenisKomponen = (typeof JENIS_KOMPONEN)[number]["value"];

export interface Konteks {
  kelas_id: string;
  kelas: string;
  mata_pelajaran_id: string;
  mata_pelajaran: string;
}

export interface Komponen {
  id?: string;
  nama: string;
  jenis: JenisKomponen | string;
  bobot: number;
  urutan: number;
  deskripsi: string;
}

export interface Rencana {
  id: string;
  tahun_ajaran_id: string;
  semester: number;
  mata_pelajaran_id: string;
  kelas_id: string;
  guru_id?: string;
  status: "DRAFT" | "AKTIF" | "TERKUNCI";
  kktp: number;
  dikunci_pada?: string;
  komponen: Komponen[];
}

export interface GridSiswa {
  siswa_id: string;
  nama: string;
  nis: string;
  // Kunci map adalah id komponen. Nilai null berarti belum dinilai,
  // berbeda maknanya dari angka 0.
  nilai: Record<string, number | null>;
  nilai_akhir: number;
  predikat: string;
}

export interface GridResponse {
  rencana: Rencana;
  terkunci: boolean;
  siswa: GridSiswa[];
}

export interface RekapRow {
  siswa_id: string;
  nama: string;
  nis: string;
  nilai: number;
  predikat: string;
  deskripsi: string;
  tuntas: boolean;
}

export interface RekapStatistik {
  jumlah_siswa: number;
  rata_rata: number;
  tertinggi: number;
  terendah: number;
  tuntas: number;
  belum_tuntas: number;
}

export interface RekapResponse {
  rencana: Rencana;
  terkunci: boolean;
  siswa: RekapRow[];
  statistik: RekapStatistik;
}

export interface KonteksTerpilih {
  tahun_ajaran_id: string;
  semester: number;
  mata_pelajaran_id: string;
  kelas_id: string;
}

export interface EntryNilai {
  komponen_id: string;
  siswa_id: string;
  nilai: number | null;
  catatan?: string;
}

export async function listKonteks(): Promise<Konteks[]> {
  const res = await http.get<ApiResponse<Konteks[]>>("/penilaian/konteks");
  return res.data.data ?? [];
}

export async function getRencana(k: KonteksTerpilih): Promise<Rencana> {
  const res = await http.get<ApiResponse<Rencana>>("/penilaian/rencana", {
    params: {
      tahun_ajaran_id: k.tahun_ajaran_id,
      semester: k.semester,
      mata_pelajaran_id: k.mata_pelajaran_id,
      kelas_id: k.kelas_id,
    },
  });
  return res.data.data as Rencana;
}

export async function createRencana(
  k: KonteksTerpilih,
  kktp: number,
  komponen: Komponen[]
): Promise<Rencana> {
  const res = await http.post<ApiResponse<Rencana>>("/penilaian/rencana", {
    ...k,
    kktp,
    komponen,
  });
  return res.data.data as Rencana;
}

// updateRencana mengirim konfirmasi=true saat komponen yang sudah punya nilai ikut dihapus.
export async function updateRencana(
  id: string,
  k: KonteksTerpilih,
  kktp: number,
  komponen: Komponen[],
  konfirmasi = false
): Promise<Rencana> {
  const res = await http.put<ApiResponse<Rencana>>(
    `/penilaian/rencana/${id}`,
    { ...k, kktp, komponen },
    { params: konfirmasi ? { konfirmasi: "true" } : undefined }
  );
  return res.data.data as Rencana;
}

export async function getGrid(rencanaID: string): Promise<GridResponse> {
  const res = await http.get<ApiResponse<GridResponse>>(`/penilaian/rencana/${rencanaID}/grid`);
  return res.data.data as GridResponse;
}

export async function getRekap(rencanaID: string): Promise<RekapResponse> {
  const res = await http.get<ApiResponse<RekapResponse>>(`/penilaian/rencana/${rencanaID}/rekap`);
  return res.data.data as RekapResponse;
}

export interface HasilSimpan {
  tersimpan: number;
  nilai_akhir: { siswa_id: string; nilai: number; predikat: string }[];
}

export async function simpanNilai(rencanaID: string, entries: EntryNilai[]): Promise<HasilSimpan> {
  const res = await http.patch<ApiResponse<HasilSimpan>>("/penilaian/nilai", {
    rencana_id: rencanaID,
    entries,
  });
  return res.data.data as HasilSimpan;
}

export async function kunciNilai(rencanaID: string): Promise<void> {
  await http.post(`/penilaian/rencana/${rencanaID}/kunci`);
}

export async function bukaKunciNilai(rencanaID: string): Promise<void> {
  await http.delete(`/penilaian/rencana/${rencanaID}/kunci`);
}

export interface BarisGagalImpor {
  baris: number;
  nis: string;
  alasan: string;
}

export interface HasilImpor {
  tersimpan: number;
  siswa_diubah: number;
  baris_gagal: BarisGagalImpor[];
}

export interface MapelRaport {
  mata_pelajaran: string;
  pengetahuan: number;
  keterampilan: number;
  deskripsi: string;
}

export interface Raport {
  siswa: { id: string; nama: string; nis: string; nisn: string; kelas: string };
  tahun_ajaran: string;
  semester: number;
  mata_pelajaran: MapelRaport[];
  rata_rata: number;
}

// unduhTemplate mengambil file Excel lalu memicu unduhan di browser.
export async function unduhTemplate(rencanaID: string): Promise<void> {
  const res = await http.get(`/penilaian/rencana/${rencanaID}/template`, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(res.data as Blob);
  const tautan = document.createElement("a");
  tautan.href = url;
  tautan.download = `template-nilai-${rencanaID.slice(0, 8)}.xlsx`;
  tautan.click();
  URL.revokeObjectURL(url);
}

export async function imporNilai(rencanaID: string, berkas: File): Promise<HasilImpor> {
  const form = new FormData();
  form.append("file", berkas);
  const res = await http.post<ApiResponse<HasilImpor>>(
    `/penilaian/rencana/${rencanaID}/impor`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data.data as HasilImpor;
}

export async function getRaport(
  siswaID: string,
  tahunAjaranID: string,
  semester: number
): Promise<Raport> {
  const res = await http.get<ApiResponse<Raport>>(`/penilaian/siswa/${siswaID}/raport`, {
    params: { tahun_ajaran_id: tahunAjaranID, semester },
  });
  return res.data.data as Raport;
}

// totalBobot menjumlahkan bobot komponen yang berbobot lebih dari nol.
// Dipakai indikator live pada tab Rencana, dan harus 100 supaya bisa disimpan.
export function totalBobot(komponen: Komponen[]): number {
  return komponen.reduce((sum, k) => (k.bobot > 0 ? sum + k.bobot : sum), 0);
}
