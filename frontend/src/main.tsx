import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { AcademicYearProvider } from "./context/AcademicYearContext";
import { applyBranding } from "./lib/branding";
import { initTheme } from "./lib/theme";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./index.css";

// Terapkan branding default sebelum render; nanti diganti nilai dari config backend.
applyBranding();
// Terapkan mode terang/gelap sebelum render agar tidak ada kedip warna.
initTheme();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AcademicYearProvider>
          <App />
        </AcademicYearProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
