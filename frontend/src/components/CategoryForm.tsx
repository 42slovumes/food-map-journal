import { Check } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

import { Dialog } from "@/components/ui/Dialog";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";
import { apiErrorMessage } from "@/lib/errors";
import { useData } from "@/store/data";
import { useUI } from "@/store/ui";
import type { Category } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: Category | null;
}

const FALLBACK_COLORS = ["#F2701A", "#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#14B8A6"];
const FALLBACK_ICONS = ["📍", "🍜", "☕", "🍰", "🍺", "🍲", "🏞️", "🎨", "🛍️", "🍣", "🏨", "📷", "❤️", "⭐"];

export function CategoryForm({ open, onClose, initial }: Props) {
  const presets = useData((s) => s.presets);
  const createCategory = useData((s) => s.createCategory);
  const updateCategory = useData((s) => s.updateCategory);
  const advanced = useUI((s) => s.advancedMode);

  const colors = presets?.colors?.length ? presets.colors : FALLBACK_COLORS;
  const icons = presets?.icons?.length ? presets.icons : FALLBACK_ICONS;

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📍");
  const [color, setColor] = useState(colors[0]);
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isCollab, setIsCollab] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setIcon(initial?.icon ?? "📍");
    setColor(initial?.color ?? colors[0]);
    setDescription(initial?.description ?? "");
    setIsPublic(initial?.is_public ?? false);
    setIsCollab(initial?.is_collaborative ?? false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("請輸入分類名稱");
    setSaving(true);
    const payload: Partial<Category> = {
      name: name.trim(),
      icon,
      color,
      description,
      is_public: isPublic,
      is_collaborative: isCollab,
    };
    try {
      if (initial) {
        await updateCategory(initial.id, payload);
        toast.success("已更新分類");
      } else {
        await createCategory(payload);
        toast.success("已新增分類");
      }
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err, "儲存失敗"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={initial ? "編輯分類" : "新增分類"}
      maxWidth="max-w-md"
      footer={
        <div className="flex gap-3">
          <button type="button" className="btn-outline flex-1 py-3" onClick={onClose}>
            取消
          </button>
          <button type="submit" form="category-form" disabled={saving} className="btn-primary flex-1 py-3">
            {saving ? <Spinner className="h-5 w-5 border-white/40 border-t-white" /> : null}
            {initial ? "儲存" : "新增"}
          </button>
        </div>
      }
    >
      <form id="category-form" onSubmit={submit} className="space-y-5">
        {/* 預覽 */}
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-stone-50 p-3">
          <span
            className="grid h-11 w-11 place-items-center rounded-2xl text-xl"
            style={{ backgroundColor: color + "22" }}
          >
            {icon}
          </span>
          <span className="font-display text-lg font-semibold" style={{ color }}>
            {name || "分類名稱"}
          </span>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-soft">名稱 *</label>
          <input
            className="input"
            placeholder="例如：拉麵、咖啡廳、想去景點"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-ink-soft">圖示</label>
          <div className="flex flex-wrap gap-1.5">
            {icons.map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIcon(i)}
                className={`grid h-10 w-10 place-items-center rounded-xl text-lg transition ${
                  icon === i ? "bg-brand-500/10 ring-2 ring-brand-400" : "hover:bg-black/[0.04]"
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-ink-soft">顏色</label>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="grid h-9 w-9 place-items-center rounded-full transition active:scale-90"
                style={{ backgroundColor: c }}
                aria-label={c}
              >
                {color === c && <Check size={16} className="text-white" />}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-soft">描述</label>
          <input
            className="input"
            placeholder="這個分類在收集什麼？"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {advanced && (
          <div className="space-y-2 rounded-2xl bg-stone-50 p-3">
            <Toggle label="公開分類" hint="其他人可透過連結查看" checked={isPublic} onChange={setIsPublic} />
            <Toggle
              label="開放共編"
              hint="邀請朋友一起新增地點（即時同步為第二階段功能）"
              checked={isCollab}
              onChange={setIsCollab}
            />
          </div>
        )}
      </form>
    </Dialog>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 py-1.5 text-left"
    >
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {hint && <span className="block text-xs text-ink-faint">{hint}</span>}
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-brand-500" : "bg-stone-300"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`}
        />
      </span>
    </button>
  );
}
