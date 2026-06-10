import { MapPin, Star } from "lucide-react";
import { forwardRef } from "react";

import type { Place } from "@/types";

export interface ShareCardOptions {
  showRating: boolean;
  showTags: boolean;
  showNote: boolean;
  showAddress: boolean;
}

interface Props {
  title: string;
  emoji: string;
  ownerName: string;
  places: Place[];
  options: ShareCardOptions;
}

/**
 * 社群分享圖卡：暖色排行榜風格，適合截圖分享。
 * 用 forwardRef 讓 html-to-image 擷取此節點。固定寬度確保輸出穩定。
 */
export const ShareCard = forwardRef<HTMLDivElement, Props>(function ShareCard(
  { title, emoji, ownerName, places, options },
  ref,
) {
  return (
    <div
      ref={ref}
      style={{ width: 440, fontFamily: '"Noto Sans TC", system-ui, sans-serif' }}
      className="overflow-hidden rounded-3xl bg-card"
    >
      {/* header */}
      <div
        className="relative px-6 pb-7 pt-6 text-white"
        style={{
          background:
            "linear-gradient(135deg, #F2701A 0%, #DD5C0C 60%, #B7470C 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(420px 200px at 18% 8%, rgba(255,255,255,.6), transparent 60%)",
          }}
        />
        <div className="relative">
          <div className="text-3xl">{emoji}</div>
          <h1
            className="mt-1.5 font-semibold leading-tight"
            style={{ fontFamily: '"Fraunces", serif', fontSize: 28 }}
          >
            {title}
          </h1>
          <p className="mt-1 text-sm text-white/80">by {ownerName} · 共 {places.length} 個地點</p>
        </div>
      </div>

      {/* list */}
      <div className="space-y-2.5 px-5 py-5">
        {places.map((p, i) => (
          <div key={p.id} className="flex items-start gap-3 rounded-2xl border border-line p-3">
            <div
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
              style={{ background: p.category_color }}
            >
              {i + 1}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-base">{p.category_icon}</span>
                <span className="truncate font-semibold text-ink">{p.name}</span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="text-xs font-medium" style={{ color: p.category_color }}>
                  {p.category_name}
                </span>
                {options.showRating && p.rating ? (
                  <span className="inline-flex items-center gap-0.5 text-xs font-medium text-amber-600">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    {p.rating}
                  </span>
                ) : null}
              </div>
              {options.showAddress && p.address && (
                <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-ink-faint">
                  <MapPin size={11} />
                  {p.address}
                </p>
              )}
              {options.showNote && p.note && (
                <p className="mt-1 line-clamp-2 text-xs text-ink-soft">{p.note}</p>
              )}
              {options.showTags && p.tags?.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {p.tags.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="rounded-md px-1.5 py-0.5 text-[11px]"
                      style={{ background: p.category_color + "1f", color: p.category_color }}
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* footer */}
      <div className="flex items-center justify-center gap-1.5 border-t border-line py-3 text-sm text-ink-faint">
        <MapPin size={14} className="text-brand-500" />
        <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }} className="text-ink">
          Pinmap
        </span>
        · 你的地圖收藏
      </div>
    </div>
  );
});
