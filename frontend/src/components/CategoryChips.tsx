import { Plus } from "lucide-react";

import { withAlpha } from "@/lib/format";
import { useData } from "@/store/data";

interface Props {
  onAddCategory?: () => void;
}

export function CategoryChips({ onAddCategory }: Props) {
  const categories = useData((s) => s.categories);
  const activeId = useData((s) => s.activeCategoryId);
  const setActiveCategory = useData((s) => s.setActiveCategory);
  const totalPlaces = categories.reduce((n, c) => n + c.places_count, 0);

  return (
    <div className="no-scrollbar flex items-center gap-2 overflow-x-auto py-0.5">
      <button
        onClick={() => setActiveCategory(null)}
        className={`chip ${
          activeId === null
            ? "border-ink bg-ink text-white"
            : "border-line bg-card text-ink-soft hover:border-ink/30"
        }`}
      >
        全部
        <span className="tnum opacity-70">{totalPlaces}</span>
      </button>

      {categories.map((c) => {
        const active = c.id === activeId;
        return (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className="chip"
            style={
              active
                ? { backgroundColor: c.color, borderColor: c.color, color: "#fff" }
                : { backgroundColor: withAlpha(c.color, 0.08), borderColor: withAlpha(c.color, 0.25), color: c.color }
            }
          >
            <span>{c.icon}</span>
            {c.name}
            <span className="tnum opacity-75">{c.places_count}</span>
          </button>
        );
      })}

      {onAddCategory && (
        <button
          onClick={onAddCategory}
          className="chip shrink-0 border-dashed border-line text-ink-soft hover:border-brand-300 hover:text-brand-700"
        >
          <Plus size={15} />
          新分類
        </button>
      )}
    </div>
  );
}
