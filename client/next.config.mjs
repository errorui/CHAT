// where the express api lives
const apiUrl = (
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:4000"
    : "https://chat-12-z8u3.onrender.com")
).replace(/\/+$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // without this, next dev writes AGENTS.md into the project
  agentRules: false,
  // this folder is the app, the lockfile above it belongs to the api
  turbopack: { root: import.meta.dirname },
  env: { NEXT_PUBLIC_API_URL: apiUrl },
  // serve the api from this site, so the login cookie is first party and not blocked
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiUrl}/api/:path*` }];
  },
};

export default nextConfig;
