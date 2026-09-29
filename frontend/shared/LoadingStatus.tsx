import "./loading-status.css";

/** Full-screen segmented loading bar (admin / teacher / parent / session). */
export default function LoadingStatus({
  title,
  message = "loading...",
  error = "",
  onRetry,
  onSignOut,
  secondaryLabel,
  onSecondary,
}: {
  title: string;
  message?: string;
  error?: string;
  onRetry?: () => void;
  onSignOut?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  const failed = Boolean(error);
  const status = failed
    ? (error.startsWith("Loading") || error.startsWith("loading")
      ? error
      : "Check your connection, then retry.")
    : (message.toLowerCase().startsWith("loading") ? "loading..." : message);

  return <main className="sq-load" role={failed ? "alert" : "status"} aria-busy={!failed} aria-live="polite">
    <span className="sr-only">{title}</span>
    <p className="sq-load-label">{failed ? "loading..." : status}</p>
    <div className="sq-load-track" aria-hidden="true">
      <div className={`sq-load-fill ${failed ? "is-paused" : ""}`} />
    </div>
    {failed && <p className="sq-load-hint">{status}</p>}
    {(onRetry || onSignOut || onSecondary) && failed && <div className="sq-load-actions">
      {onRetry && <button type="button" className="sq-load-primary" onClick={onRetry}>Retry</button>}
      {onSignOut && <button type="button" className="sq-load-ghost" onClick={onSignOut}>Sign out</button>}
      {onSecondary && <button type="button" className="sq-load-ghost" onClick={onSecondary}>{secondaryLabel ?? "Continue"}</button>}
    </div>}
  </main>;
}
