/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Warna utama memakai CSS custom property agar bisa di-inject dari branding per instance.
        primary: {
          DEFAULT: "var(--color-primary, #2563eb)",
          hover: "var(--color-primary-hover, #1d4ed8)",
          active: "var(--color-primary-active, #1e40af)",
          soft: "var(--color-primary-soft, #eff6ff)",
          border: "var(--color-primary-border, #bfdbfe)",
        },
        // Netral slate dan semantik status tetap konstan (lihat DESIGN.md).
        ink: "#0f172a",
        body: "#334155",
        muted: "#64748b",
        hairline: "#e2e8f0",
        "surface-soft": "#f8fafc",
        "surface-strong": "#f1f5f9",
        sidebar: "#0f172a",
        "sidebar-elevated": "#1e293b",
        "on-sidebar": "#e2e8f0",
        "on-sidebar-muted": "#94a3b8",
        success: "#16a34a",
        warning: "#d97706",
        danger: "#dc2626",
        info: "#0284c7",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
    },
  },
  plugins: [],
};
