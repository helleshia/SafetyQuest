import { useEffect, useState } from "react";
import { api, RequestError } from "./shared/api";
import AuthPage from "./AuthPage";
import AcceptInvite from "./AcceptInvite";
import AdminApp from "./admin/AdminApp";
import TeacherApp from "./teacher/TeacherApp";
import ParentApp from "./parent/ParentApp";
import BrandLogo from "./shared/BrandLogo";
import CookieConsent from "./CookieConsent";
import LoadingStatus from "./shared/LoadingStatus";
import { getDemoSession, setDemoSession, type DemoRole } from "./shared/demo";
import { IDLE_MINUTES, useIdleTimeout } from "./shared/useIdleTimeout";

const NAV = [["#home", "Home"], ["#about", "About"], ["#features", "Features"], ["#how", "How it works"]];
const TOPICS = [["01", "Earthquake", "coral"], ["02", "Fire safety", "orange"], ["03", "Flood safety", "blue"], ["04", "First aid", "yellow"], ["05", "Online safety", "lilac"], ["06", "Storm ready", "mint"]];
const inviteToken = () => new URLSearchParams(window.location.search).get("invite");

function Arrow() { return <svg className="icon" viewBox="0 0 18 18" aria-hidden="true"><path d="M3 9h11M9.5 4.5 14 9l-4.5 4.5" /></svg>; }
function MenuIcon() { return <svg className="icon icon-menu" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h14" /></svg>; }
function CloseIcon() { return <svg className="icon" viewBox="0 0 18 18" aria-hidden="true"><path d="m4 4 10 10M14 4 4 14" /></svg>; }
function MarkIcon() { return <svg className="mark-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M3 12h18" /></svg>; }

function AppPreview() {
  return <div className="app-preview" aria-label="SafetyQuest mobile app preview">
    <div className="app-status"><span>9:41</span><span>● ● ●</span></div>
    <div className="app-greeting"><small>GOOD MORNING, MAYA</small><strong>Ready for<br /><em>today's quest?</em></strong></div>
    <div className="app-orbit"><span className="orbit-dot dot-one" /><span className="orbit-dot dot-two" /><span className="orbit-dot dot-three" /><div className="orbit-core">SQ</div></div>
    <div className="app-quest"><span>CONTINUE LEARNING</span><strong>Earthquake safety</strong><div><i /><small>72% complete</small><b>{"->"}</b></div></div>
  </div>;
}

function DashboardPreview() {
  return <div className="dashboard-preview" aria-label="SafetyQuest teacher dashboard preview">
    <div className="window-bar"><span /><span /><span /><small>teacher dashboard / overview</small></div>
    <div className="dashboard-inner"><div className="dashboard-title"><small>CLASSROOM PULSE</small><strong>How is your class<br /><em>doing today?</em></strong></div><div className="metric-row"><div><b>86%</b><small>active learners</small></div><div><b>24</b><small>quests finished</small></div><div><b>12</b><small>badges earned</small></div></div><div className="chart"><span className="chart-line" /><i /><i /><i /><i /><i /></div><div className="dashboard-footer"><span>Learning momentum</span><b>+18.4%</b></div></div>
  </div>;
}

export default function App() {
  const [menu, setMenu] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "forgot" | null>(null);
  const [session, setSession] = useState<DemoRole | null>(null);
  const [checking, setChecking] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const [invite, setInvite] = useState(() => inviteToken());
  useEffect(() => {
    api<{ account: { role: string } }>("/api/auth/me").then(result => setSession(result.account.role === "Teacher" ? "teacher" : result.account.role === "Parent" ? "parent" : "super-admin")).catch(error => {
      if (!(error instanceof RequestError) || ![401, 403].includes(error.status)) setSessionError(error.message);
    }).finally(() => setChecking(false));
  }, []);

  const [timedOut, setTimedOut] = useState(false);
  // The server closes an idle session after the same interval; this signs the person
  // out in the open tab so they are told why, instead of hitting a dead screen.
  const countdown = useIdleTimeout(session !== null, () => { setTimedOut(true); void signOut(); });

  const signOut = async () => {
    try { await api("/api/auth/logout", "POST", {}); setDemoSession(null); setSession(null); setAuthMode(null); }
    catch (error) { setSessionError((error as Error).message); }
  };
  if (checking) return <LoadingStatus title="SafetyQuest" message="Loading…" />;
  if (sessionError) return <LoadingStatus
    title="SafetyQuest"
    error={sessionError}
    onRetry={() => window.location.reload()}
    secondaryLabel="Continue to sign in"
    onSecondary={() => setSessionError("")}
  />;
  const idleBanner = countdown !== null
    ? <div className="idle-warning" role="alert"><span>Still there? You will be signed out in {countdown} second{countdown === 1 ? "" : "s"}.</span></div>
    : null;

  if (invite && !session) {
    return <AcceptInvite token={invite} onDone={() => {
      const url = new URL(window.location.href);
      url.searchParams.delete("invite");
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
      setInvite(null);
      setAuthMode("signin");
    }} />;
  }

  if (session === "super-admin") return <>{idleBanner}<AdminApp onSignOut={signOut} /><CookieConsent /></>;
  if (session === "teacher") return <>{idleBanner}<TeacherApp onSignOut={signOut} /><CookieConsent /></>;
  if (session === "parent") return <>{idleBanner}<ParentApp onSignOut={signOut} /><CookieConsent /></>;

  return <div className="app-shell">
    {!authMode && <header className="topbar"><a href="#home" className="brand"><BrandLogo /><span>SafetyQuest</span></a><nav className={`nav-links ${menu ? "is-open" : ""}`}>{NAV.map(([href, label]) => <a key={href} href={href} onClick={() => setMenu(false)}>{label}</a>)}</nav><div className="nav-actions"><button className="button button-dark" onClick={() => setAuthMode("signin")}>Get started <Arrow /></button><button className="menu-button" onClick={() => setMenu((value) => !value)} aria-label="Toggle menu"><MenuIcon /></button></div></header>}

    {timedOut && !authMode && <div className="idle-notice" role="status"><span>You were signed out after {IDLE_MINUTES} minutes of inactivity.</span><button type="button" onClick={() => setAuthMode("signin")}>Sign in again</button><button type="button" className="idle-dismiss" aria-label="Dismiss" onClick={() => setTimedOut(false)}>×</button></div>}
    {authMode ? <AuthPage key={authMode} mode={authMode} onClose={() => setAuthMode(null)} onSwitch={setAuthMode} onAuthed={role => { setTimedOut(false); setSession(role); }} /> : <><main>
      <section id="home" className="hero section-pad"><div className="hero-grid" /><div className="hero-copy"><div className="eyebrow"><span /> Interactive safety education</div><h1>Know what<br />to do <em>next.</em></h1><p>SafetyQuest turns preparedness into a clear, memorable practice for every curious learner.</p><div className="hero-actions"><a href="#features" className="button button-coral">Explore the platform <Arrow /></a><a href="#how" className="text-link">See how it works <Arrow /></a></div></div><div className="hero-stage"><div className="hero-ring ring-one" /><div className="hero-ring ring-two" /><div className="hero-card card-left"><span>01</span><b>LEARN</b></div><div className="hero-card card-right"><span>03</span><b>READY</b></div><div className="hero-character"><div className="character-head"><i /><i /></div><div className="character-body"><span>+</span></div><div className="character-leg leg-left" /><div className="character-leg leg-right" /></div><div className="hero-caption"><span>YOUR NEXT QUEST</span><b>Earthquake safety</b></div></div><div className="hero-scroll">Scroll to explore <Arrow /></div></section>

      <section id="about" className="about section-pad"><div className="section-intro"><div className="eyebrow"><span /> The idea</div><h2>Preparedness is a<br /><em>practice, not a panic.</em></h2><p>We give students a safe place to learn what matters, try it out, and keep getting better. Small moments of practice create calm when it counts.</p><a href="#how" className="text-link">Our learning method <Arrow /></a></div><div className="about-statboard"><div className="statboard-header"><span>SAFETYQUEST / 2026</span><span>01 — 03</span></div><div className="big-stat">15<sup>+</sup><small>guided quests<br />to explore</small></div><div className="statboard-lines"><span>Stories that stick</span><span>Decisions that matter</span><span>Progress you can see</span></div><div className="statboard-stamp">READY<br />WHEN<br />IT<br />MATTERS</div></div></section>

      <section id="features" className="features section-pad"><div className="section-top"><div><div className="eyebrow"><span /> The experience</div><h2>Designed to make<br /><em>confidence visible.</em></h2></div><p>Every part of SafetyQuest is made to keep learning active, simple, and satisfying.</p></div><div className="feature-list"><article className="feature-row"><div className="feature-index">01</div><div className="feature-text"><h3>Learn by doing</h3><p>Short stories turn important safety lessons into moments students remember.</p><a href="#how" className="circle-link"> <Arrow /></a></div><div className="lesson-visual"><div className="lesson-book"><span>01</span><b>LEARN</b><i>open<br />your<br />mind</i></div><div className="lesson-star">+</div></div></article><article className="feature-row reverse"><div className="feature-index">02</div><div className="feature-text"><h3>Practice calmly</h3><p>Quizzes and real-world scenarios build confidence before an emergency happens.</p><a href="#how" className="circle-link"> <Arrow /></a></div><div className="quiz-visual"><div className="quiz-question">What should<br /><em>you do first?</em></div><div className="quiz-option active">A <span>Stay calm and look around</span><b>✓</b></div><div className="quiz-option">B <span>Run without a plan</span></div><div className="quiz-option">C <span>Wait for someone else</span></div></div></article><article className="feature-row"><div className="feature-index">03</div><div className="feature-text"><h3>Track progress</h3><p>Teachers see growth clearly and students get the small wins that keep them going.</p><a href="#how" className="circle-link"> <Arrow /></a></div><DashboardPreview /></article></div></section>

      <section id="how" className="how section-pad"><div className="how-head"><div className="eyebrow"><span /> How it works</div><h2>Three moves.<br /><em>One safer habit.</em></h2><p>No complicated setup. Just a clear path from curious to capable.</p></div><div className="steps"><div className="step"><span>01</span><div><h3>Choose a quest</h3><p>Pick a topic that feels useful today.</p></div></div><div className="step"><span>02</span><div><h3>Make a decision</h3><p>Work through a bite-sized scenario.</p></div></div><div className="step"><span>03</span><div><h3>Keep your progress</h3><p>Return, collect badges, grow ready.</p></div></div></div></section>

      <section className="topics section-pad"><div className="section-top"><div><div className="eyebrow"><span /> Explore the curriculum</div><h2>Find your <em>next quest.</em></h2></div><p>One platform, many ways to be ready.</p></div><div className="topic-grid">{TOPICS.map(([number, name, color]) => <a className={`topic-card ${color}`} href="#download" key={number}><span>{number}</span><strong>{name}</strong><i><Arrow /></i></a>)}</div></section>

      <section id="download" className="download section-pad"><div className="download-copy"><div className="eyebrow"><span /> Take it with you</div><h2>Ready when<br /><em>you are.</em></h2><p>Keep your quests close. Learn in small moments, practice at your own pace, and make preparedness part of everyday life.</p><div className="store-row"><a href="#home" className="store-button store-button-now"><b>↓</b><small>Android app<strong>Download now</strong></small></a></div></div><AppPreview /></section>
    </main>

    <footer><div className="footer-top"><a href="#home" className="brand"><BrandLogo /><span>SafetyQuest</span></a><div className="footer-links">{NAV.map(([href, label]) => <a key={href} href={href}>{label}</a>)}</div><a href="#download" className="button button-coral">Get the app <Arrow /></a></div><div className="footer-bottom"><span>Learn today. Be ready when it matters.</span><span>© 2026 SafetyQuest</span></div><div className="footer-word">SafetyQuest</div></footer></>}
    <CookieConsent />
  </div>;
}
