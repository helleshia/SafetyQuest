import { useState } from "react";
import { api } from "./shared/api";

export default function AdminSetup({ onComplete, onBack }: { onComplete: () => void; onBack: () => void }) {
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  return <main className="backend-state"><h1>Set up SafetyQuest</h1><p>Create the first Super Admin account. Your workspace starts empty.</p>
    <form className="sa-form" onSubmit={async event => {
      event.preventDefault(); const data = new FormData(event.currentTarget); setBusy(true); setError("");
      if (data.get("password") !== data.get("confirm")) { setError("Passwords do not match."); setBusy(false); return; }
      try { await api("/api/auth/setup", "POST", { name: data.get("name"), email: data.get("email"), password: data.get("password"), setupToken: data.get("token") }); onComplete(); }
      catch (err) { setError((err as Error).message); } finally { setBusy(false); }
    }}>
      <label>Full name<input name="name" required autoComplete="name" maxLength={100} /></label>
      <label>Email<input name="email" required type="email" autoComplete="email" /></label>
      <label>Password<input name="password" required type="password" minLength={8} maxLength={128} autoComplete="new-password" /></label>
      <label>Confirm password<input name="confirm" required type="password" autoComplete="new-password" /></label>
      <label>Setup token<input name="token" required type="password" autoComplete="off" /></label>
      <p>The setup token is the ADMIN_SETUP_TOKEN configured by the server owner in backend/.env.</p>
      {error && <p role="alert" className="account-error">{error}</p>}
      <button className="sa-primary" disabled={busy}>{busy ? "Creating administrator…" : "Create administrator"}</button>
      <button className="sa-ghost" type="button" onClick={onBack}>Back to sign in</button>
    </form>
  </main>;
}
