# 🗺️ Pinmap · food-map-journal

一個自由分類的地圖收藏平台。把想去的、去過的、朋友推薦的地點，依自己的主題（拉麵、咖啡廳、想去景點、約會清單…）釘在地圖上，記錄狀態、評價與心得，並一鍵跳轉 Google Maps 導航。不只美食 —— 景點、展覽、旅遊、購物都收得下。

> 設計取向：**簡約優先、低認知負荷、行動優先**。介面預設清爽好上手；想要更多細緻欄位與篩選的人，可在「設定 → 進階模式」一鍵開啟。

---

## ✨ 已完成功能（MVP）

- **帳號系統**：註冊 / 登入 / 登出（JWT）、**Google 登入（選用）**、個人資料、路由守衛。
- **自由分類**：自訂名稱、顏色、圖示、描述，排序與計數。
- **地圖 / 看板**：可建立多張主題地圖並快速切換。
- **地點紀錄**：名稱、地址、座標、狀態、星等、標籤、備註，照片與進階欄位。
- **地點搜尋帶入座標**：輸入店名/地址自動帶入地址與經緯度（OpenStreetMap，免金鑰）。
- **地圖標註 + 清單**：地圖 marker 與清單卡片連動；桌機分割視圖、手機地圖/清單切換 + bottom sheet 詳情。
- **單一分類切換**：chips 一鍵只看某個分類。
- **附近搜尋**：依目前位置，列出附近已收藏的地點並按距離排序。
- **Google Maps 高度整合**：每個地點自動產生 Google Maps 連結，一鍵開啟導航。
- **探索推薦（第一階段，規則式）**：高評價 / 想去清單 / 附近順路。
- **進階模式開關**：把高密度欄位與篩選收進設定，預設保持清爽。
- **雙模式地圖**：有 `VITE_GOOGLE_MAPS_API_KEY` 用 Google Maps；沒有則自動降級 Leaflet + OpenStreetMap。
- **三環境設定**：development / staging / production。
- **Docker 一鍵開發環境**：postgres + redis + backend + frontend。

第二、三階段（共編即時同步、分享圖片、智慧推薦進階版）規劃見 [PROGRESS.md](./PROGRESS.md)。

---

## 🧱 技術架構

| 層 | 技術 |
|----|------|
| 前端 | React + Vite + TypeScript、React Router、Zustand、Tailwind CSS、Framer Motion、地圖抽象層（Google Maps JS API / react-leaflet） |
| 後端 | Django 5 + Django REST Framework、SimpleJWT、django-filter、uv 管理 |
| 資料庫 | PostgreSQL（Docker）／本機可降級 SQLite |
| 基礎設施 | Docker Compose（db / redis / backend / frontend） |

---

## 🚀 快速開始

### 方式一：Docker（推薦，最接近正式環境）

```bash
cp .env.example .env        # 可直接使用預設值
docker compose up --build
```

- 前端：<http://localhost:5173>
- 後端 API：<http://localhost:8080/api>
- 啟動時會自動建立資料表並灌入示範資料。

停止：`docker compose down`（保留資料）／`docker compose down -v`（連資料一起清除）。

### 方式二：本機開發（不需 Docker，後端走 SQLite）

```bash
cp .env.example .env        # 本機預設不設 POSTGRES_HOST → 自動用 SQLite

# 後端
cd backend
uv sync
uv run python manage.py migrate
uv run python manage.py seed_demo
uv run python manage.py runserver 0.0.0.0:8080

# 前端（另開一個終端）
cd frontend
pnpm install
pnpm dev
```

### Demo 帳號

```
帳號：demo@foodmap.app
密碼：demo1234
```

> 登入頁也有「用 demo 帳號快速體驗」按鈕。

---

## 🔑 環境變數

所有設定集中在 repo 根目錄的 `.env`（由 `.env.example` 複製），同時驅動前後端。重點：

| 變數 | 說明 |
|------|------|
| `VITE_GOOGLE_MAPS_API_KEY` | 留空 → 自動用 OpenStreetMap；填入 → 切換成 Google Maps + Places |
| `GOOGLE_OAUTH_CLIENT_ID` / `VITE_GOOGLE_CLIENT_ID` | Google 登入用的同一組 Web Client ID（前後端皆需）；留空則不啟用 Google 登入 |
| `VITE_API_BASE_URL` | 前端呼叫的後端位置（預設 `http://localhost:8080/api`） |
| `POSTGRES_*` | 資料庫帳密；本機不設 `POSTGRES_HOST` 即用 SQLite |
| `DJANGO_ENV` | `development` / `staging` / `production` |

### 啟用 Google 登入（選用）

1. 到 [Google Cloud Console](https://console.cloud.google.com/apis/credentials) 建立 **OAuth 2.0 用戶端 ID → 網頁應用程式**。
2. 在「已授權的 JavaScript 來源」加入 `http://localhost:5173`（正式環境再加你的網域）。
3. 把產生的 **Client ID** 同時填入 `.env` 的 `GOOGLE_OAUTH_CLIENT_ID` 與 `VITE_GOOGLE_CLIENT_ID`（必須是同一組）。
4. 重啟服務 → 登入頁會自動出現「使用 Google 繼續」按鈕。

> 流程：前端用 Google Identity Services 取得 ID token → 後端用 `google-auth` 驗證（簽章、audience、未過期、email 已驗證）→ 依 email 找到或建立使用者 → 換發本站 JWT。沒填 Client ID 時整個功能自動隱藏，不影響 email 登入。

> 本機 8000–8010 常被其他服務佔用，本專案因此預設使用 8080（後端）/ 5173（前端）。

---

## 📁 專案結構

```
food-map-journal/
├── backend/                Django + DRF
│   ├── config/             專案設定（settings 分 base/dev/staging/prod、urls、asgi/wsgi）
│   ├── accounts/           自訂 User + JWT 認證
│   ├── maps/               Map / Category / Place 模型、API、附近搜尋、種子資料
│   ├── Dockerfile · entrypoint.sh · pyproject.toml
├── frontend/               React + Vite + TS
│   └── src/
│       ├── map/            地圖抽象層（Google / Leaflet 雙模式）
│       ├── store/          Zustand（auth / data / ui 偏好）
│       ├── components/     UI 元件與表單
│       ├── pages/          Auth / Map / Manage / Discover / Settings
│       └── lib/            api client、格式化、地理編碼
├── docker-compose.yml
├── .env.example
├── plan.md                 產品需求書
├── PROGRESS.md             開發進度紀錄
└── design-references/      Claude / Codex 版 UIUX 參考圖
```

---

## 🔌 API 一覽

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/auth/register/` · `/api/auth/login/` · `/api/auth/refresh/` | 註冊 / 登入 / 換 token |
| POST | `/api/auth/google/` | Google ID token 登入（驗證後換發 JWT） |
| GET/PATCH | `/api/auth/me/` | 個人資料 |
| CRUD | `/api/maps/` · `/api/categories/` · `/api/places/` | 地圖 / 分類 / 地點 |
| GET | `/api/places/?category=&status=&search=&map=` | 篩選 |
| GET | `/api/places/?lat=&lng=&radius=` | 附近搜尋（回傳 `distance_km`，依距離排序） |
| GET | `/api/meta/presets/` | 狀態 / 顏色 / 標籤 / 圖示建議 |

---

## 🗺️ Roadmap

- **第二階段**：共編協作 + Django Channels + Redis + WebSocket 即時同步、權限管理。
- **第三階段**：地圖/清單圖片產出與社群分享、智慧推薦進階版、PostGIS 地理查詢優化。
