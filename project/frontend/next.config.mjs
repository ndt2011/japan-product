/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Cloudflare R2 public bucket — spec: docs/sa/amendments/product-tier-model.md § 3
    // Thêm domain thực tế của R2 bucket vào đây trước khi deploy
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "pub-*.r2.dev",   // R2 public URL pattern
      },
      {
        protocol: "https",
        hostname: "cdn.**.com",     // Custom domain (thay bằng domain thực)
      },
    ],
  },
};

export default nextConfig;
