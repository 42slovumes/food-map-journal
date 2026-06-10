import { Star } from "lucide-react";

interface Props {
  value: number | null;
  onChange?: (v: number) => void;
  size?: number;
  readOnly?: boolean;
}

export function StarRating({ value, onChange, size = 18, readOnly = false }: Props) {
  const v = value ?? 0;
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= v;
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(n === value ? 0 : n)}
            className={`${readOnly ? "cursor-default" : "cursor-pointer transition active:scale-90"}`}
            aria-label={`${n} 星`}
          >
            <Star
              style={{ width: size, height: size }}
              className={filled ? "fill-amber-400 text-amber-400" : "fill-transparent text-stone-300"}
            />
          </button>
        );
      })}
    </div>
  );
}
