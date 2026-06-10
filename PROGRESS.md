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

## API 版本化、healthz 與前端版本標記（本輪）

- **Google 登入複查**：9 個 pytest 全過、前後端元件齊全，確認完整可用。
- **API 改 `/api/v1/`**：`config/urls.py` 全部路由前綴改 v1；同步更新前端 `VITE_API_BASE_URL` 預設、`.env(.example)`、docker-compose、README、測試絕對路徑。前端無其他 `/api` 硬編碼（皆走 baseURL）。實機驗證：前端登入後所有呼叫走 `/api/v1/`、舊 `/api/...` 回 404。
- **healthz**：新增 `GET /healthz/`（與 `/api/v1/healthz/`）回傳 `status/service/version/released/commit/environment/time`，供 k8s/VM 探針與版更除錯；`/api/v1/health/` 為輕量 ok。版本資訊在 `backend/config/version.py`，可由 `APP_VERSION`/`APP_RELEASE_DATE`/`APP_GIT_SHA` 覆蓋（compose 已 passthrough）。
- **前端打包嵌日期**：vite `define` 注入 `__APP_VERSION__`（package.json）與 `__BUILD_DATE__`（打包當日 YYYY-MM-DD），設定頁底顯示「v0.2.0 · build 2026-06-10」。版本升至 0.2.0。
- **附帶修正**：`seed_demo` 改為冪等（已有 demo 資料就略過，`--force` 可重建），避免每次重啟後端清掉使用者資料。

## 第二階段：共編協作 + 即時同步（完成）

**後端**
- `Collaborator(map, user, role)` 模型 + migration；Map 角色判斷 `role_for/can_view/can_edit/can_manage`（owner/editor/viewer）。
- Map/Category/Place queryset 擴及共編地圖；`MapAccessPermission`：viewer 唯讀、editor 可寫地點/分類、owner 管理地圖與成員。
- 共編者 API `/maps/{id}/collaborators/`：列出、以 email 邀請、改角色、移除；owner 限定，成員可自行退出。
- Channels + channels-redis + Daphne；`config/asgi.py` ProtocolTypeRouter；`JWTAuthMiddleware`（?token= 驗證）；`MapConsumer` 依地圖分 group、驗權、presence；`CHANNEL_LAYER=redis`（Docker）/InMemory（本機）。
- REST 寫入後 `broadcast_event` 推播 place/category/collaborator/permission 事件給同地圖 group。

**前端**
- `wsBaseUrl()` 由 API base 推導；`store/realtime.ts` 管理 WS 連線、presence、重連（指數退避）、事件分派與他人動作 toast。
- `store/data.ts` `applyEvent` 即時 upsert/移除地點、刷新分類/成員/地圖；成員 CRUD。
- AppLayout 跟隨 activeMap 連線、登出斷線；`MembersDialog` 成員管理（邀請/角色/移除/退出、線上指示）。
- 權限感知：viewer 隱藏 FAB/新增/編輯/刪除/點圖新增；工具列成員按鈕含線上數與連線綠點。

**驗證**
- 後端測試 21 個全過（11 共編權限 + 10 認證，含新「註冊免帶 username」回歸）。
- WebSocket live 測試：無 token 被拒、成員連線、place.created/updated/deleted 即時推播。
- 真實瀏覽器兩分頁：A 改 → B 不重整即見/即移除。
- 真實瀏覽器跨使用者：邀請 editor → 看到共享地點與 FAB → demo 新增 collab2 即時看到 → 降為 viewer 後 FAB 即時消失。
- **附帶修正**：發現並修掉「用 app 註冊（不帶 username）會 400」的 MVP 既有 bug（serializer username 改非必填）。

**設計取捨/未做**：持久化操作紀錄(activity_logs) 與「邀請連結 token」留待後續（目前邀請＝加既有 email 使用者）；presence 在連線期間累積（晚加入者看不到先前已在線者，屬已知小限制）。

### 共編安全審查（多代理對抗式，24 agents，19 個成立發現）

**已修並驗證：**
- **IDOR（critical）**：`perform_update` 未驗證目標地圖 → editor 可把地點/分類搬到無權限地圖。已在 PlaceViewSet/CategoryViewSet 的 `perform_update` 補目標 `can_edit` 驗證，加 2 個回歸測試（共 23 測試全過）。
- **被移除成員 WS 仍收事件（critical）**：consumer 收到 `collaborator.removed`/`permission.updated` 後重檢角色，非成員即以 4403 斷線（live 驗證通過）。降為 viewer 不斷線（viewer 本就可讀）。

**評估後不改（記錄理由）：**
- 廣播前已是「授權寫入成功後」才觸發，actor 必已具權限（非問題）。
- WS 用 ?token=、過期 token 連線存續、Redis/WSS TLS、WS 連線限流 → 屬**部署層強化**（正式環境用 wss + Redis TLS/密碼；可改短期 WS ticket），列後續。
- 成員互看 email/建立者/操作者 → 協作工具設計常態（如 Google Docs 顯示協作者）。
- map.deleted 廣播、角色查詢 N+1 → 後續優化。

## 第三階段：圖片產出與分享 + 公開連結 + 智慧推薦（完成）

**後端**
- 智慧推薦 `GET /api/v1/recommendations/?map=&lat=&lng=`：分組回傳高評價/附近/想去/朋友也收藏（共編地圖的高分地點），各帶理由；只回傳使用者可存取的地點。
- 公開分享：`Map.share_token`（UUID4，migration 0003）；`POST/DELETE /maps/{id}/share/`（owner 限定）產生/撤銷；`GET /public/maps/{token}/` 免登入唯讀，用 `PublicPlaceSerializer` 精簡欄位（不外洩建立者/想去原因/體驗/place_id）；share_token 只回給 owner。

**前端**
- ShareDialog：公開連結開關＋複製＋LINE/FB/Threads/系統分享；ShareCard 排行榜圖卡（可選顯示評分/標籤/地址/備註）以 html-to-image 下載 PNG。
- PublicMapPage（`/share/:token`）：免登入唯讀地圖＋清單＋marker＋「建立你的地圖」CTA。
- DiscoverPage 改用後端推薦 API，分組 tabs 含計數與理由（含「朋友也收藏」）。

**驗證**
- 後端測試 29 個全過（含公開分享免登入讀取、未分享 404、僅 owner 可分享、share_token 僅 owner 可見、推薦分組、朋友也收藏、公開 payload 不外洩私人欄位）。
- 瀏覽器：分享圖卡渲染（排行榜 7 筆）＋公開連結＋社群按鈕；公開頁免登入正常顯示地圖/清單；推薦頁分組 tabs 與卡片正常。

**PostGIS 決策**：plan 列為地理查詢「優化」。目前 haversine + bounding box 已完整滿足附近搜尋功能；導入 PostGIS 需換 PostGIS 映像 + GeoDjango（GDAL/GEOS）且會破壞本機 SQLite 開發路徑，屬高風險純優化 → 列為選用的正式環境優化，README 記錄升級路徑。

### 第三階段安全審查（多代理對抗式，19 agents，7 個成立發現）

**已修並驗證：**
- 公開端點分類序列化外洩 `is_public`/`is_collaborative` → 改用 `PublicCategorySerializer` 精簡欄位（live 驗證不再外洩）。
- 推薦回傳完整 PlaceSerializer（含 want_reason/experience_note）→ 改用 `RecommendationPlaceSerializer`（卡片本就不顯示這些；縱深防禦）。
- 推薦的附近查詢缺 bounding box → 比照 PlaceViewSet 加粗篩，避免記憶體放大。
- 加測試斷言（公開分類無內部旗標、推薦無個人欄位），共 29 測試全過。

**評估後不改（記錄）：**
- friends 「外洩非共編地圖」為誤報：queryset 以 `collaborators__user=user` 限定＝確實是分享給該使用者的地圖；且共編者本就能透過 /places/ 讀到（非新外洩）。
- share_token 回給 owner 是必要、owner-only 且冪等；撤銷後查 NULL token 立即 404（即時失效，已 live 驗證）。
- share_token 用 UUID4（~2^122）無法列舉；PublicPlaceSerializer 欄位限制正確（審查確認「做對了」）。

## PostGIS 地理空間查詢（完成）

- **GeoDjango**：`django.contrib.gis`；DB engine 依環境自動選 PostGIS（Docker）/ SpatiaLite（本機·測試）；settings 自動偵測 Homebrew 函式庫路徑（GDAL/GEOS/SpatiaLite）。
- **Place.location**：`PointField(srid=4326, spatial_index=True)`，於 `save()` 由 lat/lng 同步；migration 0004（postgis 擴充 guarded 只在 postgres 跑、AddField、回填）。
- **附近查詢**：`location__dwithin`（走空間索引、度數預篩）+ haversine 精算排序；PlaceViewSet 與 RecommendationsView 一致；缺座標的地點自動排除。
- **Docker**：db 換 `postgis/postgis:16-3.4`、backend 映像裝 GDAL/GEOS/PROJ。
- **驗證**：本機 SpatiaLite 與 Docker PostGIS 都 30 測試全過（含空間附近搜尋測試）；Docker 確認 postgis 3.4.3 擴充、location POINT 幾何欄位、空間附近查詢距離排序正確。
- **本機需求**：`brew install gdal geos proj libspatialite`（README 已載明）。

## 全面回歸檢查（本輪）

- 後端測試 **30 passed**（SpatiaLite 本機 + PostGIS 容器內各一輪）。
- 前端 `pnpm build` 零錯誤。
- 端點 sweep：maps/categories/places/presets/recommendations/nearby/healthz 全 200。
- 瀏覽器 e2e 全通：登入、資料載入、**近我（定位＋PostGIS 空間查詢）**、即時同步、分享、公開頁、推薦。
- 多代理全專案稽核（7 子系統 × 對抗式驗證，20 agents）對照 plan 找問題 → 10 個成立發現，分流如下。

### 全專案稽核修正

**已修並驗證：**
- 登入未做 email 小寫正規化 → `EmailTokenObtainPairSerializer.validate` 補 `.lower()`（大小寫不敏感登入，live 驗證）+ 測試。
- `UserSerializer.email` 可被 PATCH /auth/me/ 修改（身份識別不該可變）→ 加入 `read_only_fields`（live 驗證 email 不變、其他欄位可改）+ 測試。
- **被移除成員前端處理（我前一階段引入的 bug）**：① WS `onclose` 未判 4403/4401 → 無限重連 ② 被移除後 `applyEvent` 先呼叫 `loadMembers()` 會 403 throw、導致 `reloadMaps()` 切換地圖跑不到。修正：onclose 判關閉碼不重連；applyEvent 改先 reloadMaps（自動切換到可用地圖）再 try/catch loadMembers；自己被移除時 toast 提示。e2e 驗證：提示 + 自動切換 + 不卡死。
- ManagePage 對共編地圖未做權限 gating → 地圖編輯/刪除只給 owner、分類管理只給 owner/editor。
- `Recommendations` 型別錯標為 `Place[]`（後端回精簡欄位）→ 新增 `RecommendationPlace` 型別。

**評估後不改（誤報/刻意）：**
- migration 0004「缺 spatial_index」為誤報：`spatial_index=True` 是 PointField 預設、Django 慣例不寫進 migration 文字但仍建 GiST 索引（已查 DB 確認 `USING gist (location)` 存在）；PROGRESS 所述指模型欄位，正確。
- presence 廣播含自己（自己在線上清單看到自己）：你本來就在線，屬可接受設計。

**最終回歸**：本機 SpatiaLite 與容器 PostGIS 各 **32 測試全過**；前端建置零錯誤；全面 e2e（登入/載入/近我空間/即時/分享/公開/推薦）全通；被移除成員流程 e2e 通過。

## 目前執行狀態

- Docker 全堆疊目前為「已啟動」狀態（`docker compose up -d`）：前端 http://localhost:5173、後端 http://localhost:8080/api。
- 停止：`docker compose down`。
- 也可改用本機方式（後端 SQLite）開發，見 README。
