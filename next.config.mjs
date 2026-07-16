import withPWA from "@ducanh2912/next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow Capacitor Android emulator / WebView hitting the Next dev server.
  allowedDevOrigins: [
    "10.0.2.2",
    "localhost",
    "127.0.0.1",
  ],
};

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
})(nextConfig);
