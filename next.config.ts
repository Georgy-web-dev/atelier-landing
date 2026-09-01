import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.PAGES_BASE ?? "",
  images: { unoptimized: true },
};

export default nextConfig;
