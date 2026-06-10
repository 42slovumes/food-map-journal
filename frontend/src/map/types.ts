export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapMarkerData {
  id: number;
  lat: number;
  lng: number;
  color: string;
  icon?: string; // emoji
  active?: boolean;
}

export interface MapViewProps {
  markers: MapMarkerData[];
  center?: LatLng;
  zoom?: number;
  activeId?: number | null;
  userLocation?: LatLng | null;
  onMarkerClick?: (id: number) => void;
  onMapClick?: (latlng: LatLng) => void;
  className?: string;
}

export const GOOGLE_MAPS_API_KEY: string =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ?? "";

export const hasGoogleMaps = GOOGLE_MAPS_API_KEY.trim().length > 0;

export const DEFAULT_CENTER: LatLng = { lat: 25.0478, lng: 121.517 }; // 台北車站
export const DEFAULT_ZOOM = 13;

/** 產生 teardrop 樣式的 pin HTML（Leaflet divIcon 用） */
export function pinHtml(color: string, icon = "📍", active = false): string {
  const scale = active ? 1.15 : 1;
  const ring = active
    ? `box-shadow:0 0 0 4px ${color}33, 0 10px 18px -6px rgba(33,28,24,.5);`
    : `box-shadow:0 6px 14px -6px rgba(33,28,24,.45);`;
  return `
    <div style="transform:translate(-50%,-100%) scale(${scale});transform-origin:bottom center;transition:transform .18s ease;">
      <div style="position:relative;width:34px;height:34px;border-radius:50% 50% 50% 0;
        background:${color};transform:rotate(-45deg);${ring}
        display:flex;align-items:center;justify-content:center;border:2.5px solid #fff;">
        <span style="transform:rotate(45deg);font-size:15px;line-height:1;">${icon}</span>
      </div>
    </div>`;
}
