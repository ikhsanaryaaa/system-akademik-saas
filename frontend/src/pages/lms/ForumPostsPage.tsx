import { useEffect, useState, type FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { http, type ApiResponse } from "../../lib/http";
import { fmtDateTime } from "../../lib/format";
import { type ForumPost } from "../../lib/lms";
import { useAuth } from "../../context/AuthContext";

export default function ForumPostsPage() {
  const { id } = useParams<{ id: string }>();
  const { can } = useAuth();
  const [rows, setRows] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");

  const canWrite = can("lms.create");
  const canDelete = can("lms.delete");

  async function load() {
    setLoading(true);
    try {
      const res = await http.get<ApiResponse<ForumPost[]>>(`/forum-threads/${id}/posts`);
      setRows(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await http.post(`/forum-threads/${id}/posts`, { author, body });
      setBody("");
      load();
    } catch {
      setError("Gagal mengirim balasan");
    }
  }

  async function handleDelete(postId: string) {
    if (!confirm("Hapus balasan ini?")) return;
    await http.delete(`/forum-threads/${id}/posts/${postId}`);
    load();
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <Link to="/lms/forum" className="text-sm text-primary hover:underline">
          Kembali
        </Link>
      </div>
      <h1 className="mt-2 text-2xl font-semibold text-ink tracking-tight">Diskusi</h1>

      {loading ? (
        <div className="mt-6 rounded-lg border border-hairline bg-canvas p-8 text-center text-muted">Memuat...</div>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.length === 0 ? (
            <div className="rounded-lg border border-hairline bg-canvas p-8 text-center text-muted">
              Belum ada balasan.
            </div>
          ) : (
            rows.map((p) => (
              <div key={p.id} className="rounded-lg border border-hairline bg-canvas p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">{p.author || "Anonim"}</p>
                    <p className="mt-1 text-sm text-body">{p.body}</p>
                  </div>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      className="shrink-0 text-danger hover:underline"
                    >
                      Hapus
                    </button>
                  )}
                </div>
                <p className="mt-2 font-mono text-xs text-muted">{fmtDateTime(p.created_at)}</p>
              </div>
            ))
          )}
        </div>
      )}

      {canWrite && (
        <form onSubmit={handleAdd} className="mt-6 rounded-lg border border-hairline bg-canvas p-4">
          <h2 className="text-lg font-semibold text-ink">Tambah Balasan</h2>
          <div className="mt-3 space-y-3">
            <div>
              <label htmlFor="fp-author" className="block text-sm font-medium text-body">
                Nama
              </label>
              <input
                id="fp-author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="mt-1 h-[38px] w-full rounded-md border border-hairline px-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="fp-body" className="block text-sm font-medium text-body">
                Balasan
              </label>
              <textarea
                id="fp-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                rows={3}
                className="mt-1 w-full rounded-md border border-hairline px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              className="h-[38px] rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
            >
              Kirim
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
