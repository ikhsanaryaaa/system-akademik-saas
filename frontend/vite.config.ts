import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Izinkan akses lewat Cloudflare quick tunnel (subdomain acak *.trycloudflare.com).
    // Awalan titik mencakup seluruh subdomain di bawah domain tersebut.
    allowedHosts: ["demo.ikhsanaryaaa.dev", "api.ikhsanaryaaa.dev"],
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
