import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // Export the app as static content
  distDir: "akcs", // Store the build files in the "akcs" folder
  exportPathMap: async function (defaultPathMap) {
    // Exclude API routes from static export
    delete defaultPathMap["/api/get-winner"];
    delete defaultPathMap["/api/generate-winner"];
    return defaultPathMap;
  },
};

export default nextConfig;
