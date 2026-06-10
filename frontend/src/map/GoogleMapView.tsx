import { Loader } from "@googlemaps/js-api-loader";
import { useEffect, useRef } from "react";

import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  GOOGLE_MAPS_API_KEY,
  type MapViewProps,
} from "./types";

// 簡約地圖樣式：降低道路飽和、隱藏 POI 標籤雜訊，讓自家 marker 突出
const MAP_STYLE: google.maps.MapTypeStyle[] = [
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ saturation: -40 }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#cfe3e0" }] },
];

function pinSvg(color: string, active: boolean): google.maps.Icon {
  const stroke = "#ffffff";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${active ? 44 : 38}" height="${active ? 44 : 38}" viewBox="0 0 38 38">
      <path d="M19 2C12 2 7 7 7 13.5C7 22 19 36 19 36C19 36 31 22 31 13.5C31 7 26 2 19 2Z"
        fill="${color}" stroke="${stroke}" stroke-width="2.5"/>
      <circle cx="19" cy="14" r="4.5" fill="#ffffff"/>
    </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(active ? 44 : 38, active ? 44 : 38),
    anchor: new google.maps.Point(active ? 22 : 19, active ? 44 : 38),
  };
}

let loaderPromise: Promise<typeof google> | null = null;
function loadGoogle() {
  if (!loaderPromise) {
    loaderPromise = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: "weekly",
    }).load();
  }
  return loaderPromise;
}

export default function GoogleMapView({
  markers,
  center,
  zoom = DEFAULT_ZOOM,
  activeId,
  userLocation,
  onMarkerClick,
  onMapClick,
  className,
}: MapViewProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<Map<number, google.maps.Marker>>(new Map());
  const userRef = useRef<google.maps.Marker | null>(null);
  const fitDone = useRef(false);
  const clickCb = useRef(onMarkerClick);
  clickCb.current = onMarkerClick;
  const mapClickCb = useRef(onMapClick);
  mapClickCb.current = onMapClick;

  // 初始化地圖
  useEffect(() => {
    let cancelled = false;
    loadGoogle().then(() => {
      if (cancelled || !elRef.current || mapRef.current) return;
      const map = new google.maps.Map(elRef.current, {
        center: center ?? DEFAULT_CENTER,
        zoom,
        disableDefaultUI: true,
        zoomControl: true,
        clickableIcons: false,
        styles: MAP_STYLE,
      });
      map.addListener("click", (e: google.maps.MapMouseEvent) => {
        if (e.latLng)
          mapClickCb.current?.({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      });
      mapRef.current = map;
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 同步 markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const existing = markerRef.current;
    const nextIds = new Set(markers.map((m) => m.id));

    // 移除不存在的
    for (const [id, mk] of existing) {
      if (!nextIds.has(id)) {
        mk.setMap(null);
        existing.delete(id);
      }
    }
    // 新增 / 更新
    for (const m of markers) {
      const active = m.id === activeId;
      let mk = existing.get(m.id);
      if (!mk) {
        mk = new google.maps.Marker({ map, position: { lat: m.lat, lng: m.lng } });
        mk.addListener("click", () => clickCb.current?.(m.id));
        existing.set(m.id, mk);
      } else {
        mk.setPosition({ lat: m.lat, lng: m.lng });
      }
      mk.setIcon(pinSvg(m.color, active));
      mk.setZIndex(active ? 1000 : 1);
    }

    // 第一次拿到 markers：框到所有地點
    if (!fitDone.current && markers.length > 0) {
      if (markers.length === 1) {
        map.setCenter({ lat: markers[0].lat, lng: markers[0].lng });
        map.setZoom(15);
      } else {
        const bounds = new google.maps.LatLngBounds();
        markers.forEach((m) => bounds.extend({ lat: m.lat, lng: m.lng }));
        map.fitBounds(bounds, 60);
      }
      fitDone.current = true;
    }
  }, [markers, activeId]);

  // 平移到 center
  useEffect(() => {
    if (mapRef.current && center) mapRef.current.panTo(center);
  }, [center?.lat, center?.lng, activeId]);

  // 使用者位置
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!userLocation) {
      userRef.current?.setMap(null);
      userRef.current = null;
      return;
    }
    if (!userRef.current) {
      userRef.current = new google.maps.Marker({
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#2563eb",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 3,
        },
      });
    }
    userRef.current.setPosition(userLocation);
  }, [userLocation?.lat, userLocation?.lng]);

  return <div ref={elRef} className={className} style={{ height: "100%", width: "100%" }} />;
}
