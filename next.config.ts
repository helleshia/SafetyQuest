import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { NextConfig } from "next";

/* Server settings live with the server, in backend/.env. Next.js only auto-loads a
   .env at the project root, so it is loaded explicitly here — next.config runs in
   Node before the server starts, which is early enough for the route handlers. */
const envFile = resolve(process.cwd(), "backend/.env");
if (existsSync(envFile)) {
  try {
    process.loadEnvFile(envFile);
  } catch (error) {
    console.error("Could not read backend/.env:", error instanceof Error ? error.message : "unknown error");
  }
}

/* The student app's web build (installed on iPhones from Safari) is hosted on GitHub
   Pages, so the browser treats its calls to /api/mobile as cross-site. Only that one
   address may read the replies. Set WEB_APP_ORIGIN to change it. */
const webAppOrigin = (process.env.WEB_APP_ORIGIN ?? "https://reycadealba07192303-ai.github.io").replace(/\/$/, "");

const config: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  async headers() {
    return [{
      source: "/api/mobile/:path*",
      headers: [
        { key: "Access-Control-Allow-Origin", value: webAppOrigin },
        { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
        { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        { key: "Vary", value: "Origin" },
      ],
    }];
  },
};
export default config;
