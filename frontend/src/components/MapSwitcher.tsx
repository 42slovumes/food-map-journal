import { Check, ChevronDown, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useData } from "@/store/data";

interface Props {
  onNewMap: () => void;
}

export function MapSwitcher({ onNewMap }: Props) {
  const maps = useData((s) => s.maps);
  const activeMapId = useData((s) => s.activeMapId);
  const setActiveMap = useData((s) => s.setActiveMap);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const active = maps.find((m) => m.id === activeMapId);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-2xl border border-line bg-card px-3 py-2 text-left transition hover:border-brand-200"
      >
        <span className="text-lg">{active?.emoji ?? "🗺️"}</span>
        <span className="max-w-[120px] truncate font-semibold text-ink sm:max-w-[180px]">
          {active?.name ?? "地圖"}
        </span>
        <ChevronDown size={16} className={`text-ink-faint transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1.5 w-64 animate-scale-in overflow-hidden rounded-2xl border border-line bg-card p-1.5 shadow-lift">
          <div className="max-h-72 overflow-y-auto">
            {maps.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setActiveMap(m.id);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition hover:bg-brand-50"
              >
                <span className="text-lg">{m.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{m.name}</span>
                  <span className="block text-xs text-ink-faint tnum">
                    {m.categories_count} 分類 · {m.places_count} 地點
                  </span>
                </span>
                {m.id === activeMapId && <Check size={16} className="text-brand-600" />}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setOpen(false);
              onNewMap();
            }}
            className="mt-1 flex w-full items-center gap-2 rounded-xl border-t border-line px-2.5 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
          >
            <Plus size={16} />
            建立新地圖
          </button>
        </div>
      )}
    </div>
  );
}
