import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// `just dev-ui` sets VITE_API_TARGET to the running stack (e.g. https://app.localhost).
const apiTarget = process.env.VITE_API_TARGET ?? "https://app.localhost";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      // Caddy uses a self-signed certificate, hence secure: false.
      "/api": { target: apiTarget, changeOrigin: true, secure: false },
    },
  },
});
