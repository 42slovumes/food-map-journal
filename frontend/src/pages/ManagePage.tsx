import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { CategoryForm } from "@/components/CategoryForm";
import { MapForm } from "@/components/MapForm";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";
import { useData } from "@/store/data";
import type { Category, MapBoard } from "@/types";

export default function ManagePage() {
  const maps = useData((s) => s.maps);
  const activeMapId = useData((s) => s.activeMapId);
  const setActiveMap = useData((s) => s.setActiveMap);
  const deleteMap = useData((s) => s.deleteMap);
  const categories = useData((s) => s.categories);
  const deleteCategory = useData((s) => s.deleteCategory);

  const [catForm, setCatForm] = useState<{ open: boolean; initial: Category | null }>({
    open: false,
    initial: null,
  });
  const [mapForm, setMapForm] = useState<{ open: boolean; initial: MapBoard | null }>({
    open: false,
    initial: null,
  });
  const [delCat, setDelCat] = useState<Category | null>(null);
  const [delMap, setDelMap] = useState<MapBoard | null>(null);

  const activeMap = maps.find((m) => m.id === activeMapId);
  const canEditCats = !!activeMap && activeMap.my_role !== "viewer"; // owner/editor 可管理分類

  return (
    <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-28 pt-5 md:px-8 md:pb-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <header>
          <h1 className="font-display text-2xl font-semibold text-ink">收藏管理</h1>
          <p className="mt-1 text-sm text-ink-soft">管理你的地圖與分類。</p>
        </header>

        {/* 地圖 */}
        <section>
          <SectionHeader title="我的地圖" onAdd={() => setMapForm({ open: true, initial: null })} addLabel="新增地圖" />
          <div className="grid gap-2.5 sm:grid-cols-2">
            {maps.map((m) => (
              <div
                key={m.id}
                className={`card flex items-center gap-3 p-3.5 ${
                  m.id === activeMapId ? "ring-2 ring-brand-300" : ""
                }`}
              >
                <button
                  onClick={() => setActiveMap(m.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-xl">
                    {m.emoji}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-ink">{m.name}</span>
                    <span className="block text-xs text-ink-faint tnum">
                      {m.categories_count} 分類 · {m.places_count} 地點
                    </span>
                  </span>
                </button>
                {m.my_role === "owner" ? (
                  <div className="flex shrink-0 gap-1">
                    <IconBtn onClick={() => setMapForm({ open: true, initial: m })} label="編輯">
                      <Pencil size={16} />
                    </IconBtn>
                    <IconBtn
                      onClick={() => {
                        if (maps.filter((x) => x.my_role === "owner").length <= 1)
                          return toast.error("至少保留一張自己的地圖");
                        setDelMap(m);
                      }}
                      label="刪除"
                      danger
                    >
                      <Trash2 size={16} />
                    </IconBtn>
                  </div>
                ) : (
                  <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-1 text-xs text-ink-faint">
                    {m.my_role === "editor" ? "共編" : "檢視"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 分類 */}
        <section>
          <SectionHeader
            title="目前地圖的分類"
            onAdd={canEditCats ? () => setCatForm({ open: true, initial: null }) : undefined}
            addLabel="新增分類"
          />
          {categories.length === 0 ? (
            <div className="card flex flex-col items-center px-6 py-12 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-400">
                <MapPin size={24} />
              </div>
              <p className="mt-3 font-medium text-ink">還沒有分類</p>
              <p className="mt-1 text-sm text-ink-faint">建立「拉麵」「咖啡廳」等主題開始收藏</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {categories.map((c) => (
                <div key={c.id} className="card flex items-center gap-3 p-3.5">
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl"
                    style={{ backgroundColor: c.color + "22" }}
                  >
                    {c.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold text-ink">{c.name}</span>
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium tnum"
                        style={{ backgroundColor: c.color + "1f", color: c.color }}
                      >
                        {c.places_count}
                      </span>
                    </div>
                    {c.description && (
                      <p className="truncate text-sm text-ink-faint">{c.description}</p>
                    )}
                  </div>
                  {canEditCats && (
                    <div className="flex shrink-0 gap-1">
                      <IconBtn onClick={() => setCatForm({ open: true, initial: c })} label="編輯">
                        <Pencil size={16} />
                      </IconBtn>
                      <IconBtn onClick={() => setDelCat(c)} label="刪除" danger>
                        <Trash2 size={16} />
                      </IconBtn>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <CategoryForm
        open={catForm.open}
        initial={catForm.initial}
        onClose={() => setCatForm({ open: false, initial: null })}
      />
      <MapForm
        open={mapForm.open}
        initial={mapForm.initial}
        onClose={() => setMapForm({ open: false, initial: null })}
      />
      <ConfirmDialog
        open={!!delCat}
        title="刪除分類？"
        description={delCat ? `「${delCat.name}」與其中的 ${delCat.places_count} 個地點都會被刪除。` : ""}
        confirmLabel="刪除"
        danger
        onConfirm={async () => {
          if (delCat) {
            await deleteCategory(delCat.id);
            toast.success("已刪除分類");
          }
        }}
        onClose={() => setDelCat(null)}
      />
      <ConfirmDialog
        open={!!delMap}
        title="刪除地圖？"
        description={delMap ? `「${delMap.name}」與其所有分類、地點都會被刪除。` : ""}
        confirmLabel="刪除"
        danger
        onConfirm={async () => {
          if (delMap) {
            await deleteMap(delMap.id);
            toast.success("已刪除地圖");
          }
        }}
        onClose={() => setDelMap(null)}
      />
    </div>
  );
}

function SectionHeader({
  title,
  onAdd,
  addLabel,
}: {
  title: string;
  onAdd?: () => void;
  addLabel: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      {onAdd && (
        <button onClick={onAdd} className="btn-outline px-3 py-2 text-sm">
          <Plus size={16} />
          {addLabel}
        </button>
      )}
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  label,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`grid h-9 w-9 place-items-center rounded-xl border border-line bg-card transition ${
        danger ? "text-rose-600 hover:border-rose-200 hover:bg-rose-50" : "text-ink-soft hover:border-brand-200 hover:text-brand-700"
      }`}
    >
      {children}
    </button>
  );
}
