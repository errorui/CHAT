// where the express api lives
const apiUrl = (
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:4000"
    : "https://chat-12-z8u3.onrender.com")
).replace(/\/+$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: { NEXT_PUBLIC_API_URL: apiUrl },
};

export default nextConfig;
