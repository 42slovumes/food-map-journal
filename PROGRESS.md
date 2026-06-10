# 開發進度紀錄 (PROGRESS)

> 這份檔案記錄目前做到哪裡、做了什麼決策、還剩什麼。中斷後可從這裡接續。
> 需求來源：[plan.md](./plan.md)；設計參考：[design-references/](./design-references/)

## 重大決策（已與使用者確認）

1. **地圖方案：雙模式自動降級** — 有 `VITE_GOOGLE_MAPS_API_KEY` 用 Google Maps + Places；沒有金鑰自動降級成 Leaflet + OpenStreetMap，專案不需金鑰即可跑起來。
2. **本次範圍：穩固可運行 MVP** — 登入註冊、地圖/分類、地點 CRUD、地圖標記、清單、單一分類切換、狀態標註、附近搜尋、Google 跳轉、PostgreSQL、Docker。共編即時同步/分享圖片/智慧推薦留待後續階段（但架構先預留）。
3. **UI 風格：簡約優先 + 進階開關** — 預設走 Claude 骨架版的簡約、橘色、行動優先（bottom sheet + FAB + TabBar）。多欄工作台、細緻欄位、活動紀錄等高密度內容收進「進階模式」開關，借用 Codex 版的精緻卡片/成員列/分享圖卡優點。

## 技術選型

- 前端：React + Vite + TypeScript + React Router + Zustand + Tailwind CSS；地圖抽象層（Google Maps JS API / react-leaflet）。
- 後端：Django + DRF（+ 預留 Channels）、uv 管理、JWT 認證。
- 資料庫：PostgreSQL（Docker），本機快速開發可降級 SQLite。
- 基礎設施：Docker Compose（postgres / redis / backend / frontend）。

## 目錄結構

```
food-map-journal/
├── backend/        Django + DRF（config 專案、accounts、maps apps）
├── frontend/       React + Vite + TS
├── docker-compose.yml
├── .env.example
└── PROGRESS.md
```

## 進度看板

| # | 工作項 | 狀態 |
|---|--------|------|
| 1 | monorepo 骨架與根設定 | ✅ 完成 |
| 2 | 後端 Django + uv + settings 分環境 | ✅ 完成 |
| 3 | 後端資料模型 User/Map/Category/Place | ✅ 完成 |
| 4 | 後端 DRF API（auth/CRUD/附近搜尋） | ✅ 完成 |
| 5 | 前端骨架與設計系統（橘色簡約） | ✅ 完成 |
| 6 | 前端地圖抽象層（Google/Leaflet 雙模式） | ✅ 完成 |
| 7 | 前端認證頁與 API client | ✅ 完成 |
| 8 | 前端主應用（地圖/清單/分類/詳情/新增） | ✅ 完成 |
| 9 | 前端管理與設定頁（進階開關） | ✅ 完成 |
| 10 | Docker 化與端到端驗證 | ✅ 完成 |

**MVP 全數完成並通過驗證。** 前端設計：溫暖紙感極簡（米白底＋暖橘＋Fraunces 標題），行動優先（bottom sheet + FAB + 底部 tab + 桌機左側導覽軌）。頁面：登入/註冊、主畫面（地圖/清單/分割 + 分類 chips + 附近搜尋 + 詳情 + 新增/編輯）、收藏管理（地圖/分類 CRUD）、探索推薦、設定（進階模式開關）。

## 後端 API 一覽（已驗證）

- `POST /api/auth/register/`、`POST /api/auth/login/`、`POST /api/auth/refresh/`、`GET/PATCH /api/auth/me/`
- `GET /api/health/`、`GET /api/meta/presets/`（狀態/顏色/標籤/圖示建議）
- `/api/maps/`、`/api/categories/`、`/api/places/`（CRUD，JWT 保護，只能存取自己的資料）
- 篩選：`?category=`、`?status=`、`?map=`、`?search=`
- 附近搜尋：`?lat=&lng=&radius=`（bounding box 粗篩 + haversine 精算排序，回傳 `distance_km`）
- 地點 `google_maps_url` 在無提供時自動依 place_id / 座標 / 名稱產生

## 重要環境註記

- 本機 8000–8010 已被使用者其他專案佔用 → 本專案預設改用 **backend host 8080 / frontend 5173**。
- 後端無 `DATABASE_URL` / `POSTGRES_HOST` 時自動降級 SQLite（已用此模式驗證通過）；Docker 走 PostgreSQL。
- demo 帳號：`demo@foodmap.app` / `demo1234`（`python manage.py seed_demo`）。

## 待辦決策 / 未來擴充（非本次 MVP 範圍）

- 第二階段：Django Channels + Redis + WebSocket 即時共編（asgi.py 已預留註解位置；Collaborator/權限模型待建）。
- 第三階段：分享圖片產出、智慧推薦、PostGIS。
- 標籤 MVP 以 Place.tags JSONField 儲存（非正規化），未來如需排行/聚合再拆 tags / place_tags 表。

## 變更日誌

- 2026-06-10：閱讀 plan.md 與 design-references，確認三項重大決策，建立 monorepo 骨架。
- 2026-06-10：完成後端（Django 5.1 + DRF + JWT），User/Map/Category/Place 模型與 migration，CRUD + 附近搜尋 API，種子資料；以 SQLite 降級模式 curl 煙霧測試全數通過。
- 2026-06-10：完成前端全部頁面與設計系統（Vite + React + TS + Tailwind + Zustand + Framer Motion）。`pnpm build` 型別檢查與打包零錯誤；Vite dev 轉譯關鍵模組無誤；本機端到端（backend 8080 + frontend 5173）登入/資料載入驗證通過。
- 2026-06-10：完成 Docker 化（backend/frontend Dockerfile、entrypoint、docker-compose）。修正前端容器內 pnpm 版本（釘 10.30.3，避開 pnpm 11 supply-chain 政策）。`docker compose up` 全堆疊驗證通過：Postgres 內遷移＋種子、登入、單一分類、附近搜尋、雙服務皆正常，4 容器 Up、db healthy。
- 2026-06-10：撰寫 README（Docker / 本機兩種啟動方式、demo 帳號、API 一覽、roadmap）。

## 視覺驗證（真實瀏覽器）

用 puppeteer-core 驅動系統 Chrome，對所有主要畫面截圖檢視（桌機 + 手機），並量測無水平 overflow：

- 登入/註冊、主畫面（桌機分割：左清單/右地圖；手機清單與地圖模式）、地點詳情（桌機左面板 / 手機 bottom sheet）、新增地點表單、收藏管理、探索推薦、設定（進階模式開關）。
- 修正一個手機版 bug：預設 `viewMode="split"` 在手機會把面板與地圖都隱藏 → 改為手機把 split 視為 list 渲染（`effectiveView`）。
- 修正 Docker（macOS bind mount 不傳檔案事件）hot reload：compose 加 `CHOKIDAR_USEPOLLING=true`。
- demo 登入 → 主畫面流程在真實瀏覽器跑通；對 Docker/Postgres 堆疊最終確認通過。

## Google 登入（後續加入）

- 方案：Google Identity Services（ID token 流程）→ 後端 `google-auth` 驗證（簽章/aud/iss/過期/email_verified）→ 依 email get_or_create → 換發本站 JWT。
- 後端：`User.google_id` / `avatar_url` 欄位（migration 0002）、`POST /api/auth/google/`、`GOOGLE_OAUTH_CLIENT_ID` 設定；新 Google 使用者設為不可用密碼，既有 email 帳號會被「連結」而非重建。
- 前端：`GoogleSignInButton`（載入 GIS、渲染官方按鈕）、AuthPage 整合「或」分隔 + Google 按鈕、`authApi.google` / `loginWithGoogle`。
- 雙模式降級：未設定 `GOOGLE_OAUTH_CLIENT_ID` / `VITE_GOOGLE_CLIENT_ID` 時整個功能自動隱藏，不影響 email 登入。
- 驗證：後端 6 個 pytest 全過（停用→503、無效 token→401、未驗證 email→401、建立新帳號為不可用密碼、既有 email 連結）；Docker migration 已套用、無金鑰→503、email 登入回歸正常；前端帶 dummy client id 截圖確認 Google 按鈕渲染。
- 需使用者提供：在 Google Cloud Console 建 Web OAuth Client ID（授權來源 http://localhost:5173），填入 `.env` 的 `GOOGLE_OAUTH_CLIENT_ID` 與 `VITE_GOOGLE_CLIENT_ID`（同一組），即可實際使用。

## Google 登入安全審查（多代理對抗式）

對 OAuth 變更跑了 3 視角 × 對抗式驗證的安全工作流（17 agents），確認 11 個發現後用工程判斷分流：

**已修並驗證：**
- `email_verified` 檢查瑕疵（原 `is False` 在 claim 缺失時不擋）→ 改 `is not True`，並要求 `sub` 必存在（補 2 個測試）。
- email 一律小寫正規化（RegisterSerializer + User.save），杜絕大小寫重複/誤配。
- 認證端點 rate limiting：DRF `ScopedRateThrottle`，登入/註冊/Google scope `auth` = 10/min（實機驗證第 11 次回 429）。
- refresh token 黑名單：`BLACKLIST_AFTER_ROTATION=True` + `token_blacklist` app + `POST /api/auth/logout/`（實機驗證撤銷後 refresh→401）。
- 後端測試 9 個全過。

**評估後不修（高估／非 MVP／UX 取捨，刻意保留）：**
- 既有 email 帳號自動連結 Google：在嚴格 `email_verified` 後，只有「控制該已驗證 email」者能登入＝帳號擁有者本人，自動連結是業界標準且安全；強制 409 會傷 UX → 保留。
- token 存 localStorage、缺 CSP：MVP 可接受取捨，httpOnly cookie / CSP 列後續強化。
- client_id 前後端一致性：屬設定 DX（README 已載明需同一組）。錯誤訊息列舉、email full_clean：近乎零風險。

## 目前執行狀態

- Docker 全堆疊目前為「已啟動」狀態（`docker compose up -d`）：前端 http://localhost:5173、後端 http://localhost:8080/api。
- 停止：`docker compose down`。
- 也可改用本機方式（後端 SQLite）開發，見 README。
