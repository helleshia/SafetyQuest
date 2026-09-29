import type { Metadata } from "next";
import "../frontend/index.css";

export const metadata: Metadata = { title: "SafetyQuest", description: "SafetyQuest school administration and safety learning" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
