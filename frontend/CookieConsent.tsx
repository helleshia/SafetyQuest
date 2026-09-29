import { useEffect, useState } from "react";

const CONSENT_KEY = "safetyquest.cookie-consent";

type Choice = "accepted" | "essential";

export default function CookieConsent() {
  const [choice, setChoice] = useState<Choice | null>(null);
  const [details, setDetails] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(CONSENT_KEY);
      if (stored === "accepted" || stored === "essential") setChoice(stored);
    } catch { /* Continue with the banner if browser storage is unavailable. */ }
  }, []);

  function save(next: Choice) {
    setChoice(next);
    try { window.localStorage.setItem(CONSENT_KEY, next); } catch { /* Consent still applies for this tab. */ }
  }

  if (choice) return null;

  return <aside className="cookie-consent" aria-label="Cookie and privacy notice">
    <div className="cookie-consent-mark" aria-hidden="true">✓</div>
    <div className="cookie-consent-copy">
      <strong>Cookies &amp; privacy</strong>
      <p>SafetyQuest uses essential cookies to keep your session secure and remember your consent. We do not use advertising cookies.</p>
      {details && <div className="cookie-consent-details"><b>What we store</b><span>Essential session, security, and consent preferences only. Learning records are handled under the SafetyQuest privacy notice.</span></div>}
    </div>
    <div className="cookie-consent-actions">
      <button type="button" className="cookie-consent-link" onClick={() => setDetails(value => !value)}>{details ? "Hide details" : "Privacy details"}</button>
      <button type="button" className="cookie-consent-secondary" onClick={() => save("essential")}>Essential only</button>
      <button type="button" className="cookie-consent-primary" onClick={() => save("accepted")}>Accept</button>
    </div>
  </aside>;
}
