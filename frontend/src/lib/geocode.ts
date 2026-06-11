import { loadPlacesLibrary } from "@/lib/googleLoader";
import { hasGoogleMaps } from "@/map/types";

export interface GeoResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
  /** Google Place ID（僅 Google 來源有） */
  placeId?: string;
  /** Google 評分（僅 Google 來源有），供下拉提示，不會覆蓋使用者自己的評分 */
  rating?: number | null;
  /** Google Maps 連結（僅 Google 來源有） */
  googleMapsUrl?: string;
  source: "google" | "osm";
}

/**
 * 地點搜尋 → 帶入名稱、地址與座標（雙模式）。
 * - 有 VITE_GOOGLE_MAPS_API_KEY 且已啟用 Places API (New)：用 Google Places（含 place_id、評分）。
 * - 否則 / Google 失敗：退回 OpenStreetMap Nominatim（免金鑰）。
 * 呼叫端需自行 debounce（Nominatim 政策約每秒 1 次）。
 */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<GeoResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  if (hasGoogleMaps) {
    try {
      return await searchGoogle(q);
    } catch (e) {
      console.warn("Google Places 搜尋失敗，改用 OpenStreetMap：", e);
    }
  }
  return searchNominatim(q, signal);
}

/** Google Places：用 Place.searchByText 取得店家（名稱/地址/座標/place_id/評分）。 */
async function searchGoogle(query: string): Promise<GeoResult[]> {
  const { Place } = await loadPlacesLibrary();
  const { places } = await Place.searchByText({
    textQuery: query,
    fields: ["displayName", "formattedAddress", "location", "id", "rating", "googleMapsURI"],
    language: "zh-TW",
    region: "TW",
    maxResultCount: 6,
  });
  return (places ?? [])
    .filter((p) => p.location)
    .map((p) => ({
      name: p.displayName ?? query,
      address: p.formattedAddress ?? "",
      lat: p.location!.lat(),
      lng: p.location!.lng(),
      placeId: p.id ?? undefined,
      rating: p.rating ?? null,
      googleMapsUrl: p.googleMapsURI ?? undefined,
      source: "google" as const,
    }));
}

/** OpenStreetMap Nominatim 搜尋（免金鑰）。 */
async function searchNominatim(query: string, signal?: AbortSignal): Promise<GeoResult[]> {
  const url =
    "https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&accept-language=zh-TW&q=" +
    encodeURIComponent(query);
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("geocode failed");
  const data: any[] = await res.json();
  return data.map((d) => ({
    name: (d.name as string) || (d.display_name as string).split(",")[0],
    address: d.display_name as string,
    lat: parseFloat(d.lat),
    lng: parseFloat(d.lon),
    source: "osm" as const,
  }));
}
