export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <div
      className={`${className} animate-spin rounded-full border-2 border-brand-200 border-t-brand-600`}
      role="status"
      aria-label="載入中"
    />
  );
}

export function FullSpinner({ label }: { label?: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 py-16 text-ink-soft">
      <Spinner className="h-7 w-7" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}
