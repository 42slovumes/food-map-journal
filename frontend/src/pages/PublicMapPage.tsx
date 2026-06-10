import { ExternalLink, MapPin, Navigation } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { StarRating } from "@/components/ui/StarRating";
import { FullSpinner } from "@/components/ui/Spinner";
import { publicApi } from "@/lib/api";
import { statusTone } from "@/lib/format";
import MapView from "@/map/MapView";
import type { LatLng, MapMarkerData } from "@/map/types";
import type { PublicMapData, PublicPlace } from "@/types";

export default function PublicMapPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PublicMapData | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    publicApi
      .getMap(token)
      .then((d) => {
        setData(d);
        setStatus("ok");
      })
      .catch(() => setStatus("error"));
  }, [token]);

  const markers: MapMarkerData[] = useMemo(
    () =>
      (data?.places ?? [])
        .filter((p) => p.latitude != null && p.longitude != null)
        .map((p) => ({
          id: p.id,
          lat: p.latitude as number,
          lng: p.longitude as number,
          color: p.category_color,
          icon: p.category_icon,
        })),
    [data],
  );

  const selected = data?.places.find((p) => p.id === selectedId) ?? null;
  const focus: LatLng | undefined =
    selected?.latitude != null && selected?.longitude != null
      ? { lat: selected.latitude, lng: selected.longitude }
      : undefined;

  if (status === "loading") return <FullSpinner label="載入分享地圖中..." />;

  if (status === "error" || !data)
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-paper px-6 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-3xl bg-brand-50 text-brand-400">
          <MapPin size={28} />
        </div>
        <h1 className="font-display text-xl font-semibold text-ink">找不到這張分享地圖</h1>
        <p className="text-sm text-ink-faint">連結可能已失效或被關閉分享。</p>
        <Link to="/" className="btn-primary mt-2 px-5 py-2.5">
          回到 Pinmap
        </Link>
      </div>
    );

  return (
    <div className="flex h-dvh flex-col bg-paper">
      {/* 頂列 */}
      <header className="flex shrink-0 items-center justify-between border-b border-line bg-card/80 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-brand-500 text-white">
            <MapPin size={16} />
          </div>
          <span className="font-display text-lg font-semibold">Pinmap</span>
          <span className="hidden text-xs text-ink-faint sm:inline">· 公開分享（唯讀）</span>
        </div>
        <Link to="/login" className="btn-primary px-4 py-2 text-sm">
          建立你的地圖
        </Link>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* 清單 */}
        <div className="no-scrollbar order-2 flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:order-1 md:max-w-[420px] md:border-r md:border-line">
          <div className="mb-4">
            <div className="text-3xl">{data.map.emoji}</div>
            <h1 className="mt-1 font-display text-2xl font-semibold text-ink">{data.map.name}</h1>
            <p className="mt-0.5 text-sm text-ink-soft">
              by {data.map.owner_name} · {data.map.categories_count} 分類 · {data.map.places_count} 地點
            </p>
            {data.map.description && (
              <p className="mt-1.5 text-sm text-ink-faint">{data.map.description}</p>
            )}
          </div>

          <div className="space-y-2.5">
            {data.places.map((p) => (
              <PublicPlaceCard
                key={p.id}
                place={p}
                active={p.id === selectedId}
                onClick={() => setSelectedId(p.id)}
              />
            ))}
          </div>
        </div>

        {/* 地圖 */}
        <div className="relative order-1 h-[38vh] min-h-0 md:order-2 md:h-auto md:flex-1">
          <MapView
            markers={markers}
            activeId={selectedId}
            center={focus}
            onMarkerClick={setSelectedId}
            className="h-full w-full"
          />
        </div>
      </div>
    </div>
  );
}

function PublicPlaceCard({
  place,
  active,
  onClick,
}: {
  place: PublicPlace;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-2xl border p-3.5 transition ${
        active ? "border-brand-300 bg-brand-50/60 shadow-soft" : "border-line bg-card hover:border-brand-200"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl text-base"
          style={{ backgroundColor: place.category_color + "1f" }}
        >
          {place.category_icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-ink">{place.name}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {place.status && (
              <span className={`chip px-2 py-0.5 text-xs ${statusTone(place.status)}`}>
                {place.status}
              </span>
            )}
            {place.rating ? <StarRating value={place.rating} readOnly size={13} /> : null}
          </div>
          {place.address && <p className="mt-1 truncate text-sm text-ink-faint">{place.address}</p>}
          {place.tags?.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {place.tags.slice(0, 3).map((t) => (
                <span key={t} className="rounded-md bg-stone-100 px-1.5 py-0.5 text-xs text-ink-soft">
                  #{t}
                </span>
              ))}
            </div>
          )}
          <a
            href={place.google_maps_url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-700"
          >
            <ExternalLink size={13} />
            Google Maps
            <Navigation size={11} className="ml-0.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
