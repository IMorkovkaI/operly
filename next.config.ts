import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  // Next's development WebSocket validates the browser's host, including LAN previews.
  allowedDevOrigins: ["127.0.0.1", "10.143.132.232"],
};

export default nextConfig;
