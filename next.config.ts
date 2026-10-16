import { realpathSync } from "node:fs";
import type { NextConfig } from "next";

// On Windows, running from a path with different letter case (e.g. "raid-techs" instead of "Raid-techs")
// makes Node load React twice and the build fails with "Cannot read properties of null (reading 'useContext')".
// Stop early with a clear message instead.
const cwd = process.cwd();
const real = realpathSync.native(cwd);
if (process.platform === "win32" && cwd !== real && cwd.toLowerCase() === real.toLowerCase()) {
  throw new Error(`Open the project using its exact folder name (letter case matters here):\n  cd "${real}"\nCurrent folder: ${cwd}`);
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Photos are pre-sized when downloaded (see public/CREDITS.md), so no runtime optimisation is needed.
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
