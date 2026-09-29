import { useState } from "react";
import { api } from "./shared/api";

export default function VerifyRegistration({ token, email, onRestart, onSignIn }: { token: string; email: string; onRestart: () => void; onSignIn: () => void }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("The code expires 10 minutes after registration.");
  async function send(step: "verify" | "resend") {
    if (busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await api<{ message: string }>("/api/auth/verify-registration", "POST", { step, token, ...(step === "verify" ? { code } : {}) });
      setNotice(result.message);
      setCode("");
      if (step === "verify") setVerified(true);
    } catch (problem) { setError((problem as Error).message); }
    finally { setBusy(false); }
  }
  return <form className={`account-form account-otp-form ${verified ? "is-verified" : ""}`} onSubmit={event => { event.preventDefault(); void send("verify"); }}>
    {verified ? <div className="account-otp-success">
      <span className="account-otp-success-icon" aria-hidden="true">✓</span>
      <h2>Email verified</h2>
      <p>Your account is ready for Super Admin approval. We&apos;ll let you know when you can sign in.</p>
      {notice && <p className="account-notice" role="status">{notice}</p>}
      <button type="button" className="account-submit" onClick={onSignIn}>Back to sign in<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-5-5 5 5-5 5" /></svg></button>
    </div> : <>
      <div className="account-otp-intro"><span className="account-otp-mail" aria-hidden="true">@</span><div><strong>Check your inbox</strong><p>We sent a 6-digit code to <b>{email}</b></p></div></div>
      <label className="account-otp-label" htmlFor="registration-code">Verification code<input className="account-otp-input" id="registration-code" value={code} onChange={event => { setCode(event.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} placeholder="000000" required autoFocus disabled={busy} /></label>
      <p className="account-otp-hint">The code expires in 10 minutes and can only be used once.</p>
      {error && <p className="account-error" role="alert">{error}</p>}
      {notice && <p className="account-notice" role="status">{notice}</p>}
      <button type="submit" className="account-submit" disabled={busy || code.length !== 6}>{busy ? "Verifying..." : "Verify email"}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-5-5 5 5-5 5" /></svg></button>
      <div className="account-otp-actions"><span>Didn&apos;t receive it?</span><button type="button" className="account-text-button" disabled={busy} onClick={() => void send("resend")}>Resend code</button></div>
      <button type="button" className="account-text-button account-otp-back" disabled={busy} onClick={onRestart}>Use a different email</button>
    </>}
  </form>;
}
