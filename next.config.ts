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

const config: NextConfig = { poweredByHeader: false, devIndicators: false };
export default config;
