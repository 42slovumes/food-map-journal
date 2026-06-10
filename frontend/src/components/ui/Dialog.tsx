import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { type ReactNode, useEffect } from "react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  /** 底部固定動作區（例如儲存/取消） */
  footer?: ReactNode;
  /** 桌機最大寬度 */
  maxWidth?: string;
}

/**
 * 響應式對話框：
 * - 手機（< md）：從底部滑上來的 bottom sheet，可向下拖曳關閉。
 * - 桌機（md+）：置中的卡片 modal。
 * 設計取自 Claude 骨架版的行動優先 bottom sheet。
 */
export function Dialog({ open, onClose, title, children, footer, maxWidth = "max-w-lg" }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
          <motion.div
            className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={`relative z-10 flex max-h-[92vh] w-full ${maxWidth} flex-col overflow-hidden
              rounded-t-3xl border border-line bg-card shadow-sheet md:rounded-3xl md:shadow-lift`}
            initial={{ y: "100%", opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0.6 }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120) onClose();
            }}
          >
            {/* 手機拖曳把手 */}
            <div className="flex shrink-0 justify-center pt-2.5 md:hidden">
              <div className="h-1.5 w-10 rounded-full bg-line" />
            </div>

            {(title || true) && (
              <div className="flex shrink-0 items-center justify-between gap-3 px-5 pb-3 pt-3 md:pt-5">
                <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
                <button
                  onClick={onClose}
                  className="grid h-9 w-9 place-items-center rounded-full text-ink-soft transition hover:bg-black/[0.04]"
                  aria-label="關閉"
                >
                  <X size={20} />
                </button>
              </div>
            )}

            <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-4">{children}</div>

            {footer && (
              <div className="shrink-0 border-t border-line bg-card px-5 py-3 pb-safe">{footer}</div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
