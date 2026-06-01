import path from "node:path";
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve("./"),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "oanwmlouezwtcirrhbyl.supabase.co",
      },
    ],
  },
};

export default withNextIntl(nextConfig);

