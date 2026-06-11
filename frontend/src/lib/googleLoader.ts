import { Loader } from "@googlemaps/js-api-loader";

import { GOOGLE_MAPS_API_KEY } from "@/map/types";

// 單一共用的 Loader 實例（GoogleMapView 與地點搜尋共用，避免重複載入/設定衝突）
let loaderInstance: Loader | null = null;

function loader(): Loader {
  if (!loaderInstance) {
    loaderInstance = new Loader({ apiKey: GOOGLE_MAPS_API_KEY, version: "weekly" });
  }
  return loaderInstance;
}

/** 載入 Google Maps 核心（給地圖使用）。 */
export function loadGoogleMaps(): Promise<typeof google> {
  return loader().load();
}

/** 載入 Places 函式庫（給地點搜尋使用，需啟用 Places API (New)）。 */
export async function loadPlacesLibrary(): Promise<google.maps.PlacesLibrary> {
  await loader().load();
  return (await google.maps.importLibrary("places")) as google.maps.PlacesLibrary;
}
