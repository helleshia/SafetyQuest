import { useEffect, useRef, useState, type FormEvent } from "react";
import { api } from "./shared/api";
import AdminSetup from "./AdminSetup";
import BrandLogo from "./shared/BrandLogo";
import AccountVisual from "./AccountVisual";
import VerifyRegistration from "./VerifyRegistration";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, setDemoSession, type DemoRole } from "./shared/demo";

export type AuthMode = "signin" | "signup" | "forgot";

const copy = {
  signin: {
    eyebrow: "WELCOME BACK",
    title: "Sign in.",
    description: "Welcome back! Sign in to continue your SafetyQuest journey.",
    badge: "YOUR SAFETY JOURNEY",
    headline: <>Small steps.<br /><em>Big confidence.</em></>,
    supporting: "Learn what matters, practice at your pace, and feel ready for the moments that count.",
    submit: "Sign in",
  },
  signup: {
    eyebrow: "JOIN SAFETYQUEST",
    title: "Create an account.",
    description: "Create your account, verify your email, then wait for Super Admin approval before signing in.",
    badge: "A SAFER TOMORROW",
    headline: <>Your next quest<br /><em>starts here.</em></>,
    supporting: "Join a learning space where every small lesson builds lasting confidence.",
    submit: "Create account",
  },
  forgot: {
    eyebrow: "PASSWORD RECOVERY",
    title: "Forgot password?",
    description: "Enter the email on your account and we'll send you a 6-digit reset code.",
    badge: "ACCOUNT RECOVERY",
    headline: <>Back in<br /><em>control soon.</em></>,
    supporting: "Reset your access securely and return to learning with SafetyQuest.",
    submit: "Send reset code",
  },
};

function FieldIcon({ kind }: { kind: "email" | "password" }) {
  return <svg className="account-field-icon" viewBox="0 0 24 24" aria-hidden="true">
    {kind === "email" ? <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m3 7 9 6 9-6" /></> : <><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></>}
  </svg>;
}

function PasswordInput({ confirm = false, signup = false }: { confirm?: boolean; signup?: boolean }) {
  const [visible, setVisible] = useState(false);
  const id = confirm ? "confirm-password" : "password";
  return <div className="account-input-wrap">
    <FieldIcon kind="password" />
    <input id={id} name={id} type={visible ? "text" : "password"} required minLength={signup ? 8 : undefined} placeholder={confirm ? "Repeat your password" : signup ? "8+ chars, letter + number" : "Enter your password"} autoComplete={signup ? "new-password" : "current-password"} />
    <button className="account-password-toggle" type="button" aria-label={`${visible ? "Hide" : "Show"} ${confirm ? "confirmation " : ""}password`} aria-controls={id} aria-pressed={visible} onClick={() => setVisible(!visible)}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />{visible && <path d="m3 3 18 18" />}</svg>
    </button>
  </div>;
}

export default function AuthPage({ mode, onClose, onSwitch, onAuthed }: { mode: AuthMode; onClose: () => void; onSwitch: (mode: AuthMode) => void; onAuthed: (role: DemoRole) => void }) {
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [registration, setRegistration] = useState<{ token: string; email: string } | null>(null);
  const [setupRequired, setSetupRequired] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [recovery, setRecovery] = useState<{
    stage: "email" | "code" | "password";
    email: string;
    to: string;
    expiresInMinutes: number;
    delivered: boolean;
    code: string;
  } | null>(null);
  useEffect(() => { api<{ setupRequired: boolean }>("/api/auth/status").then(value => setSetupRequired(value.setupRequired)).catch(err => setError(err.message)); }, []);
  useEffect(() => { setRecovery(null); setError(""); setNotice(""); }, [mode]);
  const formRef = useRef<HTMLFormElement>(null);
  const content = copy[mode];
  const signup = mode === "signup";
  const forgot = mode === "forgot";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    if (signup && data.get("password") !== data.get("confirm-password")) {
      setError("Your passwords don't match. Please try again.");
      event.currentTarget.querySelector<HTMLInputElement>("#confirm-password")?.focus();
      return;
    }
    if (signup) {
      const nextPassword = String(data.get("password") ?? "");
      if (nextPassword.length < 8 || !/[A-Za-z]/.test(nextPassword) || !/[0-9]/.test(nextPassword)) {
        setError("Password needs at least 8 characters, including a letter and a number.");
        return;
      }
    }
    setError("");
    setNotice("");
    if (signup) {
      setBusy(true);
      try {
        const result = await api<{ token: string; email: string; message: string }>("/api/auth/register", "POST", {
          firstName: String(data.get("first-name") ?? ""),
          lastName: String(data.get("last-name") ?? ""),
          email: String(data.get("email") ?? "").trim().toLowerCase(),
          password: String(data.get("password") ?? ""),
          role: data.get("account-type") === "parent" ? "Parent" : "Teacher",
        });
        formRef.current?.reset();
        setRegistration({ token: result.token, email: result.email });
      } catch (err) { setError((err as Error).message); }
      finally { setBusy(false); }
      return;
    }
    if (forgot) {
      const email = String(data.get("email") ?? recovery?.email ?? "").trim().toLowerCase();
      setBusy(true);
      try {
        if (!recovery || recovery.stage === "email") {
          const result = await api<{ sent: boolean; to: string; expiresInMinutes: number; delivered: boolean }>(
            "/api/auth/forgot",
            "POST",
            { step: "request", email },
          );
          setRecovery({
            stage: "code",
            email,
            to: result.to,
            expiresInMinutes: result.expiresInMinutes,
            delivered: result.delivered,
            code: "",
          });
          setNotice(
            result.delivered
              ? `If an account exists for that address, a 6-digit code was emailed to ${result.to}.`
              : `If an account exists for that address, a reset code was issued for ${result.to}. Check your inbox, or the server console when email is not configured.`,
          );
        } else if (recovery.stage === "code") {
          const code = String(data.get("reset-code") ?? "").trim();
          await api("/api/auth/forgot", "POST", { step: "verify", email: recovery.email, code });
          setRecovery({ ...recovery, stage: "password", code });
          setNotice("Code verified. Choose a new password.");
        } else {
          const password = String(data.get("password") ?? "");
          const confirm = String(data.get("confirm-password") ?? "");
          if (password !== confirm) {
            setError("Your passwords don't match. Please try again.");
            return;
          }
          await api("/api/auth/forgot", "POST", {
            step: "confirm",
            email: recovery.email,
            code: recovery.code,
            password,
          });
          setRecovery(null);
          setNotice("Password updated. You can sign in with your new password.");
          onSwitch("signin");
        }
      } catch (err) { setError((err as Error).message); }
      finally { setBusy(false); }
      return;
    }
    if (!signup && !forgot) {
      const email = String(data.get("email")).trim().toLowerCase();
      const password = String(data.get("password"));
      setBusy(true);
      try {
        const result = await api<{ account: { role: string } }>("/api/auth/login", "POST", { email, password });
        setDemoSession(null);
        onAuthed(result.account.role === "Teacher" ? "teacher" : result.account.role === "Parent" ? "parent" : "super-admin");
      }
      catch (err) { setError((err as Error).message); } finally { setBusy(false); }
    }
  }

  function fillDemo(address: string) {
    const form = formRef.current;
    if (!form) return;
    const email = form.querySelector<HTMLInputElement>("#email");
    const password = form.querySelector<HTMLInputElement>("#password");
    if (email) email.value = address;
    if (password) password.value = DEMO_PASSWORD;
    setError("");
    setNotice("");
    password?.focus();
  }

  const forgotTitle = recovery?.stage === "code"
    ? "Enter your code."
    : recovery?.stage === "password"
      ? "Choose a new password."
      : content.title;
  const forgotDescription = recovery?.stage === "code"
    ? `Enter the 6-digit code sent for ${recovery.to}. It expires in ${recovery.expiresInMinutes} minutes.`
    : recovery?.stage === "password"
      ? "Use at least 8 characters. You'll use this the next time you sign in."
      : content.description;
  const forgotSubmit = recovery?.stage === "code"
    ? "Verify code"
    : recovery?.stage === "password"
      ? "Save new password"
      : content.submit;
  const busyLabel = forgot
    ? recovery?.stage === "code"
      ? "Checking…"
      : recovery?.stage === "password"
        ? "Saving…"
        : "Sending…"
    : signup
      ? "Creating account…"
      : "Signing in…";

  if (setupOpen) return <AdminSetup onBack={() => setSetupOpen(false)} onComplete={() => { setDemoSession(null); onAuthed("super-admin"); }} />;
  return <main className={`account-page account-${mode}`}>
    <section className="account-panel" aria-labelledby="account-title">
      <a href="#home" className="account-brand" onClick={onClose} aria-label="SafetyQuest home">
        <BrandLogo />
        <span>SafetyQuest</span>
      </a>
      <button type="button" className="account-home" onClick={onClose} aria-label="Back to home"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6" /></svg></button>
      <div className="account-content">
        <div className="account-eyebrow"><span />{content.eyebrow}</div>
        <h1 id="account-title">{signup && registration ? "Verify your email." : forgot ? forgotTitle : content.title}</h1>
        <p className="account-description">{forgot ? forgotDescription : content.description}</p>
        {signup && registration ? <VerifyRegistration token={registration.token} email={registration.email} onRestart={() => { setRegistration(null); setError(""); setNotice(""); }} onSignIn={() => { setRegistration(null); onSwitch("signin"); }} /> : <form className="account-form" ref={formRef} onSubmit={submit} onChange={() => { setError(""); setNotice(""); }}>
          {signup && <div className="account-field-pair">
            <label htmlFor="first-name">First name<input id="first-name" name="first-name" required autoComplete="given-name" placeholder="First name" /></label>
            <label htmlFor="last-name">Last name<input id="last-name" name="last-name" required autoComplete="family-name" placeholder="Last name" /></label>
          </div>}
          {(!forgot || !recovery || recovery.stage === "email") && (
            <label htmlFor="email">Email address<div className="account-input-wrap"><FieldIcon kind="email" /><input id="email" name="email" type="email" required autoComplete="email" placeholder="you@email.com" defaultValue={recovery?.email} /></div></label>
          )}
          {forgot && recovery?.stage === "code" && (
            <label htmlFor="reset-code">Reset code<input id="reset-code" name="reset-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} placeholder="000000" required autoFocus /></label>
          )}
          {forgot && recovery?.stage === "password" && (
            <div className="account-field-pair">
              <label htmlFor="password">New password<PasswordInput signup /></label>
              <label htmlFor="confirm-password">Confirm password<PasswordInput confirm signup /></label>
            </div>
          )}
          {!forgot && !signup && <>
            <div className="account-password-label"><label htmlFor="password">Password</label>{!signup && <button type="button" className="account-text-button" onClick={() => onSwitch("forgot")}>Forgot password?</button>}</div>
            <PasswordInput signup={signup} />
          </>}
          {signup && <>
            <div className="account-field-pair">
              <label htmlFor="password">Password<PasswordInput signup /></label>
              <label htmlFor="confirm-password">Confirm password<PasswordInput confirm signup /></label>
            </div>
            <label htmlFor="account-type">Account type<div className="account-select-wrap"><select id="account-type" name="account-type" defaultValue="teacher"><option value="teacher">Teacher</option><option value="parent">Parent</option></select><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7.5 5 5 5-5" /></svg></div></label>
          </>}
          {error && <p className="account-error" role="alert">{error}</p>}
          {notice && <p className="account-notice" role="status">{notice}</p>}
          <button className="account-submit" type="submit" disabled={busy}>{busy ? busyLabel : forgot ? forgotSubmit : content.submit}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-5-5 5 5-5 5" /></svg></button>
          {forgot && recovery?.stage === "code" && (
            <button
              type="button"
              className="account-text-button"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                setError("");
                api<{ sent: boolean; to: string; expiresInMinutes: number; delivered: boolean }>(
                  "/api/auth/forgot",
                  "POST",
                  { step: "request", email: recovery.email },
                ).then(result => {
                  setRecovery({ ...recovery, to: result.to, expiresInMinutes: result.expiresInMinutes, delivered: result.delivered, code: "" });
                  setNotice(result.delivered ? `A new code was emailed to ${result.to}.` : `A new code was issued for ${result.to}.`);
                }).catch(err => setError((err as Error).message)).finally(() => setBusy(false));
              }}
            >
              Resend code
            </button>
          )}
        </form>}
        <p className="account-switch">{forgot ? "Remember your password?" : signup ? "Already have an account?" : "New to SafetyQuest?"}{" "}<button type="button" className="account-text-button" onClick={() => { setRecovery(null); onSwitch(signup || forgot ? "signin" : "signup"); }}>{forgot ? "Back to sign in" : signup ? "Sign in" : "Create an account"}</button></p>

        {setupRequired && mode === "signin" && <button type="button" className="account-text-button" onClick={() => setSetupOpen(true)}>Set up the first administrator</button>}
        {signup && <p className="account-fineprint">Super Admin is not a public signup option. Administrator accounts are provisioned through a controlled invitation.</p>}
      </div>
    </section>
    <aside className="account-story" aria-label="About your SafetyQuest journey">
      <div className="account-story-content">
        <span className="account-badge"><i />{content.badge}</span>
        <h2>{content.headline}</h2>
        <p>{content.supporting}</p>
        <AccountVisual recovery={forgot} signup={signup} />
        <ol className="account-journey" aria-label="The SafetyQuest learning journey">
          <li><span>01</span><strong>Learn</strong><small>Stay curious.</small></li>
          <li><span>02</span><strong>Practice</strong><small>Build confidence.</small></li>
          <li><span>03</span><strong>Be ready</strong><small>Make it a habit.</small></li>
        </ol>
      </div>
      <span className="account-story-footer">LEARN TODAY. BE READY WHEN IT MATTERS.</span>
    </aside>
  </main>;
}

