import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // This specifies exporting the app as static content
  distDir: 'akcs', // This will store the build files in the "akcs" folder
};

export default nextConfig;

