import L from "leaflet";
import { useEffect, useRef } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  type LatLng,
  type MapMarkerData,
  type MapViewProps,
  pinHtml,
} from "./types";

function markerIcon(m: MapMarkerData) {
  return L.divIcon({
    className: "fmj-pin",
    html: pinHtml(m.color, m.icon, m.active),
    iconSize: [34, 34],
    iconAnchor: [17, 34],
  });
}

const userIcon = L.divIcon({
  className: "fmj-pin",
  html: `<div style="transform:translate(-50%,-50%);width:18px;height:18px;border-radius:50%;
    background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 4px rgba(37,99,235,.25);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

/** 當 center / activeId 改變時平移地圖 */
function Recenter({ center, activeId }: { center?: LatLng; activeId?: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo([center.lat, center.lng], map.getZoom(), { duration: 0.6 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center?.lat, center?.lng, activeId]);
  return null;
}

function ClickHandler({ onMapClick }: { onMapClick?: (l: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onMapClick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

/** 第一次拿到 markers 時，把畫面框到所有地點（之後不再自動干預使用者操作） */
function FitBounds({ markers }: { markers: MapMarkerData[] }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current || markers.length === 0) return;
    if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 15);
    } else {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    }
    done.current = true;
  }, [markers, map]);
  return null;
}

export default function LeafletMapView({
  markers,
  center,
  zoom = DEFAULT_ZOOM,
  activeId,
  userLocation,
  onMarkerClick,
  onMapClick,
  className,
}: MapViewProps) {
  const start = center ?? DEFAULT_CENTER;
  return (
    <MapContainer
      center={[start.lat, start.lng]}
      zoom={zoom}
      zoomControl={false}
      className={className}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <Recenter center={center} activeId={activeId} />
      <FitBounds markers={markers} />
      <ClickHandler onMapClick={onMapClick} />
      {markers.map((m) => (
        <Marker
          key={m.id}
          position={[m.lat, m.lng]}
          icon={markerIcon({ ...m, active: m.id === activeId })}
          zIndexOffset={m.id === activeId ? 1000 : 0}
          eventHandlers={{ click: () => onMarkerClick?.(m.id) }}
        />
      ))}
      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} />
      )}
    </MapContainer>
  );
}
