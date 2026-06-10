import { ExternalLink, MapPin, Pencil, Trash2 } from "lucide-react";

import { StarRating } from "@/components/ui/StarRating";
import { formatDistance, googleMapsUrl, statusTone } from "@/lib/format";
import { useUI } from "@/store/ui";
import type { Place } from "@/types";

interface Props {
  place: Place;
  onEdit: () => void;
  onDelete: () => void;
}

export function PlaceDetail({ place, onEdit, onDelete }: Props) {
  const advanced = useUI((s) => s.advancedMode);
  const distance = formatDistance(place.distance_km);

  return (
    <div className="space-y-4">
      {place.cover_photo && (
        <img
          src={place.cover_photo}
          alt={place.name}
          className="h-40 w-full rounded-2xl object-cover"
        />
      )}

      <div>
        <div className="flex items-center gap-2">
          <span
            className="grid h-7 w-7 place-items-center rounded-lg text-sm"
            style={{ backgroundColor: place.category_color + "22" }}
          >
            {place.category_icon}
          </span>
          <span className="text-sm font-medium" style={{ color: place.category_color }}>
            {place.category_name}
          </span>
        </div>
        <h2 className="mt-2 font-display text-2xl font-semibold leading-snug text-ink">
          {place.name}
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className={`chip text-xs ${statusTone(place.status)}`}>{place.status}</span>
          {place.rating ? <StarRating value={place.rating} readOnly size={16} /> : null}
          {distance && (
            <span className="text-sm font-medium text-brand-700 tnum">距你 {distance}</span>
          )}
        </div>
      </div>

      {place.address && (
        <div className="flex items-start gap-2 text-ink-soft">
          <MapPin size={17} className="mt-0.5 shrink-0" />
          <span className="text-sm">{place.address}</span>
        </div>
      )}

      {/* Google Maps 跳轉 — 核心整合 */}
      <a
        href={googleMapsUrl(place)}
        target="_blank"
        rel="noreferrer"
        className="btn-primary w-full py-3"
      >
        <ExternalLink size={18} />
        在 Google Maps 開啟導航
      </a>

      {place.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {place.tags.map((t) => (
            <span key={t} className="rounded-lg bg-stone-100 px-2 py-1 text-sm text-ink-soft">
              #{t}
            </span>
          ))}
        </div>
      )}

      {place.note && (
        <Field label="備註">
          <p className="whitespace-pre-wrap text-ink">{place.note}</p>
        </Field>
      )}

      {/* 進階欄位：預設收起，降低認知負荷 */}
      {advanced && (
        <div className="space-y-3 rounded-2xl bg-stone-50 p-3">
          {place.recommend_level ? (
            <Field label="推薦程度">
              <StarRating value={place.recommend_level} readOnly size={15} />
            </Field>
          ) : null}
          {place.want_reason && (
            <Field label="想去原因">
              <p className="whitespace-pre-wrap text-ink">{place.want_reason}</p>
            </Field>
          )}
          {place.experience_note && (
            <Field label="實際體驗">
              <p className="whitespace-pre-wrap text-ink">{place.experience_note}</p>
            </Field>
          )}
          <Field label="建立者">
            <p className="text-ink">{place.created_by_name ?? "—"}</p>
          </Field>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={onEdit} className="btn-outline flex-1 py-2.5">
          <Pencil size={16} />
          編輯
        </button>
        <button
          onClick={onDelete}
          className="btn border border-line bg-card px-4 py-2.5 text-rose-600 hover:border-rose-200 hover:bg-rose-50"
          aria-label="刪除"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-0.5 text-xs font-medium uppercase tracking-wide text-ink-faint">
        {label}
      </div>
      {children}
    </div>
  );
}
