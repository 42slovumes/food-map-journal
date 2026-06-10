import { readFileSync } from "node:fs";
import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// 從 package.json 取版本；打包當下產生日期，注入成編譯期常數
const pkg = JSON.parse(readFileSync(path.resolve(__dirname, "package.json"), "utf-8"));
const buildDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

// 讀取 repo 根目錄的 .env（單一來源同時驅動前後端設定）
export default defineConfig({
  plugins: [react()],
  envDir: path.resolve(__dirname, ".."),
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_DATE__: JSON.stringify(buildDate),
  },
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
