import type { NextConfig } from "next";
import { buildLegacyAgentRedirects } from "./src/lib/legacyRedirects";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ['better-sqlite3'],
  async redirects() {
    return buildLegacyAgentRedirects();
  },
};

export default nextConfig;
