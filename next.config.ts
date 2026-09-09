import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // The compiler API is more reliable than the CLI checker in restricted CI environments.
    useTypeScriptCli: false,
  },
};

export default nextConfig;
