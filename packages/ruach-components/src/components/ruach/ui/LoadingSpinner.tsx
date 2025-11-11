type LoadingSpinnerProps = {
  label?: string;
};

export default function LoadingSpinner({ label = "Loading…" }: LoadingSpinnerProps) {
  const hasVisibleLabel = typeof label === "string" && label.length > 0;

  return (
    <div
      className="flex items-center gap-3 text-neutral-600"
      role="status"
      aria-live="polite"
      aria-label={hasVisibleLabel ? undefined : "Loading"}
    >
      <span
        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-transparent"
        aria-hidden="true"
      />
      <span
        className={`text-sm${hasVisibleLabel ? "" : " sr-only"}`}
        data-testid="loading-spinner-label"
      >
        {hasVisibleLabel ? label : ""}
      </span>
    </div>
  );
}
