import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    headers: {
      // Allow eval() in dev mode (needed by Vite HMR + MSAL)
      // This header is only served by the dev server — not included in production builds
      "Content-Security-Policy": [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "connect-src 'self' https://login.microsoftonline.com https://graph.microsoft.com https://*.sharepoint.com wss://localhost:5173 ws://localhost:5173",
        "frame-src https://login.microsoftonline.com",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
      ].join("; "),
    },
  },
  define: {
    // Required for MSAL in some environments
    global: "globalThis",
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-msal": ["@azure/msal-browser", "@azure/msal-react"],
          "vendor-fluent": ["@fluentui/react-components", "@fluentui/react-icons"],
          "vendor-query": ["@tanstack/react-query", "zustand", "axios"],
        },
      },
    },
  },
});
