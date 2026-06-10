import { type FormEvent, useEffect, useState } from "react";

import { Dialog } from "@/components/ui/Dialog";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";
import { useData } from "@/store/data";
import type { MapBoard } from "@/types";

const EMOJIS = ["🗺️", "🍱", "🍜", "☕", "🏞️", "✈️", "❤️", "🌃", "🗼", "🏖️", "🛍️", "🎒"];

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: MapBoard | null;
}

export function MapForm({ open, onClose, initial }: Props) {
  const createMap = useData((s) => s.createMap);
  const updateMap = useData((s) => s.updateMap);
  const setActiveMap = useData((s) => s.setActiveMap);

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🗺️");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setEmoji(initial?.emoji ?? "🗺️");
    setDescription(initial?.description ?? "");
  }, [open, initial]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("請輸入地圖名稱");
    setSaving(true);
    try {
      if (initial) {
        await updateMap(initial.id, { name: name.trim(), emoji, description });
        toast.success("已更新地圖");
      } else {
        const map = await createMap({ name: name.trim(), emoji, description });
        await setActiveMap(map.id);
        toast.success("已建立地圖");
      }
      onClose();
    } catch {
      toast.error("儲存失敗");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={initial ? "編輯地圖" : "建立新地圖"}
      maxWidth="max-w-md"
      footer={
        <div className="flex gap-3">
          <button type="button" className="btn-outline flex-1 py-3" onClick={onClose}>
            取消
          </button>
          <button type="submit" form="map-form" disabled={saving} className="btn-primary flex-1 py-3">
            {saving ? <Spinner className="h-5 w-5 border-white/40 border-t-white" /> : null}
            {initial ? "儲存" : "建立"}
          </button>
        </div>
      }
    >
      <form id="map-form" onSubmit={submit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-ink-soft">圖示</label>
          <div className="flex flex-wrap gap-1.5">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={`grid h-10 w-10 place-items-center rounded-xl text-lg transition ${
                  emoji === e ? "bg-brand-500/10 ring-2 ring-brand-400" : "hover:bg-black/[0.04]"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-soft">名稱 *</label>
          <input
            className="input"
            placeholder="例如：台北美食地圖、濟州島想去"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-soft">描述</label>
          <input
            className="input"
            placeholder="這張地圖在收集什麼？"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </form>
    </Dialog>
  );
}
