import { motion } from "framer-motion";
import { MapPinned, Plus } from "lucide-react";

import { PlaceCard } from "@/components/PlaceCard";
import { FullSpinner } from "@/components/ui/Spinner";
import type { Place } from "@/types";

interface Props {
  places: Place[];
  selectedId: number | null;
  loading: boolean;
  onSelect: (id: number) => void;
  onAdd?: () => void;
  emptyHint?: string;
}

export function PlaceList({ places, selectedId, loading, onSelect, onAdd, emptyHint }: Props) {
  if (loading && places.length === 0) return <FullSpinner label="載入地點中..." />;

  if (places.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-400">
          <MapPinned size={26} />
        </div>
        <p className="mt-4 font-medium text-ink">這裡還沒有地點</p>
        <p className="mt-1 text-sm text-ink-faint">{emptyHint ?? "新增第一個想去或去過的地方吧"}</p>
        {onAdd && (
          <button onClick={onAdd} className="btn-primary mt-5 px-5 py-2.5">
            <Plus size={18} />
            新增地點
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {places.map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.3 }}
        >
          <PlaceCard place={p} active={p.id === selectedId} onClick={() => onSelect(p.id)} />
        </motion.div>
      ))}
    </div>
  );
}
