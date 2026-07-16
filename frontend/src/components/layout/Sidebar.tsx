// Sidebar gelap 260px sesuai DESIGN.md. Item modul ditambahkan di tahap
// berikutnya dan visibilitasnya mengikuti RBAC.
export default function Sidebar() {
  return (
    <aside className="w-[260px] shrink-0 bg-sidebar text-on-sidebar min-h-screen">
      <div className="h-[60px] flex items-center px-4 text-white font-semibold">
        SIM Sekolah
      </div>
      <nav className="px-3 py-2 text-sm text-on-sidebar-muted">
        <p className="px-3 py-2">Menu akan tampil sesuai role.</p>
      </nav>
    </aside>
  );
}
