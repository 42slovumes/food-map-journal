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
- **共編協作 + 即時同步（第二階段）**：以 email 邀請成員、權限分 Owner/Editor/Viewer；透過 WebSocket（Django Channels + Redis）即時同步地點/分類新增・修改・刪除與成員/權限變更；線上成員指示、他人動作提示、斷線自動重連；Viewer 介面唯讀。
- **圖片產出與分享（第三階段）**：一鍵產生美觀排行榜分享圖卡（可選顯示評分/標籤/地址/備註、下載 PNG）；產生公開唯讀分享連結，分享到 LINE / Facebook / Threads / 系統分享。
- **公開分享頁**：免登入的唯讀地圖頁（`/share/:token`），含地圖、清單與 Google Maps 跳轉。
- **智慧推薦（第三階段，後端多訊號）**：高評價 / 想去清單 / 附近順路 / 朋友也收藏（共編夥伴的高分收藏），各帶推薦理由。
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
| 後端 | Django 5 + Django REST Framework、SimpleJWT、django-filter、**Channels + channels-redis + Daphne（WebSocket 即時同步）**、uv 管理 |
| 資料庫 | PostgreSQL（Docker）／本機可降級 SQLite |
| 即時 | WebSocket（Django Channels），Redis 作 channel layer（本機可降級 InMemory） |
| 基礎設施 | Docker Compose（db / redis / backend / frontend） |

---

## 🚀 快速開始

### 方式一：Docker（推薦，最接近正式環境）

```bash
cp .env.example .env        # 可直接使用預設值
docker compose up --build
```

- 前端：<http://localhost:5173>
- 後端 API：<http://localhost:8080/api/v1>（健康檢查：<http://localhost:8080/healthz/>）
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
| `VITE_API_BASE_URL` | 前端呼叫的後端位置（預設 `http://localhost:8080/api/v1`） |
| `POSTGRES_*` | 資料庫帳密；本機不設 `POSTGRES_HOST` 即用 SQLite |
| `CHANNEL_LAYER` | 即時同步 channel layer：`redis`（Docker/正式）或留空＝InMemory（本機單程序） |
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

所有 API 統一掛在 **`/api/v1/`** 前綴下，方便日後擴展與版本演進。

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/healthz/`（亦 `/api/v1/healthz/`） | 健康檢查：版本、發佈日期、commit、環境、時間（供 k8s/VM 探針與版更除錯） |
| GET | `/api/v1/health/` | 輕量存活檢查（簡單 ok） |
| POST | `/api/v1/auth/register/` · `/api/v1/auth/login/` · `/api/v1/auth/refresh/` | 註冊 / 登入 / 換 token |
| POST | `/api/v1/auth/google/` | Google ID token 登入（驗證後換發 JWT） |
| POST | `/api/v1/auth/logout/` | 登出（撤銷 refresh token） |
| GET/PATCH | `/api/v1/auth/me/` | 個人資料 |
| CRUD | `/api/v1/maps/` · `/api/v1/categories/` · `/api/v1/places/` | 地圖 / 分類 / 地點 |
| GET | `/api/v1/places/?category=&status=&search=&map=` | 篩選 |
| GET | `/api/v1/places/?lat=&lng=&radius=` | 附近搜尋（回傳 `distance_km`，依距離排序） |
| GET/POST | `/api/v1/maps/{id}/collaborators/` | 列出 / 以 email 邀請共編者（owner） |
| PATCH/DELETE | `/api/v1/maps/{id}/collaborators/{cid}/` | 改角色 / 移除（owner）或成員自行退出 |
| POST/DELETE | `/api/v1/maps/{id}/share/` | 產生 / 撤銷公開分享連結（owner） |
| GET | `/api/v1/public/maps/{token}/` | 公開唯讀地圖（免登入，精簡欄位） |
| GET | `/api/v1/recommendations/?map=&lat=&lng=` | 智慧推薦分組：高評價 / 想去 / 附近 / 朋友也收藏 |
| GET | `/api/v1/meta/presets/` | 狀態 / 顏色 / 標籤 / 圖示建議 |
| WS | `ws://<host>/ws/maps/{id}/?token=<access>` | 即時同步：成員連線後接收 place/category/collaborator 等事件與上線狀態 |

> 健康檢查範例：`curl http://localhost:8080/healthz/` →
> `{"status":"ok","version":"0.2.0","released":"2026-06-10","commit":"","environment":"development","time":"..."}`
> 版本資訊可由 `APP_VERSION` / `APP_RELEASE_DATE` / `APP_GIT_SHA` 環境變數於部署時覆蓋。前端打包會自動嵌入版本與日期（設定頁底部顯示）。

---

## 🗺️ Roadmap

- ~~**第一階段**：穩固可運行 MVP。~~ ✅ 完成
- ~~**第二階段**：共編協作 + Django Channels + Redis + WebSocket 即時同步、權限管理。~~ ✅ 完成
- ~~**第三階段**：地圖/清單圖片產出與社群分享、公開分享連結、智慧推薦。~~ ✅ 完成
- **後續優化**：PostGIS 地理空間查詢（目前以 haversine + bounding box 達成附近搜尋，功能已滿足；PostGIS 為正式環境的效能優化，需換 PostGIS 映像 + GeoDjango，列為選用）、持久化操作紀錄、相似度/順路推薦。
