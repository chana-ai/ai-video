/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: false,
  // skipTrailingSlashRedirect: true,
  distDir: "dist",
  async redirects() {
    return [
      // Basic redirect
      {
        source: "/",
        destination: "/ai/dashboard",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
