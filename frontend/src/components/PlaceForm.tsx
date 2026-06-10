import { MapPinned, Search, X } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";

import { Dialog } from "@/components/ui/Dialog";
import { Spinner } from "@/components/ui/Spinner";
import { StarRating } from "@/components/ui/StarRating";
import { toast } from "@/components/ui/Toast";
import { type GeoResult, searchPlaces } from "@/lib/geocode";
import { withAlpha } from "@/lib/format";
import type { LatLng } from "@/map/types";
import { useData } from "@/store/data";
import { useUI } from "@/store/ui";
import type { Place } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: Place | null;
  defaultCoords?: LatLng | null;
  defaultCategoryId?: number | null;
}

export function PlaceForm({ open, onClose, initial, defaultCoords, defaultCategoryId }: Props) {
  const categories = useData((s) => s.categories);
  const presets = useData((s) => s.presets);
  const createPlace = useData((s) => s.createPlace);
  const updatePlace = useData((s) => s.updatePlace);
  const advanced = useUI((s) => s.advancedMode);

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [status, setStatus] = useState("想去");
  const [rating, setRating] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [note, setNote] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [wantReason, setWantReason] = useState("");
  const [experience, setExperience] = useState("");
  const [recommend, setRecommend] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // 地點搜尋
  const [geoQuery, setGeoQuery] = useState("");
  const [geoResults, setGeoResults] = useState<GeoResult[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // 初始化／重置表單
  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setCategoryId(initial?.category ?? defaultCategoryId ?? categories[0]?.id ?? null);
    setAddress(initial?.address ?? "");
    setCoords(
      initial?.latitude != null && initial?.longitude != null
        ? { lat: initial.latitude, lng: initial.longitude }
        : (defaultCoords ?? null),
    );
    setStatus(initial?.status ?? presets?.statuses[0] ?? "想去");
    setRating(initial?.rating ?? null);
    setTags(initial?.tags ?? []);
    setNote(initial?.note ?? "");
    setPlaceId(initial?.google_place_id ?? "");
    setWantReason(initial?.want_reason ?? "");
    setExperience(initial?.experience_note ?? "");
    setRecommend(initial?.recommend_level ?? null);
    setGeoQuery("");
    setGeoResults([]);
    setShowResults(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // 地點搜尋 debounce
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    if (geoQuery.trim().length < 2) {
      setGeoResults([]);
      return;
    }
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setGeoLoading(true);
      try {
        const results = await searchPlaces(geoQuery, ctrl.signal);
        setGeoResults(results);
        setShowResults(true);
      } catch {
        /* 忽略中斷/失敗 */
      } finally {
        setGeoLoading(false);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [geoQuery]);

  function pickGeo(r: GeoResult) {
    if (!name.trim()) setName(r.name);
    setAddress(r.address);
    setCoords({ lat: r.lat, lng: r.lng });
    setShowResults(false);
    setGeoQuery("");
  }

  function addTag(t: string) {
    const v = t.trim();
    if (v && !tags.includes(v)) setTags([...tags, v]);
    setTagInput("");
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("請輸入地點名稱");
    if (!categoryId) return toast.error("請選擇分類");
    setSaving(true);
    const payload: Partial<Place> = {
      name: name.trim(),
      category: categoryId,
      address,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      status,
      rating,
      tags,
      note,
      google_place_id: placeId,
      want_reason: wantReason,
      experience_note: experience,
      recommend_level: recommend,
    };
    try {
      if (initial) {
        await updatePlace(initial.id, payload);
        toast.success("已更新地點");
      } else {
        await createPlace(payload);
        toast.success("已新增地點");
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "儲存失敗");
    } finally {
      setSaving(false);
    }
  }

  const statusOptions = presets?.statuses ?? ["想去", "已去", "一定要去"];
  const tagSuggestions = (presets?.tags ?? []).filter((t) => !tags.includes(t)).slice(0, 8);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={initial ? "編輯地點" : "新增地點"}
      footer={
        <div className="flex gap-3">
          <button type="button" className="btn-outline flex-1 py-3" onClick={onClose}>
            取消
          </button>
          <button type="submit" form="place-form" disabled={saving} className="btn-primary flex-1 py-3">
            {saving ? <Spinner className="h-5 w-5 border-white/40 border-t-white" /> : null}
            {initial ? "儲存變更" : "新增"}
          </button>
        </div>
      }
    >
      <form id="place-form" onSubmit={submit} className="space-y-4">
        {/* 地點搜尋帶入座標 */}
        <div className="relative">
          <label className="mb-1.5 block text-sm font-medium text-ink-soft">搜尋地點帶入座標</label>
          <div className="relative">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              className="input pl-10"
              placeholder="輸入店名或地址，例如：麵屋一燈"
              value={geoQuery}
              onChange={(e) => setGeoQuery(e.target.value)}
              onFocus={() => geoResults.length && setShowResults(true)}
            />
            {geoLoading && <Spinner className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2" />}
          </div>
          {showResults && geoResults.length > 0 && (
            <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-2xl border border-line bg-card shadow-lift">
              {geoResults.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => pickGeo(r)}
                  className="flex w-full items-start gap-2 border-b border-line/60 px-3.5 py-2.5 text-left last:border-0 hover:bg-brand-50"
                >
                  <MapPinned size={16} className="mt-0.5 shrink-0 text-brand-500" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink">{r.name}</div>
                    <div className="truncate text-xs text-ink-faint">{r.address}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 名稱 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-soft">名稱 *</label>
          <input
            className="input"
            placeholder="地點名稱"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* 分類 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-soft">分類 *</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const active = c.id === categoryId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className="chip"
                  style={
                    active
                      ? { backgroundColor: c.color, borderColor: c.color, color: "#fff" }
                      : { backgroundColor: withAlpha(c.color, 0.08), borderColor: withAlpha(c.color, 0.25), color: c.color }
                  }
                >
                  <span>{c.icon}</span>
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 地址 + 座標狀態 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-soft">地址</label>
          <input
            className="input"
            placeholder="地址（可由上方搜尋自動帶入）"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <p className="mt-1.5 text-xs text-ink-faint">
            {coords
              ? `📍 已定位 ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
              : "尚未定位 — 可用上方搜尋，或關閉視窗後在地圖上點選位置新增"}
          </p>
        </div>

        {/* 狀態 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-soft">狀態</label>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`chip ${status === s ? "border-brand-400 bg-brand-500 text-white" : "border-line bg-card text-ink-soft"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* 評分 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-soft">星等</label>
          <StarRating value={rating} onChange={setRating} size={26} />
        </div>

        {/* 標籤 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-soft">標籤</label>
          {tags.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span key={t} className="chip border-line bg-stone-100 text-ink-soft">
                  #{t}
                  <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))}>
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <input
            className="input"
            placeholder="輸入標籤後按 Enter"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag(tagInput);
              }
            }}
          />
          {tagSuggestions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tagSuggestions.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => addTag(t)}
                  className="rounded-full border border-dashed border-line px-2.5 py-1 text-xs text-ink-faint hover:border-brand-300 hover:text-brand-700"
                >
                  + {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 備註 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-soft">備註</label>
          <textarea
            className="input min-h-[80px] resize-y"
            placeholder="想記下的任何事..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {/* 進階欄位 */}
        {advanced && (
          <div className="space-y-4 rounded-2xl bg-stone-50 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">進階</p>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-soft">推薦程度</label>
              <StarRating value={recommend} onChange={setRecommend} size={22} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-soft">想去原因</label>
              <textarea
                className="input min-h-[60px] resize-y"
                value={wantReason}
                onChange={(e) => setWantReason(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-soft">實際體驗紀錄</label>
              <textarea
                className="input min-h-[60px] resize-y"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-soft">Google Place ID</label>
              <input className="input" value={placeId} onChange={(e) => setPlaceId(e.target.value)} />
            </div>
          </div>
        )}
      </form>
    </Dialog>
  );
}
