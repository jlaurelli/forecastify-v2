import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Browser console warnings and errors appear in the `next dev` output,
  // prefixed [browser], where an agent running the dev server can read them.
  logging: {
    browserToTerminal: "warn",
  },
};

export default nextConfig;
