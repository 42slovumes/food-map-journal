import { Dialog } from "./Dialog";

interface Props {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "確認",
  danger = false,
  onConfirm,
  onClose,
}: Props) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="max-w-sm"
      footer={
        <div className="flex gap-3">
          <button className="btn-outline flex-1 py-3" onClick={onClose}>
            取消
          </button>
          <button
            className={`flex-1 py-3 ${danger ? "btn bg-rose-600 text-white hover:bg-rose-700" : "btn-primary"}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      {description && <p className="text-ink-soft">{description}</p>}
    </Dialog>
  );
}
