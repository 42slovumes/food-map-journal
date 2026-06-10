import { ExternalLink, Navigation, Sparkles, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { StarRating } from "@/components/ui/StarRating";
import { FullSpinner } from "@/components/ui/Spinner";
import { placesApi } from "@/lib/api";
import { formatDistance, googleMapsUrl, statusTone } from "@/lib/format";
import { useData } from "@/store/data";
import type { Place } from "@/types";

type Tab = "top" | "wish" | "near";

const TABS: { key: Tab; label: string; icon: typeof Star }[] = [
  { key: "top", label: "高評價", icon: Star },
  { key: "wish", label: "想去清單", icon: Sparkles },
  { key: "near", label: "附近順路", icon: Navigation },
];

export default function DiscoverPage() {
  const activeMapId = useData((s) => s.activeMapId);
  const userLocation = useData((s) => s.userLocation);
  const locateUser = useData((s) => s.locateUser);
  const locating = useData((s) => s.locating);

  const [tab, setTab] = useState<Tab>("top");
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  // 取得整張地圖的地點（不受主畫面篩選影響）
  useEffect(() => {
    if (!activeMapId) return;
    setLoading(true);
    placesApi
      .list({ map: activeMapId })
      .then(setPlaces)
      .finally(() => setLoading(false));
  }, [activeMapId]);

  // 附近：有定位時抓附近排序
  const [nearPlaces, setNearPlaces] = useState<Place[]>([]);
  useEffect(() => {
    if (tab !== "near" || !activeMapId || !userLocation) return;
    placesApi
      .list({ map: activeMapId, lat: userLocation.lat, lng: userLocation.lng, radius: 10 })
      .then(setNearPlaces);
  }, [tab, activeMapId, userLocation]);

  const list = useMemo(() => {
    if (tab === "top")
      return [...places]
        .filter((p) => (p.rating ?? 0) >= 4)
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    if (tab === "wish")
      return places.filter((p) => ["想去", "一定要去", "想再訪"].includes(p.status));
    return nearPlaces;
  }, [tab, places, nearPlaces]);

  return (
    <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-28 pt-5 md:px-8 md:pb-8">
      <div className="mx-auto max-w-3xl space-y-5">
        <header>
          <h1 className="font-display text-2xl font-semibold text-ink">探索推薦</h1>
          <p className="mt-1 text-sm text-ink-soft">根據你的收藏整理出值得一去的地方。</p>
        </header>

        {/* tabs */}
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`chip ${
                tab === t.key ? "border-brand-400 bg-brand-500 text-white" : "border-line bg-card text-ink-soft"
              }`}
            >
              <t.icon size={15} />
              {t.label}
            </button>
          ))}
        </div>

        {tab === "near" && !userLocation ? (
          <div className="card flex flex-col items-center px-6 py-12 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-500">
              <Navigation size={24} />
            </div>
            <p className="mt-3 font-medium text-ink">想看附近有哪些收藏？</p>
            <p className="mt-1 text-sm text-ink-faint">允許定位後，依距離排序你收藏過的地點</p>
            <button
              onClick={() => locateUser()}
              disabled={locating}
              className="btn-primary mt-5 px-5 py-2.5"
            >
              <Navigation size={16} />
              {locating ? "定位中..." : "使用目前位置"}
            </button>
          </div>
        ) : loading ? (
          <FullSpinner label="整理推薦中..." />
        ) : list.length === 0 ? (
          <div className="card px-6 py-12 text-center text-ink-faint">
            <p>這個分類還沒有符合的地點。</p>
            <p className="mt-1 text-sm">多收藏幾個並給予評價，推薦會更準。</p>
          </div>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {list.map((p) => (
              <DiscoverCard key={p.id} place={p} />
            ))}
          </div>
        )}

        <p className="pb-2 text-center text-xs text-ink-faint">
          第一階段為規則式推薦（高評價 / 想去 / 附近）；未來可擴充相似推薦與朋友收藏。
        </p>
      </div>
    </div>
  );
}

function DiscoverCard({ place }: { place: Place }) {
  const distance = formatDistance(place.distance_km);
  return (
    <div className="card flex flex-col gap-2 p-4">
      <div className="flex items-start gap-2">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-base"
          style={{ backgroundColor: place.category_color + "1f" }}
        >
          {place.category_icon}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-ink">{place.name}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className={`chip px-2 py-0.5 text-xs ${statusTone(place.status)}`}>{place.status}</span>
            {place.rating ? <StarRating value={place.rating} readOnly size={13} /> : null}
            {distance && (
              <span className="text-xs font-medium text-brand-700 tnum">{distance}</span>
            )}
          </div>
        </div>
      </div>
      {place.address && <p className="truncate text-sm text-ink-faint">{place.address}</p>}
      <a
        href={googleMapsUrl(place)}
        target="_blank"
        rel="noreferrer"
        className="btn-outline mt-1 py-2 text-sm"
      >
        <ExternalLink size={15} />
        Google Maps 導航
      </a>
    </div>
  );
}
