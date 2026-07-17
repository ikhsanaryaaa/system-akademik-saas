import { Search } from "lucide-react";
import { useState } from "react";

// SearchBar adalah kolom pencarian global di top bar. Saat ini murni UI;
// aksi pencarian disambungkan kemudian. Menyusut jadi ikon di layar sempit.
export default function SearchBar() {
  const [value, setValue] = useState("");

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Cari..."
        aria-label="Pencarian"
        className="h-9 w-40 rounded-md border border-hairline bg-canvas pl-8 pr-3 text-sm text-ink placeholder:text-muted transition-[width,border-color] focus:w-56 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 lg:w-56 lg:focus:w-64"
      />
    </div>
  );
}
