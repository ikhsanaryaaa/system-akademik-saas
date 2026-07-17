import { useEffect, useReducer, useState, type FormEvent } from "react";
import { http, type ApiResponse } from "../../lib/http";
import { simpleList, paginatedList } from "../../lib/master";
import type { Teacher } from "../../lib/curriculum";
import type { RfidCard } from "../../lib/attendance";
import { useAuth } from "../../context/AuthContext";

interface StudentOption {
  id: string;
  name: string;
}

// State form kartu dikelola sebagai satu unit karena field-nya berubah bersamaan
// (buka form, ganti field, tampilkan error). Satu action menggambarkan tiap transisi.
type OwnerType = "student" | "teacher";

interface FormState {
  open: boolean;
  uid: string;
  ownerType: OwnerType;
  ownerId: string;
  error: string;
}

type FormAction =
  | { type: "open" }
  | { type: "close" }
  | { type: "setUid"; value: string }
  | { type: "setOwnerType"; value: OwnerType }
  | { type: "setOwnerId"; value: string }
  | { type: "setError"; value: string };

const initialForm: FormState = {
  open: false,
  uid: "",
  ownerType: "student",
  ownerId: "",
  error: "",
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "open":
      return { ...initialForm, open: true };
    case "close":
      return { ...state, open: false };
    case "setUid":
      return { ...state, uid: action.value };
    case "setOwnerType":
      // Ganti tipe pemilik mereset pilihan pemilik.
      return { ...state, ownerType: action.value, ownerId: "" };
    case "setOwnerId":
      return { ...state, ownerId: action.value };
    case "setError":
      return { ...state, error: action.value };
    default:
      return state;
  }
}

export default function RfidCardsPage() {
  const { can } = useAuth();
  const [cards, setCards] = useState<RfidCard[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, dispatch] = useReducer(formReducer, initialForm);
  const { open, uid, ownerType, ownerId, error } = form;

  async function load() {
    setLoading(true);
    try {
      const res = await http.get<ApiResponse<RfidCard[]>>("/attendance/rfid-cards");
      setCards(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function loadRefs() {
    const st = await paginatedList<StudentOption>("/students", { per_page: 100 });
    setStudents(st.items);
    setTeachers(await simpleList<Teacher>("/teachers"));
  }

  useEffect(() => {
    load();
    loadRefs();
  }, []);

  function openCreate() {
    dispatch({ type: "open" });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    dispatch({ type: "setError", value: "" });
    const body: Record<string, string> = { uid };
    if (ownerType === "student") body.student_id = ownerId;
    else body.teacher_id = ownerId;
    try {
      await http.post("/attendance/rfid-cards", body);
      dispatch({ type: "close" });
      load();
    } catch {
      dispatch({ type: "setError", value: "Gagal menyimpan kartu, pastikan UID unik dan pemilik dipilih" });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus kartu ini?")) return;
    await http.delete(`/attendance/rfid-cards/${id}`);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink tracking-tight">Kartu RFID</h1>
        {can("attendance.manage") && (
          <button type="button"
            onClick={openCreate}
            className="h-[38px] rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Tambah Kartu
          </button>
        )}
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-hairline bg-canvas">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-soft text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="px-4 py-3">UID</th>
              <th className="px-4 py-3">Pemilik</th>
              <th className="px-4 py-3">Tipe</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  Memuat...
                </td>
              </tr>
            ) : cards.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  Belum ada kartu.
                </td>
              </tr>
            ) : (
              cards.map((c) => (
                <tr key={c.id} className="border-t border-hairline hover:bg-surface-soft">
                  <td className="px-4 py-3 font-mono text-ink">{c.uid}</td>
                  <td className="px-4 py-3">{c.student?.name ?? c.teacher?.name ?? "-"}</td>
                  <td className="px-4 py-3">{c.student_id ? "Siswa" : "Pendidik"}</td>
                  <td className="px-4 py-3 text-right">
                    {can("attendance.manage") && (
                      <button type="button"
                        onClick={() => handleDelete(c.id)}
                        className="text-danger hover:underline"
                      >
                        Hapus
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay px-4">
          <form onSubmit={handleSubmit} className="w-full max-w-[520px] rounded-xl bg-canvas p-6">
            <h2 className="text-lg font-semibold text-ink">Tambah Kartu RFID</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="rfid-uid" className="block text-sm font-medium text-body">
                  UID Kartu
                </label>
                <input
                  id="rfid-uid"
                  value={uid}
                  onChange={(e) => dispatch({ type: "setUid", value: e.target.value })}
                  required
                  className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label htmlFor="rfid-owner-type" className="block text-sm font-medium text-body">
                  Tipe Pemilik
                </label>
                <select
                  id="rfid-owner-type"
                  value={ownerType}
                  onChange={(e) => dispatch({ type: "setOwnerType", value: e.target.value as OwnerType })}
                  className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm"
                >
                  <option value="student">Siswa</option>
                  <option value="teacher">Pendidik</option>
                </select>
              </div>
              <div>
                <label htmlFor="rfid-owner" className="block text-sm font-medium text-body">
                  Pemilik
                </label>
                <select
                  id="rfid-owner"
                  value={ownerId}
                  onChange={(e) => dispatch({ type: "setOwnerId", value: e.target.value })}
                  required
                  className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm"
                >
                  <option value="">Pilih pemilik</option>
                  {(ownerType === "student" ? students : teachers).map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
              {error && <p className="text-sm text-danger">{error}</p>}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => dispatch({ type: "close" })}
                className="h-[38px] rounded-md border border-hairline px-4 text-sm text-body hover:bg-surface-soft"
              >
                Batal
              </button>
              <button
                type="submit"
                className="h-[38px] rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
