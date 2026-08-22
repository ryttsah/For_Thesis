import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const API_TARGET = "http://127.0.0.1:8000";

/** FastAPI route prefixes — proxied so the browser only talks to port 5173 (fixes dev tunnel CORS). */
const API_PREFIXES = [
  "auth",
  "registrations",
  "bootstrap",
  "predict",
  "queue",
  "visits",
  "officers",
  "farmers",
  "analytics",
  "meta",
  "health",
  "notifications",
].join("|");

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ["@tabler/icons-react"],
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      [`^/(${API_PREFIXES})`]: {
        target: API_TARGET,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
