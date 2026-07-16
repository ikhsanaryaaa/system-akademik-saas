// Top bar 60px terang. Breadcrumb, context switcher, notifikasi, dan menu
// akun ditambahkan di tahap berikutnya.
export default function TopBar() {
  return (
    <header className="h-[60px] shrink-0 bg-white border-b border-hairline flex items-center justify-between px-6">
      <div className="text-ink font-medium">Dashboard</div>
      <div className="text-sm text-muted">Konteks tahun ajaran</div>
    </header>
  );
}
