import type { Place } from "@/types";

/** 距離格式化：< 1km 顯示公尺，否則公里 */
export function formatDistance(km: number | null | undefined): string | null {
  if (km === null || km === undefined) return null;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/** 取得地點的 Google Maps 跳轉連結（後端通常已填好，這裡做保險） */
export function googleMapsUrl(place: Pick<Place, "google_maps_url" | "name" | "latitude" | "longitude">): string {
  if (place.google_maps_url) return place.google_maps_url;
  if (place.latitude != null && place.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`;
}

/** 狀態 → 色調（用於 badge）。未知狀態回傳中性色。 */
const STATUS_TONE: Record<string, string> = {
  想去: "bg-brand-50 text-brand-700 border-brand-200",
  一定要去: "bg-rose-50 text-rose-700 border-rose-200",
  已去: "bg-emerald-50 text-emerald-700 border-emerald-200",
  想再訪: "bg-amber-50 text-amber-700 border-amber-200",
  朋友推薦: "bg-violet-50 text-violet-700 border-violet-200",
  收藏中: "bg-sky-50 text-sky-700 border-sky-200",
  不推薦: "bg-stone-100 text-stone-500 border-stone-200",
};

export function statusTone(status: string): string {
  return STATUS_TONE[status] ?? "bg-stone-100 text-ink-soft border-line";
}

/** hex 顏色加上透明度（給 marker / chip 背景用） */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const bigint = parseInt(
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h,
    16,
  );
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** 平均座標：用於把地圖中心放在一群地點的中間 */
export function centroid(
  places: { latitude: number | null; longitude: number | null }[],
): { lat: number; lng: number } | null {
  const valid = places.filter(
    (p) => p.latitude != null && p.longitude != null,
  ) as { latitude: number; longitude: number }[];
  if (valid.length === 0) return null;
  const lat = valid.reduce((s, p) => s + p.latitude, 0) / valid.length;
  const lng = valid.reduce((s, p) => s + p.longitude, 0) / valid.length;
  return { lat, lng };
}
