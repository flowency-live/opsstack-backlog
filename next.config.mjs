/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly expose server-side env vars for Amplify SSR compute
  env: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
};

export default nextConfig;
