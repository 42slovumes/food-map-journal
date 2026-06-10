import { Navigation } from "lucide-react";

import { StarRating } from "@/components/ui/StarRating";
import { formatDistance, statusTone } from "@/lib/format";
import type { Place } from "@/types";

interface Props {
  place: Place;
  active?: boolean;
  onClick?: () => void;
}

export function PlaceCard({ place, active, onClick }: Props) {
  const distance = formatDistance(place.distance_km);
  return (
    <button
      onClick={onClick}
      className={`group w-full rounded-2xl border p-3.5 text-left transition-all
        ${active ? "border-brand-300 bg-brand-50/60 shadow-soft" : "border-line bg-card hover:border-brand-200 hover:shadow-soft"}`}
    >
      <div className="flex items-start gap-3">
        {/* 分類色標 */}
        <div
          className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl text-base"
          style={{ backgroundColor: place.category_color + "1f" }}
        >
          <span>{place.category_icon || "📍"}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-ink">{place.name}</h3>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={`chip px-2 py-0.5 text-xs ${statusTone(place.status)}`}>
              {place.status}
            </span>
            {place.rating ? <StarRating value={place.rating} readOnly size={13} /> : null}
            {distance && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 tnum">
                <Navigation size={12} />
                {distance}
              </span>
            )}
          </div>

          {place.address && (
            <p className="mt-1 truncate text-sm text-ink-faint">{place.address}</p>
          )}

          {place.tags?.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {place.tags.slice(0, 3).map((t) => (
                <span key={t} className="rounded-md bg-stone-100 px-1.5 py-0.5 text-xs text-ink-soft">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
