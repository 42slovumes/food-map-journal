export interface GeoResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

/**
 * 地點搜尋 → 帶入地址與座標。
 * 使用 OpenStreetMap Nominatim（免金鑰、雙模式通用）。
 * 注意：Nominatim 使用政策限制約每秒 1 次，呼叫端需自行 debounce。
 * 未來若啟用 Google Places，可在此切換成 Places Autocomplete 以取得 place_id。
 */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<GeoResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const url =
    "https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&accept-language=zh-TW&q=" +
    encodeURIComponent(q);
  const res = await fetch(url, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("geocode failed");
  const data: any[] = await res.json();
  return data.map((d) => ({
    name: (d.name as string) || (d.display_name as string).split(",")[0],
    address: d.display_name as string,
    lat: parseFloat(d.lat),
    lng: parseFloat(d.lon),
  }));
}
