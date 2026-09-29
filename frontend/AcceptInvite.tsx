import { useEffect, useState, type FormEvent } from "react";
import { api } from "./shared/api";
import BrandLogo from "./shared/BrandLogo";
import AccountVisual from "./AccountVisual";

/** Invited Super Admins land here from their email link (?invite=token). */
export default function AcceptInvite({ token, onDone }: { token: string; onDone: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpHint, setOtpHint] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    void api<{ name: string; email: string }>("/api/auth/accept-invite", "POST", { step: "lookup", token })
      .then(result => {
        setName(result.name);
        setEmail(result.email);
      })
      .catch(err => setError((err as Error).message))
      .finally(() => setBusy(false));
  }, [token]);

  async function sendOtp() {
    setError("");
    if (password.length < 8) { setError("Use at least 8 characters for your password."); return; }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Password needs at least one letter and one number.");
      return;
    }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setBusy(true);
    try {
      const result = await api<{ message: string; to: string }>("/api/auth/accept-invite", "POST", { step: "send-otp", token });
      setOtpSent(true);
      setOtpHint(result.message || `Code sent to ${result.to}.`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!otpSent) {
      await sendOtp();
      return;
    }
    if (!/^\d{6}$/.test(code.trim())) { setError("Enter the 6-digit code from your email."); return; }
    if (password.length < 8 || password !== confirm) { setError("Check your password fields first."); return; }
    setBusy(true);
    try {
      await api("/api/auth/accept-invite", "POST", { step: "accept", token, password, code: code.trim() });
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return <main className="account-shell">
    <section className="account-panel">
      <BrandLogo />
      {done ? <>
        <p className="account-eyebrow">READY</p>
        <h1>You&apos;re verified.</h1>
        <p>Your email is confirmed and your password is saved. Sign in to open the Super Admin console.</p>
        <button type="button" className="account-submit" onClick={onDone}>Sign in</button>
      </> : <>
        <p className="account-eyebrow">SUPER ADMIN INVITE</p>
        <h1>{otpSent ? "Enter your code." : "Create your password."}</h1>
        <p>
          {otpSent
            ? (otpHint || `We sent a 6-digit code to ${email || "your email"}. Enter it below to finish.`)
            : `${name ? `Welcome, ${name}. ` : ""}Create a password for ${email || "your invited account"} (8+ characters, letter and number), then we email a one-time code to verify.`}
        </p>
        <form className="account-form" onSubmit={event => void submit(event)}>
          <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" disabled={busy || !email || otpSent} /></label>
          <label>Confirm password<input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={8} autoComplete="new-password" disabled={busy || !email || otpSent} /></label>
          {otpSent && <label>Verification code<input type="text" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} required minLength={6} maxLength={6} placeholder="6-digit code" disabled={busy} autoFocus /></label>}
          {error && <p className="account-error" role="alert">{error}</p>}
          <button type="submit" className="account-submit" disabled={busy || !email}>
            {busy ? (otpSent ? "Verifying…" : "Sending code…") : otpSent ? "Verify and continue" : "Send verification code"}
          </button>
          {otpSent && <button type="button" className="account-text-button" disabled={busy} onClick={() => void sendOtp()}>Resend code</button>}
        </form>
      </>}
    </section>
    <AccountVisual />
  </main>;
}
