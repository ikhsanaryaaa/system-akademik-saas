import { useEffect, useRef, useState } from "react";
import { Check, Copy, QrCode, RefreshCw, X } from "lucide-react";
import QRCode from "qrcode";
import type { QrAttendanceToken } from "../lib/attendance";

export default function AttendanceQrModal({ token, onClose, onRegenerate }: { token: QrAttendanceToken; onClose: () => void; onRegenerate: () => void }) {
  const [src, setSrc] = useState("");
  const [copied, setCopied] = useState(false);
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.floor((Date.parse(token.expires_at) - Date.now()) / 1000)));
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { let active = true; QRCode.toDataURL(token.token, { margin: 2, color: { dark: "#000000", light: "#ffffff" } }).then((value) => { if (active) setSrc(value); }); return () => { active = false; }; }, [token.token]);
  useEffect(() => {
    const update = () => {
      const next = Math.max(0, Math.ceil((Date.parse(token.expires_at) - Date.now()) / 1000));
      setRemaining(next);
      if (next === 0) onRegenerate();
    };
    update();
    const id = window.setInterval(update, 1000);
    return () => clearInterval(id);
  }, [token.expires_at, onRegenerate]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab") return;
      const items = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!items?.length) return;
      const first = items[0]; const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("keydown", key); previous?.focus(); };
  }, [onClose]);
  const expired = remaining === 0;
  async function copyToken() { await navigator.clipboard.writeText(token.token); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }

  return <div className="fixed inset-0 z-[60] grid place-items-center bg-overlay p-4"><div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="attendance-qr-title" className="w-full max-w-sm rounded-xl border border-hairline bg-canvas p-6 shadow-lg"><div className="flex items-start justify-between gap-4"><div className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><QrCode className="h-5 w-5" aria-hidden="true" /></span><div><h2 id="attendance-qr-title" className="text-lg font-semibold text-ink">QR Absensi</h2><p className="text-sm text-muted">Pindai sebelum token kedaluwarsa.</p></div></div><button ref={closeRef} type="button" aria-label="Tutup modal QR" title="Tutup" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-md text-muted hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><X className="h-5 w-5" aria-hidden="true" /></button></div><div className="mt-5 text-center">{src && !expired ? <img src={src} alt="QR token absensi" className="mx-auto h-56 w-56 rounded-lg border border-hairline" /> : <div className="mx-auto grid h-56 w-56 place-items-center rounded-lg bg-surface-soft text-sm text-muted">Token kedaluwarsa</div>}<span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${expired ? "bg-danger-soft text-danger" : "bg-primary-soft text-primary"}`}>{expired ? "Token kedaluwarsa" : <>Tersisa <span className="ml-1 font-mono">{remaining}s</span></>}</span><code className="mt-3 block break-all rounded-md bg-surface-soft p-2 text-xs text-ink">{token.token}</code></div><div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" onClick={copyToken} className="inline-flex h-9 items-center gap-2 rounded-md border border-hairline px-3 text-sm text-body hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{copied ? <Check className="h-4 w-4 text-success" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}{copied ? "Tersalin" : "Salin token"}</button><button type="button" onClick={onRegenerate} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-white hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"><RefreshCw className="h-4 w-4" aria-hidden="true" />Buat ulang</button></div></div></div>;
}
