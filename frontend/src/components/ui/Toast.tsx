import { AnimatePresence, motion } from "framer-motion";
import { Check, Info, TriangleAlert } from "lucide-react";
import { create } from "zustand";

type ToastKind = "success" | "error" | "info";
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastState {
  items: ToastItem[];
  push: (kind: ToastKind, message: string) => void;
  remove: (id: number) => void;
}

let seq = 1;
const useToastStore = create<ToastState>((set) => ({
  items: [],
  push: (kind, message) => {
    const id = seq++;
    set((s) => ({ items: [...s.items, { id, kind, message }] }));
    setTimeout(() => set((s) => ({ items: s.items.filter((i) => i.id !== id) })), 2800);
  },
  remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
}));

export const toast = {
  success: (m: string) => useToastStore.getState().push("success", m),
  error: (m: string) => useToastStore.getState().push("error", m),
  info: (m: string) => useToastStore.getState().push("info", m),
};

const ICONS = {
  success: <Check size={16} className="text-emerald-600" />,
  error: <TriangleAlert size={16} className="text-rose-600" />,
  info: <Info size={16} className="text-brand-600" />,
};

export function Toaster() {
  const items = useToastStore((s) => s.items);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            initial={{ y: -16, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -10, opacity: 0, scale: 0.96 }}
            className="pointer-events-auto flex items-center gap-2 rounded-full border border-line
              bg-card px-4 py-2.5 text-sm font-medium text-ink shadow-lift"
          >
            {ICONS[t.kind]}
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
