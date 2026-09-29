"use client";
import dynamic from "next/dynamic";
const App = dynamic(() => import("../frontend/App"), { ssr: false, loading: () => <p role="status">Loading SafetyQuest…</p> });
export default function Page() { return <App />; }
