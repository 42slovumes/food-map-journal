import { lazy, Suspense } from "react";

import { hasGoogleMaps, type MapViewProps } from "./types";

const GoogleMapView = lazy(() => import("./GoogleMapView"));
const LeafletMapView = lazy(() => import("./LeafletMapView"));

function MapSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#eef2f0]">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-300 border-t-brand-600" />
    </div>
  );
}

/**
 * 統一地圖入口：有 Google Maps 金鑰時用 Google，否則自動降級 Leaflet + OpenStreetMap。
 * 兩者實作相同的 MapViewProps 介面。
 */
export default function MapView(props: MapViewProps) {
  return (
    <Suspense fallback={<MapSkeleton />}>
      {hasGoogleMaps ? <GoogleMapView {...props} /> : <LeafletMapView {...props} />}
    </Suspense>
  );
}

export { hasGoogleMaps };
export type { MapViewProps } from "./types";
