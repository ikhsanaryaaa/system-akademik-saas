/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Seluruh warna memakai CSS custom property agar branding per instance
        // dan dark mode bisa menimpanya tanpa menyentuh util di komponen.
        primary: {
          DEFAULT: "var(--color-primary, #2563eb)",
          hover: "var(--color-primary-hover, #1d4ed8)",
          active: "var(--color-primary-active, #1e40af)",
          soft: "var(--color-primary-soft, #eff6ff)",
          border: "var(--color-primary-border, #bfdbfe)",
        },
        ink: "var(--color-ink, #0f172a)",
        body: "var(--color-body, #334155)",
        muted: {
          DEFAULT: "var(--color-muted, #64748b)",
          soft: "var(--color-muted-soft, #94a3b8)",
        },
        hairline: {
          DEFAULT: "var(--color-hairline, #e2e8f0)",
          soft: "var(--color-hairline-soft, #f1f5f9)",
        },
        canvas: "var(--color-canvas, #ffffff)",
        "surface-soft": "var(--color-surface-soft, #f8fafc)",
        "surface-strong": "var(--color-surface-strong, #f1f5f9)",
        sidebar: "var(--color-sidebar, #0f172a)",
        "sidebar-elevated": "var(--color-sidebar-elevated, #1e293b)",
        "on-sidebar": "var(--color-on-sidebar, #e2e8f0)",
        "on-sidebar-muted": "var(--color-on-sidebar-muted, #94a3b8)",
        success: {
          DEFAULT: "var(--color-success, #16a34a)",
          soft: "var(--color-success-soft, #dcfce7)",
        },
        warning: {
          DEFAULT: "var(--color-warning, #d97706)",
          soft: "var(--color-warning-soft, #fef3c7)",
        },
        danger: {
          DEFAULT: "var(--color-danger, #dc2626)",
          hover: "var(--color-danger-hover, #b91c1c)",
          soft: "var(--color-danger-soft, #fee2e2)",
        },
        info: {
          DEFAULT: "var(--color-info, #0284c7)",
          soft: "var(--color-info-soft, #e0f2fe)",
        },
        overlay: "var(--color-overlay, rgba(15, 23, 42, 0.5))",
      },
      fontFamily: {
        sans: ["Inter Variable", "Inter", "system-ui", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono Variable", "JetBrains Mono", "ui-monospace", "monospace"],
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
