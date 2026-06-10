import { Columns2, Layers, LogOut, MapPin, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { hasGoogleMaps } from "@/map/MapView";
import { useAuth } from "@/store/auth";
import { useUI } from "@/store/ui";
import type { ViewMode } from "@/types";

export default function SettingsPage() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();

  const advanced = useUI((s) => s.advancedMode);
  const setAdvanced = useUI((s) => s.setAdvanced);
  const viewMode = useUI((s) => s.viewMode);
  const setViewMode = useUI((s) => s.setViewMode);

  return (
    <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-28 pt-5 md:px-8 md:pb-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <header>
          <h1 className="font-display text-2xl font-semibold text-ink">設定</h1>
        </header>

        {/* 個人資料 */}
        <section className="card p-5">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-ink text-xl font-semibold text-white">
              {(user?.display_name || user?.email || "?").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-semibold text-ink">
                {user?.display_name || "使用者"}
              </p>
              <p className="truncate text-sm text-ink-faint">{user?.email}</p>
            </div>
          </div>
        </section>

        {/* 偏好 */}
        <section className="card divide-y divide-line">
          <div className="px-5 py-3.5">
            <h2 className="font-display text-base font-semibold text-ink">偏好設定</h2>
          </div>

          {/* 進階模式 — 核心：把複雜功能收在這裡 */}
          <SettingRow
            icon={<Sparkles size={20} className="text-brand-600" />}
            title="進階模式"
            desc="顯示更多欄位與篩選：推薦程度、想去原因、體驗紀錄、Place ID、狀態篩選、共編設定等。預設關閉，保持介面清爽。"
          >
            <Switch checked={advanced} onChange={setAdvanced} />
          </SettingRow>

          {/* 預設視圖 */}
          <SettingRow
            icon={<Columns2 size={20} className="text-ink-soft" />}
            title="桌機預設視圖"
            desc="開啟主畫面時的版面。"
          >
            <div className="flex items-center gap-0.5 rounded-full border border-line bg-card p-0.5">
              {(
                [
                  { v: "split", label: "分割" },
                  { v: "map", label: "地圖" },
                  { v: "list", label: "清單" },
                ] as { v: ViewMode; label: string }[]
              ).map((o) => (
                <button
                  key={o.v}
                  onClick={() => setViewMode(o.v)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    viewMode === o.v ? "bg-brand-500 text-white" : "text-ink-soft"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </SettingRow>
        </section>

        {/* 系統資訊 */}
        <section className="card divide-y divide-line">
          <div className="px-5 py-3.5">
            <h2 className="font-display text-base font-semibold text-ink">關於</h2>
          </div>
          <SettingRow
            icon={hasGoogleMaps ? <MapPin size={20} className="text-emerald-600" /> : <Layers size={20} className="text-sky-600" />}
            title="地圖資料來源"
            desc={
              hasGoogleMaps
                ? "目前使用 Google Maps（已偵測到 API 金鑰）。"
                : "目前使用 OpenStreetMap（未設定 Google 金鑰）。設定 VITE_GOOGLE_MAPS_API_KEY 後將自動切換成 Google Maps。"
            }
          >
            <span
              className={`chip text-xs ${
                hasGoogleMaps
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-sky-200 bg-sky-50 text-sky-700"
              }`}
            >
              {hasGoogleMaps ? "Google Maps" : "OpenStreetMap"}
            </span>
          </SettingRow>
        </section>

        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="btn w-full border border-line bg-card py-3.5 text-rose-600 hover:border-rose-200 hover:bg-rose-50"
        >
          <LogOut size={18} />
          登出
        </button>

        <p className="pb-2 text-center text-xs text-ink-faint">Pinmap · 你的地圖收藏 · v0.1</p>
      </div>
    </div>
  );
}

function SettingRow({
  icon,
  title,
  desc,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 px-5 py-4">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-ink">{title}</p>
        <p className="mt-0.5 text-sm text-ink-faint">{desc}</p>
      </div>
      <div className="shrink-0 pt-0.5">{children}</div>
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 rounded-full transition ${checked ? "bg-brand-500" : "bg-stone-300"}`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}
