import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@vedaai/shared"],
  // Standalone output for small, self-contained Docker images (Cloud Run).
  output: "standalone",
  // Monorepo: trace files from the repo root so the workspace package is included.
  outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default nextConfig;
