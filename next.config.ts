import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This tells Vercel: "Hey, when you build the API route for downloading,
  // please include everything in the 'bin' folder too."
  outputFileTracingIncludes: {
    "/api/download-connector": ["./bin/**/*"],
  },
};

export default nextConfig;
