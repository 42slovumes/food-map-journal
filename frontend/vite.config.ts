import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// 讀取 repo 根目錄的 .env（單一來源同時驅動前後端設定）
export default defineConfig({
  plugins: [react()],
  envDir: path.resolve(__dirname, ".."),
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 5173,
  },
});
