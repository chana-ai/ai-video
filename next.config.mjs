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
  //Optimize build package process
  swcMinify: true,
  revalidate: 60, // Revalidate pages every 60 seconds
  webpack: (config, { isServer }) => {
    // if (!isServer) {
    //   config.optimization.splitChunks.maxInitialRequests = 10;
    //   config.optimization.splitChunks.maxAsyncRequests = 10;
    // }
    config.cache = {
      type: 'filesystem',
    };
    return config;
  },
  reactStrictMode: true,
};

export default nextConfig;
