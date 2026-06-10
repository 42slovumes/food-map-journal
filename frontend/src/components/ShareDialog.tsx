import { toPng } from "html-to-image";
import { Check, Copy, Download, Link2, Share2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { ShareCard, type ShareCardOptions } from "@/components/ShareCard";
import { Dialog } from "@/components/ui/Dialog";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";
import { placesApi } from "@/lib/api";
import { useData } from "@/store/data";
import type { Place } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
}

const FIELD_TOGGLES: { key: keyof ShareCardOptions; label: string }[] = [
  { key: "showRating", label: "評分" },
  { key: "showTags", label: "標籤" },
  { key: "showAddress", label: "地址" },
  { key: "showNote", label: "備註" },
];

export function ShareDialog({ open, onClose }: Props) {
  const maps = useData((s) => s.maps);
  const activeMapId = useData((s) => s.activeMapId);
  const enableShare = useData((s) => s.enableShare);
  const disableShare = useData((s) => s.disableShare);

  const map = maps.find((m) => m.id === activeMapId);
  const isOwner = map?.my_role === "owner";

  const [places, setPlaces] = useState<Place[]>([]);
  const [options, setOptions] = useState<ShareCardOptions>({
    showRating: true,
    showTags: true,
    showAddress: false,
    showNote: false,
  });
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !activeMapId) return;
    placesApi.list({ map: activeMapId }).then((all) => {
      const top = [...all]
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        .slice(0, 8);
      setPlaces(top);
    });
  }, [open, activeMapId]);

  const shareUrl = useMemo(
    () => (map?.share_token ? `${window.location.origin}/share/${map.share_token}` : ""),
    [map?.share_token],
  );

  async function toggleShare(on: boolean) {
    if (!map) return;
    setBusy(true);
    try {
      if (on) await enableShare(map.id);
      else await disableShare(map.id);
    } catch {
      toast.error("操作失敗");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("已複製連結");
    setTimeout(() => setCopied(false), 1500);
  }

  async function downloadImage() {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
      const a = document.createElement("a");
      a.download = `${map?.name ?? "pinmap"}.png`;
      a.href = dataUrl;
      a.click();
      toast.success("圖片已下載");
    } catch {
      toast.error("圖片產生失敗");
    } finally {
      setBusy(false);
    }
  }

  function webShare() {
    if (navigator.share) {
      navigator.share({ title: map?.name, url: shareUrl }).catch(() => {});
    } else {
      copyLink();
    }
  }

  const socials = [
    { label: "LINE", href: `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`, color: "#06C755" },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, color: "#1877F2" },
    { label: "Threads", href: `https://www.threads.net/intent/post?text=${encodeURIComponent(`${map?.name ?? ""} ${shareUrl}`)}`, color: "#000000" },
  ];

  return (
    <Dialog open={open} onClose={onClose} title="分享地圖" maxWidth="max-w-lg">
      <div className="space-y-5">
        {/* 公開連結 */}
        <section className="rounded-2xl border border-line bg-stone-50 p-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Link2 size={18} className="text-brand-600" />
              <span className="font-medium text-ink">公開分享連結</span>
            </div>
            {isOwner ? (
              <Switch checked={!!map?.is_shared} disabled={busy} onChange={toggleShare} />
            ) : (
              <span className="text-xs text-ink-faint">僅擁有者可設定</span>
            )}
          </div>
          <p className="mt-1 text-xs text-ink-faint">開啟後，任何人有連結即可唯讀檢視這張地圖。</p>

          {map?.is_shared && shareUrl && (
            <>
              <div className="mt-3 flex gap-2">
                <input readOnly value={shareUrl} className="input flex-1 py-2 text-sm" />
                <button onClick={copyLink} className="btn-outline px-3 py-2 text-sm">
                  {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                </button>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full px-3 py-1.5 text-xs font-medium text-white"
                    style={{ background: s.color }}
                  >
                    {s.label}
                  </a>
                ))}
                <button
                  onClick={webShare}
                  className="inline-flex items-center gap-1 rounded-full border border-line bg-card px-3 py-1.5 text-xs font-medium text-ink-soft"
                >
                  <Share2 size={13} />
                  分享…
                </button>
              </div>
            </>
          )}
        </section>

        {/* 分享圖卡 */}
        <section>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-ink">分享圖卡</span>
            <div className="flex flex-wrap gap-1.5">
              {FIELD_TOGGLES.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setOptions((o) => ({ ...o, [f.key]: !o[f.key] }))}
                  className={`chip text-xs ${
                    options[f.key]
                      ? "border-brand-400 bg-brand-500 text-white"
                      : "border-line bg-card text-ink-soft"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="no-scrollbar max-h-[46vh] overflow-y-auto rounded-2xl bg-stone-100 p-3">
            {places.length > 0 ? (
              <div className="mx-auto w-fit shadow-lift">
                <ShareCard
                  ref={cardRef}
                  title={map?.name ?? "我的地圖"}
                  emoji={map?.emoji ?? "🗺️"}
                  ownerName={map?.owner_name ?? ""}
                  places={places}
                  options={options}
                />
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-ink-faint">這張地圖還沒有地點可以產圖。</p>
            )}
          </div>

          <button
            onClick={downloadImage}
            disabled={busy || places.length === 0}
            className="btn-primary mt-3 w-full py-3"
          >
            {busy ? <Spinner className="h-5 w-5 border-white/40 border-t-white" /> : <Download size={18} />}
            下載分享圖片
          </button>
        </section>
      </div>
    </Dialog>
  );
}

function Switch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50 ${
        checked ? "bg-brand-500" : "bg-stone-300"
      }`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}
