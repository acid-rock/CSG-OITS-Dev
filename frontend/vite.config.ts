import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // The only chunk above this limit is the lazily-imported `exceljs` vendor
    // (~1 MB), which is loaded on demand when an admin exports XLSX — never in
    // the initial bundle.
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          pdfjs: ["pdfjs-dist"],
        },
      },
    },
  },
});
